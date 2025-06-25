// src/utils.js

import { supabase } from "./utils/supabaseClient";

// ===== 유튜브 관련 =====

// 유튜브 ID 추출
export function getYoutubeId(url = "") {
  if (!url) return "";
  const reg = /(?:youtube\.com\/.*[?&]v=|youtube\.com\/(?:v|embed)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(reg);
  return match ? match[1] : "";
}

// 유튜브 썸네일 URL 또는 이미지 URL 반환
export function getThumbnail(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) {
    return `https://img.youtube.com/vi/${ytid}/mqdefault.jpg`;
  }
  return url || "";
}

// 이미지 URL 유효성 검사 (확장자 기준, 유튜브 URL 제외)
export function isValidImageUrl(url = "") {
  return /\.(jpeg|jpg|png|gif|webp)$/i.test(url) && !getYoutubeId(url);
}

// 유튜브 임베드 URL 반환
export function getYoutubeEmbed(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://www.youtube.com/embed/${ytid}?autoplay=0&mute=1`;
  return "";
}

// ===== 통계, 기록 관련 (supabase 연동 버전) =====

// 월드컵 종료시 통계 저장 (DB에 저장)
export async function saveWinnerStatsWithUser(userId, cupId, winner, matchHistory) {
  // 단순 예시: 우승자 정보만 저장
  const win_count = 1;
  const match_wins = matchHistory.length;
  const match_count = matchHistory.length;
  const total_games = 1;

  const { error } = await supabase.from('winner_stats').upsert([
    {
      cup_id: String(cupId),
      candidate_id: String(winner.id),
      name: winner.name,
      image: winner.image,
      win_count,
      match_wins,
      match_count,
      total_games,
      updated_at: new Date().toISOString()
    }
  ], {
    onConflict: ['cup_id', 'candidate_id'],
  });

  if (error) {
    alert("DB 저장 실패: " + error.message);
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
