import { supabase } from "./supabaseClient";

function safeString(str) {
  return String(str).replace(/[^\w.-]+/g, '-').toLowerCase();
}

export async function uploadCandidateImage(file, userId = "guest") {
  const safeUserId = safeString(userId);
  const safeName = safeString(file.name);
  const filePath = `candidates/${safeUserId}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase
    .storage
    .from("candidates")
    .upload(filePath, file);

  if (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }

  const { data: urlData } = supabase
    .storage
    .from("candidates")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
