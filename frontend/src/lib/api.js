import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
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

export function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadFile(path, filename) {
  const res = await api.get(path, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(res.data);
  triggerDownload(blobUrl, filename);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 4000);
}
