// Disposable statistics only. Never delete auth, drafts, or user settings.
const TTL = 5 * 60 * 1000;
const MAX_BYTES = 1024 * 1024;
const MAX_ENTRIES = 8;
function isStatsKey(key) {
  return key.startsWith("onepick_winner_stats_v1:") ||
    /^stats:[0-9a-f-]{36}:/i.test(key);
}
export function clearLegacyStatsCache() {
  try {
    Object.keys(localStorage).filter(isStatsKey)
      .forEach(key => localStorage.removeItem(key));
  } catch {}
}
export function readStatsCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || !Number.isFinite(value.savedAt) || Date.now() - value.savedAt > TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return value.data || null;
  } catch { return null; }
}
export function writeStatsCache(key, data) {
  if (!isStatsKey(key)) return;
  try {
    sessionStorage.removeItem(key);
    const payload = JSON.stringify({ savedAt: Date.now(), data });
    const size = (key.length + payload.length) * 2;
    if (size > MAX_BYTES) return;
    const entries = [];
    for (const candidate of Object.keys(sessionStorage).filter(isStatsKey)) {
      const raw = sessionStorage.getItem(candidate) || "";
      let savedAt = 0;
      try { savedAt = JSON.parse(raw).savedAt; } catch {}
      if (!Number.isFinite(savedAt) || Date.now() - savedAt > TTL) {
        sessionStorage.removeItem(candidate);
      } else {
        entries.push({ key: candidate, savedAt, bytes: (candidate.length + raw.length) * 2 });
      }
    }
    entries.sort((a, b) => a.savedAt - b.savedAt);
    let bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
    while (entries.length >= MAX_ENTRIES || bytes + size > MAX_BYTES) {
      const oldest = entries.shift();
      if (!oldest) break;
      sessionStorage.removeItem(oldest.key);
      bytes -= oldest.bytes;
    }
    sessionStorage.setItem(key, payload);
  } catch {} // Cache failure must not interrupt statistics rendering.
}
