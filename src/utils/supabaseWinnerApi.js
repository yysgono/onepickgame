import { supabase } from "./utils/supabaseClient";

/** ==== 비회원 고유 guest_id 발급 ==== */
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}

/** ==== 항상 participant_id 반환 (회원: user.id, 비회원: guest_id) ==== */
export async function getParticipantId() {
  const { data } = await supabase.auth.getUser();
  if (data?.user?.id) return data.user.id;
  return getOrCreateGuestId();
}

/* ==== winner_logs ==== */

// 기록 추가 (중복 unique는 false 반환)
export async function insertWinnerLog(cupId) {
  const participant_id = await getParticipantId();
  const { error } = await supabase
    .from("winner_logs")
    .insert([{ cup_id: cupId, participant_id }]);
  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
      return false;
    }
    console.error("winner_logs insert error:", error);
    return false;
  }
  return true;
}

// 내 winner_logs 조회
export async function getMyWinnerLogs({ cup_id } = {}) {
  const participant_id = await getParticipantId();
  let query = supabase.from("winner_logs").select("*").eq("participant_id", participant_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 기록 삭제 (cupId/내 participant_id 기준)
export async function deleteOldWinnerLogAndStats(cupId) {
  const participant_id = await getParticipantId();
  await supabase.from("winner_logs").delete().match({ cup_id: cupId, participant_id });
  await supabase.from("winner_stats").delete().match({ cup_id: cupId, participant_id });
}

/* ==== winner_stats ==== */

// 통계 계산 예시(집계)
export function calcStatsFromMatchHistory(candidates, winner, matchHistory) {
  const statsMap = {};
  candidates.forEach(c => {
    statsMap[c.id] = {
      candidate_id: c.id,
      name: c.name,
      image: c.image,
      win_count: 0,
      match_wins: 0,
      match_count: 0,
      total_games: 0,
    };
  });
  matchHistory.forEach(({ c1, c2, winner }) => {
    if (c1) statsMap[c1.id].match_count++;
    if (c2) statsMap[c2.id].match_count++;
    if (winner) statsMap[winner.id].match_wins++;
  });
  if (winner) {
    statsMap[winner.id].win_count = 1;
    statsMap[winner.id].total_games = 1;
    Object.keys(statsMap).forEach(id => {
      if (id !== winner.id) statsMap[id].total_games = 1;
    });
  }
  return Object.values(statsMap);
}

// 내 통계 upsert (한 후보)
export async function upsertMyWinnerStat({
  cup_id,
  candidate_id,
  win_count = 0,
  match_wins = 0,
  total_games = 0,
  name = "",
  image = "",
  match_count = 0,
}) {
  const participant_id = await getParticipantId();
  const payload = {
    participant_id,
    cup_id,
    candidate_id,
    win_count,
    match_wins,
    total_games,
    name,
    image,
    match_count,
  };
  const { data, error } = await supabase
    .from("winner_stats")
    .upsert(
      [payload],
      { onConflict: ["participant_id", "cup_id", "candidate_id"] }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 내 통계 전체 upsert (여러 후보/배열)
export async function saveWinnerStatsToDB(cupId, statsArr) {
  const participant_id = await getParticipantId();
  const prevStats = await supabase
    .from("winner_stats")
    .select("*")
    .eq("participant_id", participant_id)
    .eq("cup_id", cupId);
  const prevStatsMap = {};
  (prevStats.data || []).forEach(row => {
    prevStatsMap[row.candidate_id] = row;
  });
  const rows = statsArr.map(row => {
    const prev = prevStatsMap[row.candidate_id] || {};
    return {
      ...row,
      participant_id,
      cup_id: cupId,
      win_count: (prev.win_count || 0) + (row.win_count || 0),
      match_wins: (prev.match_wins || 0) + (row.match_wins || 0),
      match_count: (prev.match_count || 0) + (row.match_count || 0),
      total_games: (prev.total_games || 0) + (row.total_games || 0),
      name: row.name || prev.name || "",
      image: row.image || prev.image || "",
    };
  });
  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ["participant_id", "cup_id", "candidate_id"] });
  if (error) {
    console.error("DB save error", error);
    return false;
  }
  return true;
}

// 내 통계만 조회
export async function getMyWinnerStats({ cup_id } = {}) {
  const participant_id = await getParticipantId();
  let query = supabase.from("winner_stats").select("*").eq("participant_id", participant_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 후보별 전체 통계 조회 (특정 cup)
export async function fetchWinnerStatsFromDB(cupId) {
  const { data, error } = await supabase
    .from("winner_stats")
    .select("*")
    .eq("cup_id", cupId);
  if (error) {
    console.error("DB fetch error", error);
    return [];
  }
  return data || [];
}
