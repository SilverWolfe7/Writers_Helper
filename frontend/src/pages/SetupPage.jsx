import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { Mic, Shield, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import useMicPermission, { MIC_STATE } from "../hooks/useMicPermission";

function detectSpeechRecognition() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

const BANNERS = {
  [MIC_STATE.UNKNOWN]: { label: "Checking…", tone: "neutral" },
  [MIC_STATE.GRANTED]: { label: "Microphone access granted", tone: "ok" },
  [MIC_STATE.PROMPT]: { label: "Access not yet granted", tone: "warn" },
  [MIC_STATE.DENIED]: { label: "Access blocked in browser settings", tone: "warn" },
  [MIC_STATE.UNAVAILABLE]: { label: "Microphone API unavailable in this browser", tone: "warn" },
};

function dotColorFor(tone) {
  if (tone === "ok") return "bg-moss";
  if (tone === "warn") return "bg-sand";
  return "bg-muted2";
}

function borderColorFor(tone) {
  if (tone === "ok") return "border-moss";
  if (tone === "warn") return "border-sand";
  return "border-rule";
}

export default function SetupPage() {
  const navigate = useNavigate();
  const mic = useMicPermission();
  const speechSupported = detectSpeechRecognition();
  const banner = BANNERS[mic.state] || BANNERS[MIC_STATE.UNKNOWN];

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

        <StatusCard banner={banner} mic={mic} speechSupported={speechSupported} />

        <div className="flex flex-wrap gap-3 mb-16">
          <ActionButtons mic={mic} />
        </div>

        <div className="overline mb-4">What you&apos;re allowing</div>
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

function StatusCard({ banner, mic, speechSupported }) {
  const dot = dotColorFor(banner.tone);
  const border = borderColorFor(banner.tone);
  return (
    <div
      className={`border p-6 md:p-8 bg-parchment-2 mb-8 ${border}`}
      data-testid="setup-status-card"
    >
      <div className="flex items-center gap-3">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-base text-ink" data-testid="setup-status-label">
          {banner.label}
        </span>
      </div>
      <StatusHint state={mic.state} />
      {!speechSupported && mic.state !== MIC_STATE.UNAVAILABLE && (
        <p className="text-sm text-rust mt-3 leading-relaxed">
          Note: your browser doesn&apos;t support live Web Speech transcription (Firefox). Microphone access will
          still be granted, but voice-to-text needs Chrome, Edge, or Safari.
        </p>
      )}
      {mic.error && <p className="text-sm text-rust mt-3">{mic.error}</p>}
    </div>
  );
}

function StatusHint({ state }) {
  if (state === MIC_STATE.GRANTED) {
    return (
      <p className="text-sm text-muted2 mt-3 leading-relaxed">
        You&apos;re all set. Open a project and tap Dictate to begin.
      </p>
    );
  }
  if (state === MIC_STATE.PROMPT) {
    return (
      <p className="text-sm text-muted2 mt-3 leading-relaxed">
        Click the button below — your browser will prompt you to allow microphone access.
      </p>
    );
  }
  if (state === MIC_STATE.DENIED) {
    return (
      <p className="text-sm text-muted2 mt-3 leading-relaxed">
        Your browser is blocking the prompt. Open the site permissions (lock icon in the address bar) and
        set Microphone to Allow, then click Re-check below.
      </p>
    );
  }
  if (state === MIC_STATE.UNAVAILABLE) {
    return (
      <p className="text-sm text-muted2 mt-3 leading-relaxed">
        This browser doesn&apos;t expose the microphone API. Try the latest Chrome, Edge, or Safari.
      </p>
    );
  }
  return null;
}

function ActionButtons({ mic }) {
  if (mic.state === MIC_STATE.GRANTED) {
    return (
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-3 text-sm hover:bg-[#383632] transition-colors"
        data-testid="setup-done-button"
      >
        <CheckCircle2 className="w-4 h-4" /> Back to projects
      </Link>
    );
  }
  return (
    <>
      <button
        onClick={mic.request}
        disabled={mic.state === MIC_STATE.UNAVAILABLE}
        className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-3 text-sm hover:bg-[#383632] transition-colors disabled:opacity-50"
        data-testid="setup-grant-button"
      >
        <Mic className="w-4 h-4" /> Grant microphone access
      </button>
      <button
        onClick={mic.refresh}
        className="inline-flex items-center gap-2 border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-parchment transition-colors"
        data-testid="setup-recheck-button"
      >
        Re-check
      </button>
    </>
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
