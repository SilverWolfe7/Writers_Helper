import "react-native-gesture-handler";
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { colors } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import ProjectScreen from "./src/screens/ProjectScreen";
import DictateScreen from "./src/screens/DictateScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.parchment,
    card: colors.parchment,
    text: colors.ink,
    border: colors.rule,
    primary: colors.ink,
  },
};

function RootNav() {
  const { user } = useAuth();

  if (user === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.parchment } }}>
        {user ? (
          <>
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Dictate" component={DictateScreen} />
            <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
});
