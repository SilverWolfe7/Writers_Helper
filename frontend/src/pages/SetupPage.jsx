import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { Mic, Shield, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

const STATE = {
  UNKNOWN: "unknown",
  GRANTED: "granted",
  PROMPT: "prompt",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
};

function detectSpeechRecognition() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATE.UNKNOWN);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const speechSupported = detectSpeechRecognition();

  const refresh = useCallback(async () => {
    setError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus(STATE.UNAVAILABLE);
      return;
    }
    try {
      if (navigator.permissions?.query) {
        const p = await navigator.permissions.query({ name: "microphone" });
        setStatus(p.state === "granted" ? STATE.GRANTED : p.state === "denied" ? STATE.DENIED : STATE.PROMPT);
        p.onchange = () => {
          setStatus(p.state === "granted" ? STATE.GRANTED : p.state === "denied" ? STATE.DENIED : STATE.PROMPT);
        };
      } else {
        setStatus(STATE.PROMPT);
      }
    } catch {
      setStatus(STATE.PROMPT);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestAccess = async () => {
    setError("");
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus(STATE.GRANTED);
    } catch (e) {
      if (e?.name === "NotAllowedError") {
        setStatus(STATE.DENIED);
        setError(
          "Your browser blocked the microphone. Click the lock/info icon next to the address bar and allow microphone access."
        );
      } else {
        setError(e?.message || "Could not access the microphone.");
      }
    } finally {
      setRequesting(false);
    }
  };

  const banner = {
    [STATE.UNKNOWN]: { label: "Checking…", tone: "neutral" },
    [STATE.GRANTED]: { label: "Microphone access granted", tone: "ok" },
    [STATE.PROMPT]: { label: "Access not yet granted", tone: "warn" },
    [STATE.DENIED]: { label: "Access blocked in browser settings", tone: "warn" },
    [STATE.UNAVAILABLE]: { label: "Microphone API unavailable in this browser", tone: "warn" },
  }[status];

  const dotColor =
    banner.tone === "ok" ? "bg-moss" : banner.tone === "warn" ? "bg-sand" : "bg-muted2";

  return (
    <div className="min-h-screen bg-parchment">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-ink transition-colors mb-8"
          data-testid="setup-back"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="overline mb-3">Step 01 · Permissions</div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">
          Grant Writer&apos;s Helper access to your microphone.
        </h1>
        <p className="text-muted2 max-w-xl leading-relaxed mb-12">
          Writer&apos;s Helper uses your browser&apos;s microphone and the Web Speech API to transcribe your dictation into
          written notes. Audio is processed by your browser — only the transcript you choose to save is sent to
          your Writer&apos;s Helper account.
        </p>

        <div
          className={`border p-6 md:p-8 bg-parchment-2 mb-8 ${
            banner.tone === "ok" ? "border-moss" : banner.tone === "warn" ? "border-sand" : "border-rule"
          }`}
          data-testid="setup-status-card"
        >
          <div className="flex items-center gap-3">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <span className="text-base text-ink" data-testid="setup-status-label">
              {banner.label}
            </span>
          </div>
          {status === STATE.GRANTED && (
            <p className="text-sm text-muted2 mt-3 leading-relaxed">
              You're all set. Open a project and tap Dictate to begin.
            </p>
          )}
          {status === STATE.PROMPT && (
            <p className="text-sm text-muted2 mt-3 leading-relaxed">
              Click the button below — your browser will prompt you to allow microphone access.
            </p>
          )}
          {status === STATE.DENIED && (
            <p className="text-sm text-muted2 mt-3 leading-relaxed">
              Your browser is blocking the prompt. Open the site permissions (lock icon in the address bar) and
              set Microphone to Allow, then click Re-check below.
            </p>
          )}
          {status === STATE.UNAVAILABLE && (
            <p className="text-sm text-muted2 mt-3 leading-relaxed">
              This browser doesn't expose the microphone API. Try the latest Chrome, Edge, or Safari.
            </p>
          )}
          {!speechSupported && status !== STATE.UNAVAILABLE && (
            <p className="text-sm text-rust mt-3 leading-relaxed">
              Note: your browser doesn't support live Web Speech transcription (Firefox). Microphone access will
              still be granted, but voice-to-text needs Chrome, Edge, or Safari.
            </p>
          )}
          {error && <p className="text-sm text-rust mt-3">{error}</p>}
        </div>

        <div className="flex flex-wrap gap-3 mb-16">
          {status === STATE.GRANTED ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-3 text-sm hover:bg-[#383632] transition-colors"
              data-testid="setup-done-button"
            >
              <CheckCircle2 className="w-4 h-4" /> Back to projects
            </Link>
          ) : (
            <>
              <button
                onClick={requestAccess}
                disabled={requesting || status === STATE.UNAVAILABLE}
                className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-3 text-sm hover:bg-[#383632] transition-colors disabled:opacity-50"
                data-testid="setup-grant-button"
              >
                <Mic className="w-4 h-4" /> {requesting ? "Requesting…" : "Grant microphone access"}
              </button>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-parchment transition-colors"
                data-testid="setup-recheck-button"
              >
                Re-check
              </button>
            </>
          )}
        </div>

        <div className="overline mb-4">What you're allowing</div>
        <div className="grid gap-5">
          <BulletRow
            icon={<Mic className="w-4 h-4" />}
            title="Microphone"
            body="Captures your voice while you press Start dictation. Stops the moment you tap Stop."
          />
          <BulletRow
            icon={<Shield className="w-4 h-4" />}
            title="Web Speech API"
            body="Your browser converts audio to text. In Chrome/Edge, audio is handled by Google's speech service; in Safari, Apple's on-device engine is used."
          />
          <BulletRow
            icon={<AlertTriangle className="w-4 h-4" />}
            title="What's NOT collected"
            body="No raw audio is uploaded to Writer's Helper. Only the transcript you choose to save is stored in your account."
          />
        </div>
      </main>
    </div>
  );
}

function BulletRow({ icon, title, body }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 text-ink">{icon}</div>
      <div>
        <div className="font-serif text-lg text-ink">{title}</div>
        <div className="text-sm text-muted2 mt-1 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
