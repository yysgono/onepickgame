import { supabase } from "./supabaseClient";

export async function addGuestComment({ kind, targetId, nickname, password, content }) {
  const { data, error } = await supabase.rpc("add_guest_comment", {
    p_kind: kind,
    p_target_id: targetId,
    p_nickname: nickname,
    p_password: password,
    p_content: content,
  });
  if (error) throw error;
  return data;
}

export async function manageGuestComment({ kind, commentId, password, action, content = null }) {
  const { data, error } = await supabase.rpc("manage_guest_comment", {
    p_kind: kind,
    p_comment_id: String(commentId),
    p_password: password,
    p_action: action,
    p_content: content,
  });
  if (error) throw error;
  if (data !== true) throw new Error("COMMENT_PASSWORD_OR_PERMISSION_INVALID");
  return true;
}
