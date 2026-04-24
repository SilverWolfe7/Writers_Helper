import { useCallback, useEffect, useRef, useState } from "react";

const getRecognitionCtor = () =>
  (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

/**
 * Browser SpeechRecognition wrapper.
 *
 * Returns a stateful transcript + interim string plus start/stop/clear helpers.
 * Emits onPermissionDenied() when the underlying onerror fires a permission
 * event so callers can refresh their permission UI.
 */
export default function useSpeechRecognition({ lang = "en-US", onPermissionDenied } = {}) {
  const [supported] = useState(() => !!getRecognitionCtor());
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const baseTranscriptRef = useRef("");
  const onPermissionDeniedRef = useRef(onPermissionDenied);

  useEffect(() => {
    onPermissionDeniedRef.current = onPermissionDenied;
  }, [onPermissionDenied]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return undefined;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

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
        } catch (err) {
          console.warn("SpeechRecognition restart failed:", err);
        }
        return;
      }
      setRecording(false);
      setInterim("");
    };

    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldRestartRef.current = false;
        setRecording(false);
        if (onPermissionDeniedRef.current) onPermissionDeniedRef.current();
      } else {
        console.warn("SpeechRecognition error:", event.error);
      }
    };

    recognitionRef.current = rec;

    return () => {
      shouldRestartRef.current = false;
      try {
        rec.stop();
      } catch (err) {
        console.warn("SpeechRecognition stop on unmount failed:", err);
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    baseTranscriptRef.current = transcript.trim();
    shouldRestartRef.current = true;
    try {
      rec.start();
      setRecording(true);
    } catch (err) {
      // SpeechRecognition throws "InvalidStateError" if already started.
      console.warn("SpeechRecognition start failed:", err);
    }
  }, [transcript]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    shouldRestartRef.current = false;
    try {
      rec.stop();
    } catch (err) {
      console.warn("SpeechRecognition stop failed:", err);
    }
  }, []);

  const setManualTranscript = useCallback((value) => {
    baseTranscriptRef.current = value;
    setTranscript(value);
  }, []);

  return { supported, transcript, interim, recording, start, stop, setManualTranscript };
}
