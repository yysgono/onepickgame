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

// ===== 통계, 기록 관련 =====

/**
 * 월드컵 종료시 통계 저장 (user별로 upsert, 중복 저장 방지)
 * @param {string|number} cupId
 * @param {object} winner
 * @param {Array} matchHistory
 * @param {string} [userId]  // userId 인자를 받거나, localStorage에서 꺼냄
 */
export async function saveWinnerStatsWithUser(cupId, winner, matchHistory, userId) {
  // userId 미지정 시 localStorage에서 최대한 파싱해서 추출
  let uid = userId;
  if (!uid) {
    try {
      const userRaw = localStorage.getItem("onepickgame_user");
      if (userRaw) {
        if (userRaw.startsWith("{")) {
          // json 형식
          const user = JSON.parse(userRaw);
          uid = user.userid || user.id || user.nickname || "guest";
        } else {
          uid = userRaw;
        }
      }
    } catch {
      uid = "guest";
    }
  }

  // 방어코드
  const safeHistory = Array.isArray(matchHistory) ? matchHistory : [];

  // 후보별 새 기록 계산
  const candidateStats = {};
  safeHistory.forEach(({ c1, c2, winner }) => {
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

  // DB에 새로 저장 (upsert, 유저구분 추가)
  const statsArr = Object.entries(candidateStats).map(([candidate_id, stats]) => ({
    cup_id: String(cupId),
    candidate_id: String(candidate_id),
    ...stats,
    updated_at: new Date().toISOString(),
    user_id: uid,
  }));

  if (statsArr.length > 0) {
    const { error } = await supabase.from('winner_stats').upsert(statsArr, {
      onConflict: ['cup_id', 'candidate_id', 'user_id']
    });
    if (error) {
      alert("DB 저장 실패: " + error.message);
    }
  }
}

/**
 * 통계 가져오기 (모든 유저 합계 반환)
 */
export async function getWinnerStats(cupId) {
  // user_id별로 다 가져와 합산
  const { data, error } = await supabase
    .from('winner_stats')
    .select('*')
    .eq('cup_id', String(cupId));

  if (error) {
    alert("통계 불러오기 실패: " + error.message);
    return [];
  }

  // 후보별 합산
  const merged = {};
  for (const row of Array.isArray(data) ? data : []) {
    const cid = String(row.candidate_id);
    if (!merged[cid]) {
      merged[cid] = { ...row };
      merged[cid].user_count = 1;
    } else {
      // 누적합
      merged[cid].win_count += row.win_count;
      merged[cid].match_wins += row.match_wins;
      merged[cid].match_count += row.match_count;
      merged[cid].total_games += row.total_games;
      merged[cid].user_count += 1;
    }
  }
  return Object.values(merged);
}

/**
 * 최다 우승 후보 반환
 */
export async function getMostWinner(cupId, cupData) {
  const statsArr = await getWinnerStats(cupId);
  let maxWin = -1;
  let mostWinner = null;
  for (const c of cupData) {
    const stat = statsArr.find(row => String(row.candidate_id) === String(c.id));
    if ((stat?.win_count || 0) > maxWin) {
      maxWin = stat.win_count || 0;
      mostWinner = c;
    }
  }
  return mostWinner;
}
