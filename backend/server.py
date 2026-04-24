from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# --- Database ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# --- JWT / Auth helpers ---
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24  # 1 day (writing app, no need for tight expiry)
REFRESH_TOKEN_DAYS = 30


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str) -> str:
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        path="/",
    )
    return access_token


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Pydantic Models ---
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    created_at: str


class AuthOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    created_at: str
    access_token: str


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    genre: str = Field(default="", max_length=60)


class ProjectOut(ProjectIn):
    id: str
    owner_id: str
    created_at: str
    updated_at: str


class CharacterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=2000)


class CharacterOut(CharacterIn):
    id: str
    project_id: str
    created_at: str


class ChapterIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    number: int = Field(default=1, ge=0, le=9999)
    summary: str = Field(default="", max_length=2000)


class ChapterOut(ChapterIn):
    id: str
    project_id: str
    created_at: str


class ActIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    number: int = Field(default=1, ge=0, le=999)
    summary: str = Field(default="", max_length=2000)


class ActOut(ActIn):
    id: str
    project_id: str
    created_at: str


class NoteIn(BaseModel):
    title: str = Field(default="Untitled note", max_length=200)
    content: str = Field(default="", max_length=50000)
    character_ids: List[str] = Field(default_factory=list)
    chapter_id: Optional[str] = None
    act_id: Optional[str] = None
    source: str = Field(default="manual")  # 'manual' | 'dictation'


class NoteOut(NoteIn):
    id: str
    project_id: str
    owner_id: str
    created_at: str
    updated_at: str


# --- FastAPI app ---
app = FastAPI(title="Scribeverse API")
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# --- Auth endpoints ---
@api_router.post("/auth/register", response_model=AuthOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": new_id(),
        "email": email,
        "name": body.name.strip(),
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    access_token = set_auth_cookies(response, user_doc["id"], email)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {**user_doc, "access_token": access_token}


@api_router.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = set_auth_cookies(response, user["id"], email)
    user.pop("password_hash", None)
    return {**user, "access_token": access_token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user


# --- Project endpoints ---
async def assert_project_owner(project_id: str, user_id: str) -> dict:
    proj = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not proj or proj["owner_id"] != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@api_router.post("/projects", response_model=ProjectOut)
async def create_project(body: ProjectIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": new_id(),
        "owner_id": user["id"],
        "title": body.title.strip(),
        "description": body.description,
        "genre": body.genre,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/projects", response_model=List[ProjectOut])
async def list_projects(user: dict = Depends(get_current_user)):
    items = await db.projects.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    return await assert_project_owner(project_id, user["id"])


@api_router.put("/projects/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, body: ProjectIn, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    update = {**body.model_dump(), "updated_at": now_iso()}
    await db.projects.update_one({"id": project_id}, {"$set": update})
    proj = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return proj


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    await db.projects.delete_one({"id": project_id})
    await db.characters.delete_many({"project_id": project_id})
    await db.chapters.delete_many({"project_id": project_id})
    await db.acts.delete_many({"project_id": project_id})
    await db.notes.delete_many({"project_id": project_id})
    return {"ok": True}


# --- Characters ---
@api_router.post("/projects/{project_id}/characters", response_model=CharacterOut)
async def create_character(project_id: str, body: CharacterIn, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    doc = {
        "id": new_id(),
        "project_id": project_id,
        "name": body.name.strip(),
        "role": body.role,
        "description": body.description,
        "created_at": now_iso(),
    }
    await db.characters.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/projects/{project_id}/characters", response_model=List[CharacterOut])
async def list_characters(project_id: str, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    return await db.characters.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(500)


@api_router.put("/characters/{char_id}", response_model=CharacterOut)
async def update_character(char_id: str, body: CharacterIn, user: dict = Depends(get_current_user)):
    ch = await db.characters.find_one({"id": char_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Character not found")
    await assert_project_owner(ch["project_id"], user["id"])
    await db.characters.update_one({"id": char_id}, {"$set": body.model_dump()})
    return await db.characters.find_one({"id": char_id}, {"_id": 0})


@api_router.delete("/characters/{char_id}")
async def delete_character(char_id: str, user: dict = Depends(get_current_user)):
    ch = await db.characters.find_one({"id": char_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Character not found")
    await assert_project_owner(ch["project_id"], user["id"])
    await db.characters.delete_one({"id": char_id})
    await db.notes.update_many(
        {"project_id": ch["project_id"]},
        {"$pull": {"character_ids": char_id}},
    )
    return {"ok": True}


# --- Chapters ---
@api_router.post("/projects/{project_id}/chapters", response_model=ChapterOut)
async def create_chapter(project_id: str, body: ChapterIn, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    doc = {"id": new_id(), "project_id": project_id, **body.model_dump(), "created_at": now_iso()}
    await db.chapters.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/projects/{project_id}/chapters", response_model=List[ChapterOut])
async def list_chapters(project_id: str, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    return await db.chapters.find({"project_id": project_id}, {"_id": 0}).sort("number", 1).to_list(500)


@api_router.put("/chapters/{chap_id}", response_model=ChapterOut)
async def update_chapter(chap_id: str, body: ChapterIn, user: dict = Depends(get_current_user)):
    ch = await db.chapters.find_one({"id": chap_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    await assert_project_owner(ch["project_id"], user["id"])
    await db.chapters.update_one({"id": chap_id}, {"$set": body.model_dump()})
    return await db.chapters.find_one({"id": chap_id}, {"_id": 0})


@api_router.delete("/chapters/{chap_id}")
async def delete_chapter(chap_id: str, user: dict = Depends(get_current_user)):
    ch = await db.chapters.find_one({"id": chap_id}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    await assert_project_owner(ch["project_id"], user["id"])
    await db.chapters.delete_one({"id": chap_id})
    await db.notes.update_many({"chapter_id": chap_id}, {"$set": {"chapter_id": None}})
    return {"ok": True}


# --- Acts ---
@api_router.post("/projects/{project_id}/acts", response_model=ActOut)
async def create_act(project_id: str, body: ActIn, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    doc = {"id": new_id(), "project_id": project_id, **body.model_dump(), "created_at": now_iso()}
    await db.acts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/projects/{project_id}/acts", response_model=List[ActOut])
async def list_acts(project_id: str, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    return await db.acts.find({"project_id": project_id}, {"_id": 0}).sort("number", 1).to_list(500)


@api_router.put("/acts/{act_id}", response_model=ActOut)
async def update_act(act_id: str, body: ActIn, user: dict = Depends(get_current_user)):
    a = await db.acts.find_one({"id": act_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Act not found")
    await assert_project_owner(a["project_id"], user["id"])
    await db.acts.update_one({"id": act_id}, {"$set": body.model_dump()})
    return await db.acts.find_one({"id": act_id}, {"_id": 0})


@api_router.delete("/acts/{act_id}")
async def delete_act(act_id: str, user: dict = Depends(get_current_user)):
    a = await db.acts.find_one({"id": act_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Act not found")
    await assert_project_owner(a["project_id"], user["id"])
    await db.acts.delete_one({"id": act_id})
    await db.notes.update_many({"act_id": act_id}, {"$set": {"act_id": None}})
    return {"ok": True}


# --- Notes ---
@api_router.post("/projects/{project_id}/notes", response_model=NoteOut)
async def create_note(project_id: str, body: NoteIn, user: dict = Depends(get_current_user)):
    await assert_project_owner(project_id, user["id"])
    doc = {
        "id": new_id(),
        "project_id": project_id,
        "owner_id": user["id"],
        **body.model_dump(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.notes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/projects/{project_id}/notes", response_model=List[NoteOut])
async def list_notes(
    project_id: str,
    character_id: Optional[str] = None,
    chapter_id: Optional[str] = None,
    act_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    await assert_project_owner(project_id, user["id"])
    q: dict = {"project_id": project_id}
    if character_id:
        q["character_ids"] = character_id
    if chapter_id:
        q["chapter_id"] = chapter_id
    if act_id:
        q["act_id"] = act_id
    return await db.notes.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.put("/notes/{note_id}", response_model=NoteOut)
async def update_note(note_id: str, body: NoteIn, user: dict = Depends(get_current_user)):
    n = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    await assert_project_owner(n["project_id"], user["id"])
    update = {**body.model_dump(), "updated_at": now_iso()}
    await db.notes.update_one({"id": note_id}, {"$set": update})
    return await db.notes.find_one({"id": note_id}, {"_id": 0})


@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    n = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    await assert_project_owner(n["project_id"], user["id"])
    await db.notes.delete_one({"id": note_id})
    return {"ok": True}


# --- Exports ---
def format_note_txt(note: dict, char_map: dict, chapter_map: dict, act_map: dict) -> str:
    char_names = [char_map.get(cid, "") for cid in note.get("character_ids", []) if char_map.get(cid)]
    chapter = chapter_map.get(note.get("chapter_id")) if note.get("chapter_id") else None
    act = act_map.get(note.get("act_id")) if note.get("act_id") else None
    lines = [
        f"Title: {note.get('title', 'Untitled note')}",
        f"Created: {note.get('created_at', '')}",
        f"Source: {note.get('source', 'manual')}",
    ]
    if char_names:
        lines.append(f"Characters: {', '.join(char_names)}")
    if chapter:
        lines.append(f"Chapter: {chapter}")
    if act:
        lines.append(f"Act: {act}")
    lines.append("-" * 60)
    lines.append(note.get("content", ""))
    return "\n".join(lines)


@api_router.get("/notes/{note_id}/export")
async def export_note(note_id: str, user: dict = Depends(get_current_user)):
    n = await db.notes.find_one({"id": note_id}, {"_id": 0})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    await assert_project_owner(n["project_id"], user["id"])
    chars = await db.characters.find({"project_id": n["project_id"]}, {"_id": 0}).to_list(500)
    chapters = await db.chapters.find({"project_id": n["project_id"]}, {"_id": 0}).to_list(500)
    acts = await db.acts.find({"project_id": n["project_id"]}, {"_id": 0}).to_list(500)
    char_map = {c["id"]: c["name"] for c in chars}
    chapter_map = {c["id"]: f"{c.get('number', '')}. {c['title']}" for c in chapters}
    act_map = {a["id"]: f"{a.get('number', '')}. {a['title']}" for a in acts}
    text = format_note_txt(n, char_map, chapter_map, act_map)
    filename = f"note-{(n.get('title') or 'untitled').replace(' ', '_')[:40]}.txt"
    return PlainTextResponse(
        content=text,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@api_router.get("/projects/{project_id}/export")
async def export_project(project_id: str, user: dict = Depends(get_current_user)):
    proj = await assert_project_owner(project_id, user["id"])
    notes = await db.notes.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(5000)
    chars = await db.characters.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    chapters = await db.chapters.find({"project_id": project_id}, {"_id": 0}).sort("number", 1).to_list(500)
    acts = await db.acts.find({"project_id": project_id}, {"_id": 0}).sort("number", 1).to_list(500)
    char_map = {c["id"]: c["name"] for c in chars}
    chapter_map = {c["id"]: f"{c.get('number', '')}. {c['title']}" for c in chapters}
    act_map = {a["id"]: f"{a.get('number', '')}. {a['title']}" for a in acts}

    header = [
        f"PROJECT: {proj['title']}",
        f"GENRE: {proj.get('genre', '')}",
        f"DESCRIPTION: {proj.get('description', '')}",
        f"EXPORTED: {now_iso()}",
        "=" * 60,
        "",
    ]
    if chars:
        header.append("CHARACTERS")
        header.append("-" * 60)
        for c in chars:
            header.append(f"- {c['name']} ({c.get('role', '')}): {c.get('description', '')}")
        header.append("")
    if acts:
        header.append("ACTS")
        header.append("-" * 60)
        for a in acts:
            header.append(f"- Act {a.get('number', '')} — {a['title']}: {a.get('summary', '')}")
        header.append("")
    if chapters:
        header.append("CHAPTERS")
        header.append("-" * 60)
        for c in chapters:
            header.append(f"- Chapter {c.get('number', '')} — {c['title']}: {c.get('summary', '')}")
        header.append("")
    header.append("=" * 60)
    header.append("NOTES")
    header.append("=" * 60)
    body_parts = [format_note_txt(n, char_map, chapter_map, act_map) for n in notes]
    text = "\n".join(header) + "\n\n" + ("\n\n" + ("=" * 60) + "\n\n").join(body_parts)
    filename = f"project-{proj['title'].replace(' ', '_')[:40]}.txt"
    return PlainTextResponse(
        content=text,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Router + startup ---
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url]
for extra in os.environ.get("CORS_ORIGINS", "").split(","):
    extra = extra.strip()
    if extra and extra != "*" and extra not in allowed_origins:
        allowed_origins.append(extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.projects.create_index("owner_id")
    await db.characters.create_index("project_id")
    await db.chapters.create_index("project_id")
    await db.acts.create_index("project_id")
    await db.notes.create_index("project_id")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@scribeverse.app").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": new_id(),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user: %s", admin_email)
    logger.info("Backend ready. Allowed origins: %s", allowed_origins)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
