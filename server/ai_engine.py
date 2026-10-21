"""Optional custom-trained YOLO segmentation for GridLens.

Requires model weights trained for exactly two classes: 'power_line' and 'vegetation'.
Without valid weights the engine returns UNAVAILABLE, never invented severity.
Image pixel gaps are screening indicators, NOT physical conductor clearances.
"""
from pathlib import Path
import os
import numpy as np
import cv2
from geometry import measure

WEIGHTS=Path(os.getenv("GRIDLENS_MODEL_WEIGHTS",str(Path(__file__).parent/"models"/"best.pt")))
THRESHOLDS={"high_px":12,"medium_px":40} # demo-only pixel distances at normalized width 960
_MODEL=None

def model_ready():
    return WEIGHTS.is_file()

def analyze(rgb):
    global _MODEL
    if not model_ready():
        return {"method":"custom-yolo-segmentation","model_status":"not_configured",
                "severity":"Unassessed","review_recommended":True,
                "pixel_gap":None,"power_line_detected":False,"vegetation_detected":False,
                "disclaimer":"No custom-trained model weights are installed. Cannot assess encroachment."},None
    try:
        from ultralytics import YOLO
        if _MODEL is None:_MODEL=YOLO(str(WEIGHTS))
        h,w=rgb.shape[:2]
        scale=960/max(h,w)
        frame=cv2.resize(rgb,(max(1,round(w*scale)),max(1,round(h*scale))))
        pred=_MODEL.predict(source=frame,conf=0.3,verbose=False)[0]
        names=pred.names
        masks=pred.masks
        line=np.zeros(frame.shape[:2],np.uint8)
        vegetation=np.zeros_like(line)
        if masks is not None and pred.boxes is not None:
            for mask,cls in zip(masks.data.cpu().numpy(),pred.boxes.cls.cpu().numpy()):
                label=str(names[int(cls)]).lower().replace(" ","_").replace("-","_")
                resized=cv2.resize(mask,(frame.shape[1],frame.shape[0]),interpolation=cv2.INTER_NEAREST)>0.5
                if label in ("power_line","powerline","conductor","wire"):line[resized]=255
                if label in ("vegetation","tree","canopy","branches"):vegetation[resized]=255
        both=bool(line.any() and vegetation.any())
        # No physical severity from 2D photographs.
        severity="Review suggested" if both else "Unassessed"
        overlay=frame.copy()
        overlay[vegetation>0]=(0.45*overlay[vegetation>0]+0.55*np.array([36,198,91])).astype(np.uint8)
        overlay[line>0]=(0.3*overlay[line>0]+0.7*np.array([255,205,30])).astype(np.uint8)
        geometry=measure(line,vegetation,overlay)
        return {"method":"custom-yolo-segmentation","model_status":"loaded","severity":severity,
                "review_recommended":True,**geometry,
                "power_line_detected":bool(line.any()),"vegetation_detected":bool(vegetation.any()),
                "screening_width_px":frame.shape[1],
                "disclaimer":"Experimental image-space screening only. Pixel distance is not real-world electrical clearance. Requires utility-image validation and human review."},overlay
    except Exception as exc:
        return {"method":"custom-yolo-segmentation","model_status":"inference_error",
                "severity":"Unassessed","review_recommended":True,"pixel_gap":None,
                "disclaimer":"Model inference failed; no encroachment determination.",
                "error_type":type(exc).__name__},None
