#!/usr/bin/env bash
# Installs Mooncart on an Android phone or emulator (adb), turns on airplane mode and plays some
# of the built-in games, taking a screenshot of each step and checking the app's log.
#
#   bash tools/phone-test.sh build/android/Mooncart.apk [out-dir]
#
# On an emulator the screen is first made like a cheap phone's (720 x 1600). Games are started by
# their save slot (see collection.json); a game that isn't in this build is skipped. WAIT=seconds
# changes how long it waits for a game to load (90). AIRPLANE=0 leaves the network on (needed for
# adb over Wi-Fi). With PRINT_SHOTS=1 small copies of a few screenshots go into the log between
# "=== SHOT name" and "=== END" (needs ffmpeg or ImageMagick).
set -uo pipefail
APK="${1:?apk}"
OUT="${2:-build/phone-test}"
PKG=io.github.chriskizer91ops.mooncart
LOG="$OUT/logcat.txt"
mkdir -p "$OUT"
rm -rf "$OUT"/*.png "$OUT"/*.jpg "$OUT/screens"
FAIL=0
SLOW=()

# ------------------------------------------------------------------ helpers
key() { adb shell input keyevent "$@"; sleep 0.5; }
lines() { wc -l < "$LOG"; }

# wait_log TEXT SECONDS FROM: wait until the app's log says TEXT after line FROM
wait_log() {
  local i
  for ((i = 0; i < $2; i++)); do
    # (grep reads everything rather than -q: with pipefail an early exit would read as a miss)
    if tail -n +"$(($3 + 1))" "$LOG" | grep -F -- "$1" >/dev/null; then echo "    \"$1\" after ${i}s"; return 0; fi
    sleep 1
  done
  echo "    !! still no \"$1\" after $2s"
  return 1
}

# tap_text TEXT: tap the button showing TEXT, if there is one (for the system's own pop-ups)
tap_text() {
  local b
  adb shell uiautomator dump /sdcard/mc-ui.xml >/dev/null 2>&1 || return 1
  b=$(adb exec-out cat /sdcard/mc-ui.xml | grep -o "text=\"$1\"[^>]*bounds=\"[^\"]*\"" | head -1 | sed 's/.*bounds="//' | tr -c '0-9' ' ')
  [ -n "${b// /}" ] || return 1
  # shellcheck disable=SC2086
  set -- $b
  adb shell input tap $((($1 + $3) / 2)) $((($2 + $4) / 2))
  sleep 1
}

# The system's own pop-ups would hide the screenshots: the one-time "Viewing full screen" tip,
# and the "... isn't responding" box a busy emulator shows now and then.
clear_popups() {
  local wins
  wins=$(adb shell dumpsys window windows 2>/dev/null)
  if grep -q "Application Not Responding" <<<"$wins"; then
    echo "    (the system shows its \"$(grep -m1 -o 'Application Not Responding: [^ }]*' <<<"$wins")\" box; tapping Wait)"
    tap_text Wait || echo "    (couldn't find its Wait button)"
  fi
  if grep -q "ImmersiveModeConfirmation" <<<"$wins"; then tap_text "Got it" || true; fi
}

# shot NAME [SECONDS]: wait, then take a screenshot
shot() {
  sleep "${2:-0}"
  clear_popups
  adb exec-out screencap -p > "$OUT/$1.png"
  echo "    screenshot $1"
}

in_build() { grep -q "\"saveKey\": *\"$1\"" "$OUT/collection.json"; }

# play SLOT [SECONDS]: start a built-in game by its save slot, then wait until it has loaded
play() {
  if ! in_build "$1"; then echo "--- $1: not in this build, skipped"; return 1; fi
  echo "--- playing $1"
  local from; from=$(lines)
  adb shell am start -n "$PKG/.MainActivity" --es launch "$1" >/dev/null
  wait_log "[mooncart] loaded $1 in" "${2:-${WAIT:-90}}" "$from" || SLOW+=("$1")
  return 0
}

# A freshly started emulator spends its first minutes setting up its own apps. Wait (at most
# 90 s) for it to calm down, so its slowness isn't put down to Mooncart.
settle() {
  local i load cpus
  cpus=$(adb shell nproc 2>/dev/null | tr -dc '0-9'); cpus=${cpus:-2}
  for ((i = 0; i < 18; i++)); do
    load=$(adb shell cat /proc/loadavg | cut -d' ' -f1 | tr -dc '0-9.')
    awk -v l="${load:-0}" -v c="$cpus" 'BEGIN { exit !(l + 0 < c + 0) }' && break
    sleep 5
  done
  echo "load average $(adb shell cat /proc/loadavg | cut -d' ' -f1-3) on $cpus processors (waited $((i * 5)) s)"
}

# to_jpg in.png out.jpg width: with whatever image tool this machine has (else a copy of the PNG)
to_jpg() {
  if command -v ffmpeg >/dev/null; then ffmpeg -y -loglevel error -i "$1" -vf "scale=$3:-2" -q:v 4 "$2"
  elif command -v magick >/dev/null; then magick "$1" -resize "$3x$3" -quality 80 "$2"
  elif command -v convert >/dev/null; then convert "$1" -resize "$3x$3" -quality 80 "$2"
  else cp "$1" "${2%.jpg}.png"; fi
}
print_shots() {
  [ "${PRINT_SHOTS:-}" = 1 ] || return 0
  for f in "$@"; do
    [ -f "$OUT/$f.png" ] || continue
    to_jpg "$OUT/$f.png" "$OUT/$f.small.jpg" 640
    [ -f "$OUT/$f.small.jpg" ] || continue
    echo "=== SHOT $f"
    base64 -w 4000 "$OUT/$f.small.jpg"
    echo "=== END"
  done
}

# ------------------------------------------------------------------ the phone
adb shell getprop ro.build.version.release | sed 's/^/Android /'
adb shell dumpsys webviewupdate 2>/dev/null | grep -m1 -i "current webview package" | sed 's/^ *//'
unzip -p "$APK" assets/collection/collection.json > "$OUT/collection.json" 2>/dev/null || echo '{}' > "$OUT/collection.json"
echo "games inside: $(grep -c '"saveKey"' "$OUT/collection.json")"
EMULATOR=0
if [ "$(adb shell getprop ro.boot.qemu | tr -d '\r')" = 1 ] || [ "$(adb shell getprop ro.kernel.qemu | tr -d '\r')" = 1 ]; then
  EMULATOR=1
  echo "an emulator: giving it a cheap phone's screen, 720 x 1600"
  adb shell wm size 720x1600
  adb shell wm density 280
fi
# the one-time "Viewing full screen" tip (a person taps Got it once)
adb shell settings put secure immersive_mode_confirmations confirmed
echo "--- installing $(du -h "$APK" | cut -f1)"
adb install -r -g "$APK" || { echo "install failed"; exit 1; }
WAS_AIRPLANE=$(adb shell settings get global airplane_mode_on | tr -dc '0-9')
if [ "${AIRPLANE:-1}" = 1 ]; then
  adb shell cmd connectivity airplane-mode enable >/dev/null 2>&1 || { adb shell svc wifi disable; adb shell svc data disable; }
  echo "airplane mode: $(adb shell settings get global airplane_mode_on | tr -d '\r') (1 = on)"
fi
adb logcat -c
adb logcat Mooncart:V chromium:W AndroidRuntime:E ActivityManager:W ActivityTaskManager:W '*:S' > "$LOG" 2>&1 &
LOGCAT=$!
trap 'kill $LOGCAT 2>/dev/null' EXIT

# ------------------------------------------------------------------ play
echo "--- starting Mooncart"
adb shell am start -W -n "$PKG/.MainActivity" | grep -E "Status|TotalTime"
if [ "$EMULATOR" = 1 ]; then
  # the emulator's home screen app gets stuck redrawing itself for the new screen size and keeps
  # saying it "isn't responding"; with Mooncart in front it isn't needed, so stop it
  HOME_APP=$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null | tail -n 1 | cut -d/ -f1 | tr -d '\r')
  case "$HOME_APP" in ""|android|"$PKG") ;; *) echo "stopping the home screen app ($HOME_APP)"; adb shell am force-stop "$HOME_APP" ;; esac
fi
settle
wait_log "[mooncart] ready" 90 0 || { echo "!!! the console never got going"; FAIL=1; }
shot 01-game-list 2
key KEYCODE_DPAD_DOWN KEYCODE_DPAD_DOWN
shot 02-picked

if play bogmire; then
  shot 03-bogmire 6
  key KEYCODE_DPAD_RIGHT
  key KEYCODE_BACK; shot 04-game-menu 1
  key KEYCODE_BACK
fi
play wickhollow-square && shot 05-wickhollow-square 4
# (an emulator draws 3D with its processor: Sol's first picture takes it about half a minute)
play sol-the-last-ember-warden && shot 06-sol-3d-model 30
play the-realm-of-aethermoor-interactive-map && shot 07-aethermoor-map 3
play aethermoor-character-ledger && shot 08-character-ledger 3
if play what-the-map-forgot; then
  shot 09-what-the-map-forgot 4
  key KEYCODE_ENTER; shot 10-map-after-enter 2
fi
play follow-me-down-witch-way 150 && shot 11-witch-way 6

echo "--- back to the game list, then the library"
key KEYCODE_BACK; sleep 1
for _ in 1 2 3 4; do key KEYCODE_DPAD_DOWN; done
key KEYCODE_ENTER; shot 12-back-to-list 2
key KEYCODE_F1;    shot 13-library 2

# ------------------------------------------------------------------ what the log says
sleep 1
kill $LOGCAT 2>/dev/null
echo "--- the app's log"
grep -F "Mooncart" "$LOG" | grep -v -E "RENDER WARNING|too many errors" | tail -n 60
if grep -A2 "FATAL EXCEPTION" "$LOG" | grep -F "Process: $PKG" >/dev/null; then echo "!!! Mooncart crashed"; FAIL=1; fi
if grep -q "ANR in $PKG" "$LOG"; then echo "!! the system saw Mooncart stop responding for a while"; fi
if grep -q "Mooncart: internet:" "$LOG"; then
  echo "!! pages that reached for the internet (with no internet they go without):"
  grep -F "Mooncart: internet:" "$LOG" | sed 's/.*internet: /   /' | sort -u | head -20
fi
if grep -q "Mooncart: ERROR" "$LOG"; then
  echo "!! errors on the pages:"
  grep -F "Mooncart: ERROR" "$LOG" | sed 's/.*Mooncart: ERROR /   /' | sort | uniq -c | sort -rn | head -20
fi
[ ${#SLOW[@]} -eq 0 ] || echo "!! still loading when the test went on: ${SLOW[*]}"
adb shell pidof "$PKG" >/dev/null || { echo "!!! the app is not running at the end"; FAIL=1; }
# put the phone back as it was
if [ "${AIRPLANE:-1}" = 1 ] && [ "$WAS_AIRPLANE" != 1 ]; then adb shell cmd connectivity airplane-mode disable >/dev/null 2>&1 || true; fi
if [ "$EMULATOR" = 1 ]; then adb shell wm size reset; adb shell wm density reset; fi

# copies of a few steps, for the release page
mkdir -p "$OUT/screens"
for f in 01-game-list 03-bogmire 04-game-menu 05-wickhollow-square 06-sol-3d-model 07-aethermoor-map 09-what-the-map-forgot 11-witch-way 13-library; do
  [ -f "$OUT/$f.png" ] && to_jpg "$OUT/$f.png" "$OUT/screens/android-$f.jpg" 1280
done
ls -la "$OUT/screens"
print_shots 01-game-list 03-bogmire
exit $FAIL
