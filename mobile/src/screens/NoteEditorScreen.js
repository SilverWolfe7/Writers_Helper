import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, formatApiError } from "../api";
import { colors } from "../theme";
import { H1, Overline, Muted, PrimaryButton, OutlineButton, Tag } from "../ui";

export default function NoteEditorScreen({ route, navigation }) {
  const { projectId, note } = route.params || {};
  const isEdit = !!note;
  const [title, setTitle] = useState(note?.title || "Untitled note");
  const [content, setContent] = useState(note?.content || "");
  const [characterIds, setCharacterIds] = useState(note?.character_ids || []);
  const [chapterId, setChapterId] = useState(note?.chapter_id || "");
  const [actId, setActId] = useState(note?.act_id || "");
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, ch, a] = await Promise.all([
        api.get(`/projects/${projectId}/characters`),
        api.get(`/projects/${projectId}/chapters`),
        api.get(`/projects/${projectId}/acts`),
      ]);
      setCharacters(c.data);
      setChapters(ch.data);
      setActs(a.data);
    })();
  }, [projectId]);

  const toggleChar = (cid) =>
    setCharacterIds((p) => (p.includes(cid) ? p.filter((x) => x !== cid) : [...p, cid]));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || "Untitled note",
        content,
        character_ids: characterIds,
        chapter_id: chapterId || null,
        act_id: actId || null,
        source: note?.source || "manual",
      };
      if (isEdit) {
        await api.put(`/notes/${note.id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/notes`, payload);
      }
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
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>{isEdit ? "Edit note" : "New note"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Overline>Title</Overline>
        <TextInput
          testID="note-title-input"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Overline style={{ marginTop: 20 }}>Content</Overline>
        <TextInput
          testID="note-content-input"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={8}
          style={[styles.input, { minHeight: 180, textAlignVertical: "top", borderBottomWidth: 1, borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.parchment2 }]}
        />

        <Overline style={{ marginTop: 24 }}>Chapter</Overline>
        <View style={styles.tags}>
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
        <View style={styles.tags}>
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
        <View style={styles.tags}>
          {characters.length === 0 && <Muted>No characters yet.</Muted>}
          {characters.map((c) => (
            <Tag
              key={c.id}
              label={c.name}
              selected={characterIds.includes(c.id)}
              onPress={() => toggleChar(c.id)}
              testID={`note-char-${c.id}`}
            />
          ))}
        </View>

        <PrimaryButton
          title={saving ? "Saving…" : isEdit ? "Update note" : "Save note"}
          onPress={save}
          disabled={saving}
          testID="note-save-button"
          style={{ marginTop: 28 }}
        />
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
  topTitle: { fontSize: 14, color: colors.ink, fontWeight: "600" },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.ink,
    marginTop: 6,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
});
