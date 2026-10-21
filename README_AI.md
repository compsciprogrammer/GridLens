# GridLens AI & Computer Vision Upgrade

The original prototype's color/edge heuristic is replaced in the report pipeline
with an **optional custom-trained YOLO segmentation model**. No model weights or
labeled utility imagery are bundled. Without `best.pt`, submissions are recorded
as **Unassessed**, not Low/Medium/High.

## Run
```
cd server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ai.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
Use the mobile app as described in the main README.

## Train a custom model
1. Collect appropriately licensed urban utility images and obtain permission.
2. Annotate pixel-level polygons for BOTH `power_line` and `vegetation`.
3. Split images by site/corridor (not random adjacent frames) into train/validation/test.
4. Export YOLO segmentation format and edit `server/example_dataset.yaml`.
5. Run:
```
cd server
python train_yolo.py --data /path/to/dataset.yaml --epochs 80
```
6. Validate precision/recall, class-wise mask IoU, false-negative rate, and
   severity confusion matrix on a HELD-OUT utility-specific test set.
7. Configure weights:
```
export GRIDLENS_MODEL_WEIGHTS=/absolute/path/to/best.pt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## What the analysis actually measures
- YOLO segmentation identifies class-specific pixel masks for conductor and canopy.
- OpenCV `distanceTransform` calculates minimum 2D image-space gap between masks
  after resizing the image to maximum dimension 960 pixels.
- Example UI categories: High <=12 px, Medium <=40 px, Low >40 px.
- If either class is absent, result is **Unassessed**.
- These thresholds are arbitrary DEMO SCREENING VALUES, NOT utility standards.
- Even a correctly classified 2D pixel gap does not provide physical clearance,
  depth, line voltage, or a safe/unsafe decision.
- All reports require human review; no automatic crew dispatch or utility notification.

## Model provenance
No custom model has been trained or evaluated by this package. You must supply
training data, weights, and held-out metrics before making that claim.
The package has been syntax-checked; end-to-end inference with real weights
has not been validated in this environment.

## Security
The existing demo backend is not suitable for public deployment: add authentication,
authorization, consent, HTTPS, abuse controls, and privacy protections first.
