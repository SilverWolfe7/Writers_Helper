"""Backend regression tests for Scribeverse (auth, projects, characters, chapters, acts, notes, exports, ownership)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://voice-notes-writer-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _unique_email(prefix="writer"):
    return f"test_{prefix}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="module")
def user_a():
    s = requests.Session()
    email = _unique_email("a")
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "User A"})
    assert r.status_code == 200, r.text
    return {"session": s, "email": email, "data": r.json()}


@pytest.fixture(scope="module")
def user_b():
    s = requests.Session()
    email = _unique_email("b")
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "User B"})
    assert r.status_code == 200, r.text
    return {"session": s, "email": email, "data": r.json()}


# --- Auth ---
class TestAuth:
    def test_register_sets_cookies(self, user_a):
        s = user_a["session"]
        # access_token cookie should exist
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names, f"Missing access_token cookie: {cookie_names}"
        assert "refresh_token" in cookie_names
        assert user_a["data"]["email"] == user_a["email"].lower()
        assert "id" in user_a["data"]

    def test_register_duplicate_rejected(self, user_a):
        r = requests.post(f"{API}/auth/register", json={"email": user_a["email"], "password": "pass1234", "name": "Dup"})
        assert r.status_code == 400

    def test_login_success_and_me(self, user_a):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "pass1234"})
        assert r.status_code == 200
        assert r.json()["email"] == user_a["email"].lower()
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == user_a["email"].lower()
        assert "password_hash" not in me.json()

    def test_login_invalid_credentials(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookies(self, user_a):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "pass1234"})
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout")
        assert r2.status_code == 200
        # After logout, cookies are cleared; /me should fail
        s.cookies.clear()
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 401

    def test_admin_seed_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@scribeverse.app", "password": "admin123"})
        assert r.status_code == 200, f"Seeded admin login failed: {r.text}"
        assert r.json()["role"] == "admin"


# --- Projects CRUD ---
class TestProjects:
    def test_create_list_get_update_delete(self, user_a):
        s = user_a["session"]
        r = s.post(f"{API}/projects", json={"title": "TEST_Proj1", "description": "d", "genre": "fantasy"})
        assert r.status_code == 200
        p = r.json()
        assert p["title"] == "TEST_Proj1" and p["owner_id"] == user_a["data"]["id"]
        pid = p["id"]

        lr = s.get(f"{API}/projects")
        assert lr.status_code == 200
        assert any(x["id"] == pid for x in lr.json())

        gr = s.get(f"{API}/projects/{pid}")
        assert gr.status_code == 200
        assert gr.json()["title"] == "TEST_Proj1"

        ur = s.put(f"{API}/projects/{pid}", json={"title": "TEST_Proj1_upd", "description": "d2", "genre": "scifi"})
        assert ur.status_code == 200
        assert ur.json()["title"] == "TEST_Proj1_upd"
        # Verify persisted
        gr2 = s.get(f"{API}/projects/{pid}")
        assert gr2.json()["title"] == "TEST_Proj1_upd"

        dr = s.delete(f"{API}/projects/{pid}")
        assert dr.status_code == 200
        gr3 = s.get(f"{API}/projects/{pid}")
        assert gr3.status_code == 404

    def test_unauthenticated_projects(self):
        r = requests.get(f"{API}/projects")
        assert r.status_code == 401


@pytest.fixture(scope="module")
def project_a(user_a):
    s = user_a["session"]
    r = s.post(f"{API}/projects", json={"title": "TEST_MainProj", "description": "main", "genre": "drama"})
    assert r.status_code == 200
    return r.json()


# --- Characters ---
class TestCharacters:
    def test_crud(self, user_a, project_a):
        s = user_a["session"]
        pid = project_a["id"]
        r = s.post(f"{API}/projects/{pid}/characters", json={"name": "Alice", "role": "Hero", "description": "brave"})
        assert r.status_code == 200
        cid = r.json()["id"]

        lr = s.get(f"{API}/projects/{pid}/characters")
        assert lr.status_code == 200 and any(c["id"] == cid for c in lr.json())

        ur = s.put(f"{API}/characters/{cid}", json={"name": "Alice2", "role": "Hero", "description": "brave"})
        assert ur.status_code == 200 and ur.json()["name"] == "Alice2"

        dr = s.delete(f"{API}/characters/{cid}")
        assert dr.status_code == 200


# --- Chapters & Acts ---
class TestChaptersActs:
    def test_chapter_crud(self, user_a, project_a):
        s = user_a["session"]
        pid = project_a["id"]
        r = s.post(f"{API}/projects/{pid}/chapters", json={"title": "Ch1", "number": 1, "summary": "s"})
        assert r.status_code == 200
        chid = r.json()["id"]
        lr = s.get(f"{API}/projects/{pid}/chapters")
        assert any(c["id"] == chid for c in lr.json())
        ur = s.put(f"{API}/chapters/{chid}", json={"title": "Ch1-updated", "number": 2, "summary": "s2"})
        assert ur.status_code == 200 and ur.json()["title"] == "Ch1-updated"
        assert s.delete(f"{API}/chapters/{chid}").status_code == 200

    def test_act_crud(self, user_a, project_a):
        s = user_a["session"]
        pid = project_a["id"]
        r = s.post(f"{API}/projects/{pid}/acts", json={"title": "Act1", "number": 1, "summary": "s"})
        assert r.status_code == 200
        aid = r.json()["id"]
        lr = s.get(f"{API}/projects/{pid}/acts")
        assert any(a["id"] == aid for a in lr.json())
        ur = s.put(f"{API}/acts/{aid}", json={"title": "Act1-upd", "number": 2, "summary": "s2"})
        assert ur.status_code == 200 and ur.json()["title"] == "Act1-upd"
        assert s.delete(f"{API}/acts/{aid}").status_code == 200


# --- Notes + Filtering + Exports ---
class TestNotesAndExports:
    def test_notes_multitag_filter_and_exports(self, user_a, project_a):
        s = user_a["session"]
        pid = project_a["id"]
        c1 = s.post(f"{API}/projects/{pid}/characters", json={"name": "Bob", "role": "", "description": ""}).json()
        c2 = s.post(f"{API}/projects/{pid}/characters", json={"name": "Carol", "role": "", "description": ""}).json()
        ch = s.post(f"{API}/projects/{pid}/chapters", json={"title": "ChA", "number": 1, "summary": ""}).json()
        act = s.post(f"{API}/projects/{pid}/acts", json={"title": "ActA", "number": 1, "summary": ""}).json()

        n1 = s.post(f"{API}/projects/{pid}/notes", json={
            "title": "TEST_Note1", "content": "hello world",
            "character_ids": [c1["id"], c2["id"]],
            "chapter_id": ch["id"], "act_id": act["id"], "source": "manual",
        })
        assert n1.status_code == 200
        note = n1.json()
        assert note["character_ids"] == [c1["id"], c2["id"]]
        assert note["chapter_id"] == ch["id"]
        nid = note["id"]

        # Unrelated note
        s.post(f"{API}/projects/{pid}/notes", json={"title": "TEST_Note2", "content": "x", "character_ids": [], "source": "manual"})

        # Filter by character_id
        f1 = s.get(f"{API}/projects/{pid}/notes", params={"character_id": c1["id"]})
        assert f1.status_code == 200 and any(n["id"] == nid for n in f1.json())
        # Filter by chapter_id
        f2 = s.get(f"{API}/projects/{pid}/notes", params={"chapter_id": ch["id"]})
        assert any(n["id"] == nid for n in f2.json())
        # Filter by act_id
        f3 = s.get(f"{API}/projects/{pid}/notes", params={"act_id": act["id"]})
        assert any(n["id"] == nid for n in f3.json())
        # Combined filter with unrelated character should exclude
        other_char = s.post(f"{API}/projects/{pid}/characters", json={"name": "Dan", "role": "", "description": ""}).json()
        f4 = s.get(f"{API}/projects/{pid}/notes", params={"character_id": other_char["id"]})
        assert not any(n["id"] == nid for n in f4.json())

        # Update note
        ur = s.put(f"{API}/notes/{nid}", json={
            "title": "TEST_Note1_upd", "content": "updated content",
            "character_ids": [c1["id"]], "chapter_id": ch["id"], "act_id": act["id"], "source": "manual",
        })
        assert ur.status_code == 200 and ur.json()["content"] == "updated content"

        # Export single note
        er = s.get(f"{API}/notes/{nid}/export")
        assert er.status_code == 200
        assert er.headers.get("content-type", "").startswith("text/plain")
        assert "Content-Disposition" in er.headers and "attachment" in er.headers["Content-Disposition"]
        assert "TEST_Note1_upd" in er.text
        assert "Bob" in er.text

        # Export project
        pe = s.get(f"{API}/projects/{pid}/export")
        assert pe.status_code == 200
        assert "Content-Disposition" in pe.headers
        assert "PROJECT:" in pe.text and "NOTES" in pe.text

        # Delete note
        assert s.delete(f"{API}/notes/{nid}").status_code == 200
        # After delete, export should 404
        er2 = s.get(f"{API}/notes/{nid}/export")
        assert er2.status_code == 404

        # Deleting a character pulls from note.character_ids
        n3 = s.post(f"{API}/projects/{pid}/notes", json={
            "title": "TEST_Note3", "content": "c", "character_ids": [c1["id"]], "source": "manual"
        }).json()
        s.delete(f"{API}/characters/{c1['id']}")
        refreshed = s.get(f"{API}/projects/{pid}/notes").json()
        matched = [n for n in refreshed if n["id"] == n3["id"]][0]
        assert c1["id"] not in matched["character_ids"]


# --- Ownership isolation ---
class TestOwnership:
    def test_user_b_cannot_access_user_a_project(self, user_a, user_b, project_a):
        sa = user_a["session"]
        sb = user_b["session"]
        pid = project_a["id"]

        # user B should get 404 on user A project
        r = sb.get(f"{API}/projects/{pid}")
        assert r.status_code == 404

        # Create a note for user A, user B tries to update/delete/export
        n = sa.post(f"{API}/projects/{pid}/notes", json={"title": "TEST_Iso", "content": "x", "character_ids": []}).json()
        nid = n["id"]
        assert sb.put(f"{API}/notes/{nid}", json={"title": "hax", "content": "", "character_ids": []}).status_code == 404
        assert sb.delete(f"{API}/notes/{nid}").status_code == 404
        assert sb.get(f"{API}/notes/{nid}/export").status_code == 404
        assert sb.get(f"{API}/projects/{pid}/export").status_code == 404

        # Characters/chapters/acts list endpoints should 404 for user B
        assert sb.get(f"{API}/projects/{pid}/characters").status_code == 404
        assert sb.get(f"{API}/projects/{pid}/chapters").status_code == 404
        assert sb.get(f"{API}/projects/{pid}/acts").status_code == 404
