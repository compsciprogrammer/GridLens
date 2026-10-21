#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<13)){console.error("Node 22.13+ required");process.exit(1)}'
npm install
npx expo install --fix
npx expo-doctor
printf '\nSDK 57 dependencies aligned. Run: npx expo start --clear\n'
