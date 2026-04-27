# Writer's Helper — Product Requirements & Progress

## Original problem statement
> Build an app that takes dictation for a given writing project and stores notes locally. Each project can be created and the characters added per project. Notes can be associated with particular characters, chapters or acts in the story. The notes can be exported as TEXT files.

## User choices (captured 2026-02)
- Voice dictation via browser Web Speech API (no external STT).
- Server-backed storage (MongoDB) behind user auth — "local" reinterpreted as personal workspace, sharable across devices for the same user.
- Notes can be linked to multiple tags at once (characters + chapter + act).
- User accounts with JWT-based custom email/password auth (httpOnly cookies).
- Export notes to TXT both per-note and per-project (bulk).

## Personas
- Novelist / screenwriter drafting a long-form project and jotting ideas while walking or commuting.
- Worldbuilder who organizes by character arcs, act structure, and chapter beats.

## Architecture
- Backend: FastAPI (`/api` prefix), Motor (async MongoDB), bcrypt + PyJWT for auth, CORS restricted to FRONTEND_URL, httpOnly cookies (`access_token`, `refresh_token`).
- Frontend: React 19 + Tailwind + shadcn/ui, custom editorial theme (Playfair Display / IBM Plex Sans / IBM Plex Mono), sonner toasts, react-router.
- Storage: MongoDB collections `users`, `projects`, `characters`, `chapters`, `acts`, `notes`.

## Implemented (2026-02, v1)
- Auth: register / login / me / logout (httpOnly secure cookies).
- Projects: CRUD with cascade delete of children.
- Characters / Chapters / Acts: CRUD with cleanup of note tag references on delete.
- Notes: CRUD + multi-tag (characters[], chapter_id, act_id) + filtering by character_id / chapter_id / act_id.
- Exports: per-note and per-project TXT downloads (Content-Disposition).
- Ownership isolation across users (404 on foreign resources).
- Frontend: editorial UI with dedicated dashboard, project workspace (tabs), dictation canvas (Web Speech API + manual textarea fallback), multi-select character chips, chapter/act dropdowns.
- Seeded admin (`admin@scribeverse.app` / `admin123`).
- Test suite: `/app/backend/tests/backend_test.py` (14 tests, all passing).
- Mobile (Expo/React Native) scaffold in `/app/mobile` with App Store metadata.
- Desktop (Electron) wrapper in `/app/desktop` with `electron-updater` wired to GitHub Releases.
- Privacy Policy page at `/privacy`.
- iOS App Store screenshots captured (5/5).

## 2026-04-27 — Desktop store screenshots (this session)
- Added `/app/scripts/capture_store_screenshots.py` — Playwright script that logs in, seeds a rich demo ("The Hollow Lantern"), hides the Emergent preview badge, and captures a 6-shot tour (dashboard, notes, editor, dictate, characters, acts).
- Added `/app/scripts/seed_demo_project.py` — idempotent seed for the demo project (4 characters, 3 acts, 5 chapters, 7 notes) so screenshots can be re-captured after any DB reset.
- Output: 2560×1600 PNGs in `/app/store-screenshots/macos/` (Mac App Store) + 1920×1080 PNGs in `/app/store-screenshots/windows/` (Microsoft Store).
- Updated `STORE_LISTING.md` §8 with the final 6-shot macOS + Windows lineup and captions.

## Backlog
### P1 (next up)
- Rich note search (full-text across title + content).
- Sharing a project with collaborators (read-only link).
- DOCX / Markdown export in addition to TXT.
- Password reset flow + `/api/auth/refresh` endpoint activation.
### P2
- Per-note audio recording archive in object storage.
- Writing streaks & word-count goals.
- Offline-first dictation buffer with sync.
- Optional higher-accuracy STT via OpenAI Whisper.

## Notes for future contributors
- Keep `server.py` under ~700 lines; split into routers when next feature lands.
- Use `@example.com` emails in tests (Pydantic `EmailStr` rejects `.test`).
- Test credentials live in `/app/memory/test_credentials.md`.
