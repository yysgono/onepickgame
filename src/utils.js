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
 * winner_stats 테이블에 통계 저장/업데이트 (DB upsert, 누적합)
 * @param {string|number} cupId
 * @param {Array} statsArr [{candidate_id, name, image, win_count, match_wins, match_count, total_games}]
 */
export async function saveWinnerStatsToDB(cupId, statsArr) {
  // 누적 방식
  const prevStats = await fetchWinnerStatsFromDB(cupId);
  const prevStatsMap = {};
  prevStats.forEach(row => {
    prevStatsMap[row.candidate_id] = row;
  });

  const rows = statsArr.map(row => {
    const prev = prevStatsMap[row.candidate_id] || {};
    return {
      ...row,
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

// ======= 비회원 guest_id 발급 (localStorage) =======
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}

/**
 * winner_logs 테이블에 insert로 1회 중복 체크
 * @param {string} cupId
 * @param {string|null} userId
 * @param {string|null} guestId
 * @returns {Promise<boolean>} true=첫참여, false=중복
 */
export async function insertWinnerLog(cupId, userId, guestId) {
  const { error } = await supabase
    .from("winner_logs")
    .insert([{
      cup_id: cupId,
      user_id: userId || null,
      guest_id: guestId || null,
    }]);
  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
      return false; // 이미 참여한 적 있음
    }
    console.error("winner_logs insert error:", error);
    return false;
  }
  return true;
}
