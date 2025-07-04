import { supabase } from "./supabaseClient";

// 특수문자, 공백 등 안전하게 변환
function safeString(str) {
  return String(str).replace(/[^\w.-]+/g, '-').toLowerCase();
}

/**
 * Supabase Storage에 후보 이미지 업로드 (userId별 폴더 분리)
 * @param {File|Blob} file - 업로드할 파일 객체
 * @param {string} userId - (옵션) 사용자 ID (기본값: guest)
 * @returns {Promise<string>} 업로드된 이미지의 공개 URL
 */
export async function uploadCandidateImage(file, userId = "guest") {
  const safeUserId = safeString(userId); // 폴더 이름 보호
  const safeName = safeString(file.name); // 파일명 보호
  const filePath = `candidates/${safeUserId}/${Date.now()}-${safeName}`; // 시간 중복 방지
  const { data, error } = await supabase
    .storage
    .from("candidates")
    .upload(filePath, file);

  if (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }

  // 공개 URL 반환 (실제 파일 접근용)
  const { data: urlData } = supabase
    .storage
    .from("candidates")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
