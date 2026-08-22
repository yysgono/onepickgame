// src/utils/supabaseImageUpload.js

import { supabase } from "./supabaseClient";

// 특수문자, 공백 등 안전하게 변환
function safeString(str) {
  return String(str)
    .replace(/[^\w.-]+/g, "-")
    .toLowerCase();
}

// 충돌 없는 고유 ID 생성
function createUniqueId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/**
 * Supabase Storage에 후보 이미지 업로드
 * userId별 폴더 분리
 *
 * @param {File|Blob} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function uploadCandidateImage(
  file,
  userId = "guest"
) {
  const safeUserId = safeString(userId);

  const originalName =
    file?.name || "file";

  const safeName =
    safeString(originalName) || "file";

  // ✅ Date.now()만 사용하지 않고 UUID 추가
  const uniqueId = createUniqueId();

  const filePath =
    `candidates/${safeUserId}/${uniqueId}-${safeName}`;

  const { error } = await supabase
    .storage
    .from("candidates")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType:
        file.type || undefined,
    });

  if (error) {
    console.error(
      "이미지 업로드 실패:",
      error
    );

    throw error;
  }

  const {
    data: urlData,
  } = supabase
    .storage
    .from("candidates")
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error(
      "이미지 공개 URL 생성에 실패했습니다."
    );
  }

  return urlData.publicUrl;
}