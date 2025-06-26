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

// ====== DB 통계 ======

/**
 * winner_stats 테이블에서 통계 가져오기
 * @param {string|number} cupId
 * @returns {Promise<Array>} 각 후보별 [{candidate_id, win_count, match_wins, match_count, total_games}]
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
 * winner_stats 테이블에 통계 저장/업데이트 (승리/경기 결과)
 * (DB에 upsert로 candidate별로 추가/업데이트)
 * @param {string} cupId
 * @param {Array} statsArr [{candidate_id, win_count, match_wins, match_count, total_games}]
 */
export async function saveWinnerStatsToDB(cupId, statsArr) {
  // statsArr의 각 항목에 cup_id 추가
  const rows = statsArr.map(row => ({
    ...row,
    cup_id: cupId,
  }));
  const { data, error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ['cup_id', 'candidate_id'] });
  if (error) {
    console.error("DB save error", error);
    return false;
  }
  return true;
}

/**
 * DB에서 해당 월드컵의 '최다 우승 후보' 객체를 반환 (비동기)
 * @param {string|number} cupId
 * @param {Array} cupData 후보목록
 * @returns 후보 객체 or null
 */
export async function getMostWinner(cupId, cupData) {
  const statsArr = await fetchWinnerStatsFromDB(cupId);
  let maxWin = -1;
  let mostWinner = null;
  (cupData || []).forEach((c) => {
    const stat = statsArr.find((s) => String(s.candidate_id) === String(c.id));
    const win = stat ? stat.win_count || 0 : 0;
    if (win > maxWin) {
      maxWin = win;
      mostWinner = c;
    }
  });
  return mostWinner;
}
