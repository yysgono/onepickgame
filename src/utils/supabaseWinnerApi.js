// src/utils/supabaseWinnerApi.js

import { supabase } from "./supabaseClient";

// ✅ winner_stats 전체/조건 조회
export async function getWinnerStats({ user_id, guest_id, cup_id, candidate_id } = {}) {
  let query = supabase.from("winner_stats").select("*");
  if (user_id) query = query.eq("user_id", user_id);
  if (guest_id) query = query.eq("guest_id", guest_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  if (candidate_id) query = query.eq("candidate_id", candidate_id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("winner_stats 조회 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_stats 추가 (upsert 사용 추천: 중복방지)
export async function addWinnerStat({
  user_id = null,
  guest_id = null,
  cup_id,
  candidate_id,
  win_count = 0,
  match_wins = 0,
  total_games = 0,
  name = "",
  image = "",
  match_count = 0,
}) {
  const { data, error } = await supabase
    .from("winner_stats")
    .upsert([
      {
        user_id,
        guest_id,
        cup_id,
        candidate_id,
        win_count,
        match_wins,
        total_games,
        name,
        image,
        match_count,
      },
    ], { onConflict: ["user_id", "cup_id", "candidate_id"] })
    .select()
    .single();

  if (error) {
    console.error("winner_stats 추가 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_stats 수정 (업데이트)
export async function updateWinnerStat(id, updates) {
  const { data, error } = await supabase
    .from("winner_stats")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("winner_stats 수정 실패:", error);
    throw error;
  }
  return data;
}

// ✅ winner_stats 삭제
export async function deleteWinnerStat(id) {
  const { error } = await supabase
    .from("winner_stats")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("winner_stats 삭제 실패:", error);
    throw error;
  }
  return true;
}

export async function saveWinnerStatsToDB(cup_id, statsArr) {
  for (const s of statsArr) {
    const { candidate_id, win_count, match_wins, match_count, total_games, name, image, user_id, guest_id } = s;
    // 1. 기존 데이터 불러오기
    const prevArr = await getWinnerStats({ cup_id, candidate_id, user_id, guest_id });
    const prev = prevArr && prevArr.length > 0 ? prevArr[0] : {};
    // 2. 누적 합산
    const newWinCount = (prev.win_count || 0) + (win_count || 0);
    const newMatchWins = (prev.match_wins || 0) + (match_wins || 0);
    const newMatchCount = (prev.match_count || 0) + (match_count || 0);
    const newTotalGames = (prev.total_games || 0) + (total_games || 0);
    // 3. upsert
    await addWinnerStat({
      cup_id,
      candidate_id,
      user_id,
      guest_id,
      win_count: newWinCount,
      match_wins: newMatchWins,
      match_count: newMatchCount,
      total_games: newTotalGames,
      name,
      image
    });
  }
}
