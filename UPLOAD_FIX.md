# GridLens photo upload fix (Expo SDK 57)

Fixes `Unsupported FormDataPart implementation` before a POST reaches the server.

The mobile app now uses `expo-file-system/legacy` `uploadAsync` to send the photo as a native multipart upload, including lat/lon/location/notes as form parameters. No manual multipart Content-Type boundary is set. The backend endpoint is unchanged.

## Installation

1. Extract ZIP and open `gridlens_sdk57_upload_fix/mobile`.
2. Run `npx expo install expo-file-system` to install the SDK-compatible version.
3. Run `npx expo install --fix` and `npx expo start --clear`.
4. Keep the Python server running and ensure `mobile/config.js` contains your actual Mac LAN IP.
5. Select a photo and GPS, then submit. Look for `POST /api/reports ... 201` in the Python server log.

`expo-file-system/legacy` is used because the legacy multipart upload API provides a native file URI upload. If a future Expo SDK removes this legacy API, migrate to the supported File/Blob API.

The project was source-inspected; device testing and package installation were not performed.
