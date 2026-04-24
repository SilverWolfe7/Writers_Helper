# Writer's Helper — iPhone app (Expo / React Native)

A native iPhone version of Writer's Helper that talks to the same backend as the web app.

## Stack
- Expo SDK 52 + React Native 0.76 + React Navigation
- `expo-speech-recognition` for on-device iOS dictation (native Apple Speech framework)
- `@react-native-async-storage/async-storage` for persisted auth
- `axios` with a Bearer token that's returned by the backend at login/register

## Prereqs (on a Mac)
- Node 18+
- Yarn
- The free **Expo Go** app on your iPhone (App Store), OR Xcode for dev builds

## Install
```bash
cd /app/mobile
yarn install
```

## Run

### Fast path (Expo Go, no Xcode)
```bash
npx expo start
```
Scan the QR with your iPhone camera → opens in Expo Go. You'll get the full app (auth, projects, characters/chapters/acts, notes, multi-tagging).  
**Note:** voice dictation is native code and is NOT available inside Expo Go. The Dictate screen falls back to a manual text field so you can still capture & save notes. Use a dev build (below) to unlock live voice dictation.

### Full path (native voice dictation, requires Xcode on a Mac)
```bash
npx expo prebuild
npx expo run:ios
```
This builds a Writer's Helper dev client that includes the `expo-speech-recognition` native module. Voice dictation will then work on-device using Apple's Speech framework.

## Backend URL
Configured in `app.json → expo.extra.backendUrl`. Defaults to the deployed Writer's Helper preview URL. Override by editing that single value.

## Test credentials
Same as web (see `/app/memory/test_credentials.md`):
- admin@scribeverse.app / admin123 (seeded admin)
- or register a fresh account inside the app

## What's included
- Sign in / Register / Sign out
- Projects list + create + open
- Tabs inside a project: Notes / Characters / Chapters / Acts
- Create characters/chapters/acts
- Notes: create, edit, multi-tag (characters + chapter + act), filter by character, delete
- Dictation screen with live transcript (in dev build) and manual typing fallback
- Shared backend with the web app — everything syncs across devices
