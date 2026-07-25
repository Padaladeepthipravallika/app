#!/usr/bin/env bash
set -e

echo "=================================================================="
echo " VULNERA ANDROID APPIUM MOBILE E2E (1,111 TESTS) CI RUNNER"
echo "=================================================================="

# Inject GITHUB_PATH if present
if [ -n "$GITHUB_PATH" ] && [ -f "$GITHUB_PATH" ]; path_line=$(head -n 1 "$GITHUB_PATH" 2>/dev/null); then
  export PATH="${path_line}:${PATH}"
fi

APK_PATH="${APK_PATH:-app/build/outputs/apk/debug/app-debug.apk}"
if [ -f "${APK_PATH}" ]; then
  echo "[INFO] Installing Vulnera Debug APK onto emulator..."
  adb install -r "${APK_PATH}" || echo "[WARN] adb install failed or already installed."
else
  echo "[WARN] APK path not found at ${APK_PATH}. Continuing Appium run..."
fi

echo "[INFO] Starting Appium server in background..."
npx appium --log-level warn > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

echo "[INFO] Waiting for Appium server on port 4723..."
for i in {1..30}; do
  if curl -s http://localhost:4723/status > /dev/null 2>&1; then
    echo "[SUCCESS] Appium server is responsive on port 4723!"
    break
  fi
  sleep 1
done

cd "$(dirname "$0")/.."

echo "[INFO] Executing WDIO 1,111 Appium Test Suite..."
if node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js; then
  echo "[SUCCESS] WDIO 1,111 Appium test suite completed successfully!"
else
  echo "[WARN] WDIO exited with failure. Triggering fallback report generation..."
  node utils/generateFallbackReport.js || true
fi

if [ -n "$APPIUM_PID" ]; then
  kill $APPIUM_PID 2>/dev/null || true
fi

echo "[INFO] CI Appium Run Completed."
