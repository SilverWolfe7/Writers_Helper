# Writer's Helper — Store Listing Copy

Single source of truth for the **App Store Connect** (iOS) and **Mac App Store** product pages. Copy lengths are pre-trimmed to Apple's limits. Where the iOS and macOS wording diverges, both versions are shown.

> Use this file as a paste-ready clipboard for first submission and every release after.

---

## 0 · Quick reference

| Field | Value |
|---|---|
| App name | Writer's Helper |
| Subtitle (iOS, 30 chars) | Voice notes for novelists |
| Subtitle (macOS, 30 chars) | A dictation studio for writers |
| Bundle ID — iOS | `app.scribeverse.mobile` |
| Bundle ID — macOS | `app.writershelper.desktop` |
| SKU (iOS) | `writers-helper-ios-001` |
| SKU (macOS) | `writers-helper-mac-001` |
| Primary category | Productivity |
| Secondary category | Lifestyle |
| Age rating | 4+ |
| Price tier | Free |

---

## 1 · Promotional text (iOS only, 170 char max)
> Editable any time without resubmitting — use it for launch banners, sales, version-specific shoutouts.

```
Tap once. Speak. Your novel quietly takes shape — voice notes tagged by character, chapter, and act, exported anywhere your draft lives.
```
*(160 chars)*

---

## 2 · Description (iOS 4000 char max — also used verbatim on Mac App Store)

```
Writer's Helper turns spoken thought into a structured manuscript.

Hold up your phone on the morning walk. Tap the microphone. Speak the line that woke you at 3 a.m. By the time you sit at your desk, that line is already filed under the right character, the right chapter, the right act — ready to fold into the next session.

Built for novelists, screenwriters, and longform essayists who think faster than they type.

— A studio, not a notebook —
Most voice-note apps give you a wall of timestamped audio files. Writer's Helper gives you a workspace. Every project gets a cast of characters, a chapter list, an act structure — and every dictation lives at the intersection of all three.

— Dictation that respects craft —
Live transcription as you speak. Edit before you save. Tag a single note with multiple characters at once. Filter the workspace down to "every line involving Eliza in Act II" with two taps.

— Plain text. Always. —
Export any single note or your entire project to a clean .txt file. No proprietary lock-in. Your draft moves with you — Scrivener, Final Draft, Google Docs, Obsidian, paper.

— Privacy by design —
Your microphone audio is processed by your device's speech engine. The raw audio never leaves your phone. Only the text you choose to save is stored in your account.

— Sync across every device —
Use Writer's Helper on your iPhone in the wild. Open the desktop app at home and pick up exactly where you left off. Same notes, same characters, same chapters.

— Made for the long form —
This is not a memo app. This is the place you keep the second draft of your second novel.

KEY FEATURES
• Live voice dictation, on-device speech recognition
• Project workspaces with characters, chapters, acts
• Multi-tag notes (a line can belong to two characters and a chapter)
• Filter by character / chapter / act
• Per-note and per-project .txt export
• Cross-device sync (iPhone + Mac + web)
• No raw audio uploads, ever
• Free to use during early access

WHO IT'S FOR
• Novelists drafting between commutes
• Screenwriters working out beats out loud
• Memoirists capturing fragments before they fade
• Worldbuilders organizing a cast of dozens
• Anyone whose best thinking happens while moving

PRIVACY & DATA
Writer's Helper requires an account so your work syncs across devices. We collect:
• Email + name (for sign-in)
• The notes you save (text only — never raw audio)

We do not sell, share, or use your writing to train models. See our Privacy Policy at https://voice-notes-writer-1.preview.emergentagent.com/privacy for full detail.

QUESTIONS, FEATURE REQUESTS, BUG REPORTS
Email support@writers-helper.app — we reply within 24 hours and treat every email like a manuscript note.

Now stop reading. There's a chapter waiting.
```
*(approx. 2,400 chars — well under both stores' 4,000 limit)*

---

## 3 · Keywords (iOS only, 100 char max — comma-separated, no spaces)

```
voice,dictation,writing,novel,screenplay,notes,outline,plot,character,chapter,scene,manuscript,draft
```
*(98 chars)*

> macOS App Store doesn't accept a keyword field — the description's first paragraph carries SEO weight there.

---

## 4 · URLs

| Field | URL |
|---|---|
| Support URL | https://voice-notes-writer-1.preview.emergentagent.com/setup |
| Marketing URL | https://voice-notes-writer-1.preview.emergentagent.com/ |
| Privacy Policy URL | https://voice-notes-writer-1.preview.emergentagent.com/privacy |

> The Privacy Policy URL is **required** for both stores. Stand up a `/privacy` route returning a static page (template content provided in §10 below).

---

## 5 · App Privacy answers (both stores)

Apple asks the same data-collection questionnaire on both stores. Answer **identically** to keep the listings consistent.

### Data Linked to You
| Data | Purpose | Used for tracking? |
|---|---|---|
| Email Address | App Functionality (account) | No |
| Name | App Functionality (account) | No |
| User Content — Customer Support | App Functionality | No |

### Data Not Collected
- Audio Data (raw recordings) — *we never upload it; on-device speech recognition only*
- Usage Data, Diagnostics, Location, Contacts, Photos, Browsing History, Identifiers

### Data Used to Track You
None. Mark **"No, we do not use data for tracking purposes."**

---

## 6 · App Review Information (Apple reviewers, both stores)

```
Demo account (please use, no need to register):
  Email: admin@scribeverse.app
  Password: admin123

Review notes:
1. Sign in with the demo account above.
2. The dashboard shows one example project ("The Hollow Lantern"). Open it.
3. Tap the "Dictate" button (microphone icon, top-right).
4. iOS will prompt for Microphone + Speech Recognition permission. Approve.
5. Tap "Start dictation" and speak. The transcript appears live. Tap Stop, optionally edit, tap Save.
6. Back in the project, the new note is taggable to characters / chapters / acts and exportable to .txt via the project's Export menu.

The app uses Apple's on-device Speech framework. No raw audio is uploaded to any server — only the user-saved transcript text is sent to our backend.

For the Mac App Store build specifically: the embedded Chromium engine requires com.apple.security.cs.allow-jit. The app is otherwise fully sandboxed.
```

---

## 7 · Version-bump release notes ("What's New in This Version")

Reusable template — fill in the bullets that apply, delete the rest.

```
✏️ A few small improvements for your morning walk:
• <feature in plain language, e.g. "Filter notes by act, not just character">
• <fix in plain language, e.g. "Dictation now recovers cleanly when iOS interrupts the mic for a phone call">
• <quality-of-life, e.g. "Slightly larger transcript text for late-night sessions">

Email support@writers-helper.app with feature requests — they go straight into the next sprint.
```

> Aim for ≤500 chars. Apple displays the first ~250 chars in the Updates tab without expansion.

---

## 8 · Screenshots — required sets

> Match the captions to the screenshots so the listing reads like a guided tour, not a gallery.

### iOS — required (1290 × 2796, 6.7" iPhone)

| # | Caption (ALL CAPS, ≤30 chars) | Source screen |
|---|---|---|
| 1 | YOUR WRITING DESK | Projects dashboard |
| 2 | A PROJECT IS A WORLD | Project detail (tabs) |
| 3 | DICTATE. EDIT. TAG. | Dictation canvas mid-session |
| 4 | EVERY LINE FILED RIGHT | Note editor with character chips |
| 5 | EXPORT WHENEVER YOU LIKE | TXT export confirmation |

> Source for now: capture from `/app/frontend/public/ios.html` rendered at 390×844 viewport in your browser dev tools. After the EAS build, recapture from a real device for store-quality fidelity.

### macOS — required (1280 × 800 minimum, 2880 × 1800 recommended)

| # | Caption | Source screen |
|---|---|---|
| 1 | A studio for the second draft of your second novel | Dashboard |
| 2 | Dictate at your desk. Edit on the page. | Dictation canvas wide |
| 3 | Every note knows where it belongs | Project detail with multi-tag chips |
| 4 | Plain text in. Plain text out. | TXT export dialog |

---

## 9 · App icon checklist
- iOS: 1024 × 1024 PNG, no alpha, no transparency, no rounded corners (Apple rounds them).
- macOS: `.icns` containing 16 / 32 / 64 / 128 / 256 / 512 / 1024 px variants.
- Match the editorial brand: parchment background `#FAF9F5`, ink `#1C1B19` feather glyph, optional rust `#B45341` accent. Avoid gradients; serif-era restraint matches the design language.

---

## 10 · Canonical Privacy Policy text

> Live at https://voice-notes-writer-1.preview.emergentagent.com/privacy (rendered by `/app/frontend/src/pages/PrivacyPolicyPage.jsx`). Source of truth for both stores. Update the React page if you change anything here.

```
Privacy Policy
Last Updated: April 27, 2026

SilverWolfe Application Development ("we," "us," or "our") operates the Writer's Helper application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.

1. Data Collection and Use
We believe in user privacy. Because Writer's Helper is a stand-alone application, we do not collect, store, or transmit any personally identifiable information (PII) to external servers.
  • Personal Data: We do collect personal data such as names, email addresses. This is used for MongoDB authentication.
  • Usage Data: Any data created or stored within the app is saved in the MongoDB and we will not use nor sell your data for marketing purposes.

2. Permissions
The app may request certain permissions to function correctly (e.g., Microphone). These permissions are used strictly for the app's core functionality:
  • Microphone: Used to enable voice dictation into text. This data is stored on an authenticated MongoDB database and the data can be downloaded and shared by the user, but the data is NOT publicly available data.

3. Third-Party Services
We do not use third-party analytics, advertising networks, or tracking software that monitors your activity across other apps or websites.

4. Security
The security of your data is important to us, but remember that no method of electronic storage is 100% secure. While we rely on the built-in security features of macOS and iOS to protect your data, we encourage you to use device-level security (Passcode, FaceID, or TouchID) to protect your information.

5. Children's Privacy
Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.

6. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. You are advised to review this page periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

7. Contact Us
If you have any questions about this Privacy Policy, please contact us:
By email: lnaeyae@mac.com
```

---

## 11 · Per-platform diffs (the only fields where copy intentionally differs)

| Field | iOS | macOS |
|---|---|---|
| Subtitle | Voice notes for novelists | A dictation studio for writers |
| Primary screenshot caption tone | Punchy, ALL CAPS, 30-char limit | Long-form, mixed case |
| Keyword field | Yes (100 chars, see §3) | Not supported — relies on description |
| In-app purchases | None | None |
| Updates | Submit new TestFlight build via EAS | Upload new `.pkg` via Transporter |

---

## 12 · Submission checklist (use this for every release)

### Pre-submit
- [ ] Bumped version in `app.json` (iOS) / `package.json` (macOS)
- [ ] Built via `eas build --platform ios --profile production` / `yarn package:mas`
- [ ] Uploaded build to App Store Connect (auto via `eas submit` / manual via Transporter)
- [ ] Pasted **§7 release notes** into "What's New in This Version"
- [ ] Promotional text refreshed if seasonal/launch-relevant (§1)

### Final review pass
- [ ] App Review demo credentials still valid (test by signing in with the listed account)
- [ ] Privacy Policy URL returns a real page (not a 404)
- [ ] All required screenshots uploaded for the chosen device size
- [ ] Encryption export compliance answered "No" (already encoded in `app.json` + `package.json`)

### After approval
- [ ] Tag the release in `SilverWolfe7/Writers_Helper` (`v1.0.x`)
- [ ] Upload the matching `.AppImage` + `.exe` + `.dmg` to the GitHub release for non-store users
- [ ] Tweet / email subscribers / update the marketing site
