// Preserve GIF animation without sending the file through a still-image canvas.
// Keep the same 1 MiB final-file budget used by the image upload routes.
export const GIF_MAX_BYTES = 1024 * 1024;

export function isGifFile(file) {
  return Boolean(file) && (
    String(file.type || "").toLowerCase() === "image/gif" ||
    /\.gif$/i.test(file.name || "")
  );
}

export async function prepareGifFile(file) {
  if (!file || file.size > GIF_MAX_BYTES) {
    throw new Error("GIF files must be 1MB or smaller. Reduce the GIF size and try again.");
  }

  const bytes = new Uint8Array(await file.slice(0, 13).arrayBuffer());
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  if (bytes.length < 13 || !["GIF87a", "GIF89a"].includes(signature) || !width || !height) {
    throw new Error("Invalid GIF image. Renaming another file to .gif does not convert it.");
  }

  const baseName = String(file.name || "image.gif").replace(/\.[^/.]+$/, "") || "image";
  return new File([file], `${baseName}.gif`, {
    type: "image/gif",
    lastModified: file.lastModified || Date.now(),
  });
}
