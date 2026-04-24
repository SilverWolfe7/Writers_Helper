import { useCallback, useEffect, useState } from "react";

export const MIC_STATE = {
  UNKNOWN: "unknown",
  GRANTED: "granted",
  PROMPT: "prompt",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
};

const hasGetUserMedia = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

const hasPermissionsApi = () =>
  typeof navigator !== "undefined" && !!navigator.permissions?.query;

/**
 * Tracks microphone permission state via the Permissions API. Falls back to
 * `prompt` when the API is unavailable but getUserMedia is present.
 *
 * Also returns a `request` function that triggers the browser's native
 * permission prompt via getUserMedia (audio).
 */
export default function useMicPermission() {
  const [state, setState] = useState(MIC_STATE.UNKNOWN);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    if (!hasGetUserMedia()) {
      setState(MIC_STATE.UNAVAILABLE);
      return;
    }
    if (!hasPermissionsApi()) {
      setState(MIC_STATE.PROMPT);
      return;
    }
    try {
      const p = await navigator.permissions.query({ name: "microphone" });
      setState(p.state);
      p.onchange = () => setState(p.state);
    } catch (e) {
      console.warn("Permissions API failed; falling back to prompt state", e);
      setState(MIC_STATE.PROMPT);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const request = useCallback(async () => {
    setError("");
    if (!hasGetUserMedia()) {
      setState(MIC_STATE.UNAVAILABLE);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setState(MIC_STATE.GRANTED);
      return true;
    } catch (e) {
      if (e?.name === "NotAllowedError") {
        setState(MIC_STATE.DENIED);
        setError(
          "Your browser blocked the microphone. Click the lock icon in the address bar and allow microphone access."
        );
      } else {
        console.error("getUserMedia failed:", e);
        setError(e?.message || "Could not access the microphone.");
      }
      return false;
    }
  }, []);

  return { state, error, refresh, request };
}
