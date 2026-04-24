import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";
import { H1, Overline, PrimaryButton, Muted } from "../ui";

export default function LoginScreen({ navigation }) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    await login(email.trim(), password);
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Overline>Writer&apos;s Helper</Overline>
          <H1 style={{ marginTop: 8, marginBottom: 32 }}>The page is waiting.</H1>

          <Overline>Email</Overline>
          <TextInput
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          <Overline style={{ marginTop: 24 }}>Password</Overline>
          <TextInput
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          {!!error && (
            <Text testID="login-error" style={styles.error}>
              {error}
            </Text>
          )}

          <PrimaryButton
            title={submitting ? "Signing in…" : "Sign in"}
            onPress={onSubmit}
            disabled={submitting}
            testID="login-submit-button"
            style={{ marginTop: 32 }}
          />

          <Muted style={{ marginTop: 20 }}>
            New here?{" "}
            <Text
              testID="goto-register-link"
              onPress={() => navigation.navigate("Register")}
              style={styles.link}
            >
              Create an account →
            </Text>
          </Muted>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  scroll: { padding: 24, paddingTop: 48 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: 10,
    fontSize: 17,
    color: colors.ink,
  },
  error: {
    marginTop: 20,
    color: colors.rust,
    borderWidth: 1,
    borderColor: colors.rust,
    padding: 12,
    fontSize: 14,
  },
  link: { color: colors.ink, textDecorationLine: "underline" },
});
