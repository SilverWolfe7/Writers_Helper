import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Mic, Square, Save, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import useMicPermission, { MIC_STATE } from "../hooks/useMicPermission";

function badgeClasses(supported, micState) {
  if (!supported) return "border-rule bg-parchment-2 text-muted2";
  if (micState === MIC_STATE.GRANTED) return "border-moss bg-moss/10 text-ink hover:bg-moss/15";
  return "border-sand bg-sand/10 text-ink hover:bg-sand/15";
}

function badgeDotClasses(supported, micState) {
  if (!supported) return "bg-muted2";
  if (micState === MIC_STATE.GRANTED) return "bg-moss";
  return "bg-sand";
}

function badgeLabel(supported, micState) {
  if (!supported) return "Typing only · voice dictation unsupported in this browser";
  if (micState === MIC_STATE.GRANTED) return "Mic: browser speech · private";
  if (micState === MIC_STATE.DENIED) return "Mic blocked — tap to fix";
  return "Mic not yet granted — tap to set up";
}

export default function DictatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);

  const [title, setTitle] = useState("Untitled dictation");
  const [characterIds, setCharacterIds] = useState([]);
  const [chapterId, setChapterId] = useState("");
  const [actId, setActId] = useState("");
  const [saving, setSaving] = useState(false);

  const mic = useMicPermission();
  const speech = useSpeechRecognition({
    onPermissionDenied: () => {
      mic.refresh();
      toast.error("Microphone access was denied.");
    },
  });

  const load = useCallback(async () => {
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
      setTitle(`Dictation — ${new Date().toLocaleString()}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to load project"));
      navigate("/");
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRecord = useCallback(async () => {
    if (speech.recording) {
      speech.stop();
      return;
    }
    if (mic.state !== MIC_STATE.GRANTED) {
      const granted = await mic.request();
      if (!granted) {
        toast.error("Microphone access denied. Open Setup to fix.");
        return;
      }
    }
    speech.start();
  }, [speech, mic]);

  const toggleCharacter = useCallback((cid) => {
    setCharacterIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  }, []);

  const save = useCallback(async () => {
    const content = (speech.transcript + (speech.interim ? " " + speech.interim : "")).trim();
    if (!content) {
      toast.error("Nothing to save yet. Try dictating something first.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/projects/${id}/notes`, {
        title: title.trim() || "Untitled dictation",
        content,
        character_ids: characterIds,
        chapter_id: chapterId || null,
        act_id: actId || null,
        source: "dictation",
      });
      toast.success("Note saved to your project.");
      navigate(`/projects/${id}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to save note"));
    } finally {
      setSaving(false);
    }
  }, [id, title, characterIds, chapterId, actId, speech.transcript, speech.interim, navigate]);

  return (
    <div className="min-h-screen bg-parchment">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-ink transition-colors mb-8"
          data-testid="back-to-project"
        >
          <ArrowLeft className="w-4 h-4" /> Back to project
        </button>

        <div className="overline mb-3">Dictation canvas</div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-2">
          {project ? project.title : "Loading…"}
        </h1>
        <p className="text-muted2 text-sm mb-12 max-w-xl">
          Tap the microphone and start speaking. Writer&apos;s Helper transcribes live — pause, edit, tag, and save.
        </p>

        {!speech.supported && (
          <div className="border border-rust/30 bg-rust/5 p-4 text-sm text-rust mb-8" data-testid="sr-unsupported">
            Your browser does not support voice dictation. Use Chrome, Edge, or Safari — or type your note directly below.
          </div>
        )}

        <Link
          to="/setup"
          className={`flex items-center gap-3 border px-4 py-3 mb-8 transition-colors ${badgeClasses(speech.supported, mic.state)}`}
          data-testid="mic-trust-badge"
        >
          <span className={`inline-block w-2 h-2 rounded-full ${badgeDotClasses(speech.supported, mic.state)}`} />
          <span className="font-mono uppercase text-[11px] tracking-[0.2em] flex-1">
            {badgeLabel(speech.supported, mic.state)}
          </span>
          <ChevronRight className="w-4 h-4 opacity-60" />
        </Link>

        <TranscriptCanvas speech={speech} saving={saving} onToggleRecord={toggleRecord} onSave={save} />

        <div className="mt-12 grid md:grid-cols-2 gap-10">
          <div>
            <div className="overline mb-3">Note title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="editorial-input w-full"
              data-testid="dictation-title-input"
            />
          </div>
          <div>
            <div className="overline mb-3">Chapter</div>
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="editorial-input w-full"
              data-testid="dictation-chapter-select"
            >
              <option value="">— None —</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch. {c.number} · {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="overline mb-3">Act</div>
            <select
              value={actId}
              onChange={(e) => setActId(e.target.value)}
              className="editorial-input w-full"
              data-testid="dictation-act-select"
            >
              <option value="">— None —</option>
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  Act {a.number} · {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="overline mb-3">Characters</div>
            <CharacterChips
              characters={characters}
              selectedIds={characterIds}
              onToggle={toggleCharacter}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function TranscriptCanvas({ speech, saving, onToggleRecord, onSave }) {
  return (
    <div className="border border-rule bg-parchment-2 p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <div className="overline">Live transcript</div>
        {speech.recording && (
          <div className="flex items-center gap-2 overline" data-testid="recording-indicator">
            <span className="rec-dot" /> Recording
          </div>
        )}
      </div>
      <div
        className="min-h-[300px] font-serif text-xl md:text-2xl leading-relaxed text-ink whitespace-pre-wrap"
        data-testid="transcript-area"
      >
        {speech.transcript || <span className="text-muted2">Your words will appear here…</span>}
        {speech.interim && <span className="text-muted2"> {speech.interim}</span>}
      </div>
      <textarea
        value={speech.transcript}
        onChange={(e) => speech.setManualTranscript(e.target.value)}
        placeholder="Or type manually…"
        className="mt-6 w-full border border-rule bg-parchment p-4 font-sans text-base leading-relaxed focus:outline-none focus:border-ink resize-none"
        rows={4}
        data-testid="transcript-manual-input"
      />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={onToggleRecord}
          disabled={!speech.supported}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm transition-colors border ${
            speech.recording
              ? "border-rust text-rust bg-rust/5 hover:bg-rust/10"
              : "border-ink bg-ink text-parchment hover:bg-[#383632]"
          } disabled:opacity-50`}
          data-testid="record-toggle-button"
        >
          {speech.recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {speech.recording ? "Stop" : "Start dictation"}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm border border-ink hover:bg-ink hover:text-parchment transition-colors disabled:opacity-60"
          data-testid="save-dictation-button"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}

function CharacterChips({ characters, selectedIds, onToggle }) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-wrap gap-2" data-testid="dictation-characters-list">
        <span className="text-sm text-muted2">No characters yet.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2" data-testid="dictation-characters-list">
      {characters.map((c) => {
        const selected = selectedIds.includes(c.id);
        return (
          <button
            type="button"
            key={c.id}
            onClick={() => onToggle(c.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-colors ${
              selected
                ? "bg-ink text-parchment border-ink"
                : "bg-parchment-2 border-rule text-ink hover:border-ink"
            }`}
            data-testid={`dictation-character-chip-${c.id}`}
          >
            {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
