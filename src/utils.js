// src/utils.js
import { supabase } from "./utils/supabaseClient";

// YouTube 관련 유틸
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
  return /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(url) && !getYoutubeId(url);
}
export function getYoutubeEmbed(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://www.youtube.com/embed/${ytid}?autoplay=0&mute=1`;
  return "";
}

// 게스트/유저 ID 관리
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}
export async function getUserOrGuestId() {
  const { data } = await supabase.auth.getUser();
  if (data?.user?.id) return { user_id: data.user.id, guest_id: null };
  else return { user_id: null, guest_id: getOrCreateGuestId() };
}

// 월드컵 관련 함수
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
export async function addWorldcupGame(cup) {
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
export async function updateWorldcupGame(id, updates) {
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return true;
}
export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

// winner_logs, winner_stats 삭제 (대회 시작/재시작 시)
export async function deleteOldWinnerLogAndStats(cup_id) {
  const { user_id, guest_id } = await getUserOrGuestId();
  let deleteQuery = supabase.from("winner_logs").delete().eq("cup_id", cup_id);
  if (user_id) deleteQuery = deleteQuery.eq("user_id", user_id);
  if (guest_id) deleteQuery = deleteQuery.eq("guest_id", guest_id);
  await deleteQuery;

  let statsDelete = supabase.from("winner_stats").delete().eq("cup_id", cup_id);
  if (user_id) statsDelete = statsDelete.eq("user_id", user_id);
  if (guest_id) statsDelete = statsDelete.eq("guest_id", guest_id);
  await statsDelete;
}

// winner_logs 기록
export async function insertWinnerLog(cup_id, winner_id = null) {
  const { user_id, guest_id } = await getUserOrGuestId();
  const { error } = await supabase
    .from("winner_logs")
    .insert([{ user_id, guest_id, cup_id, winner_id }]);
  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate")) return false;
    return false;
  }
  return true;
}

// winner_stats upsert (개별)
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
  const { user_id, guest_id } = await getUserOrGuestId();
  const payload = {
    cup_id,
    candidate_id,
    win_count,
    match_wins,
    total_games,
    name,
    image,
    match_count,
    user_id,
    guest_id,
  };
  const { data, error } = await supabase
    .from("winner_stats")
    .upsert([payload], { onConflict: ["user_id", "guest_id", "cup_id", "candidate_id"] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// **배열 병렬 upsert**
export async function upsertMyWinnerStat_parallel(statsArr, cup_id) {
  const { user_id, guest_id } = await getUserOrGuestId();
  const rows = statsArr.map(stat => ({
    ...stat,
    cup_id,
    user_id,
    guest_id,
  }));
  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ["user_id", "guest_id", "cup_id", "candidate_id"] });
  if (error) throw error;
}

// 나의 통계 가져오기
export async function getMyWinnerStats({ cup_id } = {}) {
  const { user_id, guest_id } = await getUserOrGuestId();
  let query = supabase.from("winner_stats").select("*");
  if (user_id) query = query.eq("user_id", user_id);
  if (guest_id) query = query.eq("guest_id", guest_id);
  if (cup_id) query = query.eq("cup_id", cup_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * 누적 통계(기간 가능) + **프론트 보정(shim)**
 * - DB 수정 없이 과거 데이터의 match_count 부족분을 화면에서 안전 보정
 */
export async function fetchWinnerStatsFromDB(cup_id, since) {
  let query = supabase
    .from("winner_stats")
    .select("*")
    .eq("cup_id", cup_id);

  if (since && typeof since === "object" && since.from && since.to) {
    query = query.gte("created_at", since.from).lte("created_at", since.to);
  } else if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error) throw error;

  // 1) 합산
  const statsMap = {};
  for (const row of data) {
    const id = row.candidate_id;
    if (!statsMap[id]) {
      statsMap[id] = {
        candidate_id: id,
        name: row.name,
        image: row.image,
        win_count: 0,
        match_wins: 0,
        match_count: 0,
        total_games: 0,
        user_win_count: 0,
        user_match_wins: 0,
        user_match_count: 0,
        user_total_games: 0,
      };
    }
    // 전체 합
    statsMap[id].win_count   += row.win_count   || 0;
    statsMap[id].match_wins  += row.match_wins  || 0;
    statsMap[id].match_count += row.match_count || 0;
    statsMap[id].total_games += row.total_games || 0;

    // 회원 전용 합(회원 row에만)
    if (row.user_id) {
      statsMap[id].user_win_count   += row.win_count   || 0;
      statsMap[id].user_match_wins  += row.match_wins  || 0;
      statsMap[id].user_match_count += row.match_count || 0;
      statsMap[id].user_total_games += row.total_games || 0;
    }
  }

  // 2) 안전 보정(shim)
  for (const s of Object.values(statsMap)) {
    if (s.match_count < s.match_wins) s.match_count = s.match_wins;
    if (s.match_count < s.win_count)  s.match_count = s.win_count;
    if (s.total_games === 0 && (s.win_count > 0 || s.match_count > 0)) s.total_games = 1;

    if (s.user_match_count < s.user_match_wins) s.user_match_count = s.user_match_wins;
    if (s.user_match_count < s.user_win_count)  s.user_match_count = s.user_win_count;
    if (s.user_total_games === 0 && (s.user_win_count > 0 || s.user_match_count > 0)) s.user_total_games = 1;
  }

  return Object.values(statsMap);
}

// 통계 계산 함수 (라운드별 매치 전부 포함)
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

  if (!Array.isArray(matchHistory)) matchHistory = [];

  matchHistory.forEach(({ c1, c2, winner: matchWinner }) => {
    if (c1 && statsMap[c1.id]) statsMap[c1.id].match_count++;
    if (c2 && statsMap[c2.id]) statsMap[c2.id].match_count++;
    if (matchWinner && statsMap[matchWinner.id]) statsMap[matchWinner.id].match_wins++;
  });

  if (winner && statsMap[winner.id]) {
    statsMap[winner.id].win_count = 1;
    statsMap[winner.id].total_games = 1;
    Object.keys(statsMap).forEach(id => {
      if (id !== String(winner.id)) statsMap[id].total_games = 1;
    });
  }
  return Object.values(statsMap);
}

// 최고 우승자 찾기
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
