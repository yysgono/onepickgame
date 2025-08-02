// /utils/imageCompress.js
import imageCompression from "browser-image-compression";

// file: File 객체
export async function compressImageFile(file, maxWidth = 1000, maxMB = 0.5) {
  const options = {
    maxSizeMB: maxMB,          // 0.5MB 이하로
    maxWidthOrHeight: maxWidth, // 최대 1000px 이하
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (e) {
    return file; // 실패시 원본
  }
}
