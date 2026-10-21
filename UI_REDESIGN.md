# GridLens compact mobile redesign

Inspired by the supplied two-page LineClear PDF: white/off-white background, bold charcoal headlines, yellow selected-state accents, simple green tree/power-line illustration, three hazard radio choices.

## Interactive proximity illustration
On the Report screen, tap any of three choices:
- Touching the line
- Within 10 feet
- Growing toward it

The radio button and illustration update together. The tree canopy moves progressively away from the fixed wire in the drawing, and the caption changes. This is an illustrative animation/state change, **not a measurement** or certified safety assessment. The "Within 10 feet" option is the citizen's subjective observation, not an AI-calculated distance.

## Backend integration
Existing native multipart upload, GPS, AI screening, history, and demo dashboard remain intact. To avoid changing the backend database schema, the selected radio option is prepended to `notes` as `Citizen proximity observation: ... (unverified).` This appears in dashboard report details where notes are displayed. The AI result remains separate.

## Run
In `server`: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements-ai.txt && python -m uvicorn app:app --host 0.0.0.0 --port 8000`

In `mobile`: set the correct LAN IP in `config.js`, then `npm install && npx expo install --fix && npx expo start --clear`.

## Notes
- Expo SDK 57 source retained.
- The Heat map tab currently directs users to the existing web dashboard; it is not a native map yet.
- Do not submit emergencies through the demo app. It is not connected to Austin Energy or 911.
- The interface has not been tested on a physical iPhone/Android device.
