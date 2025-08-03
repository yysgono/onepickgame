import { supabase } from "./supabaseClient";

// 월드컵 전체 조회
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 월드컵 단일 조회
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("월드컵 데이터를 찾을 수 없습니다.");
  return data;
}

// 월드컵 추가 (id만 반환)
export async function addWorldcupGame(cup) {
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// 월드컵 수정
export async function updateWorldcupGame(id, updates) {
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return true;
}

// 월드컵 삭제 (Storage 이미지도 자동 삭제)
export async function deleteWorldcupGame(id) {
  // 1. 삭제 전, 월드컵 data(jsonb) 불러오기
  const { data: worldcup, error: fetchError } = await supabase
    .from("worldcups")
    .select("data")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // 2. 후보 이미지 경로 추출 (supabase storage url만)
  let imagePaths = [];
  if (worldcup && Array.isArray(worldcup.data)) {
    imagePaths = worldcup.data
      .map(c => {
        if (!c?.image || typeof c.image !== "string") return null;
        if (c.image.startsWith("data:image")) return null; // base64는 삭제 X
        // supabase storage url 경로 추출
        const match = c.image.match(/\/storage\/v1\/object\/public\/(.+)$/);
        if (match) return match[1]; // "candidates/..." 형태
        // 상대경로로 저장된 경우 (candidates/...) 도 삭제 지원
        if (c.image.startsWith("candidates/")) return c.image;
        return null;
      })
      .filter(Boolean);
  }

  // 3. Storage에서 이미지 일괄 삭제
  if (imagePaths.length > 0) {
    // unique(중복 제거)
    const uniqPaths = [...new Set(imagePaths)];
    await supabase.storage.from("candidates").remove(uniqPaths);
  }

  // 4. DB에서 월드컵 row 삭제
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;

  return true;
}
