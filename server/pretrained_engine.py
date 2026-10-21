"""Experimental pretrained open-vocabulary object detection + OpenCV screening.
No power-line-specific model training; no real-world clearance assessment.
"""
import threading
import cv2
import numpy as np

_MODEL = None
_LOCK = threading.Lock()
LABELS = ['power line', 'overhead electrical wire', 'tree', 'tree branches']

def warmup():
    global _MODEL
    with _LOCK:
        if _MODEL is None:
            from ultralytics import YOLOWorld
            model = YOLOWorld('yolov8s-worldv2.pt')
            model.set_classes(LABELS)
            _MODEL = model
    return _MODEL

def analyze(rgb):
    try:
        model = warmup()
        h,w=rgb.shape[:2]
        scale=min(1.,960/max(h,w))
        frame=cv2.resize(rgb,(max(1,round(w*scale)),max(1,round(h*scale))))
        with _LOCK:
            prediction=model.predict(source=frame,conf=0.20,verbose=False,imgsz=960)[0]
        overlay=frame.copy()
        line_boxes=[]; tree_boxes=[]
        names=prediction.names
        for box in prediction.boxes:
            label=str(names[int(box.cls.item())]).lower()
            x1,y1,x2,y2=[int(v) for v in box.xyxy[0].tolist()]
            x1=max(0,x1);y1=max(0,y1);x2=min(frame.shape[1],x2);y2=min(frame.shape[0],y2)
            if x2<=x1 or y2<=y1:continue
            if 'wire' in label or 'power line' in label:
                line_boxes.append((x1,y1,x2,y2))
                cv2.rectangle(overlay,(x1,y1),(x2,y2),(255,198,30),2)
            elif 'tree' in label:
                tree_boxes.append((x1,y1,x2,y2))
                cv2.rectangle(overlay,(x1,y1),(x2,y2),(42,210,95),2)
        # A box gap is NOT a conductor-to-vegetation pixel gap. No severity rating.
        # Overlay is useful to inspect whether zero-shot detections are plausible.
        result={'method':'pretrained-yoloworld-open-vocabulary','model_status':'loaded',
                'severity':'Review suggested' if line_boxes and tree_boxes else 'Unassessed',
                'review_recommended':True,'power_line_detected':bool(line_boxes),
                'vegetation_detected':bool(tree_boxes),
                'candidate_line_boxes':len(line_boxes),'candidate_tree_boxes':len(tree_boxes),
                'pixel_gap':None,'physical_clearance_ft':None,'physical_severity':'Not determined',
                'screening_proximity':'Unassessed — pretrained bounding boxes are not pixel masks',
                'disclaimer':'Experimental pretrained zero-shot bounding boxes only; no custom utility training, no verified power-line segmentation or clearance measurement. Human review required.'}
        return result,overlay
    except Exception as exc:
        return {'method':'pretrained-yoloworld-open-vocabulary','model_status':'inference_error',
                'severity':'Unassessed','review_recommended':True,'pixel_gap':None,'physical_clearance_ft':None,'physical_severity':'Not determined',
                'screening_proximity':'Unassessed — pretrained bounding boxes are not pixel masks',
                'error_type':type(exc).__name__,
                'disclaimer':'Pretrained AI unavailable. Report saved without assessment; inspect server logs.'},None
