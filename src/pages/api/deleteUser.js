import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // Supabase 프로젝트의 JWT 시크릿키

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "user id required" });
  }

  // 1) Authorization 헤더에서 Bearer 토큰 가져오기
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or malformed" });
  }
  const token = authHeader.split(" ")[1];

  try {
    // 2) JWT 토큰 검증 (서명 및 유효기간 체크)
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);

    // 3) 토큰 내 유저 ID와 요청 삭제할 유저 ID 비교 (본인 삭제만 허용)
    if (decoded.sub !== id) {
      return res.status(403).json({ error: "You can only delete your own account" });
    }

    // 4) 유저 삭제
    const { error } = await supabaseAdmin.auth.admin.deleteuser(id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
