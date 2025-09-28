// src/utils/fetchWinnerStatsFromDB.js
import { supabase } from "./supabaseClient";

/**
 * 후보별 통계 집계:
 * - win_count: 과거 기록 포함 "모든 레코드" 누적 합산
 * - match_wins / match_count / total_games:
 *    같은 사용자(user_id 또는 guest_id)가 같은 후보를 여러 번 플레이했다면
 *    => "가장 최신 1회"만 반영 (중복 플레이 과대계산 방지)
 * - user_* 필드: 로그인 사용자(user_id 존재)인 경우에만 합산
 *
 * 기간 필터:
 *  - since === null/undefined  : 전체
 *  - since === string(ISO)     : created_at >= since
 *  - since === {from, to}      : from <= created_at <= to
 */
export async function fetchWinnerStatsFromDB(cupId, since, _opts = {}) {
  if (!cupId) return [];

  const PAGE = 1000;
  let from = 0;
  let to = PAGE - 1;
  const allRows = [];

  // 최신순으로 전 페이지 가져오기 (이 순서를 이용해서 "최신 1회" 판정)
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

  // 준비: 후보별 누적 객체 + '유저×후보' 최신 1회 맵
  const aggregated = new Map(); // key: candidate_id -> obj
  const latestPerUserCandidate = new Map(); // key: `${userKey}-${cid}` -> row

  // 1) 모든 레코드 순회하며:
  //   - win_count는 무조건 누적
  //   - latestPerUserCandidate는 최초(=최신)만 저장
  for (const row of allRows) {
    const cid = row.candidate_id;
    if (!aggregated.has(cid)) {
      aggregated.set(cid, {
        candidate_id: cid,
        name: row.name || "",
        image: row.image || "",
        // 전체 누적
        win_count: 0,
        match_wins: 0,
        match_count: 0,
        total_games: 0,
        // 회원 전용
        user_win_count: 0,
        user_match_wins: 0,
        user_match_count: 0,
        user_total_games: 0,
        // 최신 시각
        last_played: row.created_at,
      });
    }
    const agg = aggregated.get(cid);

    // win_count는 과거 포함 전부 누적
    const w = Number(row.win_count || 0);
    if (w) {
      agg.win_count += w;
      if (row.user_id) agg.user_win_count += w; // 회원 전용 누적
    }

    // 가장 최근 name/image/last_played 업데이트
    if (!agg.last_played || row.created_at > agg.last_played) {
      agg.last_played = row.created_at;
    }
    // 최신값 우선 (이미 최신순이므로 첫 값이 최신)
    if (!agg._hasLatestMeta) {
      if (row.name) agg.name = row.name;
      if (row.image) agg.image = row.image;
      agg._hasLatestMeta = true;
    }

    // '유저 × 후보' 조합의 최신 1회만 보관
    const userKey = row.user_id || row.guest_id || "anon";
    const key = `${userKey}-${cid}`;
    if (!latestPerUserCandidate.has(key)) {
      latestPerUserCandidate.set(key, row);
    }
  }

  // 2) 최신 1회 맵을 이용해 match_wins/match_count/total_games 합산
  for (const row of latestPerUserCandidate.values()) {
    const cid = row.candidate_id;
    const agg = aggregated.get(cid);
    if (!agg) continue;

    const mw = Number(row.match_wins || 0);
    const mc = Number(row.match_count || 0);
    const tg = Number(row.total_games || 0);

    agg.match_wins += mw;
    agg.match_count += mc;
    agg.total_games += tg;

    if (row.user_id) {
      agg.user_match_wins += mw;
      agg.user_match_count += mc;
      agg.user_total_games += tg;
    }
  }

  // 3) 결과 배열 변환 + 정렬
  const result = Array.from(aggregated.values())
    .map(({ _hasLatestMeta, ...rest }) => rest)
    .sort((a, b) => {
      if (b.win_count !== a.win_count) return b.win_count - a.win_count;
      return b.match_wins - a.match_wins;
    });

  return result;
}
