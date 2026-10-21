// React Native does not ship Node's `buffer` module. Some versions of
// react-native-svg reference it in their SVG data-loading utilities.
// Resolve that import to the browser-compatible buffer package.
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'buffer' || moduleName === 'node:buffer') {
    return { type: 'sourceFile', filePath: require.resolve('buffer/') };
  }
  if (originalResolveRequest) return originalResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
