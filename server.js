/// server.js

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

const SITE_URL = "https://www.onepickgame.com";

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_URL) {
  throw new Error(
    "Supabase URL 환경변수가 설정되지 않았습니다."
  );
}

if (
  !SUPABASE_ANON_KEY &&
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    "Supabase key 환경변수가 설정되지 않았습니다."
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY ||
    SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const supabaseAdmin =
  SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    : null;

const SUPPORTED_LANGS = [
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
];

const OG_LOCALE_MAP = {
  en: "en_US",
  ko: "ko_KR",
  ja: "ja_JP",
  zh: "zh_CN",
  ru: "ru_RU",
  pt: "pt_BR",
  es: "es_ES",
  fr: "fr_FR",
  id: "id_ID",
  hi: "hi_IN",
  de: "de_DE",
  vi: "vi_VN",
  ar: "ar_AR",
  bn: "bn_IN",
  th: "th_TH",
  tr: "tr_TR",
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * =====================================================
 * 기본 상태 확인
 * =====================================================
 */

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "OnePickGame",
  });
});

/*
 * =====================================================
 * 블로그 Sitemap
 * =====================================================
 */

app.get("/api/sitemap-blog", async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("language, slug, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const urls = [];

    for (const lang of SUPPORTED_LANGS) {
      urls.push(`
  <url>
    <loc>${SITE_URL}/${lang}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    for (const post of posts || []) {
      if (
        !post?.language ||
        !post?.slug ||
        !SUPPORTED_LANGS.includes(post.language)
      ) {
        continue;
      }

      const loc =
        `${SITE_URL}/${post.language}/blog/` +
        encodeURIComponent(post.slug);

      const lastmod = post.created_at
        ? new Date(post.created_at).toISOString()
        : null;

      urls.push(`
  <url>
    <loc>${loc}</loc>
    ${
      lastmod
        ? `<lastmod>${lastmod}</lastmod>`
        : ""
    }
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls.join("\n")}
</urlset>`;

    res.setHeader(
      "Content-Type",
      "application/xml; charset=utf-8"
    );

    return res.status(200).send(xml);
  } catch (error) {
    console.error("블로그 sitemap 생성 실패:", error);

    return res
      .status(500)
      .send("Sitemap generation failed");
  }
});

/*
 * =====================================================
 * 블로그 서버 SEO
 * =====================================================
 */

const BLOG_TEXT = {
  ko: {
    title: "블로그",
    description:
      "이상형 월드컵, 랭킹 게임, 애니메이션, 스포츠, 음악 등 다양한 주제의 콘텐츠를 확인하세요. 크리에이터를 위한 음악, 저작권 및 Epidemic Sound 관련 정보도 확인하세요.",
    brand: "원픽게임",
    latest: "최신 글",
  },

  en: {
    title: "Blog",
    description:
      "Explore content about tournament games, ranking games, anime, sports, music, and more. Discover music, copyright, and Epidemic Sound resources for creators.",
    brand: "OnePickGame",
    latest: "Latest articles",
  },

  ja: {
    title: "ブログ",
    description:
      "理想のタイプトーナメント、ランキングゲーム、アニメ、スポーツ、音楽など、さまざまなコンテンツをご覧ください。クリエイター向けの音楽、著作権、Epidemic Soundに関する情報も紹介しています。",
    brand: "OnePickGame",
    latest: "最新記事",
  },

  zh: {
    title: "博客",
    description:
      "浏览理想型淘汰赛、排名游戏、动漫、体育、音乐等多种主题内容。同时查看面向创作者的音乐、版权和 Epidemic Sound 相关信息。",
    brand: "OnePickGame",
    latest: "最新文章",
  },

  ru: {
    title: "Блог",
    description:
      "Читайте материалы о турнирах предпочтений, рейтинговых играх, аниме, спорте, музыке и других темах. Здесь также представлена информация о музыке, авторских правах и Epidemic Sound для создателей контента.",
    brand: "OnePickGame",
    latest: "Последние статьи",
  },

  pt: {
    title: "Blog",
    description:
      "Explore conteúdos sobre torneios de preferências, jogos de classificação, anime, esportes, música e muito mais. Confira também informações sobre música, direitos autorais e Epidemic Sound para criadores.",
    brand: "OnePickGame",
    latest: "Artigos recentes",
  },

  es: {
    title: "Blog",
    description:
      "Descubre contenido sobre torneos de preferencias, juegos de clasificación, anime, deportes, música y mucho más. Consulta también información sobre música, derechos de autor y Epidemic Sound para creadores.",
    brand: "OnePickGame",
    latest: "Últimos artículos",
  },

  fr: {
    title: "Blog",
    description:
      "Découvrez des contenus sur les tournois de préférences, les jeux de classement, les anime, le sport, la musique et bien plus encore. Retrouvez également des informations sur la musique, les droits d’auteur et Epidemic Sound pour les créateurs.",
    brand: "OnePickGame",
    latest: "Derniers articles",
  },

  id: {
    title: "Blog",
    description:
      "Jelajahi konten tentang turnamen pilihan, permainan peringkat, anime, olahraga, musik, dan berbagai topik lainnya. Temukan juga informasi tentang musik, hak cipta, dan Epidemic Sound untuk kreator.",
    brand: "OnePickGame",
    latest: "Artikel terbaru",
  },

  hi: {
    title: "ब्लॉग",
    description:
      "पसंदीदा विकल्प टूर्नामेंट, रैंकिंग गेम, एनीमे, खेल, संगीत और कई अन्य विषयों से जुड़ी सामग्री देखें। क्रिएटर्स के लिए संगीत, कॉपीराइट और Epidemic Sound से संबंधित जानकारी भी प्राप्त करें।",
    brand: "OnePickGame",
    latest: "नवीनतम लेख",
  },

  de: {
    title: "Blog",
    description:
      "Entdecke Inhalte zu Auswahlturnieren, Ranking-Spielen, Anime, Sport, Musik und vielen weiteren Themen. Hier findest du außerdem Informationen zu Musik, Urheberrecht und Epidemic Sound für Kreative.",
    brand: "OnePickGame",
    latest: "Neueste Artikel",
  },

  vi: {
    title: "Blog",
    description:
      "Khám phá nội dung về các giải đấu lựa chọn, trò chơi xếp hạng, anime, thể thao, âm nhạc và nhiều chủ đề khác. Xem thêm thông tin về âm nhạc, bản quyền và Epidemic Sound dành cho nhà sáng tạo.",
    brand: "OnePickGame",
    latest: "Bài viết mới nhất",
  },

  ar: {
    title: "المدونة",
    description:
      "استكشف محتوى عن بطولات الاختيار وألعاب التصنيف والأنمي والرياضة والموسيقى والعديد من الموضوعات الأخرى. واطّلع أيضًا على معلومات حول الموسيقى وحقوق النشر وEpidemic Sound لصنّاع المحتوى.",
    brand: "OnePickGame",
    latest: "أحدث المقالات",
  },

  bn: {
    title: "ব্লগ",
    description:
      "পছন্দের টুর্নামেন্ট, র‍্যাঙ্কিং গেম, অ্যানিমে, খেলাধুলা, সঙ্গীত এবং আরও নানা বিষয়ের কনটেন্ট দেখুন। কনটেন্ট নির্মাতাদের জন্য সঙ্গীত, কপিরাইট এবং Epidemic Sound সম্পর্কিত তথ্যও জানুন।",
    brand: "OnePickGame",
    latest: "সর্বশেষ নিবন্ধ",
  },

  th: {
    title: "บล็อก",
    description:
      "พบกับเนื้อหาเกี่ยวกับทัวร์นาเมนต์ตัวเลือก เกมจัดอันดับ อนิเมะ กีฬา ดนตรี และหัวข้ออื่น ๆ อีกมากมาย พร้อมข้อมูลเกี่ยวกับดนตรี ลิขสิทธิ์ และ Epidemic Sound สำหรับครีเอเตอร์",
    brand: "OnePickGame",
    latest: "บทความล่าสุด",
  },

  tr: {
    title: "Blog",
    description:
      "Tercih turnuvaları, sıralama oyunları, anime, spor, müzik ve daha birçok konu hakkında içerikleri keşfedin. İçerik üreticileri için müzik, telif hakkı ve Epidemic Sound hakkında bilgilere de ulaşın.",
    brand: "OnePickGame",
    latest: "Son yazılar",
  },
};

app.use(async (req, res, next) => {
  const seoType = String(req.query?.seo || "");

  if (
    seoType !== "blog-list" &&
    seoType !== "blog-post"
  ) {
    return next();
  }

  const lang = String(req.query?.lang || "en")
    .trim()
    .toLowerCase();

  const slug = String(req.query?.slug || "").trim();

  if (!SUPPORTED_LANGS.includes(lang)) {
    return res
      .status(400)
      .send("Unsupported language");
  }

  if (seoType === "blog-post" && !slug) {
    return res
      .status(400)
      .send("Blog slug required");
  }

  const text = BLOG_TEXT[lang] || BLOG_TEXT.en;

  try {
    const baseResponse = await fetch(`${SITE_URL}/`);

    if (!baseResponse.ok) {
      throw new Error(
        `Base HTML load failed: ${baseResponse.status}`
      );
    }

    let html = await baseResponse.text();

    /*
     * 기존 기본 SEO 제거
     */
    html = html
      .replace(/<title[\s\S]*?<\/title>/gi, "")
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
        /<meta\s+[^>]*property=["']og:locale["'][^>]*>/gi,
        ""
      )
      .replace(
        /<meta\s+[^>]*property=["']og:locale:alternate["'][^>]*>/gi,
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
      )
      .replace(
        /<meta\s+[^>]*name=["']twitter:image:alt["'][^>]*>/gi,
        ""
      );

    html = html.replace(
      /<html([^>]*)lang=["'][^"']*["']([^>]*)>/i,
      `<html$1lang="${lang}"$2>`
    );

    /*
     * =================================================
     * 블로그 목록
     * =================================================
     */

    if (seoType === "blog-list") {
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select(
          "id, language, slug, title, description, created_at"
        )
        .eq("language", lang)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      const canonical = `${SITE_URL}/${lang}/blog`;

      const seoTitle = `${text.title} | OnePickGame`;

      const image = `${SITE_URL}/onepick-social.png`;

      const hreflangTags = SUPPORTED_LANGS.map(
        (language) => `
<link
  rel="alternate"
  hreflang="${language}"
  href="${SITE_URL}/${language}/blog"
/>`
      ).join("");

      const xDefaultTag = `
<link
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/en/blog"
/>`;

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: seoTitle,
        description: text.description,
        url: canonical,
        inLanguage: lang,
        isPartOf: {
          "@type": "WebSite",
          name: "OnePickGame",
          url: SITE_URL,
        },
      };

      const seoHead = `
<title>${escapeHtml(seoTitle)}</title>

<meta
  name="description"
  content="${escapeHtml(text.description)}"
/>

<meta
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link
  rel="canonical"
  href="${canonical}"
/>

${hreflangTags}

${xDefaultTag}

<meta property="og:type" content="website" />

<meta
  property="og:title"
  content="${escapeHtml(seoTitle)}"
/>

<meta
  property="og:description"
  content="${escapeHtml(text.description)}"
/>

<meta
  property="og:url"
  content="${canonical}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:locale"
  content="${OG_LOCALE_MAP[lang] || "en_US"}"
/>

<meta
  property="og:image"
  content="${image}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(seoTitle)}"
/>

<meta
  name="twitter:card"
  content="summary_large_image"
/>

<meta
  name="twitter:title"
  content="${escapeHtml(seoTitle)}"
/>

<meta
  name="twitter:description"
  content="${escapeHtml(text.description)}"
/>

<meta
  name="twitter:image"
  content="${image}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;

      const postItems = (posts || [])
        .map(
          (post) => `
<li>
  <a href="${SITE_URL}/${lang}/blog/${encodeURIComponent(
            post.slug
          )}">
    ${escapeHtml(post.title || "")}
  </a>
  ${
    post.description
      ? `<p>${escapeHtml(post.description)}</p>`
      : ""
  }
</li>`
        )
        .join("\n");

      const seoBody = `
<main
  id="seo-content"
  style="
    max-width:900px;
    margin:40px auto;
    padding:24px;
    color:#ffffff;
    font-family:Arial,sans-serif;
  "
>
  <h1>${escapeHtml(text.title)}</h1>

  <p>${escapeHtml(text.description)}</p>

  ${
    postItems
      ? `
  <section>
    <h2>${escapeHtml(text.latest)}</h2>
    <ul>
      ${postItems}
    </ul>
  </section>`
      : ""
  }
</main>
`;

      html = html.replace(
        /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i,
        `<div id="root">${seoBody}</div>`
      );

      html = html.replace(
        "</head>",
        `${seoHead}\n</head>`
      );

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=3600"
      );

      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );

      return res.status(200).send(html);
    }
        /*
     * =================================================
     * 블로그 상세
     * =================================================
     */

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        "id, language, slug, title, description, content, created_at"
      )
      .eq("language", lang)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!post) {
      return res
        .status(404)
        .send("Blog post not found");
    }

    const canonical =
      `${SITE_URL}/${lang}/blog/${encodeURIComponent(
        post.slug
      )}`;

    const seoTitle =
      `${post.title} | ${text.brand}`;

    const description = String(
      post.description ||
        stripHtml(post.content || "").slice(0, 155) ||
        `${post.title} - ${text.brand}`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const image =
      `${SITE_URL}/onepick-social.png`;

    /*
     * 같은 slug가 실제 존재하는 언어만
     * hreflang으로 연결
     */
    const {
      data: alternatePosts,
      error: alternateError,
    } = await supabase
      .from("blog_posts")
      .select("language, slug")
      .eq("slug", post.slug);

    if (alternateError) {
      console.warn(
        "Blog hreflang lookup failed:",
        alternateError
      );
    }

    const validAlternates = (
      alternatePosts || []
    ).filter((item) =>
      SUPPORTED_LANGS.includes(item.language)
    );

    const hreflangTags = validAlternates
      .map(
        (item) => `
<link
  rel="alternate"
  hreflang="${item.language}"
  href="${SITE_URL}/${item.language}/blog/${encodeURIComponent(
          item.slug
        )}"
/>`
      )
      .join("");

    const englishAlternate =
      validAlternates.find(
        (item) => item.language === "en"
      );

    const xDefaultTag = englishAlternate
      ? `
<link
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/en/blog/${encodeURIComponent(
          englishAlternate.slug
        )}"
/>`
      : "";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",

      headline: post.title,

      description,

      url: canonical,

      inLanguage: lang,

      datePublished:
        post.created_at || undefined,

      dateModified:
        post.created_at || undefined,

      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonical,
      },

      publisher: {
        "@type": "Organization",
        name: "OnePickGame",
        url: SITE_URL,
      },
    };

    const seoHead = `
<title>${escapeHtml(seoTitle)}</title>

<meta
  name="description"
  content="${escapeHtml(description)}"
/>

<meta
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link
  rel="canonical"
  href="${canonical}"
/>

${hreflangTags}

${xDefaultTag}

<meta
  property="og:type"
  content="article"
/>

<meta
  property="og:title"
  content="${escapeHtml(seoTitle)}"
/>

<meta
  property="og:description"
  content="${escapeHtml(description)}"
/>

<meta
  property="og:url"
  content="${canonical}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:locale"
  content="${OG_LOCALE_MAP[lang] || "en_US"}"
/>

<meta
  property="og:image"
  content="${image}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(post.title)}"
/>

<meta
  name="twitter:card"
  content="summary_large_image"
/>

<meta
  name="twitter:title"
  content="${escapeHtml(seoTitle)}"
/>

<meta
  name="twitter:description"
  content="${escapeHtml(description)}"
/>

<meta
  name="twitter:image"
  content="${image}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;

    const bodyPreview = stripHtml(
      post.content || ""
    ).slice(0, 1200);

    const seoBody = `
<main
  id="seo-content"
  style="
    max-width:900px;
    margin:40px auto;
    padding:24px;
    color:#ffffff;
    font-family:Arial,sans-serif;
  "
>
  <article>

    <h1>
      ${escapeHtml(post.title)}
    </h1>

    ${
      post.description
        ? `
    <p>
      ${escapeHtml(post.description)}
    </p>`
        : ""
    }

    ${
      post.created_at
        ? `
    <time
      datetime="${escapeHtml(post.created_at)}"
    >
      ${escapeHtml(
        String(post.created_at).slice(0, 10)
      )}
    </time>`
        : ""
    }

    ${
      bodyPreview
        ? `
    <section>
      <p>
        ${escapeHtml(bodyPreview)}
      </p>
    </section>`
        : ""
    }

  </article>
</main>
`;

    html = html.replace(
      /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i,
      `<div id="root">${seoBody}</div>`
    );

    html = html.replace(
      "</head>",
      `${seoHead}\n</head>`
    );

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
      "블로그 SEO HTML 오류:",
      err
    );

    return res
      .status(500)
      .send(
        "Blog SEO rendering failed"
      );
  }
});


/*
 * =====================================================
 * 언어별 홈 SEO HTML
 * =====================================================
 */

const HOME_SEO = {
  en: {
    title:
      "Tournament Bracket Game & Ideal Type World Cup | OnePickGame",

    description:
      "Create and play tournament bracket games on OnePickGame, also known as 이상형 월드컵. Build brackets, vote for your favorites, and share your results.",

    locale: "en_US",
  },

  ko: {
    title:
      "이상형 월드컵 해외 사이트 - 토너먼트 원픽 게임 | OnePickGame",

    description:
      "OnePickGame(원픽 게임)에서 다양한 이상형 월드컵과 토너먼트 게임을 즐겨보세요. 직접 월드컵을 만들고, 최애를 선택하고, 결과를 친구들과 공유할 수 있습니다.",

    locale: "ko_KR",
  },

  ja: {
    title:
      "理想のタイプワールドカップ・トーナメントゲーム | OnePickGame",

    description:
      "OnePickGameで理想のタイプワールドカップやトーナメントゲームを楽しもう。お気に入りを選び、自分だけのトーナメントを作成して結果を共有できます。",

    locale: "ja_JP",
  },

  zh: {
    title:
      "理想型世界杯・淘汰赛游戏 | OnePickGame",

    description:
      "在OnePickGame体验理想型世界杯和淘汰赛游戏。选择你最喜欢的候选人，创建自己的比赛并分享最终结果。",

    locale: "zh_CN",
  },

  ru: {
    title:
      "Турнир выбора и Ideal Type World Cup | OnePickGame",

    description:
      "Играйте в турниры выбора на OnePickGame. Выбирайте любимых участников, создавайте собственные сетки и делитесь результатами.",

    locale: "ru_RU",
  },

  pt: {
    title:
      "Jogo de Torneio e Ideal Type World Cup | OnePickGame",

    description:
      "Crie e jogue torneios no OnePickGame. Escolha seus favoritos, monte suas próprias chaves e compartilhe os resultados.",

    locale: "pt_BR",
  },

  es: {
    title:
      "Juego de Torneos e Ideal Type World Cup | OnePickGame",

    description:
      "Crea y juega torneos en OnePickGame. Elige tus favoritos, crea tus propios enfrentamientos y comparte los resultados.",

    locale: "es_ES",
  },

  fr: {
    title:
      "Jeu de Tournoi et Ideal Type World Cup | OnePickGame",

    description:
      "Créez et jouez à des tournois sur OnePickGame. Choisissez vos favoris, créez vos propres duels et partagez vos résultats.",

    locale: "fr_FR",
  },

  id: {
    title:
      "Game Turnamen & Ideal Type World Cup | OnePickGame",

    description:
      "Buat dan mainkan game turnamen di OnePickGame. Pilih favoritmu, buat bracket sendiri, dan bagikan hasilnya.",

    locale: "id_ID",
  },

  hi: {
    title:
      "टूर्नामेंट गेम और Ideal Type World Cup | OnePickGame",

    description:
      "OnePickGame पर टूर्नामेंट गेम खेलें और बनाएं। अपने पसंदीदा उम्मीदवार चुनें, ब्रैकेट बनाएं और परिणाम साझा करें।",

    locale: "hi_IN",
  },

  de: {
    title:
      "Turnierspiel & Ideal Type World Cup | OnePickGame",

    description:
      "Erstelle und spiele Turniere auf OnePickGame. Wähle deine Favoriten, erstelle eigene Turnierbäume und teile deine Ergebnisse.",

    locale: "de_DE",
  },

  vi: {
    title:
      "Trò Chơi Giải Đấu & Ideal Type World Cup | OnePickGame",

    description:
      "Tạo và chơi các giải đấu trên OnePickGame. Chọn ứng viên yêu thích, tạo bảng đấu và chia sẻ kết quả.",

    locale: "vi_VN",
  },

  ar: {
    title:
      "لعبة البطولات و Ideal Type World Cup | OnePickGame",

    description:
      "أنشئ والعب بطولات الاختيار على OnePickGame. اختر المفضلين لديك وأنشئ جدول البطولة وشارك النتائج.",

    locale: "ar_AR",
  },

  bn: {
    title:
      "টুর্নামেন্ট গেম ও Ideal Type World Cup | OnePickGame",

    description:
      "OnePickGame-এ টুর্নামেন্ট তৈরি করুন ও খেলুন। আপনার পছন্দের প্রার্থী বেছে নিন, ব্র্যাকেট তৈরি করুন এবং ফলাফল শেয়ার করুন।",

    locale: "bn_IN",
  },

  th: {
    title:
      "เกมทัวร์นาเมนต์ & Ideal Type World Cup | OnePickGame",

    description:
      "สร้างและเล่นเกมทัวร์นาเมนต์บน OnePickGame เลือกผู้สมัครที่คุณชื่นชอบ สร้างสายการแข่งขัน และแชร์ผลลัพธ์",

    locale: "th_TH",
  },

  tr: {
    title:
      "Turnuva Oyunu & Ideal Type World Cup | OnePickGame",

    description:
      "OnePickGame üzerinde turnuvalar oluşturun ve oynayın. Favorilerinizi seçin, kendi eşleşmelerinizi oluşturun ve sonuçları paylaşın.",

    locale: "tr_TR",
  },
};

/*
 * =====================================================
 * 홈 추천 월드컵
 * =====================================================
 */

const FEATURED_WORLDCUP_IDS = [
  "70e27e0e-1112-4785-b2f6-7aee5f508b0e",
  "2142cd10-468b-4fd9-8bf3-a09c4aeffc77",
  "db749ee3-2de3-4ceb-a5e8-e5ed239e9167",
  "4e2f1bfd-8ecc-4fd7-a9de-be369c370bf4",
  "172f7127-cc23-40bb-92f0-188d7fb90670",
  "d3cece18-68d7-4ecf-ad40-b08bd44ca992",
  "9e9495b4-9f16-4f0e-b615-d6df55c78d4a",
  "b83f8f15-2935-480f-9e87-f7e4275e83a6",
  "c257e2f1-7b2f-4a32-b9c6-6093755f58b8",
  "90af1d97-559b-4706-8878-e878dc3cd43f",
  "d389ef73-bb86-46ba-b7f6-6c3e454271e8",
  "3828b32f-ecaf-4d60-bca7-1c09e5527394",
  "91b47d8c-72ec-4f4d-94bf-b88537d7da02",
];

app.use(async (req, res, next) => {
  if (req.query?.seo !== "home") {
    return next();
  }

  const lang = String(
    req.query?.lang || "en"
  )
    .trim()
    .toLowerCase();

  if (!SUPPORTED_LANGS.includes(lang)) {
    return res
      .status(400)
      .send("Unsupported language");
  }

  const seo =
    HOME_SEO[lang] ||
    HOME_SEO.en;

  try {
    const baseResponse =
      await fetch(`${SITE_URL}/`);

    if (!baseResponse.ok) {
      throw new Error(
        `Base HTML load failed: ${baseResponse.status}`
      );
    }

    let html =
      await baseResponse.text();

    /*
     * =====================================================
     * 추천 월드컵 조회
     * =====================================================
     */

    const {
      data: featuredWorldcups,
      error: featuredWorldcupsError,
    } = await supabase
      .from("worldcups")
      .select(
        "id, title, title_translations"
      )
      .in("id", FEATURED_WORLDCUP_IDS)
      .is("deleted_at", null);

    if (featuredWorldcupsError) {
      console.warn(
        "홈 추천 월드컵 조회 실패:",
        featuredWorldcupsError
      );
    }

    /*
     * Supabase 조회 순서와 상관없이
     * FEATURED_WORLDCUP_IDS 순서 유지
     */

    const featuredWorldcupMap =
      new Map(
        (featuredWorldcups || []).map(
          (cup) => [cup.id, cup]
        )
      );

const orderedFeaturedWorldcups =
  FEATURED_WORLDCUP_IDS
    .map((id) =>
      featuredWorldcupMap.get(id)
    )
    .filter(Boolean);

/*
 * 기존 기본 SEO 제거
 */

html = html
  .replace(/<title[\s\S]*?<\/title>/gi, "")
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
    /<meta\s+[^>]*property=["']og:locale["'][^>]*>/gi,
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

    const canonical =
      `${SITE_URL}/${lang}`;

    const image =
      `${SITE_URL}/ogimg.png`;

    const hreflangTags =
      SUPPORTED_LANGS.map(
        (language) => `
<link
  rel="alternate"
  hreflang="${language}"
  href="${SITE_URL}/${language}"
/>`
      ).join("");

    const jsonLd = {
      "@context":
        "https://schema.org",

      "@type":
        "WebSite",

      name:
        "OnePickGame",

      alternateName:
        lang === "ko"
          ? [
              "원픽게임",
              "One Pick Game",
              "Ideal Type World Cup",
            ]
          : [
              "One Pick Game",
              "Ideal Type World Cup",
            ],

      url:
        SITE_URL,

      inLanguage:
        lang,
    };

    const seoHead = `
<title>${escapeHtml(
      seo.title
    )}</title>

<meta
  name="description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link
  rel="canonical"
  href="${canonical}"
/>

${hreflangTags}

<link
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/en"
/>

<meta
  property="og:type"
  content="website"
/>

<meta
  property="og:title"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta
  property="og:description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta
  property="og:url"
  content="${canonical}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:locale"
  content="${seo.locale}"
/>

<meta
  property="og:image"
  content="${image}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta
  name="twitter:card"
  content="summary_large_image"
/>

<meta
  name="twitter:title"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta
  name="twitter:description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta
  name="twitter:image"
  content="${image}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;

      /*
     * =====================================================
     * 홈 서버 SEO 본문
     * 검색엔진이 JS 실행 전에도 홈의 핵심 내용을 읽을 수 있게 함
     * =====================================================
     */

    const HOME_BODY_TEXT = {
      ko: {
        h1: "이상형 월드컵",
        intro:
          "OnePickGame에서 다양한 이상형 월드컵과 토너먼트 게임을 즐겨보세요. 좋아하는 후보를 선택해 최종 우승자를 결정하고, 직접 이상형 월드컵을 만들어 친구들과 공유할 수 있습니다.",
        playTitle: "이상형 월드컵 즐기기",
        playText:
          "애니메이션, 게임, 스포츠, 연예인 등 다양한 주제의 이상형 월드컵에서 후보들을 비교하고 나만의 최애를 선택해보세요.",
            featuredTitle: "추천 이상형 월드컵",
        createTitle: "나만의 이상형 월드컵 만들기",
        createText:
          "원하는 후보와 이미지를 등록해 직접 토너먼트를 만들고 다른 사람들과 공유할 수 있습니다.",
      },

      en: {
        h1: "Ideal Type World Cup & Tournament Bracket",
        intro:
          "Play tournament bracket games on OnePickGame. Compare your favorite characters, celebrities, games, sports stars, and more to choose the ultimate winner.",
        playTitle: "Play Tournament Bracket Games",
        playText:
          "Explore tournament brackets across anime, games, sports, celebrities, and many other topics. Choose your favorite in each matchup and find your ultimate winner.",
       featuredTitle: "Featured Tournament Brackets",
          createTitle: "Create Your Own Tournament",
        createText:
          "Create your own bracket with custom candidates and images, then share it with friends and other players.",
      },

      ja: {
        h1: "理想のタイプワールドカップ・トーナメント",
        intro:
          "OnePickGameでさまざまな理想のタイプワールドカップやトーナメントを楽しもう。お気に入りの候補を選び、最後の優勝者を決めることができます。",
        playTitle: "トーナメントを楽しむ",
        playText:
          "アニメ、ゲーム、スポーツ、芸能人など、さまざまなテーマの候補を比較して自分だけのお気に入りを選ぼう。",
       featuredTitle: "おすすめトーナメント",
          createTitle: "自分だけのトーナメントを作成",
        createText:
          "好きな候補と画像を登録してオリジナルのトーナメントを作成し、他のユーザーと共有できます。",
      },

      zh: {
        h1: "理想型世界杯・淘汰赛游戏",
        intro:
          "在OnePickGame体验各种理想型世界杯和淘汰赛游戏。比较你喜欢的角色、明星、游戏和体育选手，选出最终冠军。",
        playTitle: "体验淘汰赛游戏",
        playText:
          "探索动漫、游戏、体育、明星等不同主题的淘汰赛，在每轮对决中选择你更喜欢的候选人。",
      featuredTitle: "推荐淘汰赛",
          createTitle: "创建自己的淘汰赛",
        createText:
          "添加自己喜欢的候选人和图片，创建专属淘汰赛并与其他玩家分享。",
      },
    };

const defaultHomeBody = {
  h1: seo.title.replace(/\s*\|\s*OnePickGame\s*$/i, ""),
  intro: seo.description,
  playTitle: "Tournament Bracket Games",
  playText:
    "Compare candidates in head-to-head matchups, choose your favorites, and discover your ultimate winner.",
  featuredTitle: "Featured Tournament Brackets",
  createTitle: "Create Your Own Tournament",
  createText:
    "Create your own tournament bracket with custom candidates and share it with other players.",
};
    const homeBody =
      HOME_BODY_TEXT[lang] ||
      defaultHomeBody;

    /*
     * =====================================================
     * 추천 월드컵 HTML
     * =====================================================
     */

    const featuredWorldcupLinks =
      orderedFeaturedWorldcups
        .map((cup) => {
          let titleTranslations =
            cup.title_translations || {};

          if (
            typeof titleTranslations ===
            "string"
          ) {
            try {
              titleTranslations =
                JSON.parse(
                  titleTranslations
                );
            } catch {
              titleTranslations = {};
            }
          }

          const localizedTitle =
            String(
              titleTranslations?.[lang] ||
              titleTranslations?.en ||
              cup.title ||
              "Tournament"
            )
              .replace(/\s+/g, " ")
              .trim();

          const href =
            `${SITE_URL}/${lang}/select-round/` +
            encodeURIComponent(cup.id);

          return `
<li>
  <a href="${href}">
    ${escapeHtml(localizedTitle)}
  </a>
</li>`;
        })
        .join("\n");

    const seoBody = `
<main
  id="seo-content"
  style="
    max-width:900px;
    margin:40px auto;
    padding:24px;
    color:#ffffff;
    font-family:Arial,sans-serif;
  "
>
  <article>

    <h1>
      ${escapeHtml(homeBody.h1)}
    </h1>

    <p>
      ${escapeHtml(homeBody.intro)}
    </p>

    <section>
      <h2>
        ${escapeHtml(homeBody.playTitle)}
      </h2>

      <p>
        ${escapeHtml(homeBody.playText)}
      </p>
    </section>
    ${
      featuredWorldcupLinks
        ? `
    <section>

      <h2>
        ${escapeHtml(
          homeBody.featuredTitle
        )}
      </h2>

      <ul>
        ${featuredWorldcupLinks}
      </ul>

    </section>
`
        : ""
    }
    <section>
      <h2>
        ${escapeHtml(homeBody.createTitle)}
      </h2>

      <p>
        ${escapeHtml(homeBody.createText)}
      </p>
    </section>

  </article>
</main>
`;

    /*
     * 기존 Loading 화면을 서버 SEO 콘텐츠로 교체
     */

    html = html.replace(
      /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i,
      `<div id="root">${seoBody}</div>`
    );

    /*
     * SEO head 삽입
     */

    html = html.replace(
      "</head>",
      `${seoHead}\n</head>`
    );

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
      "홈 SEO HTML 오류:",
      err
    );

    return res
      .status(500)
      .send(
        "Home SEO rendering failed"
      );
  }
});
/*
 * =====================================================
 * 월드컵 SEO 데이터 조회 API
 * =====================================================
 */

app.get(
  "/api/worldcup-seo/:id",
  async (req, res) => {
    try {
      const id = String(
        req.params?.id || ""
      ).trim();

      if (!id) {
        return res.status(400).json({
          error: "Worldcup ID required",
        });
      }

      const {
        data: worldcup,
        error,
      } = await supabase
        .from("worldcups")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!worldcup) {
        return res.status(404).json({
          error: "Worldcup not found",
        });
      }

      return res.status(200).json(
        worldcup
      );
    } catch (err) {
      console.error(
        "월드컵 SEO 데이터 조회 실패:",
        err
      );

      return res.status(500).json({
        error:
          "Worldcup SEO data load failed",
      });
    }
  }
);


/*
 * =====================================================
 * 월드컵 선택 페이지 서버 SEO
 *
 * /:lang/select-round/:id
 * =====================================================
 */

app.use(async (req, res, next) => {
  const seoType = String(
    req.query?.seo || ""
  );

  if (seoType !== "worldcup") {
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

  if (!SUPPORTED_LANGS.includes(lang)) {
    return res
      .status(400)
      .send("Unsupported language");
  }

  if (!id) {
    return res
      .status(400)
      .send("Worldcup ID required");
  }

  try {
    /*
     * 월드컵 데이터 조회
     */

    const {
      data: worldcup,
      error,
    } = await supabase
      .from("worldcups")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!worldcup) {
      return res
        .status(404)
        .send("Worldcup not found");
    }

    /*
     * 기본 index.html 가져오기
     */

    const baseResponse =
      await fetch(`${SITE_URL}/`);

    if (!baseResponse.ok) {
      throw new Error(
        `Base HTML load failed: ${baseResponse.status}`
      );
    }

    let html =
      await baseResponse.text();

    /*
     * 기존 SEO 태그 제거
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
        /<meta\s+[^>]*property=["']og:locale["'][^>]*>/gi,
        ""
      )
      .replace(
        /<meta\s+[^>]*property=["']og:locale:alternate["'][^>]*>/gi,
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
      )
      .replace(
        /<meta\s+[^>]*name=["']twitter:image:alt["'][^>]*>/gi,
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
     * 제목
     */

    /*
 * 언어별 제목
 * 해당 언어 번역 → 영어 번역 → 기본 제목 → 기본값
 */
const translatedTitle =
  worldcup.title_translations &&
  typeof worldcup.title_translations === "object"
    ? worldcup.title_translations[lang] ||
      worldcup.title_translations.en
    : "";

const worldcupTitle =
  String(
    translatedTitle ||
    worldcup.title ||
    worldcup.name ||
    "Tournament"
  )
    .replace(/\s+/g, " ")
    .trim();

/*
 * 언어별 설명
 * 해당 언어 번역 → 영어 번역 → 기본 설명
 */
let descriptionTranslations = worldcup.description_translations || {};

if (typeof descriptionTranslations === "string") {
  try {
    descriptionTranslations = JSON.parse(descriptionTranslations);
  } catch {
    descriptionTranslations = {};
  }
}

console.log("SEO DEBUG lang:", lang);
console.log("SEO DEBUG raw:", worldcup.description_translations);
console.log("SEO DEBUG parsed:", descriptionTranslations);
console.log("SEO DEBUG ko:", descriptionTranslations.ko);

const translatedDescription =
  descriptionTranslations[lang] ||
  descriptionTranslations.en ||
  "";

let worldcupDescription =
  String(
    translatedDescription ||
    worldcup.description ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();

if (!worldcupDescription) {
  if (lang === "ko") {
    worldcupDescription =
      `${worldcupTitle}을 플레이해보세요. ` +
      `후보들을 비교하고 최애를 선택해 최종 우승자를 결정할 수 있습니다.`;
  } else if (lang === "ja") {
    worldcupDescription =
      `${worldcupTitle}をプレイしよう。` +
      `候補を比較してお気に入りを選び、最終優勝者を決めましょう。`;
  } else if (lang === "zh") {
    worldcupDescription =
      `来玩${worldcupTitle}。` +
      `比较候选人，选择你最喜欢的选项并决出最终冠军。`;
  } else if (lang === "es") {
    worldcupDescription =
      `Juega ${worldcupTitle} en OnePickGame. ` +
      `Compara candidatos, elige tus favoritos y descubre al ganador final.`;
  } else if (lang === "pt") {
    worldcupDescription =
      `Jogue ${worldcupTitle} no OnePickGame. ` +
      `Compare os candidatos, escolha seus favoritos e descubra o vencedor final.`;
  } else if (lang === "fr") {
    worldcupDescription =
      `Jouez à ${worldcupTitle} sur OnePickGame. ` +
      `Comparez les candidats, choisissez vos favoris et découvrez le gagnant final.`;
  } else if (lang === "de") {
    worldcupDescription =
      `Spiele ${worldcupTitle} auf OnePickGame. ` +
      `Vergleiche die Kandidaten, wähle deine Favoriten und bestimme den Sieger.`;
  } else {
    worldcupDescription =
      `Play ${worldcupTitle} on OnePickGame. ` +
      `Compare candidates, choose your favorites, and discover the ultimate winner.`;
  }
}

    /*
     * Canonical
     */

    const canonical =
      `${SITE_URL}/${lang}/select-round/` +
      encodeURIComponent(id);

/*
 * 후보 이미지 / YouTube 썸네일 찾기
 */

let candidates = [];

if (Array.isArray(worldcup.data)) {
  candidates = worldcup.data;
} else if (Array.isArray(worldcup.candidates)) {
  candidates = worldcup.candidates;
}

/*
 * YouTube URL에서 video ID 추출
 */
function extractYouTubeId(url = "") {
  try {
    const value = String(url || "").trim();

    if (!value) return "";

    // youtu.be/VIDEO_ID
    let match = value.match(
      /youtu\.be\/([a-zA-Z0-9_-]{6,})/i
    );

    if (match?.[1]) {
      return match[1];
    }

    // youtube.com/watch?v=VIDEO_ID
    match = value.match(
      /[?&]v=([a-zA-Z0-9_-]{6,})/i
    );

    if (match?.[1]) {
      return match[1];
    }

    // youtube.com/embed/VIDEO_ID
    match = value.match(
      /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{6,})/i
    );

    if (match?.[1]) {
      return match[1];
    }

    // youtube.com/shorts/VIDEO_ID
    match = value.match(
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i
    );

    if (match?.[1]) {
      return match[1];
    }

    return "";
  } catch {
    return "";
  }
}

/*
 * 일반 이미지인지 YouTube 영상인지 판단해서
 * 실제 OG 이미지 URL 반환
 */
function getOgImageFromCandidate(candidate) {
  if (!candidate) return "";

  const source =
    candidate.image ||
    candidate.url ||
    candidate.videoUrl ||
    candidate.video_url ||
    candidate.youtubeUrl ||
    candidate.youtube_url ||
    "";

  if (!source) return "";

  const youtubeId = extractYouTubeId(source);

  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return String(source).trim();
}

/*
 * 이미지가 있는 첫 번째 후보
 */
let image = "";

for (const candidate of candidates) {
  const candidateImage =
    getOgImageFromCandidate(candidate);

  if (candidateImage) {
    image = candidateImage;
    break;
  }
}

/*
 * 후보에서 못 찾았으면 월드컵 대표 이미지 사용
 */
if (!image) {
  image =
    worldcup.image ||
    worldcup.thumbnail ||
    "/ogimg.png";
}

/*
 * worldcup.image 자체가 YouTube URL일 수도 있으므로
 * 한 번 더 체크
 */
const youtubeId =
  extractYouTubeId(image);

if (youtubeId) {
  image =
    `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/*
 * 상대 경로라면 절대 URL로 변환
 */
if (!/^https?:\/\//i.test(image)) {
  image =
    `${SITE_URL}${
      image.startsWith("/") ? "" : "/"
    }${image}`;
}

    /*
     * hreflang
     *
     * 같은 게임 ID를 모든 지원 언어 경로로 연결
     */

    const hreflangTags =
      SUPPORTED_LANGS.map(
        (language) => `
<link
  rel="alternate"
  hreflang="${language}"
  href="${SITE_URL}/${language}/select-round/${encodeURIComponent(
          id
        )}"
/>`
      ).join("");

    /*
     * SEO title
     */

let seoTitle;

if (lang === "ko") {
  seoTitle =
    `이상형 월드컵 | ${worldcupTitle} | OnePickGame`;
} else if (lang === "ja") {
  seoTitle =
    `${worldcupTitle} トーナメント | OnePickGame`;
} else if (lang === "zh") {
  seoTitle =
    `${worldcupTitle} 淘汰赛 | OnePickGame`;
} else {
  seoTitle =
    `${worldcupTitle} Tournament | OnePickGame`;
}

    /*
     * JSON-LD
     */

    const jsonLd = {
      "@context":
        "https://schema.org",

      "@type":
        "WebPage",

      name:
        worldcupTitle,

      headline:
        worldcupTitle,

      description:
        worldcupDescription,

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
     * 서버에서 삽입할 SEO head
     */

    const seoHead = `
<title>${escapeHtml(
      seoTitle
    )}</title>

<meta
  name="description"
  content="${escapeHtml(
    worldcupDescription
  )}"
/>

<meta
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link
  rel="canonical"
  href="${canonical}"
/>

${hreflangTags}

<link
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/en/select-round/${encodeURIComponent(
      id
    )}"
/>

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
    worldcupDescription
  )}"
/>

<meta
  property="og:url"
  content="${canonical}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:locale"
  content="${
    OG_LOCALE_MAP[lang] ||
    "en_US"
  }"
/>

<meta
  property="og:image"
  content="${escapeHtml(image)}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(
    worldcupTitle
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
    worldcupDescription
  )}"
/>

<meta
  name="twitter:image"
  content="${escapeHtml(image)}"
/>

<meta
  name="twitter:image:alt"
  content="${escapeHtml(
    worldcupTitle
  )}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;

    /*
     * 검색엔진이 JS 실행 전에도
     * 게임 제목/설명을 읽을 수 있게
     * root에 최소 콘텐츠 삽입
     */

    const candidateNames =
      candidates
        .slice(0, 12)
        .map((candidate) =>
          String(
            candidate?.name ||
            candidate?.title ||
            ""
          ).trim()
        )
        .filter(Boolean);

    const candidateList =
      candidateNames.length
        ? `
<section>
  <h2>${
    lang === "ko"
      ? "주요 후보"
      : lang === "ja"
      ? "主な候補"
      : lang === "zh"
      ? "主要候选"
      : "Popular candidates"
  }</h2>

  <ul>
    ${candidateNames
      .map(
        (name) =>
          `<li>${escapeHtml(
            name
          )}</li>`
      )
      .join("")}
  </ul>
</section>
`
        : "";

    const seoBody = `
<main
  id="seo-content"
  style="
    max-width:900px;
    margin:40px auto;
    padding:24px;
    color:#ffffff;
    font-family:Arial,sans-serif;
  "
>
  <article>

    <h1>
      ${escapeHtml(
        worldcupTitle
      )}
    </h1>

    <p>
      ${escapeHtml(
        worldcupDescription
      )}
    </p>

    ${candidateList}

  </article>
</main>
`;

    /*
     * 기존 Loading 화면을
     * 서버 SEO 콘텐츠로 교체
     */

    html = html.replace(
      /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i,
      `<div id="root">${seoBody}</div>`
    );

    /*
     * head 삽입
     */

    html = html.replace(
      "</head>",
      `${seoHead}\n</head>`
    );

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
      "월드컵 SEO HTML 오류:",
      err
    );

    return res
      .status(500)
      .send(
        "Worldcup SEO rendering failed"
      );
  }
});


/*
 * =====================================================
 * 404
 * =====================================================
 */

app.use((req, res) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


/*
 * =====================================================
 * Vercel export
 * =====================================================
 */

/*
 * =====================================================
 * 로컬 실행
 * =====================================================
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
 * =====================================================
 * Vercel 실행
 * =====================================================
 */

module.exports = app;