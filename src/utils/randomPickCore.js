// Shared, side-effect-free rules. No writes to worldcups or authentication storage.
export const MODES = ['wheel','lotto','pinball','ladder','boxes','cards','order','dice','teams'];
export const MAX_CANDIDATES = 200;
export function randomInt(n, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(n) || n < 1 || n > 0x100000000) throw new Error('Invalid range');
  if (!cryptoSource?.getRandomValues) throw new Error('Secure randomness unavailable');
  const limit = Math.floor(0x100000000 / n) * n;
  const data = new Uint32Array(1);
  do { cryptoSource.getRandomValues(data); } while (data[0] >= limit);
  return data[0] % n;
}
export function shuffle(items, next = randomInt) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = next(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function safeImage(value) {
  try {
    const url = new URL(String(value || ''));
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    const host = url.hostname.replace(/^(www\.|m\.)/, '');
    if (['youtube.com','youtu.be','youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/')[2];
      return /^[\w-]{11}$/.test(id || '') ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
    }
    return /\.(mp4|webm|mov|mp3|ogg|m3u8)$/i.test(url.pathname) ? '' : url.href;
  } catch { return ''; }
}
export function normalizeCandidates(values, prefix = 'candidate') {
  let rows = values;
  if (typeof rows === 'string') { try { rows = JSON.parse(rows); } catch { rows = []; } }
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, MAX_CANDIDATES).map((row, i) => ({
    id: `${prefix}:${i}`, name: String(row?.name || row?.title || '').trim().slice(0,120),
    image: safeImage(row?.image), enabled: row?.enabled !== false,
  })).filter(row => row.name);
}
export function activeCandidates(rows) { return rows.filter(row => row.enabled && row.name.trim()); }
export function createDraw(mode, rows, groupCount = 2, next = randomInt) {
  if (!MODES.includes(mode)) throw new Error('Unknown mode');
  const active = activeCandidates(rows);
  if (active.length < 2 || active.length > MAX_CANDIDATES) throw new Error('Invalid candidates');
  if (mode === 'pinball') return {mode, pool:active.map(row=>({...row})), winner:null, seed:next(0x100000000), token:Date.now()};
  const ordered = shuffle(active, next);
  const result = { mode, pool: active.map(row => ({...row})), ordered, winner: ordered[0], token: Date.now() };
  if (mode === 'teams') {
    const count = Math.max(2, Math.min(active.length, Math.trunc(Number(groupCount)) || 2, 20));
    result.groups = Array.from({length:count}, () => []);
    ordered.forEach((row,i) => result.groups[i % count].push(row));
  }
  if (mode === 'ladder') {
    // Adjacent swaps produce a one-to-one ladder, with no crossing rungs on the same row.
    const positions = active.map((_,i) => i);
    result.rungs = Array.from({length:Math.min(60, Math.max(14,active.length * 3))}, (_,i) => {
      const left = next(active.length - 1);
      [positions[left], positions[left + 1]] = [positions[left + 1], positions[left]];
      return {left, y: i};
    });
    result.destinations = active.map((_,i) => positions.indexOf(i));
  }
  return result;
}
