// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const SITE_URL = "https://www.onepickgame.com";

const BLOG_LANGUAGES = [
  "ko",
  "en",
  "ja",
  "zh",
  "es",
  "fr",
  "vi",
  "de",
  "ru",
  "id",
  "pt",
  "hi",
  "tr",
  "th",
  "ar",
  "bn",
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/*
 * 블로그 자동 사이트맵
 *
 * 주소:
 * https://www.onepickgame.com/api/sitemap-blog
 *
 * Supabase blog_posts 테이블의 language와 slug를 읽어서
 * 블로그 사이트맵을 자동 생성합니다.
 */
app.get("/api/sitemap-blog", async (req, res) => {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from("blog_posts")
      .select("language, slug")
      .order("language", { ascending: true })
      .order("slug", { ascending: true });

    if (error) {
      throw error;
    }

    const urls = new Set();

    // 각 언어의 블로그 목록 페이지
    for (const language of BLOG_LANGUAGES) {
      urls.add(`${SITE_URL}/${language}/blog`);
    }

    // Supabase에 저장된 블로그 상세 페이지
    for (const post of posts || []) {
      const language = String(post.language || "").trim();
      const slug = String(post.slug || "").trim();

      if (!language || !slug) {
        continue;
      }

      if (!BLOG_LANGUAGES.includes(language)) {
        continue;
      }

      urls.add(
        `${SITE_URL}/${language}/blog/${encodeURIComponent(slug)}`
      );
    }

    const urlItems = Array.from(urls)
      .sort()
      .map(
        (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
      )
      .join("\n\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urlItems}

</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    return res.status(200).send(xml);
  } catch (err) {
    console.error("블로그 사이트맵 생성 오류:", err);

    return res
      .status(500)
      .type("text/plain")
      .send(`사이트맵 생성 실패: ${err.message || "알 수 없는 오류"}`);
  }
});

/*
 * 회원 탈퇴
 */
app.post("/api/deleteuser", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      error: "user id required",
    });
  }

  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);

    if (decoded.sub !== id) {
      return res.status(403).json({
        error: "You can only delete your own account",
      });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
});

/*
 * 게시글 등록
 */
app.post("/api/board", async (req, res) => {
  const { title, content, author_id, type } = req.body;

  if (!title || !content || !author_id) {
    return res.status(400).json({
      error: "제목, 내용, 작성자 필수",
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert([
        {
          title,
          content,
          author_id,
          type: type || "normal",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: err.message || "등록 실패",
    });
  }
});

/*
 * 게시글 목록
 */
app.get("/api/board", async (req, res) => {
  const { page = 1, limit = 20, type = "" } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 20;

  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("posts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type) {
    query = query.eq("type", type);
  }

  try {
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: err.message || "불러오기 실패",
    });
  }
});

/*
 * 로컬 실행용
 */
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

/*
 * Vercel 실행용
 */
module.exports = app;