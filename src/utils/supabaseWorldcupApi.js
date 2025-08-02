import { supabase } from "./supabaseClient";

// 월드컵 전체 조회
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 월드컵 단일 조회
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("월드컵 데이터를 찾을 수 없습니다.");
  return data;
}

// 월드컵 추가 (id만 반환)
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

// 월드컵 삭제 (이 함수만 남기고 나머지는 import해서 통일)
export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
