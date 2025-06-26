// utils.js

import { supabase } from "./utils/supabaseClient";

// ===== 유튜브 관련 =====

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

// ========== DB 통계 (winner_stats) ==========

/**
 * winner_stats 테이블에서 통계 가져오기
 * @param {string|number} cupId
 * @returns {Promise<Array>} [{candidate_id, win_count, match_wins, match_count, total_games}]
 */
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

/**
 * winner_stats 테이블에 통계 저장/업데이트 (DB upsert)
 * @param {string|number} cupId
 * @param {Array} statsArr [{candidate_id, name, image, win_count, match_wins, match_count, total_games}]
 */
export async function saveWinnerStatsToDB(cupId, statsArr) {
  // statsArr의 각 항목에 cup_id 추가
  const rows = statsArr.map(row => ({
    ...row,
    cup_id: cupId,
  }));
  // 디버깅용 (필요시 확인)
  // console.log("saveWinnerStatsToDB rows", rows);
  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ['cup_id', 'candidate_id'] });
  if (error) {
    console.error("DB save error", error);
    return false;
  }
  return true;
}

// === 후보별 통계 배열 만들기 (매치 히스토리→집계) ===
export function calcStatsFromMatchHistory(candidates, winner, matchHistory) {
  const statsMap = {};
  candidates.forEach(c => {
    // name, image를 반드시 포함!
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

// =========== 최다 우승자 반환 (DB 버전) ===========
/**
 * 후보 데이터(cup.data)와 DB 통계(statsArr)로 최다 우승 후보 1명 반환
 */
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
