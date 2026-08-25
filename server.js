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
 /*
 * =====================================================
 * 월드컵 SEO 데이터 조회 API
 * =====================================================
 */
app.get(
  "/api/seo/worldcup/:id",
  async (req, res) => {
    const id = String(
      req.params?.id || ""
    ).trim();

    if (!id) {
      return res.status(400).json({
        error: "worldcup id required",
      });
    }

    try {
      const { data, error } =
        await supabase
          .from("worldcups")
          .select(`
            id,
            title,
            description,
            title_translations,
            description_translations,
            data,
            created_at
          `)
          .eq("id", id)
          .maybeSingle();

      if (error) {
        console.error(
          "월드컵 SEO 조회 오류:",
          error
        );

        return res.status(500).json({
          error: "seo lookup failed",
          code: error.code || null,
          message: error.message || null,
        });
      }

      if (!data) {
        return res.status(404).json({
          error: "worldcup not found",
        });
      }

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=3600"
      );

      return res.status(200).json({
        id: data.id,

        title:
          data.title || "",

        description:
          data.description || "",

        title_translations:
          data.title_translations || {},

        description_translations:
          data.description_translations || {},

        image:
          data?.data?.[0]?.image || "",

        created_at:
          data.created_at || null,
      });
    } catch (err) {
      console.error(
        "월드컵 SEO API 예외:",
        err
      );

      return res.status(500).json({
        error: "internal server error",
        message:
          err?.message || null,
      });
    }
  }
);


/*
 * =====================================================
 * 새 월드컵용 동적 SEO HTML
 * =====================================================
 *
 * /:lang/select-round/:id 요청을
 * vercel.json에서
 *
 * /server.js?seo=worldcup&lang=:lang&id=:id
 *
 * 로 보내는 구조
 */
app.use(
  async (req, res, next) => {
    if (
      req.query?.seo !==
      "worldcup"
    ) {
      return next();
    }

    const lang = String(
      req.query?.lang || "en"
    )
      .trim()
      .toLowerCase();

    const id = String(
      req.query?.id || ""
    ).trim();

    const SUPPORTED_LANGS =
      new Set([
        "ko",
        "en",
        "ja",
        "zh",
        "ru",
        "pt",
        "es",
        "fr",
        "id",
        "hi",
        "de",
        "vi",
        "ar",
        "bn",
        "th",
        "tr",
      ]);

    if (
      !SUPPORTED_LANGS.has(lang)
    ) {
      return res
        .status(400)
        .send(
          "Unsupported language"
        );
    }

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!UUID_RE.test(id)) {
      return res
        .status(400)
        .send(
          "Invalid worldcup id"
        );
    }

    function escapeHtml(
      value = ""
    ) {
      return String(value)
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#039;"
        );
    }

    /*
     * JSON-LD에 넣을 값은
     * HTML escape가 아니라
     * JSON.stringify로 안전하게 처리
     */
    function safeJson(value) {
      return JSON.stringify(
        value
      ).replace(
        /</g,
        "\\u003c"
      );
    }

    try {
      /*
       * 월드컵 1개 조회
       * DB 수정 없음
       */
      const {
        data: cup,
        error,
      } = await supabase
        .from("worldcups")
        .select(`
          id,
          title,
          description,
          title_translations,
          description_translations,
          data,
          created_at
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(
          "동적 SEO 월드컵 조회 실패:",
          error
        );

        return res
          .status(500)
          .send(
            "SEO lookup failed"
          );
      }

      if (!cup) {
        return res
          .status(404)
          .send(
            "Worldcup not found"
          );
      }

      /*
       * 기본 CRA HTML 가져오기
       */
      const baseResponse =
        await fetch(
          `${SITE_URL}/`
        );

      if (!baseResponse.ok) {
        throw new Error(
          `Base HTML load failed: ${baseResponse.status}`
        );
      }

      let html =
        await baseResponse.text();
      

      /*
       * =================================================
       * 언어별 제목 / 설명
       * =================================================
       */

// 언어별 제목
const localizedTitle = String(
  cup?.title_translations?.[lang] ||
  cup?.title ||
  "OnePickGame"
).trim();

// DB에 설명이 있으면 번역 설명 → 기본 설명 순서로 사용
// 설명이 없으면 언어별 SEO 설명 자동 생성
const savedDescription =
  cup?.description_translations?.[lang] ||
  cup?.description ||
  "";

const localizedDescription = String(
  savedDescription ||
    (
      lang === "ko"
        ? `${localizedTitle} 이상형 월드컵을 원픽게임에서 플레이하세요. 좋아하는 후보를 선택하고 최종 우승자를 확인해보세요.`
        : lang === "en"
          ? `Play the ${localizedTitle} tournament bracket game on OnePickGame. Choose your favorites and find the ultimate winner.`
          : `Play ${localizedTitle} on OnePickGame. Choose your favorites and find the ultimate winner.`
    )
).trim();


// SEO 제목
// 한국어: 이상형 월드컵 - 게임명 | 원픽게임
// 영어: Ideal Type World Cup - 게임명 Tournament Game | OnePickGame
// 기타 언어: 게임명 | OnePickGame

const worldCupKeywordMap = {
  ko: "이상형 월드컵",
  en: "Ideal Type World Cup",
  ja: "人気投票トーナメント",
  zh: "人气投票淘汰赛",
  es: "Torneo de Votación",
  fr: "Tournoi de Vote",
  de: "Abstimmungsturnier",
  pt: "Torneio de Votação",
  ru: "Турнир голосований",
  id: "Turnamen Voting",
  hi: "वोटिंग टूर्नामेंट",
  vi: "Giải đấu bình chọn",
  ar: "بطولة التصويت",
  bn: "ভোটিং টুর্নামেন্ট",
  th: "เกมโหวตแบบทัวร์นาเมนต์",
  tr: "Oylama Turnuvası",
};

const worldCupKeyword =
  worldCupKeywordMap[lang] ||
  worldCupKeywordMap.en;

const cleanEnglishTitle = localizedTitle
  .replace(/\s+(Bracket|Tournament)$/i, "")
  .trim();

const seoTitle =
  lang === "en"
    ? `${cleanEnglishTitle} Tournament Bracket Game | Ideal Type World Cup | OnePickGame`
    : lang === "ko"
      ? `${worldCupKeyword} - ${localizedTitle} | 원픽게임`
      : `${worldCupKeyword} - ${localizedTitle} | OnePickGame`;

      const canonical =
        `${SITE_URL}/${lang}/select-round/${cup.id}`;

      /*
       * 대표 이미지
       */
      const image =
        cup?.data?.find?.(
          (item) =>
            item?.image
        )?.image ||
        `${SITE_URL}/onepick-social.png`;

      /*
       * =================================================
       * hreflang
       * =================================================
       *
       * 현재는 모든 지원 언어를 연결.
       * 번역 존재 언어만 연결하고 싶다면
       * 나중에 더 엄격하게 바꿀 수 있음.
       */

      const hreflangTags =
        Array.from(
          SUPPORTED_LANGS
        )
          .map(
            (
              language
            ) => `
<link
  rel="alternate"
  hreflang="${language}"
  href="${SITE_URL}/${language}/select-round/${cup.id}"
/>`
          )
          .join("");

      const xDefaultTag = `
<link
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/en/select-round/${cup.id}"
/>`;

      /*
       * =================================================
       * JSON-LD
       * =================================================
       */

      const jsonLd = {
        "@context":
          "https://schema.org",

        "@type":
          "WebPage",

        name:
          localizedTitle,

        description:
          localizedDescription,

        url:
          canonical,

        inLanguage:
          lang,

        isPartOf: {
          "@type":
            "WebSite",

          name:
            "OnePickGame",

          url:
            SITE_URL,
        },

        primaryImageOfPage: {
          "@type":
            "ImageObject",

          url:
            image,
        },
      };

      /*
       * =================================================
       * 게임별 SEO HEAD
       * =================================================
       */

      const seoHead = `
<title>${escapeHtml(
        seoTitle
      )}</title>

<meta
  name="description"
  content="${escapeHtml(
    localizedDescription
  )}"
/>

<meta
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link
  rel="canonical"
  href="${escapeHtml(
    canonical
  )}"
/>

${hreflangTags}

${xDefaultTag}

<meta
  property="og:type"
  content="website"
/>

<meta
  property="og:title"
  content="${escapeHtml(
    seoTitle
  )}"
/>

<meta
  property="og:description"
  content="${escapeHtml(
    localizedDescription
  )}"
/>

<meta
  property="og:url"
  content="${escapeHtml(
    canonical
  )}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:image"
  content="${escapeHtml(
    image
  )}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(
    localizedTitle
  )}"
/>

<meta
  name="twitter:card"
  content="summary_large_image"
/>

<meta
  name="twitter:title"
  content="${escapeHtml(
    seoTitle
  )}"
/>

<meta
  name="twitter:description"
  content="${escapeHtml(
    localizedDescription
  )}"
/>

<meta
  name="twitter:image"
  content="${escapeHtml(
    image
  )}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;

/*
 * =================================================
 * 서버 초기 HTML용 월드컵 본문
 * =================================================
 *
 * React가 실행되기 전에도 검색엔진이
 * 제목 / 설명 / 후보명을 읽을 수 있게 함.
 *
 * React가 실행되면 #root 안의 이 내용은
 * 실제 앱 화면으로 교체됨.
 */

const candidateNames = Array.isArray(cup?.data)
  ? cup.data
      .map((item) =>
        String(
          item?.name ||
          item?.title ||
          ""
        ).trim()
      )
      .filter(Boolean)
      .slice(0, 32)
  : [];

const candidateHeading =
  lang === "ko"
    ? "후보"
    : lang === "ja"
      ? "候補"
      : lang === "zh"
        ? "候选"
        : lang === "es"
          ? "Candidatos"
          : lang === "fr"
            ? "Candidats"
            : lang === "de"
              ? "Kandidaten"
              : lang === "pt"
                ? "Candidatos"
                : lang === "ru"
                  ? "Участники"
                  : lang === "vi"
                    ? "Ứng viên"
                    : lang === "id"
                      ? "Kandidat"
                      : lang === "tr"
                        ? "Adaylar"
                        : lang === "th"
                          ? "ผู้เข้าแข่งขัน"
                          : lang === "ar"
                            ? "المتسابقون"
                            : lang === "bn"
                              ? "প্রার্থীরা"
                              : lang === "hi"
                                ? "प्रतियोगी"
                                : "Candidates";

const candidateListHtml =
  candidateNames.length > 0
    ? `
      <section>
        <h2>${escapeHtml(candidateHeading)}</h2>

        <ul>
          ${candidateNames
            .map(
              (name) =>
                `<li>${escapeHtml(name)}</li>`
            )
            .join("\n")}
        </ul>
      </section>
    `
    : "";

const seoBody = `
<main
  id="seo-content"
  style="
    max-width: 900px;
    margin: 40px auto;
    padding: 24px;
    color: #ffffff;
    font-family: Arial, sans-serif;
  "
>
  <h1>
    ${escapeHtml(localizedTitle)}
  </h1>

  <p>
    ${escapeHtml(localizedDescription)}
  </p>

  ${candidateListHtml}
</main>
`;

      /*
       * =================================================
       * 중요:
       * CRA 기본 SEO 태그 제거
       * =================================================
       *
       * 기존 홈 canonical/title 등이
       * 게임 페이지와 중복되지 않도록 제거
       */

      html = html
        .replace(
          /<title[\s\S]*?<\/title>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']description["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']robots["'][^>]*>/gi,
          ""
        )

        .replace(
          /<link\s+[^>]*rel=["']canonical["'][^>]*>/gi,
          ""
        )

        .replace(
          /<link\s+[^>]*rel=["']alternate["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:type["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:title["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:description["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:url["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:site_name["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:image["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*property=["']og:image:alt["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']twitter:card["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']twitter:title["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']twitter:description["'][^>]*>/gi,
          ""
        )

        .replace(
          /<meta\s+[^>]*name=["']twitter:image["'][^>]*>/gi,
          ""
        );

      /*
       * html lang 변경
       */
      html = html.replace(
        /<html([^>]*)lang=["'][^"']*["']([^>]*)>/i,
        `<html$1lang="${lang}"$2>`
      );
/*
 * CRA의 Loading...을
 * 실제 월드컵 SEO 본문으로 교체
 */
html = html.replace(
  /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i,
  `<div id="root">${seoBody}</div>`
);
      /*
       * =================================================
       * SEO HEAD 삽입
       * =================================================
       */

      html = html.replace(
        "</head>",
        `${seoHead}\n</head>`
      );

      /*
       * 캐시
       */
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=3600"
      );

      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );

      return res
        .status(200)
        .send(html);
    } catch (err) {
      console.error(
        "동적 월드컵 SEO HTML 오류:",
        err
      );

      return res
        .status(500)
        .send(
          "Dynamic SEO rendering failed"
        );
    }
  }
);

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