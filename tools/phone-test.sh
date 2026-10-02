#!/usr/bin/env bash
# Installs Mooncart on a running Android phone or emulator (adb) and plays a few built-in
# games, taking a screenshot of each step and checking the log for errors.
#
#   bash tools/phone-test.sh build/android/Mooncart.apk [out-dir]
#
# With PRINT_SHOTS=1 it also prints small JPEG copies of the screenshots into the log
# (between "=== SHOT name" and "=== END" lines), so they can be looked at from the log alone.
set -uo pipefail
APK="${1:?apk}"
OUT="${2:-build/phone-test}"
PKG=io.github.chriskizer91ops.mooncart
mkdir -p "$OUT"
FAIL=0

shot() {
  sleep "${2:-0}"
  adb exec-out screencap -p > "$OUT/$1.png"
  echo "screenshot $1 ($(stat -c%s "$OUT/$1.png") bytes)"
  if [ "${PRINT_SHOTS:-}" = 1 ] && command -v convert >/dev/null; then
    convert "$OUT/$1.png" -resize 960x960 -quality 62 "$OUT/$1.jpg"
    echo "=== SHOT $1"
    base64 -w 4000 "$OUT/$1.jpg"
    echo "=== END"
  fi
}
launch() {
  echo "--- launching: $1"
  adb shell am start -n "$PKG/.MainActivity" --es launch "$1" >/dev/null
}
key() { adb shell input keyevent "$@"; sleep 0.4; }

adb shell getprop ro.build.version.release | sed 's/^/Android /'
adb shell dumpsys package com.google.android.webview 2>/dev/null | grep -m1 versionName | sed 's/^ */WebView /'
adb logcat -c
echo "--- installing $(du -h "$APK" | cut -f1)"
time adb install -r -g "$APK" || { echo "install failed"; exit 1; }
adb shell am start -W -n "$PKG/.MainActivity"
shot 01-start 4
shot 02-game-list 3
key KEYCODE_DPAD_DOWN KEYCODE_DPAD_DOWN
shot 03-picked 0.5

launch "Bogmire";                   shot 04-bogmire 18
key KEYCODE_DPAD_RIGHT
key KEYCODE_BACK;                   shot 05-game-menu 1
key KEYCODE_BACK
launch "What the Map Forgot";       shot 06-what-the-map-forgot 12
key KEYCODE_ENTER;                  shot 07-map-after-enter 2
launch "Follow Me Down Witch Way";  shot 08-witch-way 25
launch "Sol, the Last Ember Warden"; shot 09-sol-packed-3d 18
launch "Aethermoor — Character Ledger"; shot 10-character-ledger 8
key KEYCODE_BACK; sleep 1
for i in 1 2 3 4; do key KEYCODE_DPAD_DOWN; done
key KEYCODE_ENTER;                  shot 11-back-to-list 2
key KEYCODE_F1;                     shot 12-library 2

echo "--- app log"
adb logcat -d -s Mooncart:V chromium:W AndroidRuntime:E ActivityManager:W > "$OUT/logcat.txt"
grep -v -E "^--------- beginning" "$OUT/logcat.txt" | tail -n 120
if grep -q "FATAL EXCEPTION" "$OUT/logcat.txt"; then echo "!!! the app crashed"; FAIL=1; fi
if grep -E "Uncaught|ERROR " "$OUT/logcat.txt" | grep -v -i "favicon" >/dev/null; then
  echo "!!! page errors:"; grep -E "Uncaught|ERROR " "$OUT/logcat.txt" | head -20
fi
adb shell pidof "$PKG" >/dev/null || { echo "!!! the app is not running at the end"; FAIL=1; }
exit $FAIL
