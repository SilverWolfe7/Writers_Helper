import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";
import { H1, Overline, PrimaryButton, Muted } from "../ui";

export default function RegisterScreen({ navigation }) {
  const { register, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) return;
    setSubmitting(true);
    await register(name.trim(), email.trim(), password);
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Overline>New here</Overline>
          <H1 style={{ marginTop: 8, marginBottom: 32 }}>Begin a new manuscript.</H1>

          <Overline>Name</Overline>
          <TextInput
            testID="register-name-input"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Overline style={{ marginTop: 20 }}>Email</Overline>
          <TextInput
            testID="register-email-input"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          <Overline style={{ marginTop: 20 }}>Password</Overline>
          <TextInput
            testID="register-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Muted style={{ marginTop: 6, fontSize: 12 }}>Minimum 6 characters.</Muted>

          {!!error && (
            <Text testID="register-error" style={styles.error}>
              {error}
            </Text>
          )}

          <PrimaryButton
            title={submitting ? "Creating account…" : "Create account"}
            onPress={onSubmit}
            disabled={submitting}
            testID="register-submit-button"
            style={{ marginTop: 32 }}
          />

          <Muted style={{ marginTop: 20 }}>
            Already have an account?{" "}
            <Text
              testID="goto-login-link"
              onPress={() => navigation.navigate("Login")}
              style={styles.link}
            >
              Sign in →
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
