export function createId() {
  return crypto.randomUUID();
}

export function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function isValidUrl(value) {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatMs(ms) {
  return `${ms.toFixed(2)} ms`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
