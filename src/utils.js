// src/utils.js

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

// ===== 통계, 기록 관련 (supabase 연동 버전) =====

// 월드컵 통계 저장: 이전 기록 삭제 후, 새로 저장
export async function saveWinnerStatsWithUser(userId, cupId, winner, matchHistory) {
  // 1. 이전 기록 삭제
  await supabase
    .from('winner_stats')
    .delete()
    .eq('cup_id', cupId);

  // 2. 후보별 새 기록 계산
  const candidateStats = {};
  matchHistory.forEach(({ c1, c2, winner }) => {
    [c1, c2].forEach(c => {
      if (!c) return;
      if (!candidateStats[c.id]) candidateStats[c.id] = { win_count: 0, match_wins: 0, match_count: 0, total_games: 0, name: c.name, image: c.image };
      candidateStats[c.id].match_count++;
    });
    if (winner && !candidateStats[winner.id]) candidateStats[winner.id] = { win_count: 0, match_wins: 0, match_count: 0, total_games: 0, name: winner.name, image: winner.image };
    if (winner) candidateStats[winner.id].match_wins++;
  });

  if (winner && candidateStats[winner.id]) {
    candidateStats[winner.id].win_count = 1;
    candidateStats[winner.id].total_games = 1;
  }
  Object.keys(candidateStats).forEach(id => {
    if (id !== winner.id) candidateStats[id].total_games = 1;
  });

  // 3. DB에 새로 저장 (bulk insert)
  const statsArr = Object.entries(candidateStats).map(([candidate_id, stats]) => ({
    cup_id: String(cupId),
    candidate_id: String(candidate_id),
    ...stats,
    updated_at: new Date().toISOString(),
  }));

  if (statsArr.length > 0) {
    const { error } = await supabase.from('winner_stats').insert(statsArr);
    if (error) {
      alert("DB 저장 실패: " + error.message);
    }
  }
}

// DB에서 전체 통계 불러오기
export async function getWinnerStats(cupId) {
  const { data, error } = await supabase
    .from('winner_stats')
    .select('*')
    .eq('cup_id', String(cupId));
  if (error) {
    alert("통계 불러오기 실패: " + error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}
