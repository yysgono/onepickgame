import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "user id required" });
  }

  // TODO: 본인 인증, 토큰 검사 및 권한 체크 추가

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "User deleted successfully" });
}
