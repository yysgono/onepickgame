// src/utils/supabaseWinnerLogsApi.js

import { supabase } from "./supabaseClient";

// ✅ winner_logs 전체/조건 조회 (user_id/guest_id/cup_id 등)
export async function getWinnerLogs({ user_id, guest_id, cup_id } = {}) {
  let query = supabase.from("winner_logs").select("*");
  if (user_id) query = query.eq("user_id", user_id);
  if (guest_id) query = query.eq("guest_id", guest_id);
  if (cup_id) query = query.eq("cup_id", cup_id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("winner_logs 조회 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_logs 추가
export async function addWinnerLog({ user_id = null, guest_id = null, winner_id, cup_id }) {
  const { data, error } = await supabase
    .from("winner_logs")
    .insert([{ user_id, guest_id, winner_id, cup_id }])
    .select()
    .single();

  if (error) {
    console.error("winner_logs 추가 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_logs 수정 (거의 안 씀, 예시로만)
export async function updateWinnerLog(id, updates) {
  const { data, error } = await supabase
    .from("winner_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("winner_logs 수정 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_logs 삭제
export async function deleteWinnerLog(id) {
  const { error } = await supabase
    .from("winner_logs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("winner_logs 삭제 실패:", error);
    throw error;
  }
  return true;
}
