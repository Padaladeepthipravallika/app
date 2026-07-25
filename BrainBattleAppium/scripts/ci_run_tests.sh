#!/usr/bin/env bash
set -e

echo "=========================================================================="
echo " BRAINBATTLE ANDROID APPIUM CI TEST RUNNER (1,111 TESTS)"
echo "=========================================================================="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "${SCRIPT_DIR}/.." && pwd )"
cd "${PROJECT_DIR}"

# 1. Inject GITHUB_PATH into PATH if present
if [ -n "${GITHUB_PATH}" ] && [ -f "${GITHUB_PATH}" ]; then
  echo "[CI] Injecting GITHUB_PATH into current environment PATH..."
  export PATH="$(tr '\n' ':' < "${GITHUB_PATH}")${PATH}"
fi

# 2. Set APK path default if not set
APK_PATH="${APK_PATH:-${PROJECT_DIR}/../app/build/outputs/apk/debug/app-debug.apk}"
echo "[CI] Target APK Path: ${APK_PATH}"

# 3. Install APK onto Android Emulator via ADB
if command -v adb >/dev/null 2>&1; then
  echo "[CI] Waiting for Android Emulator device to be ready via ADB..."
  adb wait-for-device
  if [ -f "${APK_PATH}" ]; then
    echo "[CI] Installing debug APK onto emulator..."
    adb install -r "${APK_PATH}" || echo "[WARNING] ADB install returned non-zero code. Proceeding with testing."
  else
    echo "[WARNING] APK file not found at ${APK_PATH}. Testing will run with driver capabilities fallback."
  fi
else
  echo "[WARNING] ADB command not found in environment PATH."
fi

# 4. Start Appium Server in background
echo "[CI] Starting Appium server in background on port 4723..."
if command -v appium >/dev/null 2>&1; then
  appium --log-level warn > /tmp/appium.log 2>&1 &
  APPIUM_PID=$!
  echo "[CI] Appium server started with PID: ${APPIUM_PID}"
else
  echo "[WARNING] Global Appium binary not found; attempting npx appium execution..."
  npx appium --log-level warn > /tmp/appium.log 2>&1 &
  APPIUM_PID=$!
fi

# 5. Wait for Appium to respond on port 4723 using curl loop
echo "[CI] Waiting for Appium server to become responsive on port 4723..."
MAX_ATTEMPTS=30
ATTEMPT=0
until curl -s http://localhost:4723/status >/dev/null 2>&1 || [ $ATTEMPT -eq $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT+1))
  echo "[CI] Waiting for Appium... (${ATTEMPT}/${MAX_ATTEMPTS})"
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "[WARNING] Appium server did not respond on port 4723 within timeout. Logs:"
  cat /tmp/appium.log || true
fi

# 6. Execute WDIO Test Suite using Node
echo "[CI] Executing 1,111 Appium Test Cases via WDIO..."
EXIT_CODE=0

if [ -f "node_modules/@wdio/cli/bin/wdio.js" ]; then
  node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js || EXIT_CODE=$?
elif command -v npx >/dev/null 2>&1; then
  npx wdio run wdio.conf.js || EXIT_CODE=$?
else
  echo "[ERROR] Could not resolve WDIO test runner CLI."
  EXIT_CODE=1
fi

# 7. Fallback report generation if WDIO exited prematurely
if [ $EXIT_CODE -ne 0 ]; then
  echo "[WARNING] WDIO exited with code ${EXIT_CODE}. Triggering fallback report generation..."
  node utils/generateFallbackReport.js || true
fi

echo "=========================================================================="
echo " BRAINBATTLE APPIUM CI RUNNER COMPLETE (EXIT CODE: ${EXIT_CODE})"
echo "=========================================================================="
exit $EXIT_CODE
