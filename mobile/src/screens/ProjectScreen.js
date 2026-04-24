import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, formatApiError } from "../api";
import { colors } from "../theme";
import { H1, H2, Overline, Muted, PrimaryButton, OutlineButton, Card, Tag } from "../ui";

const TABS = [
  { key: "notes", label: "Notes" },
  { key: "characters", label: "Characters" },
  { key: "chapters", label: "Chapters" },
  { key: "acts", label: "Acts" },
];

export default function ProjectScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [acts, setActs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState("notes");
  const [filters, setFilters] = useState({ character_id: "", chapter_id: "", act_id: "" });

  const loadAll = useCallback(async () => {
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
      Alert.alert("Error", formatApiError(e.response?.data?.detail, "Failed to load"));
      navigation.goBack();
    }
  }, [projectId, navigation]);

  const loadNotes = useCallback(async () => {
    try {
      const params = {};
      if (filters.character_id) params.character_id = filters.character_id;
      if (filters.chapter_id) params.chapter_id = filters.chapter_id;
      if (filters.act_id) params.act_id = filters.act_id;
      const { data } = await api.get(`/projects/${projectId}/notes`, { params });
      setNotes(data);
    } catch {
      /* ignore */
    }
  }, [projectId, filters]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      loadNotes();
    }, [loadAll, loadNotes])
  );

  const charMap = Object.fromEntries(characters.map((c) => [c.id, c.name]));
  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, `Ch.${c.number} ${c.title}`]));
  const actMap = Object.fromEntries(acts.map((a) => [a.id, `Act ${a.number} ${a.title}`]));

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} testID="back-to-dashboard">
          <Text style={styles.back}>← Projects</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Dictate", { projectId })}
          testID="header-dictate-button"
        >
          <Text style={styles.dictate}>● Dictate</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        <Overline>{project?.genre || "Project"}</Overline>
        <H1 testID="project-title" style={{ marginTop: 6, marginBottom: 8 }}>
          {project?.title || "…"}
        </H1>
        {!!project?.description && <Muted style={{ marginBottom: 20 }}>{project.description}</Muted>}

        <View style={styles.tabsRow} testID="project-tabs">
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} testID={`tab-${t.key}`}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "notes" && (
          <NotesTab
            notes={notes}
            characters={characters}
            chapters={chapters}
            acts={acts}
            charMap={charMap}
            chapterMap={chapterMap}
            actMap={actMap}
            filters={filters}
            setFilters={setFilters}
            reload={loadNotes}
            projectId={projectId}
            navigation={navigation}
          />
        )}
        {tab === "characters" && (
          <CharactersTab characters={characters} projectId={projectId} reload={loadAll} />
        )}
        {tab === "chapters" && (
          <ChaptersTab chapters={chapters} projectId={projectId} reload={loadAll} />
        )}
        {tab === "acts" && <ActsTab acts={acts} projectId={projectId} reload={loadAll} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotesTab({ notes, characters, chapters, acts, charMap, chapterMap, actMap, filters, setFilters, reload, projectId, navigation }) {
  const del = (id) => {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/notes/${id}`);
          reload();
        },
      },
    ]);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Overline>{notes.length} note{notes.length === 1 ? "" : "s"}</Overline>
        <PrimaryButton
          title="+ New note"
          onPress={() => navigation.navigate("NoteEditor", { projectId })}
          testID="new-note-button"
          style={{ paddingVertical: 10, paddingHorizontal: 16 }}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Overline>Filter by character</Overline>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          <Tag
            label="All"
            selected={!filters.character_id}
            onPress={() => setFilters({ ...filters, character_id: "" })}
          />
          {characters.map((c) => (
            <Tag
              key={c.id}
              label={c.name}
              selected={filters.character_id === c.id}
              onPress={() =>
                setFilters({
                  ...filters,
                  character_id: filters.character_id === c.id ? "" : c.id,
                })
              }
              testID={`filter-char-${c.id}`}
            />
          ))}
        </View>
      </View>

      {notes.length === 0 ? (
        <Card>
          <H2>No notes yet.</H2>
          <Muted style={{ marginTop: 8 }}>Start dictating or create a note manually.</Muted>
        </Card>
      ) : (
        notes.map((n) => (
          <Pressable
            key={n.id}
            testID={`note-card-${n.id}`}
            onPress={() => navigation.navigate("NoteEditor", { projectId, note: n })}
            style={({ pressed }) => [
              styles.noteCard,
              pressed && { backgroundColor: colors.parchment },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <H2 style={{ flex: 1 }}>{n.title}</H2>
              <Text style={{ fontFamily: "Menlo", fontSize: 10, letterSpacing: 1.5, color: colors.muted }}>
                {String(n.source).toUpperCase()}
              </Text>
            </View>
            <Text numberOfLines={3} style={{ marginTop: 8, color: colors.ink, fontSize: 14, lineHeight: 20 }}>
              {n.content}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
              {(n.character_ids || []).map((cid) =>
                charMap[cid] ? (
                  <Text key={cid} style={styles.chip}>
                    {String(charMap[cid]).toUpperCase()}
                  </Text>
                ) : null
              )}
              {n.chapter_id && chapterMap[n.chapter_id] && (
                <Text style={styles.chip}>{String(chapterMap[n.chapter_id]).toUpperCase()}</Text>
              )}
              {n.act_id && actMap[n.act_id] && (
                <Text style={styles.chip}>{String(actMap[n.act_id]).toUpperCase()}</Text>
              )}
            </View>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <Pressable onPress={() => del(n.id)} testID={`delete-note-${n.id}`}>
                <Text style={{ color: colors.rust, fontSize: 13 }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

function SimpleListTab({ items, projectId, reload, endpoint, label, numbered }) {
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(String(items.length + 1));
  const [summary, setSummary] = useState("");
  const [role, setRole] = useState("");

  const add = async () => {
    if (!title.trim()) return;
    try {
      const payload = numbered
        ? { title, number: parseInt(number, 10) || 1, summary }
        : { name: title, role, description: summary };
      await api.post(`/projects/${projectId}/${endpoint}`, payload);
      setTitle("");
      setSummary("");
      setRole("");
      if (numbered) setNumber(String((parseInt(number, 10) || 1) + 1));
      reload();
    } catch (e) {
      Alert.alert("Error", formatApiError(e.response?.data?.detail, "Failed to add"));
    }
  };

  const del = (item) => {
    Alert.alert(`Delete ${label}?`, "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const path = endpoint === "characters" ? "characters" : endpoint.slice(0, -1) + "s";
          const id = item.id;
          const route = endpoint === "characters" ? `/characters/${id}` : endpoint === "chapters" ? `/chapters/${id}` : `/acts/${id}`;
          await api.delete(route);
          reload();
        },
      },
    ]);
  };

  return (
    <View>
      <Card style={{ marginBottom: 20 }}>
        <Overline>Add {label}</Overline>
        {numbered && (
          <>
            <Text style={styles.fieldLabel}>Number</Text>
            <TextInput
              value={number}
              onChangeText={setNumber}
              keyboardType="number-pad"
              style={styles.fieldInput}
            />
          </>
        )}
        <Text style={styles.fieldLabel}>{numbered ? "Title" : "Name"}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.fieldInput}
          testID={`${label}-title-input`}
        />
        {!numbered && (
          <>
            <Text style={styles.fieldLabel}>Role</Text>
            <TextInput value={role} onChangeText={setRole} style={styles.fieldInput} />
          </>
        )}
        <Text style={styles.fieldLabel}>{numbered ? "Summary" : "Description"}</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          multiline
          numberOfLines={3}
          style={[styles.fieldInput, { height: 70, textAlignVertical: "top" }]}
        />
        <PrimaryButton title={`Add ${label}`} onPress={add} style={{ marginTop: 14 }} testID={`${label}-add`} />
      </Card>

      {items.length === 0 ? (
        <Muted style={{ fontStyle: "italic" }}>No {label}s yet.</Muted>
      ) : (
        items.map((it) => (
          <View key={it.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              {numbered && (
                <Overline>
                  {label === "chapter" ? "Chapter" : "Act"} {it.number}
                </Overline>
              )}
              <H2 style={{ marginTop: 2 }}>{it.title || it.name}</H2>
              {!!(it.role || it.summary || it.description) && (
                <Muted style={{ marginTop: 6 }}>{it.summary || it.description || it.role}</Muted>
              )}
            </View>
            <Pressable onPress={() => del(it)}>
              <Text style={{ color: colors.rust, fontSize: 13 }}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const CharactersTab = ({ characters, projectId, reload }) => (
  <SimpleListTab items={characters} projectId={projectId} reload={reload} endpoint="characters" label="character" numbered={false} />
);
const ChaptersTab = ({ chapters, projectId, reload }) => (
  <SimpleListTab items={chapters} projectId={projectId} reload={reload} endpoint="chapters" label="chapter" numbered />
);
const ActsTab = ({ acts, projectId, reload }) => (
  <SimpleListTab items={acts} projectId={projectId} reload={reload} endpoint="acts" label="act" numbered />
);

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
  dictate: { color: colors.rust, fontSize: 14, letterSpacing: 0.5 },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    marginBottom: 18,
  },
  tabText: {
    paddingVertical: 10,
    paddingRight: 18,
    color: colors.muted,
    fontSize: 14,
  },
  tabTextActive: { color: colors.ink, fontWeight: "600" },
  noteCard: {
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.parchment2,
    padding: 16,
    marginBottom: 12,
  },
  chip: {
    fontFamily: "Menlo",
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 6,
  },
  fieldLabel: { marginTop: 12, fontFamily: "Menlo", fontSize: 11, color: colors.muted, letterSpacing: 2 },
  fieldInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.ink,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 14,
  },
});
