# Writer's Helper — Desktop (Electron)

A native desktop app for macOS, Windows, and Linux that wraps the deployed Writer's Helper web app in a Chromium shell. Microphone, voice dictation, and authentication all work as native desktop features. Auto-updates via `electron-updater`.

## Stack
- Electron 33 (Chromium 130 + Node 20)
- electron-builder for packaging (dmg/zip on macOS, NSIS/portable on Windows, AppImage on Linux)
- electron-updater for silent in-place updates
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
A native window opens pointed at https://voice-notes-writer-1.preview.emergentagent.com/. Microphone is auto-granted for our origin. Auto-update runs only in packaged builds.

You can override the URL for testing against a local backend:
```bash
WRITERS_HELPER_URL=http://localhost:3000/ yarn start
```

## Package binaries

> macOS `.dmg` / `.pkg` builds **must be produced on a Mac** for code signing.  
> Windows `.exe` is most reliable when produced on Windows (or via WSL2 with Wine).  
> Linux `.AppImage` can be produced on any Linux machine, including this container.

```bash
# Build for the OS you're on
yarn package

# Or target a specific platform:
yarn package:mac       # produces dist/Writer's Helper-1.0.0.dmg + .zip (x64 + arm64)
yarn package:win       # produces dist/Writer's Helper Setup 1.0.0.exe + portable.exe
yarn package:linux     # produces dist/Writer's Helper-1.0.0.AppImage  (universal Linux)
```

Output goes to `/app/desktop/dist/`.

## Auto-updates

The app uses [`electron-updater`](https://www.electron.build/auto-update) to silently fetch new versions in the background and prompt the user to restart when ready.

Flow:
1. On startup (packaged builds only), the app calls `autoUpdater.checkForUpdatesAndNotify()`.
2. If a newer version is found, it's downloaded in the background.
3. Once the download finishes, the user sees a native dialog: **"Restart now / Later"**.
4. **Help → Check for updates…** lets users force a manual check at any time.

### Update channel: GitHub Releases (public repo)

Configured in `package.json → build.publish`:
```json
{
  "provider": "github",
  "owner": "SilverWolfe7",
  "repo": "Writers_Helper",
  "releaseType": "release"
}
```

Because the repo is **public**, end-user installs auto-update without any token — `electron-updater` reads release manifests directly from the GitHub Releases API.

### Releasing a new version

1. Bump the version in `/app/desktop/package.json` (semver: 1.0.0 → 1.0.1, etc.). The Git tag created by GitHub will be `v<version>`.
2. Get a GitHub Personal Access Token with the **`repo`** scope (or fine-grained: `Contents: read & write` on the repo) and export it:
   ```bash
   export GH_TOKEN=ghp_…
   ```
3. Build **and** publish for each target OS:
   ```bash
   yarn release:linux   # AppImage  → uploads to a draft release on SilverWolfe7/Writers_Helper
   yarn release:mac     # dmg + zip (run on a Mac)
   yarn release:win     # nsis + portable (run on Windows)
   ```
   Each command both builds the binaries and uploads them — plus the `latest*.yml` manifests — to a single draft GitHub release tagged `v<version>`.
4. Open https://github.com/SilverWolfe7/Writers_Helper/releases, review the draft, and click **Publish release**. The instant a release is published (not draft), every existing install will see the update on its next launch.

> Tip: run all three `release:*` commands across machines, **then** publish the draft. That way every OS gets the update simultaneously.

### Manual fallback (no GH_TOKEN)

If you'd rather upload binaries by hand:
```bash
yarn package:linux
gh release create v1.0.1 \
  "dist/Writer's Helper-1.0.1.AppImage" \
  "dist/latest-linux.yml" \
  --title "v1.0.1" --notes "What's new…"
```
The same pattern works for `latest-mac.yml` + `*.dmg` and `latest.yml` + `*.exe`.

### Code-signing requirements for auto-update
- **macOS**: builds must be signed AND notarized — unsigned dmgs cannot auto-update (Gatekeeper).
- **Windows**: NSIS installer should be signed for SmartScreen compliance; `electron-updater` itself works unsigned.
- **Linux**: AppImage auto-updates work without signing.

## Architecture choices
- **Hosted backend**: the desktop app loads the same React frontend served by the deployed preview URL. Notes sync across web, mobile (iOS), and desktop.
- **Cookies + Bearer tokens**: cookies work natively because Chromium handles them. Existing auth flow is unchanged.
- **Microphone permission**: auto-granted for the app origin via `session.setPermissionRequestHandler`. Users still see Writer's Helper's in-app Setup screen confirming the granted state.
- **Sandboxing**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. The renderer cannot access Node APIs.
- **External links**: any URL outside our origin opens in the user's default browser, never inside the app.
- **Menu shortcuts**: Help → "Manage microphone access" jumps to `/setup`; Help → "Check for updates…" runs a manual update check.

## Code signing & notarization (production releases)
- **macOS**: requires an Apple Developer ID. Set env vars `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`. electron-builder picks them up.
- **Windows**: requires an EV/OV code-signing certificate. Set `CSC_LINK` + `CSC_KEY_PASSWORD`.
- **Linux**: no signing needed; AppImage publishes as-is.

## Replacing the icon
Drop your icon files into `/app/desktop/build-assets/`:
- `icon.icns` (macOS) — 1024x1024
- `icon.ico` (Windows) — multi-resolution
- `icon.png` (Linux) — 512x512

electron-builder picks them up automatically.
