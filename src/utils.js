// ===== 이미지/유튜브 관련 =====

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

// ===========================================
// 유저별 기록: userWinnerStats[userId][cupId]
// 전체통계: winnerStats[cupId][itemId] (모든 유저 합산)
// ===========================================

// (1) 월드컵 1회 끝날 때마다 로그로 저장(기간별 집계용)
export function saveWinnerStatsWithUser(userId, cupId, winner, matchHistory) {
  const userStatsAll = JSON.parse(localStorage.getItem("userWinnerStats") || "{}");
  if (!userStatsAll[userId]) userStatsAll[userId] = {};
  const prevStats = userStatsAll[userId][cupId] || {};

  // 2. 전체 통계 불러오기
  const statsAll = JSON.parse(localStorage.getItem("winnerStats") || "{}");
  if (!statsAll[cupId]) statsAll[cupId] = {};
  const stats = statsAll[cupId];

  // 3. 이전 기록 전체통계에서 "빼기"
  Object.keys(prevStats).forEach(itemId => {
    const prev = prevStats[itemId];
    if (!stats[itemId]) return;
    stats[itemId].winCount -= prev.winCount || 0;
    stats[itemId].matchWins -= prev.matchWins || 0;
    stats[itemId].matchCount -= prev.matchCount || 0;
    stats[itemId].totalGames -= prev.totalGames || 0;
    Object.keys(stats[itemId]).forEach(k => {
      if (stats[itemId][k] < 0) stats[itemId][k] = 0;
    });
  });

  // 4. 새 기록 계산
  const newStats = {};
  matchHistory.forEach(({ c1, c2, winnerId }) => {
    [c1, c2].forEach(c => {
      if (!newStats[c.id]) newStats[c.id] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
      newStats[c.id].matchCount++;
    });
    if (!newStats[winnerId]) newStats[winnerId] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
    newStats[winnerId].matchWins++;
  });
  if (!newStats[winner.id]) newStats[winner.id] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
  newStats[winner.id].winCount = 1;
  newStats[winner.id].totalGames = 1;
  Object.keys(newStats).forEach(id => {
    if (id !== winner.id) newStats[id].totalGames = 1;
  });

  // 5. 새 기록 전체통계에 "더하기"
  Object.keys(newStats).forEach(itemId => {
    if (!stats[itemId]) stats[itemId] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
    stats[itemId].winCount += newStats[itemId].winCount;
    stats[itemId].matchWins += newStats[itemId].matchWins;
    stats[itemId].matchCount += newStats[itemId].matchCount;
    stats[itemId].totalGames += newStats[itemId].totalGames;
  });

  // 6. 저장
  userStatsAll[userId][cupId] = newStats;
  statsAll[cupId] = stats;
  localStorage.setItem("userWinnerStats", JSON.stringify(userStatsAll));
  localStorage.setItem("winnerStats", JSON.stringify(statsAll));

  // ================== 기간별 랭킹 로그 기록 ==================
  // (수정!) 이전 같은 userId, cupId 로그는 삭제하고 새로 기록!
  const now = Date.now();
  let allLogs = JSON.parse(localStorage.getItem("winnerStatsLog") || "[]");
  allLogs = allLogs.filter(log => !(log.userId === userId && log.cupId === cupId));

  const statsArr = {};
  matchHistory.forEach(({ c1, c2, winnerId }) => {
    [c1, c2].forEach(c => {
      if (!statsArr[c.id]) statsArr[c.id] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
      statsArr[c.id].matchCount++;
    });
    if (!statsArr[winnerId]) statsArr[winnerId] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
    statsArr[winnerId].matchWins++;
  });
  if (!statsArr[winner.id]) statsArr[winner.id] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
  statsArr[winner.id].winCount = 1;
  statsArr[winner.id].totalGames = 1;
  Object.keys(statsArr).forEach(id => {
    if (id !== winner.id) statsArr[id].totalGames = 1;
  });

  allLogs.push({
    cupId,
    userId,
    date: now,
    itemStats: statsArr
  });
  localStorage.setItem("winnerStatsLog", JSON.stringify(allLogs));
}

// 전체 기간 or 기간별 집계용 통계 가져오기
export function getWinnerStats(cupId, period = "all") {
  const all = JSON.parse(localStorage.getItem("winnerStatsLog") || "[]"); // [{cupId, itemStats, date}, ...]
  let from = 0;
  const now = Date.now();
  if (period === "1w") from = now - 7 * 24 * 60 * 60 * 1000;
  else if (period === "1m") from = now - 30 * 24 * 60 * 60 * 1000;
  else if (period === "3m") from = now - 90 * 24 * 60 * 60 * 1000;
  else if (period === "6m") from = now - 180 * 24 * 60 * 60 * 1000;
  else if (period === "1y") from = now - 365 * 24 * 60 * 60 * 1000;

  const filtered = all.filter(
    log => log.cupId === cupId && (period === "all" || log.date >= from)
  );

  // 집계: 아이템별 합산
  const stats = {};
  filtered.forEach(log => {
    Object.entries(log.itemStats).forEach(([id, val]) => {
      if (!stats[id]) stats[id] = { winCount: 0, matchWins: 0, matchCount: 0, totalGames: 0 };
      Object.keys(stats[id]).forEach(k => {
        stats[id][k] += val[k] || 0;
      });
    });
  });
  return stats;
}

// ====================================================
//  "최다 우승 후보" 반환 함수 (Home 카드에 사용)
// ====================================================
export function getMostWinner(cupId, cupData) {
  const stats = getWinnerStats(cupId, "all");
  if (!stats) return null;
  let maxWin = -1;
  let mostWinner = null;
  for (const c of cupData) {
    const stat = stats[c.id] || {};
    if ((stat.winCount || 0) > maxWin) {
      maxWin = stat.winCount || 0;
      mostWinner = c;
    }
  }
  return mostWinner;
}
