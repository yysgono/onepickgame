import { supabase } from "./supabaseClient";

// 로그인 유저 or 비회원 구분 (항상 이 함수만 부르면 됨)
export async function getUserOrGuestId() {
  const { data } = await supabase.auth.getUser();
  if (data?.user?.id) {
    return { user_id: data.user.id, guest_id: null };
  } else {
    let guest_id = localStorage.getItem("guest_id");
    if (!guest_id) {
      guest_id = crypto.randomUUID();
      localStorage.setItem("guest_id", guest_id);
    }
    return { user_id: null, guest_id };
  }
}

// ✅ 결과 기록 (기존 기록 모두 삭제 후 insert → 항상 1개만 남김)
export async function upsertWinnerLog({ cup_id, winner_id }) {
  const { user_id, guest_id } = await getUserOrGuestId();

  // 1. 기존 winner_logs(동일 user/guest & cup_id) 삭제 (둘 중 하나만 조건에 들어감)
  let deleteQuery = supabase.from("winner_logs").delete().eq("cup_id", cup_id);
  if (user_id) {
    deleteQuery = deleteQuery.eq("user_id", user_id);
  } else if (guest_id) {
    deleteQuery = deleteQuery.eq("guest_id", guest_id);
  }
  await deleteQuery;

  // 2. 새 로그 추가 (insert)
  const { data, error } = await supabase
    .from("winner_logs")
    .insert([{ user_id, guest_id, cup_id, winner_id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 내 winner_logs(기록)만 조회
export async function getMyWinnerLogs({ cup_id } = {}) {
  const { user_id, guest_id } = await getUserOrGuestId();
  let query = supabase.from("winner_logs").select("*");
  if (user_id) query = query.eq("user_id", user_id);
  if (guest_id) query = query.eq("guest_id", guest_id);
  if (cup_id) query = query.eq("cup_id", cup_id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
