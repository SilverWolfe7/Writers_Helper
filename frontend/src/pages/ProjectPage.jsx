import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, downloadFile, formatApiError } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { ArrowLeft, Mic, Plus, Download, Trash2, Pencil, Users, BookMarked, Layers, NotebookText } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { key: "notes", label: "Notes", icon: NotebookText },
  { key: "characters", label: "Characters", icon: Users },
  { key: "chapters", label: "Chapters", icon: BookMarked },
  { key: "acts", label: "Acts", icon: Layers },
];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState("notes");
  const [filters, setFilters] = useState({ character_id: "", chapter_id: "", act_id: "" });

  const loadAll = useCallback(async () => {
    try {
      const [p, c, ch, a] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/characters`),
        api.get(`/projects/${id}/chapters`),
        api.get(`/projects/${id}/acts`),
      ]);
      setProject(p.data);
      setCharacters(c.data);
      setChapters(ch.data);
      setActs(a.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to load project"));
      navigate("/");
    }
  }, [id, navigate]);

  const loadNotes = useCallback(async () => {
    try {
      const params = {};
      if (filters.character_id) params.character_id = filters.character_id;
      if (filters.chapter_id) params.chapter_id = filters.chapter_id;
      if (filters.act_id) params.act_id = filters.act_id;
      const { data } = await api.get(`/projects/${id}/notes`, { params });
      setNotes(data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to load notes"));
    }
  }, [id, filters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const exportProject = async () => {
    try {
      await downloadFile(
        `/projects/${id}/export`,
        `${(project?.title || "project").replace(/\s+/g, "_")}.txt`
      );
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Export failed"));
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-ink transition-colors mb-8"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" /> All projects
        </button>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="overline mb-2">{project?.genre || "Project"}</div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight" data-testid="project-title">
              {project?.title || "…"}
            </h1>
            {project?.description && (
              <p className="text-muted2 mt-3 max-w-2xl leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm border border-ink hover:bg-ink hover:text-parchment transition-colors"
              data-testid="export-project-button"
            >
              <Download className="w-4 h-4" /> Export project
            </button>
            <Link
              to={`/projects/${id}/dictate`}
              className="inline-flex items-center gap-2 bg-ink text-parchment px-4 py-2.5 text-sm hover:bg-[#383632] transition-colors"
              data-testid="start-dictate-button"
            >
              <Mic className="w-4 h-4" /> Dictate
            </Link>
          </div>
        </div>

        <nav className="flex gap-6 border-b border-rule mb-10" data-testid="project-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 pb-3 -mb-px text-sm transition-colors border-b-2 ${
                tab === key ? "border-ink text-ink" : "border-transparent text-muted2 hover:text-ink"
              }`}
              data-testid={`tab-${key}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {tab === "notes" && (
          <NotesTab
            notes={notes}
            characters={characters}
            chapters={chapters}
            acts={acts}
            filters={filters}
            setFilters={setFilters}
            reload={loadNotes}
            projectId={id}
          />
        )}
        {tab === "characters" && (
          <CharactersTab characters={characters} reload={loadAll} projectId={id} />
        )}
        {tab === "chapters" && <ChaptersTab chapters={chapters} reload={loadAll} projectId={id} />}
        {tab === "acts" && <ActsTab acts={acts} reload={loadAll} projectId={id} />}
      </main>
    </div>
  );
}

function NotesTab({ notes, characters, chapters, acts, filters, setFilters, reload, projectId }) {
  const [editing, setEditing] = useState(null); // note obj or 'new'
  const charMap = Object.fromEntries(characters.map((c) => [c.id, c.name]));
  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, `Ch.${c.number} ${c.title}`]));
  const actMap = Object.fromEntries(acts.map((a) => [a.id, `Act ${a.number} ${a.title}`]));

  const del = async (nid) => {
    if (!window.confirm("Delete this note?")) return;
    await api.delete(`/notes/${nid}`);
    reload();
  };

  const exportOne = async (n) => {
    await downloadFile(`/notes/${n.id}/export`, `note-${(n.title || "untitled").replace(/\s+/g, "_")}.txt`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="overline">Filter</span>
          <select
            value={filters.character_id}
            onChange={(e) => setFilters({ ...filters, character_id: e.target.value })}
            className="editorial-input"
            data-testid="filter-character"
          >
            <option value="">All characters</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filters.chapter_id}
            onChange={(e) => setFilters({ ...filters, chapter_id: e.target.value })}
            className="editorial-input"
            data-testid="filter-chapter"
          >
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Ch.{c.number} {c.title}
              </option>
            ))}
          </select>
          <select
            value={filters.act_id}
            onChange={(e) => setFilters({ ...filters, act_id: e.target.value })}
            className="editorial-input"
            data-testid="filter-act"
          >
            <option value="">All acts</option>
            {acts.map((a) => (
              <option key={a.id} value={a.id}>
                Act {a.number} {a.title}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 text-sm border border-ink px-4 py-2 hover:bg-ink hover:text-parchment transition-colors"
          data-testid="new-note-button"
        >
          <Plus className="w-4 h-4" /> New note
        </button>
      </div>

      {editing && (
        <NoteEditor
          note={editing === "new" ? null : editing}
          characters={characters}
          chapters={chapters}
          acts={acts}
          projectId={projectId}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {notes.length === 0 ? (
        <div className="border border-rule p-14 text-center" data-testid="empty-notes">
          <NotebookText className="w-6 h-6 mx-auto text-muted2" />
          <p className="font-serif text-2xl mt-4">No notes yet.</p>
          <p className="text-muted2 mt-2 text-sm">Create a note manually or start dictating.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6" data-testid="notes-grid">
          {notes.map((n) => (
            <article
              key={n.id}
              className="border border-rule bg-parchment-2 p-6 flex flex-col"
              data-testid={`note-card-${n.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-serif text-xl tracking-tight">{n.title}</h3>
                <span className="overline">{n.source}</span>
              </div>
              <p className="text-sm text-ink/80 leading-relaxed line-clamp-6 whitespace-pre-wrap">{n.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(n.character_ids || []).map((cid) =>
                  charMap[cid] ? (
                    <span key={cid} className="font-mono text-[11px] uppercase tracking-[0.15em] border border-rule px-2 py-0.5">
                      {charMap[cid]}
                    </span>
                  ) : null
                )}
                {n.chapter_id && chapterMap[n.chapter_id] && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] border border-rule px-2 py-0.5">
                    {chapterMap[n.chapter_id]}
                  </span>
                )}
                {n.act_id && actMap[n.act_id] && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] border border-rule px-2 py-0.5">
                    {actMap[n.act_id]}
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-center gap-4 text-sm">
                <button
                  onClick={() => setEditing(n)}
                  className="inline-flex items-center gap-1.5 text-muted2 hover:text-ink transition-colors"
                  data-testid={`edit-note-${n.id}`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => exportOne(n)}
                  className="inline-flex items-center gap-1.5 text-muted2 hover:text-ink transition-colors"
                  data-testid={`export-note-${n.id}`}
                >
                  <Download className="w-3.5 h-3.5" /> TXT
                </button>
                <button
                  onClick={() => del(n.id)}
                  className="inline-flex items-center gap-1.5 text-muted2 hover:text-rust transition-colors ml-auto"
                  data-testid={`delete-note-${n.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteEditor({ note, characters, chapters, acts, projectId, onCancel, onSaved }) {
  const [title, setTitle] = useState(note?.title || "Untitled note");
  const [content, setContent] = useState(note?.content || "");
  const [characterIds, setCharacterIds] = useState(note?.character_ids || []);
  const [chapterId, setChapterId] = useState(note?.chapter_id || "");
  const [actId, setActId] = useState(note?.act_id || "");
  const [saving, setSaving] = useState(false);

  const toggleChar = (cid) =>
    setCharacterIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || "Untitled note",
        content,
        character_ids: characterIds,
        chapter_id: chapterId || null,
        act_id: actId || null,
        source: note?.source || "manual",
      };
      if (note?.id) {
        await api.put(`/notes/${note.id}`, payload);
        toast.success("Note updated");
      } else {
        await api.post(`/projects/${projectId}/notes`, payload);
        toast.success("Note created");
      }
      onSaved();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mb-10 border border-rule bg-parchment-2 p-6 md:p-8 animate-fade-up" data-testid="note-editor">
      <div className="overline mb-5">{note?.id ? "Edit note" : "New note"}</div>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-3">
          <label className="overline block mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="editorial-input w-full"
            data-testid="note-title-input"
          />
        </div>
        <div className="md:col-span-3">
          <label className="overline block mb-2">Content</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-rule bg-parchment p-3 focus:outline-none focus:border-ink text-base leading-relaxed resize-y"
            data-testid="note-content-input"
          />
        </div>
        <div>
          <label className="overline block mb-2">Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="editorial-input w-full"
            data-testid="note-chapter-select"
          >
            <option value="">— None —</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Ch.{c.number} {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="overline block mb-2">Act</label>
          <select
            value={actId}
            onChange={(e) => setActId(e.target.value)}
            className="editorial-input w-full"
            data-testid="note-act-select"
          >
            <option value="">— None —</option>
            {acts.map((a) => (
              <option key={a.id} value={a.id}>
                Act {a.number} {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="overline block mb-2">Characters</label>
        <div className="flex flex-wrap gap-2" data-testid="note-characters-list">
          {characters.length === 0 && <span className="text-sm text-muted2">No characters yet.</span>}
          {characters.map((c) => {
            const selected = characterIds.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleChar(c.id)}
                className={`px-3 py-1.5 text-sm border transition-colors ${
                  selected ? "bg-ink text-parchment border-ink" : "bg-parchment border-rule hover:border-ink"
                }`}
                data-testid={`note-char-chip-${c.id}`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-[#383632] transition-colors disabled:opacity-60"
          data-testid="note-save-button"
        >
          {saving ? "Saving…" : note?.id ? "Update note" : "Save note"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted2 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function InlineList({ items, renderItem, emptyLabel }) {
  if (items.length === 0)
    return <div className="text-sm text-muted2 italic">{emptyLabel}</div>;
  return <div className="divide-y divide-rule border border-rule">{items.map(renderItem)}</div>;
}

function CharactersTab({ characters, reload, projectId }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post(`/projects/${projectId}/characters`, { name, role, description });
    setName("");
    setRole("");
    setDescription("");
    reload();
  };
  const del = async (cid) => {
    if (!window.confirm("Delete character? Associated tags on notes will be removed.")) return;
    await api.delete(`/characters/${cid}`);
    reload();
  };

  return (
    <div className="grid md:grid-cols-5 gap-10">
      <form onSubmit={add} className="md:col-span-2 border border-rule p-6 bg-parchment-2" data-testid="new-character-form">
        <div className="overline mb-4">Add character</div>
        <label className="overline block mb-2">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="editorial-input w-full mb-4"
          required
          data-testid="character-name-input"
        />
        <label className="overline block mb-2">Role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="editorial-input w-full mb-4"
          placeholder="Protagonist, Antagonist, Sidekick…"
          data-testid="character-role-input"
        />
        <label className="overline block mb-2">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="editorial-input w-full resize-none mb-6"
          data-testid="character-description-input"
        />
        <button className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-[#383632] transition-colors" data-testid="character-add-submit">
          Add character
        </button>
      </form>
      <div className="md:col-span-3">
        <InlineList
          items={characters}
          emptyLabel="No characters yet."
          renderItem={(c) => (
            <div key={c.id} className="p-5 flex items-start justify-between gap-4" data-testid={`character-row-${c.id}`}>
              <div>
                <h3 className="font-serif text-xl">{c.name}</h3>
                {c.role && <div className="overline mt-1">{c.role}</div>}
                {c.description && <p className="text-sm text-muted2 mt-2 leading-relaxed">{c.description}</p>}
              </div>
              <button
                onClick={() => del(c.id)}
                className="text-muted2 hover:text-rust transition-colors"
                aria-label="Delete"
                data-testid={`character-delete-${c.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function ChaptersTab({ chapters, reload, projectId }) {
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(chapters.length + 1);
  const [summary, setSummary] = useState("");

  const add = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${projectId}/chapters`, { title, number: Number(number) || 1, summary });
    setTitle("");
    setSummary("");
    setNumber((n) => Number(n) + 1);
    reload();
  };
  const del = async (cid) => {
    if (!window.confirm("Delete this chapter?")) return;
    await api.delete(`/chapters/${cid}`);
    reload();
  };

  return (
    <div className="grid md:grid-cols-5 gap-10">
      <form onSubmit={add} className="md:col-span-2 border border-rule p-6 bg-parchment-2" data-testid="new-chapter-form">
        <div className="overline mb-4">Add chapter</div>
        <label className="overline block mb-2">Number</label>
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="editorial-input w-full mb-4"
          data-testid="chapter-number-input"
        />
        <label className="overline block mb-2">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editorial-input w-full mb-4"
          required
          data-testid="chapter-title-input"
        />
        <label className="overline block mb-2">Summary</label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="editorial-input w-full resize-none mb-6"
          data-testid="chapter-summary-input"
        />
        <button className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-[#383632] transition-colors" data-testid="chapter-add-submit">
          Add chapter
        </button>
      </form>
      <div className="md:col-span-3">
        <InlineList
          items={chapters}
          emptyLabel="No chapters yet."
          renderItem={(c) => (
            <div key={c.id} className="p-5 flex items-start justify-between gap-4" data-testid={`chapter-row-${c.id}`}>
              <div>
                <div className="overline">Chapter {c.number}</div>
                <h3 className="font-serif text-xl mt-1">{c.title}</h3>
                {c.summary && <p className="text-sm text-muted2 mt-2 leading-relaxed">{c.summary}</p>}
              </div>
              <button onClick={() => del(c.id)} className="text-muted2 hover:text-rust" data-testid={`chapter-delete-${c.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function ActsTab({ acts, reload, projectId }) {
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(acts.length + 1);
  const [summary, setSummary] = useState("");

  const add = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${projectId}/acts`, { title, number: Number(number) || 1, summary });
    setTitle("");
    setSummary("");
    setNumber((n) => Number(n) + 1);
    reload();
  };
  const del = async (aid) => {
    if (!window.confirm("Delete this act?")) return;
    await api.delete(`/acts/${aid}`);
    reload();
  };

  return (
    <div className="grid md:grid-cols-5 gap-10">
      <form onSubmit={add} className="md:col-span-2 border border-rule p-6 bg-parchment-2" data-testid="new-act-form">
        <div className="overline mb-4">Add act</div>
        <label className="overline block mb-2">Number</label>
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="editorial-input w-full mb-4"
          data-testid="act-number-input"
        />
        <label className="overline block mb-2">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editorial-input w-full mb-4"
          required
          data-testid="act-title-input"
        />
        <label className="overline block mb-2">Summary</label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="editorial-input w-full resize-none mb-6"
          data-testid="act-summary-input"
        />
        <button className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-[#383632] transition-colors" data-testid="act-add-submit">
          Add act
        </button>
      </form>
      <div className="md:col-span-3">
        <InlineList
          items={acts}
          emptyLabel="No acts yet."
          renderItem={(a) => (
            <div key={a.id} className="p-5 flex items-start justify-between gap-4" data-testid={`act-row-${a.id}`}>
              <div>
                <div className="overline">Act {a.number}</div>
                <h3 className="font-serif text-xl mt-1">{a.title}</h3>
                {a.summary && <p className="text-sm text-muted2 mt-2 leading-relaxed">{a.summary}</p>}
              </div>
              <button onClick={() => del(a.id)} className="text-muted2 hover:text-rust" data-testid={`act-delete-${a.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
