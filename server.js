// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/*
 * 환경변수
 *
 * 현재 Vercel에 등록된 CRA 환경변수와
 * 기존 서버 환경변수 이름을 모두 지원합니다.
 */
const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_URL) {
  throw new Error(
    "REACT_APP_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 환경변수가 필요합니다."
  );
}

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "REACT_APP_SUPABASE_ANON_KEY 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다."
  );
}

/*
 * 일반 Supabase 클라이언트
 *
 * service role key가 있으면 그것을 우선 사용하고,
 * 없으면 anon key를 사용합니다.
 */
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/*
 * 관리자 기능 전용 클라이언트
 *
 * service role key가 등록된 경우에만 생성됩니다.
 */
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/*
 * 사이트 기본 주소
 */
const SITE_URL = "https://www.onepickgame.com";

/*
 * IndexNow 설정
 */
const INDEXNOW_KEY =
  "onepickgame-indexnow-2026-7f3a9c8d";

const INDEXNOW_KEY_LOCATION =
  `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const INDEXNOW_ENDPOINT =
  "https://api.indexnow.org/indexnow";

/*
 * 블로그 지원 언어
 */
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

/*
 * XML 특수문자 처리
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/*
 * IndexNow로 URL 목록 전송
 */
async function submitIndexNow(urls) {
  const urlList = Array.isArray(urls)
    ? urls
    : [urls];

  if (urlList.length === 0) {
    throw new Error("IndexNow에 제출할 URL이 없습니다.");
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host: "www.onepickgame.com",
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList,
    }),
  });

  const responseText = await response.text();

  console.log(
    "IndexNow 응답:",
    response.status,
    response.statusText,
    responseText
  );

  if (!response.ok) {
    throw new Error(
      `IndexNow 제출 실패: ${response.status} ${
        response.statusText || ""
      } ${responseText || ""}`.trim()
    );
  }

  return {
    status: response.status,
    statusText: response.statusText,
    submittedCount: urlList.length,
  };
}

/*
 * 서버 상태 확인
 *
 * 주소:
 * https://www.onepickgame.com/api/health
 */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    supabaseUrlConfigured: Boolean(SUPABASE_URL),
    anonKeyConfigured: Boolean(SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(
      SUPABASE_SERVICE_ROLE_KEY
    ),
    jwtSecretConfigured: Boolean(
      SUPABASE_JWT_SECRET
    ),
    indexNowConfigured: Boolean(INDEXNOW_KEY),
  });
});

/*
 * 블로그 자동 사이트맵
 *
 * 주소:
 * https://www.onepickgame.com/api/sitemap-blog
 */
app.get("/api/sitemap-blog", async (req, res) => {
  try {
    const { data: posts, error } = await supabase
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

    // Supabase에 저장된 블로그 글
    for (const post of posts || []) {
      const language = String(
        post.language || ""
      )
        .trim()
        .toLowerCase();

      const slug = String(
        post.slug || ""
      ).trim();

      if (!language || !slug) {
        continue;
      }

      if (!BLOG_LANGUAGES.includes(language)) {
        continue;
      }

      urls.add(
        `${SITE_URL}/${language}/blog/${encodeURIComponent(
          slug
        )}`
      );
    }

    const urlXml = Array.from(urls)
      .sort()
      .map(
        (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
      )
      .join("\n\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urlXml}

</urlset>
`;

    res.setHeader(
      "Content-Type",
      "application/xml; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    return res.status(200).send(xml);
  } catch (err) {
    console.error(
      "블로그 사이트맵 생성 오류:",
      err
    );

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    return res.status(500).send(
      `사이트맵 생성 실패: ${
        err?.message || "알 수 없는 오류"
      }`
    );
  }
});

/*
 * IndexNow 블로그 URL 제출
 *
 * Supabase의 blog_posts를 읽어
 * 모든 블로그 목록 및 상세 URL을 제출합니다.
 *
 * 주소:
 * https://www.onepickgame.com/api/indexnow-submit
 */
app.get(
  "/api/indexnow-submit",
  async (req, res) => {
    try {
      const { data: posts, error } =
        await supabase
          .from("blog_posts")
          .select("language, slug")
          .order("language", {
            ascending: true,
          })
          .order("slug", {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      const urls = new Set();

      // 언어별 블로그 목록 URL
      for (const language of BLOG_LANGUAGES) {
        urls.add(
          `${SITE_URL}/${language}/blog`
        );
      }

      // 각 블로그 글의 상세 URL
      for (const post of posts || []) {
        const language = String(
          post.language || ""
        )
          .trim()
          .toLowerCase();

        const slug = String(
          post.slug || ""
        ).trim();

        if (!language || !slug) {
          continue;
        }

        if (
          !BLOG_LANGUAGES.includes(language)
        ) {
          continue;
        }

        urls.add(
          `${SITE_URL}/${language}/blog/${encodeURIComponent(
            slug
          )}`
        );
      }

      const urlList = Array.from(urls).sort();

      const indexNowResult =
        await submitIndexNow(urlList);

      return res.status(200).json({
        success: true,
        message:
          "블로그 URL을 IndexNow에 제출했습니다.",
        indexNowStatus:
          indexNowResult.status,
        submittedCount:
          indexNowResult.submittedCount,
        submittedUrls: urlList,
      });
    } catch (err) {
      console.error(
        "IndexNow 제출 오류:",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err?.message ||
          "IndexNow 제출에 실패했습니다.",
      });
    }
  }
);

/*
 * 회원 탈퇴
 */
app.post(
  "/api/deleteuser",
  async (req, res) => {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({
        error: "user id required",
      });
    }

    /*
     * 회원 탈퇴는 관리자 권한이 필요합니다.
     */
    if (!supabaseAdmin) {
      return res.status(500).json({
        error:
          "SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.",
      });
    }

    if (!SUPABASE_JWT_SECRET) {
      return res.status(500).json({
        error:
          "SUPABASE_JWT_SECRET 환경변수가 설정되지 않았습니다.",
      });
    }

    const authHeader =
      req.headers.authorization || "";

    if (
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        error:
          "Authorization token missing or malformed",
      });
    }

    const token = authHeader
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        error:
          "Authorization token missing or malformed",
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        SUPABASE_JWT_SECRET
      );

      if (decoded.sub !== id) {
        return res.status(403).json({
          error:
            "You can only delete your own account",
        });
      }

      const { error } =
        await supabaseAdmin.auth.admin.deleteUser(
          id
        );

      if (error) {
        return res.status(500).json({
          error: error.message,
        });
      }

      return res.status(200).json({
        message:
          "User deleted successfully",
      });
    } catch (err) {
      console.error(
        "회원 탈퇴 오류:",
        err
      );

      return res.status(401).json({
        error:
          "Invalid or expired token",
      });
    }
  }
);

/*
 * 게시글 등록
 */
app.post("/api/board", async (req, res) => {
  const {
    title,
    content,
    author_id,
    type,
  } = req.body || {};

  if (!title || !content || !author_id) {
    return res.status(400).json({
      error: "제목, 내용, 작성자 필수",
    });
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
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(
      "게시글 등록 오류:",
      err
    );

    return res.status(500).json({
      error:
        err?.message || "등록 실패",
    });
  }
});

/*
 * 게시글 목록
 */
app.get("/api/board", async (req, res) => {
  const {
    page = "1",
    limit = "20",
    type = "",
  } = req.query;

  const parsedPage = Number.parseInt(
    page,
    10
  );

  const parsedLimit = Number.parseInt(
    limit,
    10
  );

  const pageNum =
    Number.isFinite(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const pageSize =
    Number.isFinite(parsedLimit) &&
    parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 20;

  const from =
    (pageNum - 1) * pageSize;

  const to =
    from + pageSize - 1;

  try {
    let query = supabase
      .from("posts")
      .select("*", {
        count: "exact",
      })
      .order("created_at", {
        ascending: false,
      })
      .range(from, to);

    if (type) {
      query = query.eq("type", type);
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      data: data || [],
      count: count || 0,
      page: pageNum,
      limit: pageSize,
    });
  } catch (err) {
    console.error(
      "게시글 목록 오류:",
      err
    );

    return res.status(500).json({
      error:
        err?.message ||
        "불러오기 실패",
    });
  }
});

/*
 * API 주소를 잘못 입력했을 때
 *
 * 반드시 다른 API 코드들보다 아래에 있어야 합니다.
 */
app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "API route not found",
  });
});

/*
 * 로컬 실행
 */
const PORT =
  process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `API server listening on port ${PORT}`
    );
  });
}

/*
 * Vercel 실행
 */
module.exports = app;