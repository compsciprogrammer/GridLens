# GridLens SDK 57 SVG buffer fix

The React Native Metro bundler cannot resolve the Node core `buffer` module
imported by `react-native-svg/src/utils/fetchData.ts`. This update adds the
React Native-compatible `buffer` package and an Expo Metro resolver alias.

From the **mobile** directory:

```sh
npm install
npx expo install --fix
npx expo start --clear
```

If Metro still uses an old dependency graph, stop it and run:

```sh
rm -rf node_modules/.cache .expo
npx expo start --clear
```

This only changes mobile bundling. Keep the working Python backend running.

This project has not been tested on a physical device.
