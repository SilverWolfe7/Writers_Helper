import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Mic, Square, Save, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function DictatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);

  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [micPermission, setMicPermission] = useState("unknown"); // granted | prompt | denied | unknown
  const [title, setTitle] = useState("Untitled dictation");
  const [characterIds, setCharacterIds] = useState([]);
  const [chapterId, setChapterId] = useState("");
  const [actId, setActId] = useState("");
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const baseTranscriptRef = useRef("");

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

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) {
        baseTranscriptRef.current = (baseTranscriptRef.current + " " + finalText).trim();
        setTranscript(baseTranscriptRef.current);
      }
      setInterim(interimText);
    };
    rec.onend = () => {
      if (shouldRestartRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      } else {
        setRecording(false);
        setInterim("");
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone access was denied.");
        setMicPermission("denied");
        shouldRestartRef.current = false;
        setRecording(false);
      }
    };
    recognitionRef.current = rec;
    return () => {
      shouldRestartRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // Track microphone permission live (granted/prompt/denied).
  useEffect(() => {
    let permRef = null;
    let cancelled = false;
    (async () => {
      if (!navigator.permissions?.query) return;
      try {
        permRef = await navigator.permissions.query({ name: "microphone" });
        if (cancelled) return;
        setMicPermission(permRef.state);
        permRef.onchange = () => setMicPermission(permRef.state);
      } catch {
        /* older browsers */
      }
    })();
    return () => {
      cancelled = true;
      if (permRef) permRef.onchange = null;
    };
  }, []);

  const toggleRecord = async () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (recording) {
      shouldRestartRef.current = false;
      rec.stop();
      return;
    }
    // Proactively ask for mic access if we know it's not granted yet.
    if (micPermission !== "granted" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicPermission("granted");
      } catch {
        setMicPermission("denied");
        toast.error("Microphone access denied. Open Setup to fix.");
        return;
      }
    }
    baseTranscriptRef.current = transcript ? transcript.trim() : "";
    shouldRestartRef.current = true;
    try {
      rec.start();
      setRecording(true);
    } catch {
      /* already started */
    }
  };

  const toggleCharacter = (cid) => {
    setCharacterIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  };

  const save = async () => {
    const content = (transcript + (interim ? " " + interim : "")).trim();
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
  };

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
          Tap the microphone and start speaking. Scribeverse transcribes live — pause, edit, tag, and save.
        </p>

        {!supported && (
          <div className="border border-rust/30 bg-rust/5 p-4 text-sm text-rust mb-8" data-testid="sr-unsupported">
            Your browser does not support voice dictation. Use Chrome, Edge, or Safari — or type your note directly below.
          </div>
        )}

        <Link
          to="/setup"
          className={`flex items-center gap-3 border px-4 py-3 mb-8 transition-colors ${
            !supported
              ? "border-rule bg-parchment-2 text-muted2"
              : micPermission === "granted"
              ? "border-moss bg-moss/10 text-ink hover:bg-moss/15"
              : "border-sand bg-sand/10 text-ink hover:bg-sand/15"
          }`}
          data-testid="mic-trust-badge"
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              !supported
                ? "bg-muted2"
                : micPermission === "granted"
                ? "bg-moss"
                : "bg-sand"
            }`}
          />
          <span className="font-mono uppercase text-[11px] tracking-[0.2em] flex-1">
            {!supported
              ? "Typing only · voice dictation unsupported in this browser"
              : micPermission === "granted"
              ? "Mic: browser speech · private"
              : micPermission === "denied"
              ? "Mic blocked — tap to fix"
              : "Mic not yet granted — tap to set up"}
          </span>
          <ChevronRight className="w-4 h-4 opacity-60" />
        </Link>

        <div className="border border-rule bg-parchment-2 p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="overline">Live transcript</div>
            {recording && (
              <div className="flex items-center gap-2 overline" data-testid="recording-indicator">
                <span className="rec-dot" /> Recording
              </div>
            )}
          </div>
          <div
            className="min-h-[300px] font-serif text-xl md:text-2xl leading-relaxed text-ink whitespace-pre-wrap"
            data-testid="transcript-area"
          >
            {transcript || <span className="text-muted2">Your words will appear here…</span>}
            {interim && <span className="text-muted2"> {interim}</span>}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              baseTranscriptRef.current = e.target.value;
            }}
            placeholder="Or type manually…"
            className="mt-6 w-full border border-rule bg-parchment p-4 font-sans text-base leading-relaxed focus:outline-none focus:border-ink resize-none"
            rows={4}
            data-testid="transcript-manual-input"
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={toggleRecord}
              disabled={!supported}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm transition-colors border ${
                recording
                  ? "border-rust text-rust bg-rust/5 hover:bg-rust/10"
                  : "border-ink bg-ink text-parchment hover:bg-[#383632]"
              } disabled:opacity-50`}
              data-testid="record-toggle-button"
            >
              {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {recording ? "Stop" : "Start dictation"}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm border border-ink hover:bg-ink hover:text-parchment transition-colors disabled:opacity-60"
              data-testid="save-dictation-button"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>

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
            <div className="flex flex-wrap gap-2" data-testid="dictation-characters-list">
              {characters.length === 0 && <span className="text-sm text-muted2">No characters yet.</span>}
              {characters.map((c) => {
                const selected = characterIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCharacter(c.id)}
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
          </div>
        </div>
      </main>
    </div>
  );
}
