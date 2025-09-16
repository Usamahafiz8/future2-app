// api.js
import { Platform } from "react-native";

const API_BASE = "https://journeyofnation.com/api/api.php";
// const API_BASE = "http://localhost/api/api/api.php";

function toMySQLDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const hh   = pad(d.getHours());
  const mi   = pad(d.getMinutes());
  const ss   = pad(d.getSeconds());
  // e.g. "2025-09-11 21:39:27"
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export async function createEntry({
  full_name,
  email,
  message,
  is_public = false,  // default
  photoUri,           // file://... (optional)
  lang = "en",
  mode = "private",
  consent = false,
} = {}) {
  const form = new FormData();

  form.append("full_name", (full_name || "").trim());
  form.append("email", (email || "").trim());
  form.append("message", (message || "").trim());
  form.append("is_public", is_public ? "1" : "0");

  // Extras your PHP expects
  form.append("lang", lang);
  form.append("mode", mode);
  form.append("consent", consent ? "1" : "0");
  // ✅ MySQL-friendly datetime (fixes 22007)
  form.append("consented_at_client", toMySQLDateTime());

  // Attach photo if present
  if (photoUri) {
    const name = (photoUri.split("/").pop() || "photo").split("?")[0];
    const ext =
      name.includes(".") ? name.split(".").pop().toLowerCase() : "jpg";
    const mime =
      ext === "png"  ? "image/png"  :
      ext === "webp" ? "image/webp" :
      "image/jpeg";

    // Keep "file://" — modern RN uploads accept it on iOS/Android.
    form.append("photo", {
      uri: photoUri,
      name,
      type: mime,
    });
  }

  const res = await fetch(`${API_BASE}?action=entry.create`, {
    method: "POST",
    body: form, // don't set Content-Type; fetch sets boundary
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "Bad JSON" };
  }
  if (!res.ok) return { ok: false, error: data?.error || res.statusText };
  return data;
}
