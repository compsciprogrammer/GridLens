# GridLens submission spinner fix

- Mobile app now displays an error after 45 seconds instead of leaving the Submit button disabled indefinitely.
- Button resets on success or error. A timeout does NOT cancel an upload already in progress: check the dashboard before trying again to avoid duplicate reports.
- A failed local history save no longer turns a successful server submission into an error.
- Server now responds with HTTP 415 for invalid images rather than throwing an unhandled exception.
- AI without trained weights remains Unassessed.

## Start
Backend: `cd server && python -m uvicorn app:app --host 0.0.0.0 --port 8000`
Mobile: `cd mobile && npm install && npx expo install --fix && npx expo start --clear`
Set `mobile/config.js` to your Mac LAN IP.

## Debug
Watch the Python terminal while submitting. If POST is logged, note HTTP status. If there is no POST, the upload may be stalled on the device; try a small JPEG and confirm the Expo app uses the latest bundle. For a timeout, inspect dashboard before retrying.

**No end-to-end device test performed.**
