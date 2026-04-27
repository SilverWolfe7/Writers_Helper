# Writer's Helper — Desktop (Electron)

A native desktop app for macOS, Windows, and Linux that wraps the deployed Writer's Helper web app in a Chromium shell. Microphone, voice dictation, and authentication all work as native desktop features.

## Stack
- Electron 33 (Chromium 130 + Node 20)
- electron-builder for packaging (dmg/zip on macOS, NSIS/portable on Windows, AppImage/deb on Linux)
- Talks to the existing hosted backend — no local server needed.

## Install (one-time)
```bash
cd /app/desktop
yarn install
```

## Run in dev
```bash
cd /app/desktop
yarn start
```
A native window opens pointed at https://voice-notes-writer-1.preview.emergentagent.com/. Microphone is auto-granted for our origin.

You can override the URL for testing against a local backend:
```bash
WRITERS_HELPER_URL=http://localhost:3000/ yarn start
```

## Package binaries

> macOS `.dmg` / `.pkg` builds **must be produced on a Mac** for code signing.  
> Windows `.exe` is most reliable when produced on Windows (or via WSL2 with Wine).  
> Linux `.AppImage` and `.deb` can be produced on any Linux machine, including this container.

```bash
# Build for the OS you're on
yarn package

# Or target a specific platform:
yarn package:mac       # produces dist/Writer's Helper-1.0.0.dmg + .zip (x64 + arm64)
yarn package:win       # produces dist/Writer's Helper Setup 1.0.0.exe + portable.exe
yarn package:linux     # produces dist/Writer's Helper-1.0.0.AppImage  (universal Linux)
```

Output goes to `/app/desktop/dist/`.

## Architecture choices
- **Hosted backend**: the desktop app loads the same React frontend served by the deployed preview URL. Notes sync across web, mobile (iOS), and desktop.
- **Cookies + Bearer tokens**: cookies work natively because Chromium handles them. Existing auth flow is unchanged.
- **Microphone permission**: auto-granted for the app origin via `session.setPermissionRequestHandler`. Users still see Writer's Helper's in-app Setup screen confirming the granted state.
- **Sandboxing**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. The renderer cannot access Node APIs.
- **External links**: any URL outside our origin opens in the user's default browser, never inside the app.
- **Menu shortcut**: Help → "Manage microphone access" jumps straight to `/setup`.

## Code signing & notarization (production releases)
- **macOS**: requires an Apple Developer ID. Set env vars `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`. electron-builder picks them up.
- **Windows**: requires an EV/OV code-signing certificate. Set `CSC_LINK` + `CSC_KEY_PASSWORD`.
- **Linux**: no signing needed; AppImage/deb publish as-is.

## Replacing the icon
Drop your icon files into `/app/desktop/build-assets/`:
- `icon.icns` (macOS) — 1024x1024
- `icon.ico` (Windows) — multi-resolution
- `icon.png` (Linux) — 512x512

electron-builder picks them up automatically.
