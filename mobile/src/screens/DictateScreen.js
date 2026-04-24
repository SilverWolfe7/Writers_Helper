import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, formatApiError } from "../api";
import { colors } from "../theme";
import { H1, H2, Overline, Muted, PrimaryButton, OutlineButton, Tag } from "../ui";

// Speech recognition is optional — only available in a native dev build. In
// Expo Go or web, the native module throws when used, so we guard by platform.
let SpeechRecognition = null;
let addSpeechListener = null;
if (Platform.OS !== "web") {
  try {
    const mod = require("expo-speech-recognition");
    SpeechRecognition = mod.ExpoSpeechRecognitionModule;
    addSpeechListener = mod.addSpeechRecognitionListener;
  } catch {
    /* dev build not required for manual mode */
  }
}

export default function DictateScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);

  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [title, setTitle] = useState(`Dictation — ${new Date().toLocaleString()}`);
  const [characterIds, setCharacterIds] = useState([]);
  const [chapterId, setChapterId] = useState("");
  const [actId, setActId] = useState("");
  const [saving, setSaving] = useState(false);

  const baseRef = useRef("");
  const supported = !!SpeechRecognition;
  const [micGranted, setMicGranted] = useState(false);

  const refreshMicState = useCallback(async () => {
    if (!SpeechRecognition) {
      setMicGranted(false);
      return;
    }
    try {
      const perm = await SpeechRecognition.getPermissionsAsync();
      setMicGranted(!!perm?.granted);
    } catch {
      setMicGranted(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshMicState();
    }, [refreshMicState])
  );

  useEffect(() => {
    (async () => {
      try {
        const [p, c, ch, a] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/characters`),
          api.get(`/projects/${projectId}/chapters`),
          api.get(`/projects/${projectId}/acts`),
        ]);
        setProject(p.data);
        setCharacters(c.data);
        setChapters(ch.data);
        setActs(a.data);
      } catch (e) {
        Alert.alert("Error", formatApiError(e.response?.data?.detail, "Failed to load project"));
        navigation.goBack();
      }
    })();
  }, [projectId, navigation]);

  // Wire up speech recognition events only if the module is present.
  useEffect(() => {
    if (!addSpeechListener) return undefined;
    const subs = [];
    subs.push(
      addSpeechListener("result", (event) => {
        const parts = event.results || [];
        if (parts.length === 0) return;
        const text = parts.map((r) => r.transcript).join(" ");
        if (event.isFinal) {
          baseRef.current = (baseRef.current + " " + text).trim();
          setTranscript(baseRef.current);
          setInterim("");
        } else {
          setInterim(text);
        }
      })
    );
    subs.push(
      addSpeechListener("end", () => {
        setRecording(false);
        setInterim("");
      })
    );
    subs.push(
      addSpeechListener("error", (event) => {
        setRecording(false);
        setInterim("");
        if (event?.error) {
          Alert.alert("Dictation error", String(event.error));
        }
      })
    );
    return () => {
      subs.forEach((s) => {
        try {
          s?.remove?.();
        } catch {
          /* ignore */
        }
      });
    };
  }, []);

  const toggleRecord = async () => {
    if (!SpeechRecognition) {
      Alert.alert(
        "Voice dictation unavailable",
        "Voice dictation needs a Writer's Helper dev build (native module). You can type your note in the transcript field below."
      );
      return;
    }
    if (recording) {
      try {
        SpeechRecognition.stop();
      } catch {
        /* ignore */
      }
      setRecording(false);
      return;
    }
    try {
      const perm = await SpeechRecognition.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone access needed",
          "Open Setup to grant microphone and speech recognition access.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open Setup", onPress: () => navigation.navigate("Setup") },
          ]
        );
        return;
      }
      baseRef.current = transcript.trim();
      SpeechRecognition.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
      setRecording(true);
    } catch (e) {
      Alert.alert("Could not start dictation", String(e?.message || e));
    }
  };

  const toggleChar = (cid) => {
    setCharacterIds((p) => (p.includes(cid) ? p.filter((x) => x !== cid) : [...p, cid]));
  };

  const save = async () => {
    const content = (transcript + (interim ? " " + interim : "")).trim();
    if (!content) {
      Alert.alert("Nothing to save", "Dictate or type something first.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/notes`, {
        title: title.trim() || "Untitled dictation",
        content,
        character_ids: characterIds,
        chapter_id: chapterId || null,
        act_id: actId || null,
        source: supported ? "dictation" : "manual",
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Save failed", formatApiError(e.response?.data?.detail, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} testID="back-from-dictate">
          <Text style={styles.back}>← Project</Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {recording && <View style={styles.dot} />}
          <Text style={{ color: recording ? colors.rust : colors.muted, marginLeft: 8, fontSize: 13 }}>
            {recording ? "Recording" : "Idle"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Overline>Dictation canvas</Overline>
        <H1 style={{ marginTop: 6, marginBottom: 16 }}>{project?.title || "…"}</H1>

        {!supported && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              Voice dictation is only available in a Writer&apos;s Helper dev build. In Expo Go, type your note in the
              transcript field below — it still saves to your project with full tagging.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => navigation.navigate("Setup")}
          testID="mic-trust-badge"
          style={({ pressed }) => [
            styles.badge,
            !supported && styles.badgeMuted,
            supported && !micGranted && styles.badgeWarn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              supported && micGranted && { backgroundColor: colors.moss },
              supported && !micGranted && { backgroundColor: colors.sand },
              !supported && { backgroundColor: colors.muted },
            ]}
          />
          <Text style={styles.badgeLabel}>
            {!supported
              ? "Typing only · dictation unavailable in Expo Go"
              : micGranted
              ? "Mic: on-device · private"
              : "Mic not yet granted — tap to set up"}
          </Text>
          <Text style={styles.badgeArrow}>›</Text>
        </Pressable>

        <View style={styles.canvas}>
          <Overline>Live transcript</Overline>
          <Text style={styles.bigTranscript}>
            {transcript || <Text style={{ color: colors.muted }}>Your words will appear here…</Text>}
            {!!interim && <Text style={{ color: colors.muted }}> {interim}</Text>}
          </Text>
          <TextInput
            testID="transcript-manual-input"
            value={transcript}
            onChangeText={(v) => {
              setTranscript(v);
              baseRef.current = v;
            }}
            multiline
            placeholder="Or type manually…"
            placeholderTextColor={colors.muted}
            style={styles.manualInput}
          />
        </View>

        <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
          <PrimaryButton
            title={recording ? "■ Stop" : "● Start dictation"}
            onPress={toggleRecord}
            testID="record-toggle-button"
            style={{ flex: 1 }}
          />
          <OutlineButton
            title={saving ? "Saving…" : "Save"}
            onPress={save}
            disabled={saving}
            testID="save-dictation-button"
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ marginTop: 28 }}>
          <Overline>Note title</Overline>
          <TextInput
            testID="dictation-title-input"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Overline style={{ marginTop: 20 }}>Chapter</Overline>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            <Tag label="None" selected={!chapterId} onPress={() => setChapterId("")} />
            {chapters.map((c) => (
              <Tag
                key={c.id}
                label={`Ch.${c.number} ${c.title}`}
                selected={chapterId === c.id}
                onPress={() => setChapterId(chapterId === c.id ? "" : c.id)}
              />
            ))}
          </View>

          <Overline style={{ marginTop: 20 }}>Act</Overline>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            <Tag label="None" selected={!actId} onPress={() => setActId("")} />
            {acts.map((a) => (
              <Tag
                key={a.id}
                label={`Act ${a.number} ${a.title}`}
                selected={actId === a.id}
                onPress={() => setActId(actId === a.id ? "" : a.id)}
              />
            ))}
          </View>

          <Overline style={{ marginTop: 20 }}>Characters</Overline>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            {characters.length === 0 && <Muted>No characters yet.</Muted>}
            {characters.map((c) => (
              <Tag
                key={c.id}
                label={c.name}
                selected={characterIds.includes(c.id)}
                onPress={() => toggleChar(c.id)}
                testID={`dictation-char-${c.id}`}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  back: { color: colors.muted, fontSize: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rust },
  canvas: {
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.parchment2,
    padding: 18,
  },
  bigTranscript: {
    fontFamily: "serif",
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
    marginTop: 14,
    minHeight: 180,
  },
  manualInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: colors.parchment,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 8,
    fontSize: 16,
    marginTop: 6,
    color: colors.ink,
  },
  warn: {
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: "#FBF2E4",
    padding: 12,
    marginBottom: 16,
  },
  warnText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.moss,
    backgroundColor: "#EEF2EE",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  badgeWarn: {
    borderColor: colors.sand,
    backgroundColor: "#FBF2E4",
  },
  badgeMuted: {
    borderColor: colors.rule,
    backgroundColor: colors.parchment2,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.moss,
    marginRight: 10,
  },
  badgeLabel: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Menlo",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  badgeArrow: { color: colors.muted, fontSize: 18, marginLeft: 6 },
});
