import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // === POST: 게시글 등록 ===
  if (req.method === "POST") {
    const { title, content, author_id, type } = req.body;

    if (!title || !content || !author_id) {
      return res.status(400).json({ error: "제목, 내용, 작성자 필수" });
    }

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            content,
            author_id,
            type: type || "normal",
            // created_at: new Date().toISOString(), // DB에서 자동 생성되면 생략!
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message || "등록 실패" });
    }
  }

  // === GET: 게시글 목록/필터/페이징 ===
  if (req.method === "GET") {
    const {
      page = 1,
      limit = 20,
      type = "",
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (type) {
      query = query.eq("type", type);
    }

    try {
      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (err) {
      return res.status(500).json({ error: err.message || "불러오기 실패" });
    }
  }

  // === 기타: 지원하지 않는 Method ===
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
