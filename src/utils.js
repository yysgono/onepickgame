import { supabase } from "./utils/supabaseClient";

// ===== 유튜브 관련 함수 =====
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

// ===== DB 통계 함수 =====
export async function fetchWinnerStatsFromDB(cupId) {
  const { data, error } = await supabase.from("winner_stats").select("*").eq("cup_id", cupId);

  if (error) {
    console.error("DB fetch error", error);
    return [];
  }
  return data || [];
}

export async function saveWinnerStatsToDB(cupId, statsArr) {
  const rows = statsArr.map((row) => ({
    ...row,
    cup_id: cupId,
    win_count: row.win_count || 0,
    match_wins: row.match_wins || 0,
    match_count: row.match_count || 0,
    total_games: row.total_games || 0,
    name: row.name || "",
    image: row.image || "",
  }));

  const { error } = await supabase.from("winner_stats").upsert(rows, { onConflict: ["cup_id", "candidate_id"] });

  if (error) {
    console.error("DB save error", error);
    return false;
  }
  return true;
}

export function calcStatsFromMatchHistory(candidates, winner, matchHistory) {
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
  matchHistory.forEach(({ c1, c2, winner }) => {
    if (c1) statsMap[c1.id].match_count++;
    if (c2) statsMap[c2.id].match_count++;
    if (winner) statsMap[winner.id].match_wins++;
  });
  if (winner) {
    statsMap[winner.id].win_count = 1;
    statsMap[winner.id].total_games = 1;
    Object.keys(statsMap).forEach((id) => {
      if (id !== winner.id) statsMap[id].total_games = 1;
    });
  }
  return Object.values(statsMap);
}

export function getMostWinnerFromDB(statsArr, cupData) {
  if (!statsArr || !Array.isArray(statsArr)) return null;
  let maxWin = -1;
  let mostWinner = null;
  for (const stat of statsArr) {
    if ((stat.win_count || 0) > maxWin) {
      maxWin = stat.win_count || 0;
      mostWinner = cupData.find((c) => String(c.id) === String(stat.candidate_id));
    }
  }
  return mostWinner;
}

// ===== 비회원 guest_id =====
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}

// ===== winner_logs upsert =====
export async function upsertWinnerLog(cupId, userId, guestId, winnerId) {
  const match = { cup_id: cupId };
  if (userId) match.user_id = userId;
  else match.guest_id = guestId;

  try {
    // 기존 기록 찾기
    const { data, error } = await supabase.from("winner_logs").select("id").match(match).maybeSingle();

    if (error) {
      console.error("winner_logs select error", error);
      return false;
    }

    if (data?.id) {
      // 기존 기록 있으면 업데이트
      await supabase.from("winner_logs").update({ winner_id: winnerId, created_at: new Date().toISOString() }).eq("id", data.id);
      return false;
    } else {
      // 기존 기록 없으면 새로 인서트
      await supabase.from("winner_logs").insert([{ ...match, winner_id: winnerId }]);
      return true;
    }
  } catch (error) {
    console.error("winner_logs upsert error", error);
    return false;
  }
}
