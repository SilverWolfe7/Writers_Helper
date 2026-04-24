import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl ||
  Constants.manifest?.extra?.backendUrl ||
  "";

export const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = "scribeverse.token";

export async function saveToken(token) {
  if (!token) return;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use(async (config) => {
  const token = await loadToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(detail, fallback = "Something went wrong.") {
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return (
      detail
        .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
        .filter(Boolean)
        .join(" ") || fallback
    );
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
