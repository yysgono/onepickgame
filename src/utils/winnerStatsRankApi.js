import { supabase } from "./supabaseClient";

/**
 * 월드컵 내 후보별 '매치 승률' 순 랭킹
 * (match_wins / match_count, match_count가 0이면 승률 0%)
 * @param {string} cup_id - 월드컵 ID
 * @param {number} limit - TOP N명까지 (기본 3)
 * @returns {Array} [{candidate_id, name, image, match_wins, match_count, win_rate}, ...]
 */
export async function getTopWinRateOfCup(cup_id, limit = 3) {
  const { data, error } = await supabase
    .from("winner_stats")
    .select("candidate_id, name, image, match_wins, match_count")
    .eq("cup_id", cup_id);

  if (error) throw error;

  // 후보별 match_wins, match_count 합산 + 승률 계산
  const grouped = {};
  data.forEach(row => {
    if (!grouped[row.candidate_id]) {
      grouped[row.candidate_id] = { ...row, match_wins: 0, match_count: 0 };
    }
    grouped[row.candidate_id].match_wins += row.match_wins || 0;
    grouped[row.candidate_id].match_count += row.match_count || 0;
  });

  // 승률 계산 및 정렬
  const withWinRate = Object.values(grouped).map(row => ({
    ...row,
    win_rate:
      row.match_count > 0
        ? Math.round((row.match_wins / row.match_count) * 10000) / 100 // 소수점 2자리(%)
        : 0,
  }));

  return withWinRate
    .sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))
    .slice(0, limit);
}
