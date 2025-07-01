import { supabase } from "./utils/supabaseClient";

// ==== 유튜브 관련 ====
export function getYoutubeId(url = "") {
  if (!url) return "";
  const reg = /(?:youtube\.com\/.*[?&]v=|youtube\.com\/(?:v|embed)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(reg);
  return match ? match[1] : "";
}
export function getThumbnail(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://img.youtube.com/vi/${ytid}/mqdefault.jpg`;
  return url || "";
}
export function isValidImageUrl(url = "") {
  return /\.(jpeg|jpg|png|gif|webp)$/i.test(url) && !getYoutubeId(url);
}
export function getYoutubeEmbed(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://www.youtube.com/embed/${ytid}?autoplay=0&mute=1`;
  return "";
}

// ==== guest_id 발급 & participant_id 반환 ====
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}
// 항상 participant_id만 반환
export async function getParticipantId() {
  const { data } = await supabase.auth.getUser();
  if (data?.user?.id) return data.user.id;
  return getOrCreateGuestId();
}

/* ------------ winner_logs ------------ */

// 기존 기록 삭제 (내 participant_id & cup_id 기준)
export async function deleteOldWinnerLogAndStats(cupId) {
  const participant_id = await getParticipantId();
  await supabase.from("winner_logs").delete().match({ cup_id: cupId, participant_id });
  // winner_stats도 지우려면 아래 주석 해제
  await supabase.from("winner_stats").delete().match({ cup_id: cupId, participant_id });
}

// winner_logs에 insert (유니크 위반시 false)
export async function insertWinnerLog(cupId) {
  const participant_id = await getParticipantId();
  console.log("[insertWinnerLog] participant_id:", participant_id); // 추가!
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

// 내 winner_logs 기록만 조회 (내 participant_id만)
export async function getMyWinnerLogs({ cup_id } = {}) {
  const participant_id = await getParticipantId();
  let query = supabase.from("winner_logs").select("*").eq("participant_id", participant_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/* ------------ winner_stats ------------ */

// 내 승자 통계 upsert (있으면 수정, 없으면 추가)
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

// 내 승자 통계만 조회
export async function getMyWinnerStats({ cup_id } = {}) {
  const participant_id = await getParticipantId();
  let query = supabase.from("winner_stats").select("*").eq("participant_id", participant_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// winner_stats 전체 조회 (특정 cup에서만)
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

// winner_stats에 통계 누적 저장 (배열 전체 upsert)
export async function saveWinnerStatsToDB(cupId, statsArr) {
  const participant_id = await getParticipantId();
  // 기존 내 통계 가져오기
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

// 후보별 통계 집계
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

// 최다 우승자 반환
export function getMostWinnerFromDB(statsArr, cupData) {
  if (!statsArr || !Array.isArray(statsArr)) return null;
  let maxWin = -1;
  let mostWinner = null;
  for (const stat of statsArr) {
    if ((stat.win_count || 0) > maxWin) {
      maxWin = stat.win_count || 0;
      mostWinner = cupData.find(c => String(c.id) === String(stat.candidate_id));
    }
  }
  return mostWinner;
}

// 월드컵 삭제 함수
export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
