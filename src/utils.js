// src/utils.js
import { supabase } from "./utils/supabaseClient";

/* ======================= YouTube 유틸 ======================= */
export function getYoutubeId(url = "") {
  if (!url) return "";
  const reg =
    /(?:youtube\.com\/.*[?&]v=|youtube\.com\/(?:v|embed)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(reg);
  return match ? match[1] : "";
}

export function getThumbnail(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://img.youtube.com/vi/${ytid}/mqdefault.jpg`;
  return url || "";
}

export function isValidImageUrl(url = "") {
  return /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(url) && !getYoutubeId(url);
}

export function getYoutubeEmbed(url = "") {
  const ytid = getYoutubeId(url);
  if (ytid) return `https://www.youtube.com/embed/${ytid}?autoplay=0&mute=1`;
  return "";
}

/* ================= Recent Worldcups (localStorage) ================= */
export function pushRecentWorldcup(id) {
  if (!id || typeof window === "undefined") return;

  try {
    const KEY = "onepickgame_recentWorldcups";
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");

    const next = [
      id,
      ...arr.filter((x) => String(x) !== String(id)),
    ].slice(0, 30);

    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

/* ===================== Guest / User ID ===================== */
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");

  if (!guestId) {
    guestId =
      crypto.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now();

    localStorage.setItem("guest_id", guestId);
  }

  return guestId;
}

export async function getUserOrGuestId() {
  const { data } = await supabase.auth.getUser();

  if (data?.user?.id) {
    return {
      user_id: data.user.id,
      guest_id: null,
    };
  }

  return {
    user_id: null,
    guest_id: getOrCreateGuestId(),
  };
}

/* ===================== Worldcup CRUD ===================== */
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function addWorldcupGame(cup) {
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateWorldcupGame(id, updates) {
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

/* ================ winner_logs / stats ================ */
export async function deleteOldWinnerLogAndStats(cup_id) {
  const { user_id, guest_id } = await getUserOrGuestId();

  let deleteQuery = supabase
    .from("winner_logs")
    .delete()
    .eq("cup_id", cup_id);

  if (user_id) {
    deleteQuery = deleteQuery.eq("user_id", user_id);
  }

  if (guest_id) {
    deleteQuery = deleteQuery.eq("guest_id", guest_id);
  }

  await deleteQuery;

  let statsDelete = supabase
    .from("winner_stats")
    .delete()
    .eq("cup_id", cup_id);

  if (user_id) {
    statsDelete = statsDelete.eq("user_id", user_id);
  }

  if (guest_id) {
    statsDelete = statsDelete.eq("guest_id", guest_id);
  }

  await statsDelete;
}

export async function insertWinnerLog(cup_id, winner_id = null) {
  const { user_id, guest_id } = await getUserOrGuestId();

  const { error } = await supabase
    .from("winner_logs")
    .insert([
      {
        user_id,
        guest_id,
        cup_id,
        winner_id,
      },
    ]);

  if (error) {
    if (
      error.code === "23505" ||
      error.message?.includes("duplicate")
    ) {
      return false;
    }

    return false;
  }

  return true;
}
export async function upsertMyWinnerStat({
  cup_id,
  candidate_id,
  win_count = 0,
  match_wins = 0,
  total_games = 0,
  name = "",
  image = "",
  match_count = 0,
}) {
  const { user_id, guest_id } = await getUserOrGuestId();

  const payload = {
    cup_id,
    candidate_id,
    win_count,
    match_wins,
    total_games,
    name,
    image,
    match_count,
    user_id,
    guest_id,
  };

  const { data, error } = await supabase
    .from("winner_stats")
    .upsert([payload], {
      onConflict: [
        "user_id",
        "guest_id",
        "cup_id",
        "candidate_id",
      ],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertMyWinnerStat_parallel(
  statsArr,
  cup_id
) {
  const { user_id, guest_id } = await getUserOrGuestId();

  const rows = statsArr.map((stat) => ({
    ...stat,
    cup_id,
    user_id,
    guest_id,
  }));

  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, {
      onConflict: [
        "user_id",
        "guest_id",
        "cup_id",
        "candidate_id",
      ],
    });

  if (error) throw error;
}

export async function getMyWinnerStats({ cup_id } = {}) {
  const { user_id, guest_id } = await getUserOrGuestId();

  let query = supabase
    .from("winner_stats")
    .select("*");

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (guest_id) {
    query = query.eq("guest_id", guest_id);
  }

  if (cup_id) {
    query = query.eq("cup_id", cup_id);
  }

  const { data, error } = await query.order(
    "created_at",
    { ascending: false }
  );

  if (error) throw error;
  return data;
}

/* ================== 통계 가져오기 (RPC + 캐시) ================== */
/**
 * Supabase Database Function(get_winner_stats)에서 통계를 집계해 가져옵니다.
 * - 전체 winner_stats 행을 브라우저로 내려받지 않습니다.
 * - 기간 필터(All / 최근 N일 / 사용자 지정 기간)를 지원합니다.
 * - 5분 TTL 캐시(sessionStorage 우선, localStorage 보조)
 */
const STATS_CACHE_TTL = 5 * 60 * 1000;

function readStatsCache(key) {
  try {
    const raw =
      sessionStorage.getItem(key) ||
      localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (
      Date.now() - parsed.savedAt >
      STATS_CACHE_TTL
    ) {
      return null;
    }

    return parsed.data || null;
  } catch {
    return null;
  }
}

function writeStatsCache(key, data) {
  try {
    const payload = JSON.stringify({
      savedAt: Date.now(),
      data,
    });

    sessionStorage.setItem(key, payload);

    try {
      localStorage.setItem(key, payload);
    } catch {}
  } catch {}
}

export async function fetchWinnerStatsFromDB(
  cup_id,
  since = null
) {
  if (!cup_id) return [];

  const isCustomRange =
    since &&
    typeof since === "object" &&
    typeof since.from === "string" &&
    typeof since.to === "string";

  const sinceKey = isCustomRange
    ? `from:${since.from}|to:${since.to}`
    : typeof since === "string"
    ? `since:${since}`
    : "all";


  let p_from = null;
  let p_to = null;

  if (isCustomRange) {
    p_from = since.from;
    p_to = since.to;
  } else if (typeof since === "string") {
    p_from = since;
  }

  const { data, error } = await supabase.rpc(
    "get_winner_stats",
    {
      p_cup_id: cup_id,
      p_from,
      p_to,
    }
  );

  if (error) {
    console.error(
      "get_winner_stats RPC error:",
      error
    );

    throw error;
  }

  const result = (data || []).map((row) => ({
    ...row,
    win_count: Number(row.win_count || 0),
    match_wins: Number(row.match_wins || 0),
    match_count: Number(row.match_count || 0),
    total_games: Number(row.total_games || 0),
    user_win_count: Number(
      row.user_win_count || 0
    ),
    user_match_wins: Number(
      row.user_match_wins || 0
    ),
    user_match_count: Number(
      row.user_match_count || 0
    ),
    user_total_games: Number(
      row.user_total_games || 0
    ),
  }));

  return result;
}
/* ================ 계산 함수 ================ */
export function calcStatsFromMatchHistory(
  candidates,
  winner,
  matchHistory
) {
  const statsMap = {};

  candidates.forEach((c) => {
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

  if (!Array.isArray(matchHistory)) {
    matchHistory = [];
  }

  matchHistory.forEach(
    ({ c1, c2, winner: w }) => {
      if (c1) {
        statsMap[c1.id].match_count++;
      }

      if (c2) {
        statsMap[c2.id].match_count++;
      }

      if (w) {
        statsMap[w.id].match_wins++;
      }
    }
  );

  if (winner) {
    statsMap[winner.id].win_count = 1;
    statsMap[winner.id].total_games = 1;

    Object.keys(statsMap).forEach((id) => {
      if (id !== winner.id) {
        statsMap[id].total_games = 1;
      }
    });
  }

  return Object.values(statsMap);
}

export function getMostWinnerFromDB(
  statsArr,
  cupData
) {
  if (!statsArr || !Array.isArray(statsArr)) {
    return null;
  }

  let maxWin = -1;
  let mostWinner = null;

  for (const stat of statsArr) {
    if ((stat.win_count || 0) > maxWin) {
      maxWin = stat.win_count || 0;

      mostWinner = cupData.find(
        (c) =>
          String(c.id) ===
          String(stat.candidate_id)
      );
    }
  }

  return mostWinner;
}

/* ===== 호환성 별칭 ===== */
export const fetchWinnerStatsFast =
  fetchWinnerStatsFromDB;

export const fetchWinnerStatsFromDB_SLOW =
  fetchWinnerStatsFromDB;