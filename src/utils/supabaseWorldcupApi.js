import { supabase } from "./supabaseClient";
import { deleteCandidateImage } from "./supabaseImageDelete";

// 월드컵 목록 가져오기
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 단일 월드컵 가져오기
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// 월드컵 추가
export async function addWorldcupGame(cup) {
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// 월드컵 수정
export async function updateWorldcupGame(id, updates) {
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return true;
}

// 월드컵 + 후보 이미지까지 모두 삭제하는 함수 (필수)
export async function deleteWorldcupGameWithImages(id) {
  // 1. 월드컵 후보 이미지 목록 가져오기
  const { data: cup, error: getError } = await supabase
    .from("worldcups")
    .select("data")
    .eq("id", id)
    .single();
  if (getError) throw getError;

  // 2. 후보 이미지가 서버에 있으면 삭제
  if (cup?.data) {
    for (const candidate of cup.data) {
      if (
        candidate.image &&
        !candidate.image.startsWith("blob:") &&
        !candidate.image.startsWith("data:image")
      ) {
        try {
          await deleteCandidateImage(candidate.image);
        } catch (e) {
          console.warn("이미지 삭제 실패:", candidate.image, e);
        }
      }
    }
  }

  // 3. 월드컵 데이터 삭제
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;

  return true;
}
