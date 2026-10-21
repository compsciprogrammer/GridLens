# GridLens visual hazard assessment update

The previous sliding-tree graphic is replaced with a scalable vector illustration that changes **canopy-to-wire vertical separation** for each of the three radio buttons. The utility pole remains fixed at the right and is **never** used as the distance reference.

- **Touching the line**: canopy intersects the wire, highlighted with a red contact circle.
- **Within 10 feet**: visible small gap from canopy boundary to the overhead wire, shown by a double-headed amber arrow. **No feet are inferred from this schematic.**
- **Growing toward it**: larger gap to the wire, with a green double-headed arrow.

All three scenarios update immediately on radio selection. Citizen choices continue to be included in report notes; backend unchanged.

## Run
```
cd gridlens_visual_proximity_sdk57/mobile
npm install
npx expo install --fix
npx expo start --clear
```

Keep the currently working backend running. Check `mobile/config.js` for the correct Mac LAN IP.

The illustration is a teaching aid, not a measurement of actual electrical clearance. SVG dependency: `react-native-svg` (aligned by `expo install --fix`).
