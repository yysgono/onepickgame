/**
 * 이미지 주소가 유튜브면 썸네일 URL로 변환, 아니면 그대로 반환
 * 엑박 방지
 */
export function getThumbnailUrl(image) {
  if (!image) return "";
  // 유튜브 링크면 썸네일 변환
  if (image.includes("youtube.com") || image.includes("youtu.be")) {
    // 유튜브 영상ID 추출
    let id = "";
    // 일반 URL
    const ytMatch = image.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (ytMatch) id = ytMatch[1];
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    // 혹시 11자 아닌 영상ID 들어오면(방어)
    const idMatch = image.match(/([a-zA-Z0-9_-]{11})/);
    if (idMatch) return `https://img.youtube.com/vi/${idMatch[1]}/mqdefault.jpg`;
  }
  // 일반 이미지면 그대로 반환
  return image;
}

/**
 * 확장자가 이미지인지 체크 (jpg, png, gif, webp 등)
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) return true;
  if (/^data:image\//.test(url)) return true;
  return false;
}

/**
 * 유튜브 영상 ID만 반환
 */
export function getYoutubeId(url) {
  if (!url) return null;
  // 여러 유튜브 패턴 지원
  let m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/\/([A-Za-z0-9_-]{11})(?:\?|&|$)/);
  if (m) return m[1];
  return null;
}
