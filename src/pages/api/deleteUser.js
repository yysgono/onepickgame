import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

Deno.serve(async (req) => {
  const { id } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: "user id required" }), { status: 400 });
  }

  // 👇 인증 토큰 검사(본인만 삭제 가능하게)
  const authHeader = req.headers.get("Authorization") || "";
  // 토큰 파싱/검증 (추가 필요)
  // ...jwt verify로 id와 일치하는지 체크

  // 👇 admin 권한으로 유저 삭제
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ message: "deleted" }), { status: 200 });
});
