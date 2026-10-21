# GridLens Option 1: Pretrained YOLO-World (experimental)

This release adds **pretrained YOLO-World open-vocabulary object detection** to the working Expo SDK 57 + FastAPI project. No custom model training is required for this demonstration. When a trained `server/models/best.pt` exists, the existing custom YOLO segmentation takes priority. Otherwise the pretrained engine tries to identify candidate overhead wires and trees with bounding boxes. The boxes are shown in the report overlay.

**Limits:** This is NOT a reliable power-line detector, does not segment conductors or canopies, does not calculate a valid pixel gap, and does not assign Low/Medium/High safety severity. It returns **Review suggested** only when both object categories are detected, otherwise **Unassessed**. A pretrained general model may miss thin wires or hallucinate them. Never infer safety from a negative result.

## Run backend

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ai.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/health`. **Before using the phone**, open a second Terminal and pre-download/warm up the model (may take minutes and requires internet):

```bash
curl -X POST http://localhost:8000/api/ai/warmup
```

Expected `{"status":"pretrained-ready"}`. If it fails, check the Python terminal for details. The model is downloaded from Ultralytics on first initialization and is subject to the model's license. CPU inference on a Mac can be slow; warming up first avoids making the phone wait during first-time download. Model download is not bundled in this ZIP.

## Mobile app

The `mobile/` folder remains Expo SDK 57. Set `mobile/config.js` to your Mac's Wi-Fi IP, run `npm install`, `npx expo install --fix`, `npx expo start --clear`, then submit a small photo. The City Dashboard remains at `http://localhost:8000`.

## Verify

1. Confirm `/health` responds.
2. Run warmup before opening the phone app.
3. Submit a photo with trees and overhead wires.
4. Inspect bounding-box overlay and the report's `screening.method` (`pretrained-yoloworld-open-vocabulary`).
5. If either class is missed, the report remains **Unassessed**. This is expected for zero-shot detection.

No model accuracy claims are made. Code has been syntax checked, but model weights were not downloaded and real-device inference has not been tested in this environment.
