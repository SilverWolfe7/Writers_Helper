# Writer's Helper iPhone — App Store release walkthrough

This is the end-to-end path from the codebase at `/app/mobile` to a published listing on the iOS App Store. The build itself runs on Expo's EAS Build cloud; you just need an Apple Developer account, a Mac for the final upload (or use EAS submit), and ~30 mins.

## Prerequisites
- Apple Developer Program membership ($99/yr) → https://developer.apple.com/programs/enroll/
- An app record in **App Store Connect** with bundle ID **`app.scribeverse.mobile`** (matches `app.json`).
- Free Expo account → https://expo.dev/signup
- `eas-cli` installed locally: `npm i -g eas-cli` and `eas login`.

## One-time configuration

### 1. Update App Store metadata in `app.json`
The current bundle identifier is `app.scribeverse.mobile`. Keep it (Apple doesn't allow changing bundle IDs after first submission) — the user-facing **App name** in App Store Connect can still be "Writer's Helper".

### 2. Edit `eas.json`
Replace the placeholders in the `submit.production.ios` block:
- `appleId` — your Apple ID email
- `ascAppId` — the Apple-issued numeric "App Store Connect ID" (visible on the app page in App Store Connect, top-right "App Information")
- `appleTeamId` — your 10-character Team ID (Apple Developer → Membership)

### 3. Link your Expo project
```bash
cd /app/mobile
eas init                 # creates the EAS project under your account
eas credentials          # generates / pulls the iOS distribution cert + provisioning profile
```
EAS handles certs/profiles for you — you don't need Xcode for this step.

## Build & submit

### Production build → TestFlight
```bash
cd /app/mobile
eas build --platform ios --profile production
```
Takes 15-25 min on Expo's cloud. The build is automatically uploaded to TestFlight if `submit.production.ios` is filled in. To keep them separate:
```bash
eas build --platform ios --profile production --non-interactive --no-wait
# After the build completes:
eas submit --platform ios --latest
```

### Promote to App Store
1. Open https://appstoreconnect.apple.com/ → My Apps → Writer's Helper → TestFlight tab.
2. Once the build finishes processing (~10 min), add internal testers or external testers (TestFlight Public Link works great for writing groups).
3. When ready, switch to **App Store** tab → "+ Version or Platform" → fill in:
   - **Description, keywords, support URL, marketing URL**
   - **What's New in This Version**
   - **App Privacy**: declare *Microphone* (used for dictation, not linked to identity, not used for tracking) and *Speech Recognition* (same). The `Info.plist` strings are already set — see `app.json → ios.infoPlist`.
   - **App Review Information**: include the seeded test login (`admin@scribeverse.app` / `admin123`) so the reviewer can exercise voice dictation.
   - Screenshots: 6.7" iPhone (1290×2796) — use `/app/frontend/public/ios.html` as a basis for now or capture from the EAS build.
4. Submit for review.

## Required Apple App Store assets
- App Icon: 1024×1024 PNG (no alpha) — current Expo default placeholder will be rejected. Drop a real icon at `/app/mobile/assets/icon.png` (Expo will resize for all targets).
- Screenshots: at least one set at 6.7" or 6.5" iPhone size.
- Privacy Policy URL: required because we collect emails. Self-host or use a generator like https://app-privacy-policy-generator.firebaseapp.com/.

## Common rejection causes (and how we already handle them)
| Risk | Mitigation |
|---|---|
| Microphone access without explanation | `NSMicrophoneUsageDescription` set in `app.json → ios.infoPlist` |
| Speech recognition without explanation | `NSSpeechRecognitionUsageDescription` set |
| Login requiring an account without value first | Reviewer credentials provided in App Review Information |
| Encryption export compliance | Set `ITSAppUsesNonExemptEncryption: false` (we already do — only HTTPS, no custom crypto) |

## Subsequent releases
1. Bump `version` in `app.json` (e.g. 1.0.1).
2. `eas build --platform ios --profile production --auto-submit-with-profile production`
3. After processing, submit the new build for review in App Store Connect.

The `production` profile in `eas.json` has `autoIncrement: true`, so the iOS build number will auto-increment without manual edits.
