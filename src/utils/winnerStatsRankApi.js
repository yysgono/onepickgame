// 통계 집계, 순위 변환 등 확장 함수 필요시 여기에!
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
      total_games: 1,
    };
  });
  matchHistory.forEach(({ c1, c2, winner }) => {
    if (c1) statsMap[c1.id].match_count++;
    if (c2) statsMap[c2.id].match_count++;
    if (winner) statsMap[winner.id].match_wins++;
  });
  if (winner) {
    statsMap[winner.id].win_count = 1;
  }
  return Object.values(statsMap);
}
