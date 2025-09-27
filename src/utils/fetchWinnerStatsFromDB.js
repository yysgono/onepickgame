// src/utils/fetchWinnerStatsFromDB.js
import { supabase } from "./supabaseClient";

/**
 * winner_stats 전체에서 "유저당 마지막 1회"만 집계하여
 * 후보별 합산을 반환합니다.
 *
 * - created_at DESC로 전부 읽어오되(1,000개 페이지네이션),
 *   user_id/guest_id + candidate_id 기준으로 "가장 최신" 레코드만 반영
 * - 회원 전용 집계(user_*)도 함께 반환 (user_id 존재하는 경우에만 합산)
 * - 기간 필터:
 *    - null/undefined: 전체
 *    - string(ISO): created_at >= since
 *    - { from, to }: created_at BETWEEN from AND to
 *
 * 반환 필드(후보별):
 * {
 *   candidate_id, name, image,
 *   win_count, match_wins, match_count, total_games,         // 전체
 *   user_win_count, user_match_wins, user_match_count, user_total_games, // 회원 전용
 *   last_played // 가장 최근 기록 시간
 * }
 */
export async function fetchWinnerStatsFromDB(cupId, since, _opts = {}) {
  if (!cupId) return [];

  const PAGE = 1000;
  let from = 0;
  let to = PAGE - 1;
  const allRows = [];

  // 페이지네이션으로 전부 가져오기 (최신순)
  // name,image도 함께 선택 (카드/테이블 표시용)
  while (true) {
    let query = supabase
      .from("winner_stats")
      .select(
        "id,cup_id,candidate_id,name,image,user_id,guest_id,win_count,match_wins,match_count,total_games,created_at",
        { count: "exact" }
      )
      .eq("cup_id", cupId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (since) {
      if (typeof since === "object" && since.from && since.to) {
        query = query.gte("created_at", since.from).lte("created_at", since.to);
      } else if (typeof since === "string") {
        query = query.gte("created_at", since);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("fetchWinnerStatsFromDB error:", error);
      return [];
    }

    if (data && data.length) allRows.push(...data);
    if (!data || data.length < PAGE) break;

    from += PAGE;
    to += PAGE;
  }

  // 1) "유저당 마지막 1회"만 남겨두기
  // key = `${user_id || guest_id || 'anon'}-${candidate_id}`
  const latestByUserAndCandidate = new Map();
  for (const row of allRows) {
    const userKey = row.user_id || row.guest_id || "anon";
    const key = `${userKey}-${row.candidate_id}`;
    if (!latestByUserAndCandidate.has(key)) {
      // created_at DESC로 읽었으니 최초가 최신
      latestByUserAndCandidate.set(key, row);
    }
  }

  // 2) 후보별 합산 (전체 + 회원전용)
  const aggregated = {};
  for (const row of latestByUserAndCandidate.values()) {
    const cid = row.candidate_id;
    if (!aggregated[cid]) {
      aggregated[cid] = {
        candidate_id: cid,
        name: row.name || "",
        image: row.image || "",
        // 전체 집계
        win_count: 0,
        match_wins: 0,
        match_count: 0,
        total_games: 0,
        // 회원 전용 집계
        user_win_count: 0,
        user_match_wins: 0,
        user_match_count: 0,
        user_total_games: 0,
        // 최근 기록
        last_played: row.created_at,
      };
    }

    // 전체
    aggregated[cid].win_count += Number(row.win_count || 0);
    aggregated[cid].match_wins += Number(row.match_wins || 0);
    aggregated[cid].match_count += Number(row.match_count || 0);
    aggregated[cid].total_games += Number(row.total_games || 0);

    // 회원 전용(로그인 사용자에 한해)
    if (row.user_id) {
      aggregated[cid].user_win_count += Number(row.win_count || 0);
      aggregated[cid].user_match_wins += Number(row.match_wins || 0);
      aggregated[cid].user_match_count += Number(row.match_count || 0);
      aggregated[cid].user_total_games += Number(row.total_games || 0);
    }

    // 가장 최근 시각 갱신
    if (row.created_at > aggregated[cid].last_played) {
      aggregated[cid].last_played = row.created_at;
    }

    // name/image 최신값 우선
    if (row.created_at >= aggregated[cid].last_played) {
      if (row.name) aggregated[cid].name = row.name;
      if (row.image) aggregated[cid].image = row.image;
    }
  }

  // 3) 배열로 변환 + 정렬 (우승수 → 대결승수)
  const result = Object.values(aggregated).sort((a, b) => {
    if (b.win_count !== a.win_count) return b.win_count - a.win_count;
    return b.match_wins - a.match_wins;
  });

  return result;
}
