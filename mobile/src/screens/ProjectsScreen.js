import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api, formatApiError } from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";
import { H1, H2, Overline, Muted, PrimaryButton, OutlineButton, Card } from "../ui";

export default function ProjectsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (e) {
      Alert.alert("Error", formatApiError(e.response?.data?.detail, "Failed to load projects"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const create = async () => {
    if (!title.trim()) return;
    try {
      await api.post("/projects", { title: title.trim(), genre, description });
      setTitle("");
      setGenre("");
      setDescription("");
      setShowNew(false);
      load();
    } catch (e) {
      Alert.alert("Error", formatApiError(e.response?.data?.detail, "Failed to create project"));
    }
  };

  const confirmLogout = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to access your notes.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Overline>Scribeverse</Overline>
          <Text style={styles.brand}>Your writing desk</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => navigation.navigate("Setup")} testID="open-setup-button">
            <Text style={styles.signOut}>Setup</Text>
          </Pressable>
          <Pressable onPress={confirmLogout} testID="logout-button">
            <Text style={[styles.signOut, { marginLeft: 16 }]}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <H1 style={{ marginBottom: 20 }}>Every idea deserves a page of its own.</H1>

        <PrimaryButton
          title={showNew ? "Close" : "+ New project"}
          onPress={() => setShowNew((v) => !v)}
          testID="new-project-button"
        />

        {showNew && (
          <Card style={{ marginTop: 20 }}>
            <Overline>Start a new project</Overline>
            <Text style={styles.label}>Title</Text>
            <TextInput
              testID="project-title-input"
              value={title}
              onChangeText={setTitle}
              placeholder="The Hollow Lantern"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Text style={styles.label}>Genre</Text>
            <TextInput
              testID="project-genre-input"
              value={genre}
              onChangeText={setGenre}
              placeholder="Gothic Mystery"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Text style={styles.label}>Logline</Text>
            <TextInput
              testID="project-description-input"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="A sentence or two…"
              placeholderTextColor={colors.muted}
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            />
            <PrimaryButton
              title="Create project"
              onPress={create}
              testID="project-create-submit"
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        <View style={{ height: 28 }} />

        {loading ? (
          <Muted>Loading projects…</Muted>
        ) : projects.length === 0 ? (
          <Card>
            <H2>No projects yet.</H2>
            <Muted style={{ marginTop: 8 }}>Create your first writing project above.</Muted>
          </Card>
        ) : (
          projects.map((p) => (
            <Pressable
              key={p.id}
              testID={`project-card-${p.id}`}
              onPress={() => navigation.navigate("Project", { projectId: p.id })}
              style={({ pressed }) => [
                styles.projectCard,
                pressed && { backgroundColor: colors.parchment },
              ]}
            >
              <Overline style={{ color: colors.rust, marginBottom: 6 }}>{p.genre || "Project"}</Overline>
              <H2>{p.title}</H2>
              {!!p.description && (
                <Muted style={{ marginTop: 8 }} numberOfLines={2}>
                  {p.description}
                </Muted>
              )}
              <View style={styles.projectRow}>
                <OutlineButton
                  title="Dictate"
                  onPress={() => navigation.navigate("Dictate", { projectId: p.id })}
                  testID={`project-dictate-${p.id}`}
                  style={{ paddingVertical: 8, paddingHorizontal: 14 }}
                />
                <Text style={styles.openArrow}>Open →</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  brand: { fontFamily: "serif", fontSize: 20, color: colors.ink, marginTop: 4 },
  signOut: { color: colors.ink, fontSize: 14 },
  scroll: { padding: 20, paddingBottom: 80 },
  label: { marginTop: 14, fontFamily: "Menlo", fontSize: 11, color: colors.muted, letterSpacing: 2 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.ink,
  },
  projectCard: {
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.parchment2,
    padding: 20,
    marginBottom: 14,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  openArrow: { color: colors.muted, fontSize: 14 },
});
