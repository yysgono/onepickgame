// src/utils/supabaseWorldcupApi.js

import { supabase } from "./supabaseClient";

// 월드컵 추가
export async function addWorldcupGame(worldcupData) {
  const { data, error } = await supabase
    .from("worldcups")   // ✅ worldcups 테이블로 insert!
    .insert([worldcupData])
    .select()
    .single();
  if (error) {
    console.error("월드컵 저장 실패:", error);
    throw error;
  }
  return data.id;
}

// 월드컵 목록
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")   // ✅ worldcups 테이블로 select!
    .select("*")
    .order("created_at", { ascending: false });  // ✅ created_at 컬럼명!
  if (error) {
    console.error("월드컵 목록 불러오기 실패:", error);
    throw error;
  }
  return data || [];
}
