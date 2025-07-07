import { supabase } from "./supabaseClient";

// 고정월드컵 worldcup_id만 가져오기
export async function getFixedCupIds() {
  const { data, error } = await supabase
    .from("fixed_worldcups")
    .select("worldcup_id, order")
    .order("order", { ascending: true });

  if (error) throw error;
  return data.map(row => row.worldcup_id);
}

// 상세정보까지 한 번에
export async function getFixedCupsWithInfo() {
  // 1. 고정 월드컵 id 리스트
  const { data: idRows, error } = await supabase
    .from("fixed_worldcups")
    .select("worldcup_id, order")
    .order("order", { ascending: true });
  if (error) throw error;

  const ids = idRows.map(row => row.worldcup_id);

  if (!ids.length) return [];
  // 2. 해당 id의 worldcups 정보
  const { data: cups, error: error2 } = await supabase
    .from("worldcups")
    .select("id, title, thumbnail")
    .in("id", ids);

  if (error2) throw error2;

  // 정렬 순서 맞추기
  return ids.map(id => cups.find(c => c.id === id)).filter(Boolean);
}
