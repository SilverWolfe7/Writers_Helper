import { Link } from "react-router-dom";
import { Mic, MicOff } from "lucide-react";
import useMicPermission, { MIC_STATE } from "../hooks/useMicPermission";

const INDICATORS = {
  [MIC_STATE.GRANTED]: { color: "bg-moss", title: "Microphone ready", Icon: Mic, pulse: false },
  [MIC_STATE.PROMPT]: { color: "bg-sand", title: "Mic not yet granted — open Setup", Icon: Mic, pulse: true },
  [MIC_STATE.DENIED]: { color: "bg-rust", title: "Mic blocked — open Setup", Icon: MicOff, pulse: false },
  [MIC_STATE.UNAVAILABLE]: { color: "bg-muted2", title: "Voice dictation unsupported", Icon: MicOff, pulse: false },
  [MIC_STATE.UNKNOWN]: { color: "bg-muted2", title: "Mic status unknown", Icon: Mic, pulse: false },
};

// Web Speech API is required on top of mic permission — without it we should
// show the "unavailable" indicator even if getUserMedia exists.
function effectiveState(state) {
  const hasSR =
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!hasSR) return MIC_STATE.UNAVAILABLE;
  return state;
}

export default function MicStatusIndicator() {
  const { state } = useMicPermission();
  const resolved = effectiveState(state);
  const indicator = INDICATORS[resolved] || INDICATORS[MIC_STATE.UNKNOWN];
  const { Icon, color, title, pulse } = indicator;

  return (
    <Link
      to="/setup"
      title={title}
      aria-label={title}
      data-testid="mic-status-indicator"
      data-mic-state={resolved}
      className="inline-flex items-center gap-1.5 text-ink hover:text-rust transition-colors"
    >
      <span className="relative inline-flex items-center justify-center">
        <Icon className="w-4 h-4" />
        <span
          className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-parchment ${color} ${
            pulse ? "animate-pulse-soft" : ""
          }`}
        />
      </span>
    </Link>
  );
}
