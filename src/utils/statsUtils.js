// src/utils/statsUtils.js
// 통계 계산 공용 유틸 (StatsPage/ResultPage 모두에서 동일 로직 사용)

export function percent(n, d) {
  if (!d) return "-";
  return Math.round((n / d) * 100) + "%";
}

// 일부 예전 레코드 보정 + 표시/검색/정렬용 필드 사전 계산
export function normalizeStats(arr) {
  const out = (arr || []).map((r) => {
    const win_count = Number(r.win_count || 0);
    const match_wins = Number(r.match_wins || 0);
    const match_count_raw = Number(r.match_count || 0);
    const total_games_raw = Number(r.total_games || 0);

    const match_count = Math.max(match_count_raw, match_wins, win_count);

    // total_games가 0인데 기록이 있다면 최소 1
    const hasAny = win_count > 0 || match_wins > 0 || match_count_raw > 0;
    const total_games = total_games_raw > 0 ? total_games_raw : hasAny ? 1 : 0;

    const user_win_count = Number(r.user_win_count || 0);
    const user_match_wins = Number(r.user_match_wins || 0);
    const user_match_count_raw = Number(r.user_match_count || 0);
    const user_total_games_raw = Number(r.user_total_games || 0);
    const user_match_count = Math.max(
      user_match_count_raw,
      user_match_wins,
      user_win_count
    );
    const userHasAny =
      user_win_count > 0 ||
      user_match_wins > 0 ||
      user_match_count_raw > 0;
    const user_total_games =
      user_total_games_raw > 0 ? user_total_games_raw : userHasAny ? 1 : 0;

    const display = {
      winRateAll: percent(win_count, total_games),
      winRateUser: percent(user_win_count, user_total_games),
      matchRateAll: percent(match_wins, match_count),
      matchRateUser: percent(user_match_wins, user_match_count),
    };

    // 정렬용 숫자 승률 사전 계산
    const win_rate_num = total_games ? win_count / total_games : 0;
    const match_win_rate_num = match_count ? match_wins / match_count : 0;

    return {
      ...r,
      win_count,
      match_wins,
      match_count,
      total_games,
      user_win_count,
      user_match_wins,
      user_match_count,
      user_total_games,
      _name_lc: (r.name || "").toLowerCase(),
      _display: display,
      win_rate_num,
      match_win_rate_num,
    };
  });
  return out;
}
