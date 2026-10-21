# GridLens — Render free tier deployment

This package is ready to **upload to your own GitHub repository**, then connect to Render. It has **not** been deployed to your account.

## 1. Upload code to GitHub
Create a new private GitHub repository named `gridlens-demo`. Upload the contents of this folder to the repository root, including `render.yaml`, `server/`, and `mobile/`. Avoid uploading real photos, location records, secrets, `.env`, or `node_modules`.

## 2. Deploy on Render
Sign in to https://dashboard.render.com. Select **New > Blueprint** (or **New > Web Service**). Connect the GitHub repository. If using Blueprint, Render reads `render.yaml` and configures the free web service. If using Web Service manually: choose **Free**, root directory `server`, build command `pip install -r requirements-render.txt`, start command `uvicorn app:app --host 0.0.0.0 --port $PORT`, health path `/health`, and environment variable `GRIDLENS_FREE_DEMO=1`.

## 3. Check the service
Open `https://YOUR-SERVICE.onrender.com/health`. Expected: status `ok`, ai `disabled-free-demo`. Open the root URL for the dashboard. The first request after idle can take about a minute.

## 4. Point iPhone app at the hosted API
Edit `mobile/config.js` and replace `https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com` with your real HTTPS Render URL (no trailing slash). In `mobile/` run:

```bash
npm install
npx expo install --fix
npx expo start --tunnel --clear
```

Use Expo Go on iPhone. Switch off Wi-Fi to test using cellular data. `--tunnel` makes the Expo development bundle accessible remotely; the Render URL makes the backend accessible remotely.

## Free tier limitations and safety
- The free instance has 512 MB RAM; this package disables YOLO and retains report submission, photos, and dashboard. AI results explicitly say **Unassessed**.
- Render free web services sleep after 15 minutes idle; initial upload after wake-up may take longer. The mobile upload timeout was increased to 120 seconds.
- SQLite and photo uploads are stored on an **ephemeral filesystem**. Data can disappear on sleep/restart/redeploy. Do not use real private photos or exact home locations.
- The demo has no authentication or rate limiting; **the dashboard and reports become publicly reachable**. Use only synthetic/demo reports. Do not use for operational utility reporting.
- If you need persistence or production use, add authenticated access, managed database, object storage, and abuse protections.
