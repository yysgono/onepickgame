export const MP4_MAX_BYTES = 8 * 1024 * 1024;
export const MP4_SIZE_HELP = "MP4: max 8MB. MP4 videos are not compressed.";

export function isMp4File(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  return type === "video/mp4" || (/\.mp4$/i.test(file.name || "") && ["", "application/octet-stream"].includes(type));
}

// Validate actual browser decoding, not just a filename or supplied MIME type.
function checkPlayable(file) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || !URL.createObjectURL) {
      reject(new Error("This browser cannot check MP4 playback. Please use a current browser."));
      return;
    }
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let timer;
    const finish = error => {
      clearTimeout(timer);
      video.onloadeddata = null;
      video.onerror = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      error ? reject(error) : resolve();
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => finish(video.videoWidth > 0 && video.videoHeight > 0 ? null : new Error("MP4 has no playable video track."));
    video.onerror = () => finish(new Error("This MP4 could not be played. Export an H.264 MP4 and try again."));
    timer = setTimeout(() => finish(new Error("Could not check MP4 playback. Try an H.264 MP4 or a smaller file.")), 15000);
    video.src = url;
    video.load();
  });
}

const prepared = new WeakMap();
export function prepareMp4File(file) {
  if (!file || typeof file !== "object") return Promise.reject(new Error("Invalid MP4 video."));
  if (prepared.has(file)) return prepared.get(file);
  const task = (async () => {
    if (file.size > MP4_MAX_BYTES) throw new Error(MP4_SIZE_HELP);
    if (!file.size || !isMp4File(file)) throw new Error("Invalid MP4 video.");
    const bytes = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0, found = false;
    while (offset + 8 <= bytes.length) {
      const size = view.getUint32(offset);
      const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      if (size < 8 || offset + size > file.size) break;
      if (type === "ftyp" && size >= 16 && offset + 16 <= bytes.length) { found = true; break; }
      offset += size;
    }
    if (!found) throw new Error("Invalid MP4 video. Renaming a file to .mp4 does not convert it.");
    const name = String(file.name || "video.mp4").replace(/\.[^/.]+$/, "") || "video";
    const result = new File([file], `${name}.mp4`, { type: "video/mp4", lastModified: file.lastModified || Date.now() });
    await checkPlayable(result);
    return result;
  })();
  prepared.set(file, task);
  task.then(result => prepared.set(result, Promise.resolve(result)), () => prepared.delete(file));
  return task;
}
