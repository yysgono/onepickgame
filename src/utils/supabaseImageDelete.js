import { supabase } from "./supabaseClient";

/**
 * Supabase Storage에서 후보 이미지 삭제
 * @param {string} imageUrl - 삭제할 이미지의 공개 URL
 * @returns {Promise<boolean>}
 */
export async function deleteCandidateImage(imageUrl) {
  if (!imageUrl) return false;

  try {
    const url = new URL(imageUrl);
    const pathIndex = url.pathname.indexOf('/storage/v1/object/public/');
    if (pathIndex === -1) return false;

    // 이미지 경로만 추출
    const filePath = url.pathname.substring(pathIndex + '/storage/v1/object/public/'.length);

    const { error } = await supabase.storage.from('candidates').remove([filePath]);
    if (error) {
      console.error("이미지 삭제 실패:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("이미지 삭제 중 오류:", e);
    return false;
  }
}
