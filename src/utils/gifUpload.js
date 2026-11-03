// GIFs are processed locally. No Supabase render/transform endpoint is used.
export const GIF_MAX_INPUT_BYTES = 20 * 1024 * 1024;
export const GIF_MAX_BYTES = 8 * 1024 * 1024;
export const GIF_SIZE_HELP = "GIF: max 20MB input, max 8MB after compression.";

export function isGifFile(file) {
  return Boolean(file) && (String(file.type || "").toLowerCase() === "image/gif" || /\.gif$/i.test(file.name || ""));
}

// Read block boundaries before invoking WASM; reject broken/truncated files.
export function inspectGif(bytes) {
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  const invalid = () => { throw new Error("Invalid GIF image. Renaming a file to .gif does not convert it."); };
  if (bytes.length < 14 || !["GIF87a", "GIF89a"].includes(signature) || !width || !height) invalid();
  let pos = 13 + (bytes[10] & 128 ? 3 * (2 ** ((bytes[10] & 7) + 1)) : 0);
  let frames = 0, pixels = 0;
  const skipBlocks = () => {
    while (pos < bytes.length) {
      const size = bytes[pos++];
      if (!size) return;
      pos += size;
      if (pos > bytes.length) invalid();
    }
    invalid();
  };
  while (pos < bytes.length) {
    const block = bytes[pos++];
    if (block === 0x3b) {
      if (!frames) invalid();
      return { width, height, frames, pixels };
    }
    if (block === 0x21) {
      if (pos >= bytes.length) invalid();
      pos++; skipBlocks();
    } else if (block === 0x2c) {
      if (pos + 9 > bytes.length) invalid();
      const left = bytes[pos] | (bytes[pos + 1] << 8);
      const top = bytes[pos + 2] | (bytes[pos + 3] << 8);
      const w = bytes[pos + 4] | (bytes[pos + 5] << 8);
      const h = bytes[pos + 6] | (bytes[pos + 7] << 8);
      if (!w || !h || left + w > width || top + h > height) invalid();
      const flags = bytes[pos + 8];
      pos += 9 + (flags & 128 ? 3 * (2 ** ((flags & 7) + 1)) : 0);
      if (pos >= bytes.length || bytes[pos] < 2 || bytes[pos] > 8) invalid();
      pos++; skipBlocks(); frames++; pixels += w * h;
    } else invalid();
  }
  invalid();
}

let compressionQueue = Promise.resolve();
const prepared = new WeakMap();

function showStatus() {
  if (typeof document === "undefined") return { update() {}, remove() {} };
  const box = document.createElement("div");
  box.setAttribute("role", "status");
  box.setAttribute("aria-live", "polite");
  Object.assign(box.style, { position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: "2147483647", maxWidth: "90vw", padding: "12px 18px", background: "#111827", color: "white", borderRadius: "10px", boxShadow: "0 2px 16px #0004", fontSize: "14px" });
  document.body.appendChild(box);
  return { update(step, total) { box.textContent = String(document.documentElement.lang).startsWith("ko") ? `움짤 압축 중… ${step}/${total}단계. 이 페이지를 닫지 마세요.` : `Compressing GIF… ${step}/${total}. Please keep this page open.`; }, remove() { box.remove(); } };
}

function runWorker(buffer, command, timeout) {
  return new Promise((resolve, reject) => {
    let worker, timer;
    const finish = (error, value) => {
      clearTimeout(timer);
      if (worker) worker.terminate();
      error ? reject(error) : resolve(value);
    };
    try {
      const root = String(process.env.PUBLIC_URL || "").replace(/\/$/, "");
      worker = new Worker(`${root}/gif-compression/gifsicle.worker.js`);
      timer = setTimeout(() => finish(new Error("GIF compression timed out. Try a shorter or smaller GIF.")), timeout);
      worker.onerror = () => finish(new Error("GIF compression could not start. Please reload and try again."));
      worker.onmessage = ({ data }) => {
        const output = Array.isArray(data) && data.find(item => item.name === "compressed.gif");
        if (!output || !output.file || !output.file.length) {
          finish(new Error("GIF compression failed. Try a shorter or smaller GIF."));
        } else finish(null, new Uint8Array(output.file));
      };
      // Fixed virtual filenames: user filenames are never command arguments.
      worker.postMessage({ data: [{ name: "input.gif", file: buffer }], command: [command], folder: [], isStrict: false });
    } catch (error) { finish(error); }
  });
}

async function compressGif(file) {
  if (!file || file.size > GIF_MAX_INPUT_BYTES) throw new Error("GIF files must be 20MB or smaller.");
  const buffer = await file.arrayBuffer();
  const info = inspectGif(new Uint8Array(buffer));
  const baseName = String(file.name || "image.gif").replace(/\.[^/.]+$/, "") || "image";
  const makeFile = data => new File([data], `${baseName}.gif`, { type: "image/gif", lastModified: file.lastModified || Date.now() });
  if (file.size <= GIF_MAX_BYTES) return makeFile(buffer);
  // Avoid a mobile tab crash from tiny compressed files with enormous decoded frames.
  if (info.width * info.height > 16000000 || info.frames > 1000 || info.pixels > 120000000) {
    throw new Error("This GIF is too complex to compress safely. Reduce its dimensions or duration and try again.");
  }
  const status = showStatus();
  const deadline = Date.now() + 120000;
  const passes = [
    "-O1 --lossy=40",
    "-O1 --lossy=60 --resize-fit 960x960 --colors 128",
    "-O1 --lossy=80 --resize-fit 720x720 --colors 96",
    "-O1 --lossy=100 --resize-fit 480x480 --colors 64",
    "-O1 --lossy=120 --resize-fit 320x320 --colors 48",
  ];
  try {
    for (let i = 0; i < passes.length; i++) {
      status.update(i + 1, passes.length);
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("GIF compression timed out. Try a shorter or smaller GIF.");
      const data = await runWorker(buffer, `${passes[i]} input.gif -o /out/compressed.gif`, Math.min(45000, remaining));
      const result = inspectGif(data);
      // Never silently turn an animation into a still image.
      if (info.frames > 1 && result.frames < 2) throw new Error("GIF animation could not be preserved. Upload cancelled.");
      if (data.byteLength <= GIF_MAX_BYTES) return makeFile(data);
    }
    throw new Error("GIF is still larger than 8MB after compression. Reduce its dimensions or duration and try again.");
  } finally { status.remove(); }
}

export function prepareGifFile(file) {
  if (!file || typeof file !== "object") return Promise.reject(new Error("Invalid GIF image."));
  if (prepared.has(file)) return prepared.get(file);
  // One GIF at a time keeps memory bounded when many candidates are selected.
  const task = compressionQueue.then(() => compressGif(file));
  compressionQueue = task.catch(() => {});
  prepared.set(file, task);
  task.then(result => prepared.set(result, Promise.resolve(result)), () => prepared.delete(file));
  return task;
}
