import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { colors } from "./theme";

export function Overline({ children, style }) {
  return <Text style={[styles.overline, style]}>{String(children).toUpperCase()}</Text>;
}

export function H1({ children, style }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Body({ children, style }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function PrimaryButton({ title, onPress, disabled, testID, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        disabled && { opacity: 0.5 },
        pressed && { backgroundColor: colors.ink2 },
        style,
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

export function OutlineButton({ title, onPress, disabled, testID, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.outline,
        disabled && { opacity: 0.5 },
        pressed && { backgroundColor: colors.parchment2 },
        style,
      ]}
    >
      <Text style={styles.outlineText}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Tag({ label, selected, onPress, testID }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.tag, selected && styles.tagSelected]}
    >
      <Text style={[styles.tagText, selected && { color: colors.parchment }]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  overline: {
    fontFamily: "Menlo",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
  },
  h1: {
    fontFamily: "serif",
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "serif",
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: colors.parchment,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.parchment,
  },
  outlineText: {
    color: colors.ink,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.parchment2,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 20,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.parchment,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tagText: {
    fontSize: 13,
    color: colors.ink,
  },
});
