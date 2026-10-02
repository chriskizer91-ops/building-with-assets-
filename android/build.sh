#!/usr/bin/env bash
# Builds Mooncart.apk with the Android SDK's own tools (no Gradle):
#   aapt2 (resources + manifest) -> javac -> d8 (dex) -> zipalign -> apksigner.
#
#   bash android/build.sh            # uses $ANDROID_HOME (or $ANDROID_SDK_ROOT)
#
# Put the built-in games in build/collection first (node tools/collect-games.mjs); without
# them the app still builds, with an empty library.
# Signing: MOONCART_KEYSTORE / MOONCART_KEYSTORE_PASS / MOONCART_KEY_ALIAS / MOONCART_KEY_PASS,
# or the shared key in android/mooncart.keystore (see android/KEYSTORE.md).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
OUT="$ROOT/build/android"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
API="${MOONCART_API:-35}"
MIN_API=24
VERSION_NAME=$(node -p "require('./package.json').version")
VERSION_CODE="${MOONCART_VERSION_CODE:-$(node -p "const [a,b,c]=require('./package.json').version.split('.').map(Number); a*10000+b*100+c")}"

[ -n "$SDK" ] || { echo "Set ANDROID_HOME to your Android SDK"; exit 1; }
PLATFORM="$SDK/platforms/android-$API/android.jar"
[ -f "$PLATFORM" ] || { echo "Missing $PLATFORM (install it with: sdkmanager \"platforms;android-$API\")"; exit 1; }
BT=$(ls -d "$SDK"/build-tools/*/ | sort -V | tail -1)
BT=${BT%/}
echo "Android SDK: $SDK  platform: android-$API  build-tools: $(basename "$BT")  version: $VERSION_NAME ($VERSION_CODE)"

rm -rf "$OUT"
mkdir -p "$OUT/assets" "$OUT/gen" "$OUT/classes" "$OUT/dex"

# 1. what goes inside: the console (web/) and the built-in games (build/collection/)
cp -r web "$OUT/assets/web"
if [ -f build/collection/collection.json ]; then
  cp -r build/collection "$OUT/assets/collection"
  echo "Built-in games: $(node -p "require('./build/collection/collection.json').games.length") ($(du -sh build/collection | cut -f1))"
else
  mkdir -p "$OUT/assets/collection"
  echo '{"games":[]}' > "$OUT/assets/collection/collection.json"
  echo "No built-in games (run node tools/collect-games.mjs to add them)."
fi

# 2. resources and manifest
"$BT/aapt2" compile --dir android/res -o "$OUT/res.zip"
"$BT/aapt2" link -I "$PLATFORM" --manifest android/AndroidManifest.xml -o "$OUT/unaligned.apk" "$OUT/res.zip" \
  --java "$OUT/gen" -A "$OUT/assets" --min-sdk-version $MIN_API --target-sdk-version $API \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" --auto-add-overlay

# 3. code
javac --release 8 -Xlint:-options -encoding UTF-8 -classpath "$PLATFORM" -d "$OUT/classes" \
  $(find android/src -name '*.java') $(find "$OUT/gen" -name '*.java')
"$BT/d8" --release --min-api $MIN_API --lib "$PLATFORM" --output "$OUT/dex" $(find "$OUT/classes" -name '*.class')
(cd "$OUT/dex" && zip -q -X "$OUT/unaligned.apk" classes.dex)

# 4. align and sign
"$BT/zipalign" -f 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
KS="${MOONCART_KEYSTORE:-$ROOT/android/mooncart.keystore}"
if [ -n "${MOONCART_KEYSTORE_B64:-}" ]; then
  # a private key kept as a repository secret (see android/KEYSTORE.md)
  echo "$MOONCART_KEYSTORE_B64" | base64 -d > "$OUT/private.keystore"
  KS="$OUT/private.keystore"
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass "pass:${MOONCART_KEYSTORE_PASS:-mooncart}" \
  --ks-key-alias "${MOONCART_KEY_ALIAS:-mooncart}" --key-pass "pass:${MOONCART_KEY_PASS:-mooncart}" \
  --out "$OUT/Mooncart.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/Mooncart.apk"
cp "$OUT/Mooncart.apk" "$OUT/Mooncart-$VERSION_NAME.apk"
ls -la "$OUT"/Mooncart*.apk
