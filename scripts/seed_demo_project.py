"""
Seed "The Hollow Lantern" demo project for the admin user.

Idempotent — if a project titled "The Hollow Lantern" already exists under
`admin@scribeverse.app`, the script exits without changes.

Run:
    /opt/plugins-venv/bin/python3 /app/scripts/seed_demo_project.py
"""
import os
import sys
import requests

API = os.environ.get("REACT_APP_BACKEND_URL") or \
      open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()
ADMIN_EMAIL = "admin@scribeverse.app"
ADMIN_PASSWORD = "admin123"

s = requests.Session()
s.post(f"{API}/api/auth/login",
       json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).raise_for_status()

existing = s.get(f"{API}/api/projects").json()
if any(p["title"] == "The Hollow Lantern" for p in existing):
    print("Demo project already seeded — nothing to do.")
    sys.exit(0)

proj = s.post(f"{API}/api/projects", json={
    "title": "The Hollow Lantern",
    "description": "A literary thriller about a lighthouse keeper who begins receiving "
                   "letters from a woman who drowned a century ago. Set across three "
                   "acts on a fog-bound Scottish coast.",
    "genre": "Literary Thriller",
}).json()
pid = proj["id"]

CHARS = [
    ("Eliza Marsh", "Protagonist", "47-year-old lighthouse keeper. Widowed. Collects sea glass."),
    ("Thomas Wren", "The Drowned Correspondent", "Speaks only through letters that shouldn't exist."),
    ("Rev. Caldicott", "Village priest", "Knows more about the 1898 wreck than he admits."),
    ("Margaret Finch", "Antagonist", "Heritage trust officer trying to decommission the lighthouse."),
]
char_ids = {}
for name, role, desc in CHARS:
    r = s.post(f"{API}/api/projects/{pid}/characters",
               json={"name": name, "role": role, "description": desc}).json()
    char_ids[name] = r["id"]

ACTS = [
    ("Act I — The First Letter", 1, "Eliza finds an envelope wedged inside the Fresnel lens."),
    ("Act II — Salt & Ink", 2, "The correspondence deepens. The village begins to notice."),
    ("Act III — The Keeper's Light", 3, "Eliza must choose what to preserve and what to let the sea reclaim."),
]
act_ids = {}
for title, num, summ in ACTS:
    r = s.post(f"{API}/api/projects/{pid}/acts",
               json={"title": title, "number": num, "summary": summ}).json()
    act_ids[num] = r["id"]

CHAPTERS = [
    ("The Lens Room", 1, "Morning fog. First letter discovered."),
    ("A Village Memory", 2, "Rev. Caldicott recounts the 1898 wreck."),
    ("The Second Envelope", 3, "Arrives dry from a storm-lashed beach."),
    ("Heritage Inspection", 4, "Margaret Finch delivers a closure notice."),
    ("What the Tide Kept", 5, "Eliza decides."),
]
chap_ids = {}
for title, num, summ in CHAPTERS:
    r = s.post(f"{API}/api/projects/{pid}/chapters",
               json={"title": title, "number": num, "summary": summ}).json()
    chap_ids[num] = r["id"]

NOTES = [
    ("Opening line — fog at dawn",
     "The fog did not roll in so much as settle, the way an old grief settles: patient, "
     "weightless, and utterly without apology. Eliza climbed the three hundred and twelve "
     "steps before the gulls were awake, and at the top she found, folded inside the brass "
     "rim of the Fresnel lens, a single envelope addressed in a hand she had not seen in a century.",
     ["Eliza Marsh"], 1, 1, "dictation"),
    ("Thomas — first letter fragment",
     "Dear keeper of the light — I write because the light is what kept me, and the light is "
     "what would not let me go. Do not mistake this for a haunting. This is a conversation a "
     "hundred years overdue. — T.W.",
     ["Thomas Wren", "Eliza Marsh"], 1, 1, "dictation"),
    ("Rev. Caldicott — village memory",
     "The priest would not meet her eye. He poured the tea, he passed the biscuit, he spoke "
     "about the weather — and only when she stood to leave did he say, almost to himself: "
     "\"Child, some names we stopped carving into stone. Thomas Wren was one of them.\"",
     ["Rev. Caldicott", "Eliza Marsh"], 2, 1, "dictation"),
    ("Dry paper in a wet storm",
     "The second envelope came ashore during the worst of the November gale, and it came "
     "ashore dry. Not merely unsoaked — dry as paper pulled from a reading room in the middle "
     "of summer. Eliza held it under the lamp and did not breathe for a full ten seconds.",
     ["Eliza Marsh", "Thomas Wren"], 3, 2, "dictation"),
    ("Margaret — the closure notice",
     "Margaret Finch did not speak the word decommission. She let the document speak it for "
     "her. She set the paper down on the kitchen table between them, perfectly parallel to the "
     "grain of the wood, and waited, the way a cat waits.",
     ["Margaret Finch", "Eliza Marsh"], 4, 2, "manual"),
    ("What the tide kept — closing image",
     "She did not extinguish the light. She let it run until dawn, until the fog had gone the "
     "way of all fog, and then — only then — she folded the last letter into the lens, where "
     "the brass would hold it as it had held the first, and she left the door unlocked behind her.",
     ["Eliza Marsh"], 5, 3, "dictation"),
    ("Scene beat — stair climb motif",
     "Three hundred and twelve steps. On the good days she counted up. On the hard days she "
     "counted down. On the day the first letter arrived, she stopped counting altogether.",
     ["Eliza Marsh"], 1, 1, "manual"),
]
for title, content, chars, ch_num, act_num, src in NOTES:
    s.post(f"{API}/api/projects/{pid}/notes", json={
        "title": title,
        "content": content,
        "character_ids": [char_ids[n] for n in chars],
        "chapter_id": chap_ids[ch_num],
        "act_id": act_ids[act_num],
        "source": src,
    }).raise_for_status()

print(f"Seeded The Hollow Lantern — project_id={pid}, notes={len(NOTES)}")
