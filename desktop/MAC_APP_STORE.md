# Writer's Helper Desktop — Mac App Store release walkthrough

This document covers shipping the **Electron desktop app** at `/app/desktop` to the **Mac App Store** specifically. It is *additional* to the regular `.dmg` direct-download release flow — both can ship in parallel.

## Why a separate build?
- App Store builds must run inside Apple's **App Sandbox** (security restrictions).
- They use a **provisioning profile** + **3rd Party Mac Developer** certificate, not the standard Developer ID cert.
- The package format is **`.pkg`** (uploaded to App Store Connect via Transporter), not `.dmg`.
- **`electron-updater` does not run in MAS builds** — Apple handles updates. We've already guarded `main.js` with `process.mas` so the in-app updater silently disables itself inside the store build.

## One-time setup (must be done on a Mac)
1. **Apple Developer Program membership** ($99/yr).
2. In **Certificates, Identifiers & Profiles** at https://developer.apple.com/account/resources:
   - Register the App ID **`app.writershelper.desktop`** (matches `package.json → build.appId`). Enable the "App Sandbox" capability.
   - Create a **Mac Installer Distribution** certificate (download + double-click into Keychain).
   - Create a **3rd Party Mac Developer Application** certificate (same).
   - Generate a **Mac App Store** provisioning profile for `app.writershelper.desktop` and download it.
3. Place the downloaded `.provisionprofile` at:
   ```
   /app/desktop/build-assets/embedded.provisionprofile
   ```
   (This is the path referenced from `build.mas.provisioningProfile` in `package.json`. For a `mas-dev` build, save the development profile as `development.provisionprofile` in the same folder.)
4. In **App Store Connect** → My Apps → "+", create a new macOS app:
   - Bundle ID: `app.writershelper.desktop`
   - Name: Writer's Helper
   - SKU: anything unique
   - Primary language: English

## Build commands

> Must run on macOS — Linux/Windows hosts cannot produce a signed MAS build.

Confirm the certs are visible to electron-builder:
```bash
security find-identity -p codesigning -v
# Expect entries containing both "3rd Party Mac Developer Application:" and
# "3rd Party Mac Developer Installer:".
```

Production MAS build:
```bash
cd /app/desktop
yarn install
yarn package:mas
```
Output: `dist/Writer's Helper-1.0.0-mas-universal.pkg` (or per-arch pkgs depending on config).

Sandbox-test build (runs locally, doesn't require uploading):
```bash
yarn package:mas-dev
open "dist/mas-dev-universal/Writer's Helper.app"
```

## Upload to App Store Connect
Use Apple's Transporter app (free on the Mac App Store) — it's the easiest path:
1. Open Transporter.
2. Sign in with your Apple ID.
3. Drag `dist/Writer's Helper-1.0.0-mas-universal.pkg` into the window.
4. Click **Deliver**. Build appears in App Store Connect within ~10-15 min.

## Submit for review
1. App Store Connect → My Apps → Writer's Helper (macOS) → "+ Version or Platform".
2. Fill in:
   - **Description**, keywords, support URL, marketing URL
   - **App Privacy**: Microphone (used for dictation, not linked to identity), Speech Recognition (same), Email (account creation only)
   - **App Review Information**: include the seeded login `admin@scribeverse.app` / `admin123` so the reviewer can dictate without registering
   - Screenshots: 1280×800 or 1440×900 — capture from the running `.app` on a clean desktop
3. Pick the build you uploaded via Transporter.
4. Submit for review. Mac App Store reviews typically take 24-72h.

## Required entitlements (already set)

Open `build-assets/entitlements.mas.plist`. The shipping entitlements are:

| Key | Why |
|---|---|
| `com.apple.security.app-sandbox` | Mandatory for MAS |
| `com.apple.security.network.client` | Talk to the Writer's Helper backend over HTTPS |
| `com.apple.security.device.audio-input` | Microphone for dictation |
| `com.apple.security.files.user-selected.read-write` | TXT export downloads via Save dialog |
| `com.apple.security.application-groups` | Share user defaults with the helper processes |
| `com.apple.security.cs.allow-jit` | Chromium V8 JIT (required for Electron) |
| `com.apple.security.cs.allow-unsigned-executable-memory` | Chromium runtime |

Apple typically asks why `cs.allow-jit` is enabled — it's expected for Electron; respond with "Required by the embedded Chromium V8 engine to render the user interface."

## Common Mac App Store rejection causes (and our mitigations)

| Issue | Mitigation |
|---|---|
| App not respecting App Sandbox | Sandbox is on; we don't touch arbitrary filesystem paths. |
| Microphone usage with no explanation | `NSMicrophoneUsageDescription` in `package.json → build.mas.extendInfo`. |
| "Login wall" with no value before signing in | Consider adding a screenshot to the App Review Information that shows the dictation canvas working with the seeded test account. |
| Use of private APIs | Electron uses public APIs only. |
| Outbound HTTP without `network.client` | Entitlement is set. |

## Subsequent releases
1. Bump `version` in `package.json` (the same version number ships across DMG + MAS).
2. Run `yarn package:mas`.
3. Re-upload the `.pkg` via Transporter.
4. Submit the new build for review.

Mac App Store users update through the **Updates** tab in the Mac App Store app — not through `electron-updater`. The DMG channel still uses GitHub Releases for auto-update; the two channels are fully independent and can ship the same code at different cadences.
