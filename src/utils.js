// src/utils.js

import { supabase } from "./utils/supabaseClient";

// ========== 유튜브 관련 ==========
export function getYoutubeId(url = "") {
  if (!url) return "";
  const reg = /(?:youtube\.com\/.*[?&]v=|youtube\.com\/(?:v|embed)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(reg);
  return match ? match[1] : "";
}

export function getThumbnail(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) {
    return `https://img.youtube.com/vi/${ytid}/mqdefault.jpg`;
  }
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

// ========== 월드컵 게임 관련 (supabase) ==========
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

// ========== 통계 관련 (supabase) ==========

// 기록 저장 (insert or update)
export async function saveWinnerStatsWithUserSupabase(cupId, matchWinner, matchHistory, candidateData) {
  // matchWinner: { id, name, image }
  // matchHistory: [{ c1: {}, c2: {}, winner: {} }, ...]
  // candidateData: [{ id, name, image }, ...]
  // === 후보별 집계 ===
  const stats = {};
  candidateData.forEach((c) => {
    stats[c.id] = {
      win_count: 0,
      match_wins: 0,
      match_count: 0,
      total_games: 0,
      name: c.name,
      image: c.image,
    };
  });

  matchHistory.forEach(({ c1, c2, winner }) => {
    if (c1 && stats[c1.id]) stats[c1.id].match_count++;
    if (c2 && stats[c2.id]) stats[c2.id].match_count++;
    if (winner && stats[winner.id]) stats[winner.id].match_wins++;
  });

  if (matchWinner && stats[matchWinner.id]) {
    stats[matchWinner.id].win_count = 1;
    stats[matchWinner.id].total_games = 1;
  }
  Object.keys(stats).forEach((id) => {
    if (id !== matchWinner.id) stats[id].total_games = 1;
  });

  // === upsert 통계 ===
  const rows = Object.entries(stats).map(([candidate_id, stat]) => ({
    cup_id: cupId,
    candidate_id,
    win_count: stat.win_count,
    match_wins: stat.match_wins,
    match_count: stat.match_count,
    total_games: stat.total_games,
    name: stat.name,
    image: stat.image,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ["cup_id", "candidate_id"] });

  if (error) throw error;
  return true;
}

// 통계 조회
export async function getWinnerStatsSupabase(cupId) {
  const { data, error } = await supabase
    .from("winner_stats")
    .select("*")
    .eq("cup_id", cupId);

  if (error) throw error;

  // { [candidate_id]: { ... } } 형태로 변환
  const stats = {};
  data.forEach((row) => {
    stats[row.candidate_id] = {
      win_count: row.win_count,
      match_wins: row.match_wins,
      match_count: row.match_count,
      total_games: row.total_games,
      name: row.name,
      image: row.image,
    };
  });
  return stats;
}

// 최다 우승 후보 반환
export function getMostWinner(cupId, candidateData, stats) {
  if (!stats) return null;
  let maxWin = -1;
  let mostWinner = null;
  for (const c of candidateData) {
    const stat = stats[c.id] || {};
    if ((stat.win_count || 0) > maxWin) {
      maxWin = stat.win_count || 0;
      mostWinner = c;
    }
  }
  return mostWinner;
}
