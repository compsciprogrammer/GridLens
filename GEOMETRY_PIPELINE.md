# GridLens geometric encroachment screening

## What changed

When **custom YOLO segmentation weights** are installed, the backend:
1. Segments overhead conductors and vegetation into pixel masks.
2. Extracts the outer canopy contour using OpenCV.
3. Computes the minimum Euclidean pixel distance from the canopy contour to the **finite conductor mask** (not an unbounded fitted line). The reference point-to-infinite-line equation `abs(A*x+B*y+C)/sqrt(A*A+B*B)` is available in `geometry.py`, but an infinite line can create false proximity when its extension crosses vegetation outside the visible wire.
4. Draws the shortest measured segment on the image overlay.
5. Returns `pixel_gap`, `screening_proximity`, `measurement_points`, and `physical_clearance_ft: null`.

The illustrative normalized-image screening bands are Close <=12 px, Moderate <=40 px, Separated >40 px, assuming the input is scaled to a maximum dimension of 960 pixels. These are **not** validated electrical risk or clearance thresholds.

**Pretrained YOLO-World only supplies bounding boxes, not conductor/canopy pixel masks.** Its reports stay **Unassessed** for geometric proximity. This prevents claiming a precise contour-to-conductor distance from coarse bounding boxes.

## Physical severity

Do **not** convert 2D pixel distances into feet using a pole crossarm alone. Perspective, camera calibration, object depth and wire sag all matter. Your proposed Critical (<5 ft), Warning (5–15 ft), and Safe (>15 ft) categories require a validated 3D measurement (e.g. LiDAR/stereo with conductor and vegetation coordinates), not a monocular photo. The engine intentionally returns `physical_severity: Not determined`.

## Run

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ai.txt
python -m unittest test_geometry.py
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Set `GRIDLENS_MODEL_WEIGHTS=/absolute/path/to/best.pt` for custom segmentation. The included pretrained option still works for candidate boxes. No model weights are bundled, and end-to-end phone inference has not been tested.

**Keep the existing Mac LAN IP in `mobile/config.js`** when installing this new ZIP. The dashboard and mobile app remain Expo SDK 57.
