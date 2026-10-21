# GridLens — Congressional App Challenge prototype

A **dual-sided** civic infrastructure demo:

- **Citizen mobile app** (Expo / React Native): photo capture, GPS, reports, local history, server photo screening.
- **City-style operations dashboard** (FastAPI / SQLite / Leaflet): shared incoming reports, interactive Austin map, 10-second refresh, status updates, photos and screening overlays.

## IMPORTANT: AI scope and safety

This build uses **real image processing** (OpenCV HSV color segmentation and Hough line detection), but **does not include a custom-trained AI model**. Long straight edges are **not validated power-line detections**, and green pixels are not validated vegetation detections. No physical electrical clearance can be inferred from a single photo without calibration, depth, and validated infrastructure geometry. Screening output is **experimental and always requires human review**. No automatic dispatch, City of Austin affiliation, or utility notifications are implemented. A custom-trained detector and labeled utility-photo evaluation dataset are necessary before claiming reliable encroachment classification.

## Start server / dashboard (Mac)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000 on your Mac. API docs: http://localhost:8000/docs.

## Start mobile app

Install Node.js 20+ and Expo Go compatible with the project's Expo SDK (SDK 54 as pinned; use `npx expo install --fix` to align packages). Open a second terminal:

```bash
cd mobile
npm install
npx expo install --fix
npx expo start
```

Edit `mobile/config.js` to use your Mac's Wi-Fi LAN IP, e.g. `http://192.168.1.23:8000`, **not** localhost. Find Mac Wi-Fi IP with `ipconfig getifaddr en0`. Phone and computer must be on the same network. Scan QR in Expo Go. If the installed Expo Go is incompatible with SDK 54, upgrade the project with Expo's official upgrade guide or use a compatible development build.

## Real-time demo workflow

1. Take or select a photo in the citizen app, capture GPS, add notes, submit.
2. Backend re-encodes the photo, performs experimental color/edge screening, saves the report and overlay.
3. Dashboard automatically refreshes every 10 seconds, displays the report pin and photos.
4. Reviewer changes report status to Under review, Crew assigned, or Resolved (demonstration workflow only).

## Production requirements (not implemented)

Authentication and roles, TLS, rate limits, secure photo access, content moderation, consent and retention policy, audit trails, approved City integration, offline queue, reliable utility-specific image detection model, labeled test set, calibrated clearance estimation, geospatial validation, push notifications and formal utility dispatch approval. Do not expose this demo server to the public internet; all records/photos are accessible to anyone who can reach it.

## API

- GET `/health`
- GET `/api/reports`
- POST `/api/reports` (multipart `photo`, `lat`, `lon`, `location`, `notes`)
- PATCH `/api/reports/{id}` JSON `{ "status": "Under review" }`
