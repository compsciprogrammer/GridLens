# GridLens — Expo SDK 57 upgrade

This is the existing GridLens Citizen mobile app + city dashboard + optional YOLO engine, with the mobile project updated from Expo SDK 54 to **Expo SDK 57**.

## Requirements
- Node.js 22.13+ and npm
- Python 3.10+ for backend
- Compatible Expo Go version or an Expo development build

## Install mobile dependencies (Mac)
```bash
cd mobile
bash upgrade-sdk57.sh
npx expo start --clear
```

## Manual installation (all platforms)
```bash
cd mobile
npm install
npx expo install --fix
npx expo-doctor
npx expo start --clear
```

`expo install --fix` is essential: it selects the exact versions of expo-image-picker, expo-location, expo-status-bar, AsyncStorage, and other native modules compatible with the installed SDK 57 release. If `expo-doctor` reports issues, fix those before building.

## Backend
In a separate terminal:
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ai.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Edit `mobile/config.js` to set `API_URL` to `http://YOUR_MAC_WIFI_IP:8000`; do not use `localhost` from the phone. Phone and Mac must share a network. On macOS, find the Wi-Fi IP with `ipconfig getifaddr en0`.

## Important limitations
- SDK 57 Expo Go compatibility depends on the installed Expo Go release. If it refuses the project, use a compatible Expo Go build or a development build.
- This package **does not include custom-trained YOLO weights**. Without weights, photo screening returns `Unassessed`. Do not claim actual trained encroachment detection.
- The City dashboard is a prototype, not an official municipal service. Do not expose it publicly without security hardening.
- Package JSON and Python syntax checked locally; npm installation, Expo Doctor, native builds, and device tests have NOT been run here.
