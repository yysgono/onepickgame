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

// 월드컵 종료시 통계 저장 (DB에 저장, 중복 저장 안 남게 upsert)
export async function saveWinnerStatsWithUser(cupId, winner, matchHistory) {
  // matchHistory가 배열이 아닐 수 있으니 방어코드
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

  // DB에 새로 저장 (upsert)
  const statsArr = Object.entries(candidateStats).map(([candidate_id, stats]) => ({
    cup_id: String(cupId),
    candidate_id: String(candidate_id),
    ...stats,
    updated_at: new Date().toISOString(),
  }));

  if (statsArr.length > 0) {
    const { error } = await supabase.from('winner_stats').upsert(statsArr, {
      onConflict: ['cup_id', 'candidate_id']
    });
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

// "최다 우승 후보" 반환
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
