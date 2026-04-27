# Desktop store screenshots — Writer's Helper

Regenerate with:
```
/opt/plugins-venv/bin/python3 /app/scripts/capture_store_screenshots.py   # desktop
/opt/plugins-venv/bin/python3 /app/scripts/capture_ios_screenshots.py     # iOS 6.7"
```

Both scripts log in as the seeded `admin@scribeverse.app` user, hide the Emergent preview badge, and walk through the "The Hollow Lantern" sample project.

## Output

| File | Resolution | Target store | Caption (paste into listing) |
|---|---|---|---|
| `ios/01-your-writing-desk.png`        | 1290 × 2796 | App Store (iOS 6.7") | YOUR WRITING DESK |
| `ios/02-project-world.png`            | 1290 × 2796 | App Store (iOS 6.7") | A PROJECT IS A WORLD |
| `ios/03-every-line-filed-right.png`   | 1290 × 2796 | App Store (iOS 6.7") | EVERY LINE FILED RIGHT |
| `ios/04-dictate-edit-tag.png`         | 1290 × 2796 | App Store (iOS 6.7") | DICTATE. EDIT. TAG. |
| `ios/05-setup-privacy.png`            | 1290 × 2796 | App Store (iOS 6.7") | PRIVACY FIRST |
| `macos/01-dashboard.png`       | 2560 × 1600 | Mac App Store | A studio for the second draft of your second novel |
| `macos/02-project-notes.png`   | 2560 × 1600 | Mac App Store | Every note knows where it belongs |
| `macos/03-note-editor.png`     | 2560 × 1600 | Mac App Store | Tag a line with every character it touches |
| `macos/04-dictate.png`         | 2560 × 1600 | Mac App Store | Dictate at your desk. Edit on the page. |
| `macos/05-characters.png`      | 2560 × 1600 | Mac App Store | A cast, kept close at hand |
| `macos/06-acts.png`            | 2560 × 1600 | Mac App Store | Three acts. One quiet workspace. |
| `windows/01-dashboard.png`     | 1920 × 1080 | Microsoft Store | Your writing desk |
| `windows/02-project-notes.png` | 1920 × 1080 | Microsoft Store | Every note knows where it belongs |
| `windows/03-note-editor.png`   | 1920 × 1080 | Microsoft Store | Tag by character, chapter, and act |
| `windows/04-dictate.png`       | 1920 × 1080 | Microsoft Store | Live dictation, ready when you are |
| `windows/05-characters.png`    | 1920 × 1080 | Microsoft Store | Keep the cast close |
| `windows/06-acts.png`          | 1920 × 1080 | Microsoft Store | Structure the story in acts |

## Requirements met

- **App Store (iOS 6.7")**: 1290 × 2796 required → we ship exactly that.
- **Mac App Store**: 1280 × 800 min, 2880 × 1800 recommended → we ship **2560 × 1600** (Retina MBP 13" native).
- **Microsoft Store**: 1366 × 768 min, 1920 × 1080 recommended → we ship **1920 × 1080**, matches recommended.
- Format: PNG, sRGB, no alpha channel.

## Seed data

The sample project ("The Hollow Lantern") is created on the fly by the script's prerequisite curl run when missing — see the backend seed in `/app/backend/server.py` for the admin user, and re-run:

```
curl -c /tmp/c.txt -X POST $API/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@scribeverse.app","password":"admin123"}'
```

…then the POST calls in the fork's session history to recreate characters, acts, chapters, and the 7 sample notes if the MongoDB volume is reset.
