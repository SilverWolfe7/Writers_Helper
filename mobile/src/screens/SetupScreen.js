import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { H1, H2, Overline, Muted, PrimaryButton, OutlineButton, Card } from "../ui";

// Optional native module — absent in Expo Go / web.
let SpeechRecognition = null;
if (Platform.OS !== "web") {
  try {
    const mod = require("expo-speech-recognition");
    SpeechRecognition = mod.ExpoSpeechRecognitionModule;
  } catch {
    /* Expo Go or web: fall back to manual mode */
  }
}

const STATE = {
  UNKNOWN: "unknown",
  GRANTED: "granted",
  DENIED: "denied",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable",
};

function pickState(perm) {
  if (!perm) return STATE.UNKNOWN;
  if (perm.granted) return STATE.GRANTED;
  if (perm.canAskAgain === false) return STATE.BLOCKED;
  return STATE.DENIED;
}

export default function SetupScreen({ navigation }) {
  const [status, setStatus] = useState(SpeechRecognition ? STATE.UNKNOWN : STATE.UNAVAILABLE);
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(async () => {
    if (!SpeechRecognition) {
      setStatus(STATE.UNAVAILABLE);
      return;
    }
    setChecking(true);
    try {
      const perm = await SpeechRecognition.getPermissionsAsync();
      setStatus(pickState(perm));
    } catch {
      setStatus(STATE.UNKNOWN);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = async () => {
    if (!SpeechRecognition) return;
    setRequesting(true);
    try {
      const perm = await SpeechRecognition.requestPermissionsAsync();
      setStatus(pickState(perm));
    } catch (e) {
      Alert.alert("Permission error", String(e?.message || e));
    } finally {
      setRequesting(false);
    }
  };

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open Settings", "Please open Settings → Writer's Helper manually.");
    });
  };

  const banner = {
    [STATE.UNKNOWN]: { label: "Checking…", tone: "neutral" },
    [STATE.GRANTED]: { label: "Microphone access granted", tone: "ok" },
    [STATE.DENIED]: { label: "Access not yet granted", tone: "warn" },
    [STATE.BLOCKED]: { label: "Access blocked in iOS Settings", tone: "warn" },
    [STATE.UNAVAILABLE]: { label: "Not available in Expo Go", tone: "warn" },
  }[status];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} testID="setup-back">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
        <Overline>Step 01 · Permissions</Overline>
        <H1 style={{ marginTop: 8, marginBottom: 14 }}>
          Grant Writer&apos;s Helper access to your microphone.
        </H1>
        <Muted style={{ marginBottom: 28, lineHeight: 22 }}>
          Writer&apos;s Helper uses your iPhone&apos;s microphone and on-device speech recognition to transcribe your dictation
          into written notes. Audio never leaves your device — only the final transcript is saved to your writing
          projects.
        </Muted>

        <Card
          style={[
            styles.statusCard,
            banner.tone === "ok" && { borderColor: colors.moss },
            banner.tone === "warn" && { borderColor: colors.sand },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.dot,
                banner.tone === "ok" && { backgroundColor: colors.moss },
                banner.tone === "warn" && { backgroundColor: colors.sand },
                banner.tone === "neutral" && { backgroundColor: colors.muted },
              ]}
            />
            <Text testID="setup-status-label" style={styles.statusLabel}>
              {banner.label}
            </Text>
          </View>

          {status === STATE.GRANTED && (
            <Muted style={{ marginTop: 10 }}>
              You're all set. Open any project and tap Dictate to start transcribing.
            </Muted>
          )}
          {status === STATE.DENIED && (
            <Muted style={{ marginTop: 10 }}>
              Tap the button below — iOS will ask you to allow Microphone and Speech Recognition.
            </Muted>
          )}
          {status === STATE.BLOCKED && (
            <Muted style={{ marginTop: 10 }}>
              iOS is blocking the prompt. Open Settings → Writer&apos;s Helper and turn on Microphone + Speech Recognition.
            </Muted>
          )}
          {status === STATE.UNAVAILABLE && (
            <Muted style={{ marginTop: 10 }}>
              Voice dictation needs a Writer&apos;s Helper dev build. In Expo Go you can still type notes manually — that
              works everywhere.
            </Muted>
          )}
        </Card>

        <View style={{ marginTop: 24, gap: 12 }}>
          {status === STATE.GRANTED ? (
            <PrimaryButton
              title="Back to projects"
              onPress={() => navigation.goBack()}
              testID="setup-done-button"
            />
          ) : status === STATE.BLOCKED ? (
            <>
              <PrimaryButton
                title="Open iOS Settings"
                onPress={openSettings}
                testID="setup-open-settings-button"
              />
              <OutlineButton title="Re-check" onPress={refresh} disabled={checking} />
            </>
          ) : status === STATE.UNAVAILABLE ? (
            <OutlineButton
              title="Continue without dictation"
              onPress={() => navigation.goBack()}
              testID="setup-continue-manual"
            />
          ) : (
            <>
              <PrimaryButton
                title={requesting ? "Requesting…" : "Grant microphone access"}
                onPress={request}
                disabled={requesting || !SpeechRecognition}
                testID="setup-grant-button"
              />
              <OutlineButton title="Re-check status" onPress={refresh} disabled={checking} />
            </>
          )}
        </View>

        <View style={{ height: 36 }} />
        <Overline>What you're allowing</Overline>
        <View style={{ marginTop: 12, gap: 14 }}>
          <BulletRow
            title="Microphone"
            body="Captures your voice while you tap Start dictation. Stops the instant you tap Stop."
          />
          <BulletRow
            title="Speech Recognition"
            body={
              Platform.OS === "ios"
                ? "Apple's on-device Speech framework converts your audio to text locally on your iPhone."
                : "Your device's speech recognizer converts audio to text."
            }
          />
          <BulletRow
            title="What's NOT collected"
            body="No raw audio is uploaded. Only the transcript you choose to save is sent to your Writer's Helper account."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BulletRow({ title, body }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={styles.bullet} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bulletTitle}>{title}</Text>
        <Muted style={{ marginTop: 2 }}>{body}</Muted>
      </View>
    </View>
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
  topTitle: { fontSize: 14, color: colors.ink, fontWeight: "600" },
  statusCard: { padding: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.muted, marginRight: 10 },
  statusLabel: { color: colors.ink, fontSize: 15, letterSpacing: 0.2 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 0,
    backgroundColor: colors.ink,
    marginTop: 8,
    marginRight: 12,
  },
  bulletTitle: { color: colors.ink, fontWeight: "600", fontSize: 14 },
});
