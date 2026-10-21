"""Train on YOUR annotated dataset; does not ship a trained model."""
import argparse
from ultralytics import YOLO
p=argparse.ArgumentParser()
p.add_argument("--data",required=True,help="YOLO segmentation dataset.yaml")
p.add_argument("--epochs",type=int,default=80)
p.add_argument("--imgsz",type=int,default=960)
args=p.parse_args()
model=YOLO("yolo11n-seg.pt")
model.train(data=args.data,epochs=args.epochs,imgsz=args.imgsz,project="runs/gridlens",name="utility_seg")
model.val(data=args.data)
print("Use the trained runs/gridlens/utility_seg/weights/best.pt as GRIDLENS_MODEL_WEIGHTS")
