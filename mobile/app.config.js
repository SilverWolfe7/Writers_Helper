// Expo dynamic config — reads backend URL from EXPO_PUBLIC_BACKEND_URL at build time.
// Keeps app.json as the static base; this file extends it with runtime env values
// so the mobile bundle never ships a hardcoded preview URL.
//
// Local dev: create /app/mobile/.env (see .env.example) and run `yarn start`.
// EAS build: set EXPO_PUBLIC_BACKEND_URL in the EAS project env (Dashboard → Secrets)
// or pass it at build time via `eas build --build-profile production`.

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "",
  },
});
