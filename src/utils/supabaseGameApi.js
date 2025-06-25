// src/utils/supabaseGameApi.js

import { supabase } from "./supabaseClient";

// 월드컵 전체 목록
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("월드컵 목록 불러오기 실패:", error);
    throw error;
  }
  return data || [];
}

// 월드컵 1개(상세)
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("월드컵 상세 불러오기 실패:", error);
    throw error;
  }
  return data;
}

// 월드컵 추가(생성)
export async function addWorldcupGame(cup) {
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();
  if (error) {
    console.error("월드컵 저장 실패:", error);
    throw error;
  }
  return data.id;
}

// 월드컵 수정
export async function updateWorldcupGame(id, updates) {
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);
  if (error) {
    console.error("월드컵 수정 실패:", error);
    throw error;
  }
  return true;
}

// 월드컵 삭제
export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("월드컵 삭제 실패:", error);
    throw error;
  }
  return true;
}
