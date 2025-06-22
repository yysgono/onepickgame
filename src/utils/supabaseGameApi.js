import { supabase } from "../utils/supabaseClient";

// 월드컵 게임 추가
export async function addWorldcupGame(gameData) {
  const { data, error } = await supabase
    .from("games") // 테이블명!
    .insert([gameData])
    .select()
    .single();
  if (error) {
    console.error("게임 저장 실패:", error);
    throw error;
  }
  return data.id; // 새로 생성된 row의 id
}

// 월드컵 게임 목록 불러오기
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("games") // 테이블명!
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("게임 목록 불러오기 실패:", error);
    throw error;
  }
  return data || [];
}

// ✅ 실시간 월드컵 게임 구독 (Supabase Realtime)
export function subscribeWorldcupGames(callback) {
  const channel = supabase
    .channel("games-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games" },
      (payload) => {
        getWorldcupGames().then(callback);
      }
    )
    .subscribe();

  getWorldcupGames().then(callback); // 최초 1회
  return () => supabase.removeChannel(channel);
}
