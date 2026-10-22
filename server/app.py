"""GridLens demo backend. Experimental photo screening; no verified clearance assessment."""
import io, json, os, sqlite3, uuid, hashlib, secrets, hmac
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Header
from ai_engine import analyze as analyze_yolo, model_ready

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT=Path(__file__).resolve().parent
FREE_DEMO = os.getenv('GRIDLENS_FREE_DEMO', '0') == '1'
DB=ROOT/'gridlens.db'
UPLOADS=ROOT/'uploads'; UPLOADS.mkdir(exist_ok=True)
app=FastAPI(title='GridLens Demo API')
app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
app.mount('/photos',StaticFiles(directory=UPLOADS),name='photos')

def connect():
    c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
with connect() as c:
    c.execute('''CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, created_at TEXT, lat REAL, lon REAL, location TEXT, notes TEXT, photo TEXT, status TEXT, screening TEXT)''')
    if 'owner_hash' not in [x[1] for x in c.execute('PRAGMA table_info(reports)')]:
        c.execute('ALTER TABLE reports ADD COLUMN owner_hash TEXT')

@app.get('/')
def home():return FileResponse(ROOT/'static'/'index.html')

@app.get('/api/reports')
def reports():
    with connect() as c:return [dict(x) | {'screening':json.loads(x['screening'])} for x in c.execute('SELECT id,created_at,lat,lon,location,notes,photo,status,screening FROM reports ORDER BY created_at DESC')]


def require_owner(c, report_id: str, token: Optional[str]):
    row=c.execute('SELECT owner_hash FROM reports WHERE id=?',(report_id,)).fetchone()
    if row is None:raise HTTPException(404,'Report not found')
    if not row['owner_hash'] or not token or not hmac.compare_digest(row['owner_hash'],hashlib.sha256(token.encode()).hexdigest()):
        raise HTTPException(403,'Only the original submitting device can modify this report')
    return row

@app.patch('/api/reports/{report_id}/details')
def update_details(report_id:str,payload:dict,x_report_token:Optional[str]=Header(None)):
    location=payload.get('location')
    notes=payload.get('notes')
    if not isinstance(location,str) or not isinstance(notes,str) or len(location)>250 or len(notes)>2000:
        raise HTTPException(422,'Invalid location or notes')
    with connect() as c:
        require_owner(c,report_id,x_report_token)
        c.execute('UPDATE reports SET location=?,notes=? WHERE id=?',(location,notes,report_id))
    return {'id':report_id,'location':location,'notes':notes}

@app.delete('/api/reports/{report_id}')
def delete_report(report_id:str,x_report_token:Optional[str]=Header(None)):
    with connect() as c:
        require_owner(c,report_id,x_report_token)
        row=c.execute('SELECT photo FROM reports WHERE id=?',(report_id,)).fetchone()
        c.execute('DELETE FROM reports WHERE id=?',(report_id,))
    for name in (row['photo'],f'{report_id}_overlay.png'):
        if name:
            (UPLOADS/Path(name).name).unlink(missing_ok=True)
    return {'id':report_id,'deleted':True}

@app.patch('/api/reports/{report_id}')
def update(report_id:str,payload:dict):
    status=payload.get('status')
    if status not in ('New','Under review','Crew assigned','Resolved'):raise HTTPException(422,'Invalid status')
    with connect() as c:
        r=c.execute('UPDATE reports SET status=? WHERE id=?',(status,report_id))
        if not r.rowcount:raise HTTPException(404,'Report not found')
    return {'id':report_id,'status':status}

def screen_photo(raw:bytes):
    try:
        img=Image.open(io.BytesIO(raw));img.verify()
        img=Image.open(io.BytesIO(raw)).convert('RGB')
    except Exception:raise HTTPException(415,'Please upload a valid JPEG or PNG image')
    if max(img.size)>8000:raise HTTPException(413,'Image dimensions too large')
    arr=np.array(img);h,w=arr.shape[:2]
    scale=min(1.,1000/max(h,w));small=cv2.resize(arr,(max(1,int(w*scale)),max(1,int(h*scale))))
    hsv=cv2.cvtColor(small,cv2.COLOR_RGB2HSV)
    # Color heuristic, NOT a trained model. Vegetation may be missed or falsely identified.
    green=cv2.inRange(hsv,np.array([25,30,20]),np.array([95,255,255]))
    green=cv2.morphologyEx(green,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    veg_ratio=float(np.count_nonzero(green)/green.size)
    gray=cv2.cvtColor(small,cv2.COLOR_RGB2GRAY)
    edges=cv2.Canny(gray,70,170)
    lines=cv2.HoughLinesP(edges,1,np.pi/180,threshold=75,minLineLength=max(35,int(small.shape[1]*.18)),maxLineGap=12)
    line_count=int(len(lines)) if lines is not None else 0
    # This does NOT detect actual conductors or physical clearance.
    needs_review=bool(veg_ratio>.07 and line_count>0)
    overlay=small.copy();overlay[green>0]=(0.45*overlay[green>0]+0.55*np.array([25,205,90])).astype(np.uint8)
    if lines is not None:
        for ln in lines[:100]:
            x1,y1,x2,y2=map(int,ln[0]);cv2.line(overlay,(x1,y1),(x2,y2),(255,199,45),2)
    return {'method':'experimental-color-and-edge-screening','vegetation_fraction':round(veg_ratio,3),'line_like_features':line_count,'review_recommended':needs_review,'severity':'Review suggested' if needs_review else 'Uncertain','disclaimer':'Not a trained power-line detector. No real-world clearance or electrical safety determination is possible from this output.'}, Image.fromarray(overlay)

@app.post('/api/reports',status_code=201)
async def create_report(photo:UploadFile=File(...),lat:float=Form(...),lon:float=Form(...),location:str=Form(''),notes:str=Form('')):
    if not (-90<=lat<=90 and -180<=lon<=180):raise HTTPException(422,'Invalid GPS coordinates')
    if len(location)>250 or len(notes)>2000:raise HTTPException(422,'Text too long')
    raw=await photo.read(8_000_001)
    if len(raw)>8_000_000:raise HTTPException(413,'Photo exceeds 8MB')
    # Use trained segmentation when custom weights are available; otherwise return
    # an explicit unassessed result, never a heuristic risk score.
    try:
        uploaded=Image.open(io.BytesIO(raw)); uploaded.verify()
        uploaded=Image.open(io.BytesIO(raw)).convert('RGB')
        if max(uploaded.size)>8000:raise HTTPException(413,'Image dimensions too large')
    except HTTPException:raise
    except Exception:raise HTTPException(415,'Please upload a valid JPEG or PNG image')
    img_array=np.array(uploaded)
    result,overlay=({'method':'free-tier-report-only','model_status':'disabled_for_free_hosting','severity':'Unassessed','review_recommended':True,'physical_clearance_ft':None,'disclaimer':'Free-tier demo: report recorded without AI assessment. A photo cannot establish electrical clearance; human review required.'}, None) if FREE_DEMO else (analyze_yolo(img_array) if model_ready() else __import__('pretrained_engine').analyze(img_array))
    if overlay is None:
        overlay=Image.fromarray(img_array)
    else:
        overlay=Image.fromarray(overlay)
    ident=uuid.uuid4().hex[:12]
    owner_token=secrets.token_urlsafe(32)
    # Re-encode untrusted uploads instead of serving arbitrary original bytes.
    original=uploaded
    original.thumbnail((2000,2000))
    original.save(UPLOADS/f'{ident}.jpg',quality=85)
    overlay.save(UPLOADS/f'{ident}_overlay.png')
    row={'id':ident,'created_at':datetime.now(timezone.utc).isoformat(),'lat':lat,'lon':lon,'location':location,'notes':notes,'photo':f'{ident}.jpg','status':'New','screening':json.dumps(result)}
    with connect() as c:
        c.execute('INSERT INTO reports(id,created_at,lat,lon,location,notes,photo,status,screening,owner_hash) VALUES (:id,:created_at,:lat,:lon,:location,:notes,:photo,:status,:screening,:owner_hash)',{**row,'owner_hash':hashlib.sha256(owner_token.encode()).hexdigest()})
    return {**row,'screening':result,'overlay_url':f'/photos/{ident}_overlay.png','owner_token':owner_token}

@app.get('/health')
def health():return {'status':'ok','mode':'demo','ai':'disabled-free-demo' if FREE_DEMO else ('custom-yolo-segmentation' if model_ready() else 'pretrained-yoloworld-experimental')}

@app.post('/api/ai/warmup')
def ai_warmup():
    if FREE_DEMO:return {'status':'disabled-on-free-tier'}
    if model_ready():return {'status':'custom-model-configured'}
    from pretrained_engine import warmup as warmup_pretrained
    try:
        warmup_pretrained()
        return {'status':'pretrained-ready'}
    except Exception as exc:
        raise HTTPException(503,f'Pretrained model initialization failed: {type(exc).__name__}: {exc}')
