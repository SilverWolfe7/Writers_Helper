import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, MicOff } from "lucide-react";

export default function MicStatusIndicator() {
  const [state, setState] = useState("unknown"); // granted | prompt | denied | unavailable | unknown

  useEffect(() => {
    let perm = null;
    let cancelled = false;
    const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!navigator.permissions?.query || !navigator.mediaDevices?.getUserMedia || !hasSR) {
      setState("unavailable");
      return;
    }
    (async () => {
      try {
        perm = await navigator.permissions.query({ name: "microphone" });
        if (cancelled) return;
        setState(perm.state);
        perm.onchange = () => setState(perm.state);
      } catch {
        setState("unknown");
      }
    })();
    return () => {
      cancelled = true;
      if (perm) perm.onchange = null;
    };
  }, []);

  const { color, title, Icon } = {
    granted: { color: "bg-moss", title: "Microphone ready", Icon: Mic },
    prompt: { color: "bg-sand", title: "Mic not yet granted — open Setup", Icon: Mic },
    denied: { color: "bg-rust", title: "Mic blocked — open Setup", Icon: MicOff },
    unavailable: { color: "bg-muted2", title: "Voice dictation unsupported", Icon: MicOff },
    unknown: { color: "bg-muted2", title: "Mic status unknown", Icon: Mic },
  }[state];

  return (
    <Link
      to="/setup"
      title={title}
      aria-label={title}
      data-testid="mic-status-indicator"
      data-mic-state={state}
      className="inline-flex items-center gap-1.5 text-ink hover:text-rust transition-colors"
    >
      <span className="relative inline-flex items-center justify-center">
        <Icon className="w-4 h-4" />
        <span
          className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-parchment ${color} ${
            state === "prompt" ? "animate-pulse-soft" : ""
          }`}
        />
      </span>
    </Link>
  );
}
