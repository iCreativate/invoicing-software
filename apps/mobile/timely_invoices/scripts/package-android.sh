#!/usr/bin/env bash
# Release Android packages (APK + Play App Bundle). Requires JDK 17+ and Android SDK.
# Optional: pass the same --dart-define flags you use for `flutter run` (see README.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "$(uname)" == "Darwin" ]] && [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

flutter pub get
flutter build apk --release "$@"
flutter build appbundle --release "$@"

echo ""
echo "Outputs:"
echo "  APK: ${ROOT}/build/app/outputs/flutter-apk/app-release.apk"
echo "  AAB: ${ROOT}/build/app/outputs/bundle/release/app-release.aab"
