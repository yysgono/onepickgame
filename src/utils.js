import { supabase } from "./utils/supabaseClient";

// ========== 유튜브 관련 ==========

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

// ========== 월드컵 게임 관련 (supabase) ==========

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

// ========== 통계 관련 (supabase) ==========

export async function saveWinnerStatsWithUserSupabase(userId, cupId, matchWinner, matchHistory, candidateData) {
  if (!candidateData || !Array.isArray(candidateData) || candidateData.length === 0) {
    console.error("saveWinnerStatsWithUserSupabase: candidateData가 필요합니다!", {cupId, candidateData});
    return;
  }

  const stats = {};
  candidateData.forEach((c) => {
    stats[c.id] = {
      winCount: 0,
      matchWins: 0,
      matchCount: 0,
      totalGames: 0,
      name: c.name,
      image: c.image,
    };
  });

  matchHistory.forEach(({ c1, c2, winner }) => {
    if (c1 && stats[c1.id]) stats[c1.id].matchCount++;
    if (c2 && stats[c2.id]) stats[c2.id].matchCount++;
    if (winner && stats[winner.id]) stats[winner.id].matchWins++;
  });

  if (matchWinner && stats[matchWinner.id]) {
    stats[matchWinner.id].winCount = 1;
    stats[matchWinner.id].totalGames = 1;
  }
  Object.keys(stats).forEach((id) => {
    if (!matchWinner || id !== matchWinner.id) stats[id].totalGames = 1;
  });

  const rows = Object.entries(stats).map(([candidate_id, stat]) => ({
    cup_id: cupId,
    candidate_id,
    win_count: stat.winCount,
    match_wins: stat.matchWins,
    match_count: stat.matchCount,
    total_games: stat.totalGames,
    name: stat.name,
    image: stat.image,
    updated_at: new Date().toISOString(),
    user_id: userId,
  }));

  const { error } = await supabase
    .from("winner_stats")
    .upsert(rows, { onConflict: ["cup_id", "candidate_id"] });

  if (error) throw error;
  return true;
}

export async function getWinnerStatsSupabase(cupId) {
  const { data, error } = await supabase
    .from("winner_stats")
    .select("*")
    .eq("cup_id", cupId);

  if (error) throw error;

  const stats = {};
  data.forEach((row) => {
    stats[row.candidate_id] = {
      winCount: row.win_count || 0,
      matchWins: row.match_wins || 0,
      matchCount: row.match_count || 0,
      totalGames: row.total_games || 0,
      name: row.name,
      image: row.image,
    };
  });
  return stats;
}

export function getMostWinner(cupId, candidateData, stats) {
  if (!stats) return null;
  let maxWin = -1;
  let mostWinner = null;
  for (const c of candidateData) {
    const stat = stats?.[c.id] || {};
    if ((stat.winCount || 0) > maxWin) {
      maxWin = stat.winCount || 0;
      mostWinner = c;
    }
  }
  return mostWinner;
}
