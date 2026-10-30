const { initialTranslationsMiddleware } = require("./initial-translations.cjs");
const { insertRoot, makePopularLoader, renderHomeBody, verifyHome } = require("./home-seo-support.cjs");
const SITE_HOME_COPY = require("./src/seo/siteHomeCopy.json");
const tierDetailSeo = require("./src/seo/tierDetailSeo.js");
const { renderDetailLinks } = require("./src/seo/detailLinks.js");
/// server.js

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const { loadSeoTemplate } = require("./seo-template.cjs");
require("dotenv").config();

const app = express();

app.use(initialTranslationsMiddleware);
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

require("./community-seo-routes.cjs")(app, supabase, SITE_URL);

require("./quiz-seo.cjs")(app, supabase, SITE_URL);

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

require("./account-withdrawal-routes.cjs")(app, supabaseAdmin, SITE_URL);

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
 "it", "pl", "nl", "cs"];

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

"it":"it_IT",
"pl":"pl_PL",
"nl":"nl_NL",
"cs":"cs_CZ"
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

"it":{"title":"Blog","description":"Esplora i contenuti sui giochi di tornei, i giochi di classifica, anime, sport, musica e altro ancora. Scopri musica, copyright e risorse audio epidemiche per i creatori.","brand":"OnePickGame","latest":"Ultimi articoli"},
"pl":{"title":"Blog","description":"Poznaj treści o grach turniejowych, grach rankingowych, anime, sporcie, muzyce i innych. Odkryj muzykę, prawa autorskie i epidemiczne zasoby dźwiękowe dla twórców.","brand":"OnePickGame","latest":"Najnowsze artykuły"},
"nl":{"title":"Blog","description":"Ontdek de inhoud van toernooigames, ranking games, anime, sport, muziek, en nog veel meer. Ontdek muziek, copyright en Epidemic Sound bronnen voor makers.","brand":"OnePickGame","latest":"Laatste artikelen"},
"cs":{"title":"Blog","description":"Prozkoumejte obsah turnajových her, žebříčku her, anime, sport, hudbu a další. Objevte hudbu, copyright a Epidemic Sound zdroje pro tvůrce.","brand":"OnePickGame","latest":"Nejnovější články"}
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
    let html = await loadSeoTemplate(SITE_URL);

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
        .eq("language", ["it","pl","nl","cs"].includes(lang) ? "en" : lang)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(12);

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
      .eq("language", ["it","pl","nl","cs"].includes(lang) ? "en" : lang)
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

    const validAlternates = Array.from(
      new Map(
        (alternatePosts || [])
          .filter((item) =>
            SUPPORTED_LANGS.includes(item.language)
          )
          .map((item) => [item.language, item])
      ).values()
    );

    if (!validAlternates.some((item) => item.language === lang)) {
      validAlternates.push({
        language: lang,
        slug: post.slug,
      });
    }

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

    // Search engines should receive the same representative-URL signals
    // in both the HTML head and the HTTP response.
    res.setHeader("Content-Language", lang);
    res.setHeader("X-Robots-Tag", "index, follow");
    res.setHeader("Link", `<${canonical}>; rel="canonical"`);

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
    title: "OnePickGame | Brackets, Tiers & Quizzes",
    description: "Create and play free tournament brackets, tier lists and quizzes on OnePickGame.",
    locale: "en_US",
  },
ko: {
  title: "이상형 월드컵 사이트 · 티어표 · 퀴즈 맞히기 | 원픽게임",
  description: "원픽게임은 이상형 월드컵을 무료로 만들고 즐기는 사이트입니다. 티어표와 퀴즈도 만들고 친구들과 공유해보세요.",
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

"it":{"title":"OnePickGame | Tornei, classifiche e quiz","description":"Crea e gioca tornei gratuiti, liste di livelli e quiz su OnePickGame.","locale":"it_US"},
"pl":{"title":"OnePickGame | Turnieje, rankingi i quizy","description":"Tworzenie i grać w darmowe turnieje turnieje, listy poziomów i quizy na OnePickGame.","locale":"en_US"},
"nl":{"title":"OnePickGame | Toernooien, tierlijsten en quizzen","description":"Maak en speel gratis toernooien toernooien, tier lijsten en quizzen op OnePickGame.","locale":"nl_US"},
"cs":{"title":"OnePickGame | Turnaje, žebříčky a kvízy","description":"Vytvořit a hrát zdarma turnaje turnaje, seznamy úrovní a kvízy na OnePickGame.","locale":"en_US"}
};

/*
 * =====================================================
 * 홈 추천 월드컵
 * =====================================================
 */

// Public client respects RLS; never use the service role for this extra home query.
const homePublicClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {auth:{persistSession:false,autoRefreshToken:false}}) : null;
const loadPopularHome = homePublicClient ? makePopularLoader(homePublicClient) : async () => [];

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

  const seo = { ...(HOME_SEO[lang] || HOME_SEO.en), ...(SITE_HOME_COPY[lang] || SITE_HOME_COPY.en) };

  try {
    let html = await loadSeoTemplate(SITE_URL);

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
      lang === "en" ? `${SITE_URL}/` : `${SITE_URL}/${lang}`;

    const image =
      `${SITE_URL}/ogimg.png`;

    const hreflangTags =
      SUPPORTED_LANGS.map(
        (language) => `
<link data-rh="true"
  rel="alternate"
  hreflang="${language}"
  href="${language === "en" ? `${SITE_URL}/` : `${SITE_URL}/${language}`}"
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
<title data-rh="true">${escapeHtml(
      seo.title
    )}</title>

<meta data-rh="true"
  name="description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta data-rh="true"
  name="robots"
  content="index, follow, max-image-preview:large"
/>

<link data-rh="true"
  rel="canonical"
  href="${canonical}"
/>

${hreflangTags}

<link data-rh="true"
  rel="alternate"
  hreflang="x-default"
  href="${SITE_URL}/"
/>

<meta data-rh="true"
  property="og:type"
  content="website"
/>

<meta data-rh="true"
  property="og:title"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta data-rh="true"
  property="og:description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta data-rh="true"
  property="og:url"
  content="${canonical}"
/>

<meta data-rh="true"
  property="og:site_name"
  content="OnePickGame"
/>

<meta data-rh="true"
  property="og:locale"
  content="${seo.locale}"
/>

<meta data-rh="true"
  property="og:image"
  content="${image}"
/>

<meta data-rh="true"
  property="og:image:alt"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta data-rh="true"
  name="twitter:card"
  content="summary_large_image"
/>

<meta data-rh="true"
  name="twitter:title"
  content="${escapeHtml(
    seo.title
  )}"
/>

<meta data-rh="true"
  name="twitter:description"
  content="${escapeHtml(
    seo.description
  )}"
/>

<meta data-rh="true"
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

const popularHomeRows = await loadPopularHome();
const seoBody = renderHomeBody(popularHomeRows, lang, seo);
html = insertRoot(html, seoBody);

    /*
     * SEO head 삽입
     */

html = html.replace(
  "</head>",
  `${seoHead}\n</head>`
);

    verifyHome(html);

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
 * 티어표 목록 페이지 서버 SEO
 *
 * /:lang/tier-list
 * =====================================================
 */

require("./tier-list-seo.cjs")(app, supabase, SITE_URL);


/*
 * =====================================================
 * 티어표 상세 페이지 서버 SEO
 *
 * /:lang/tier-list/:id
 * =====================================================
 */

app.use(async (req, res, next) => {
  const seoType = String(req.query?.seo || "");
  if (seoType !== "tier-list") return next();

  const lang = String(req.query?.lang || "en").trim().toLowerCase();
  const id = String(req.query?.id || "").trim();

  if (!SUPPORTED_LANGS.includes(lang)) {
    return res.status(400).send("Unsupported language");
  }
  if (!id) {
    return res.status(400).send("Tier list ID required");
  }

  try {
    const { data: tierList, error } = await supabase
      .from("tier_lists")
      .select("id,user_id,guest_nickname,title,description,title_translations,description_translations,original_language,thumbnail_url,candidate_count,candidates,tiers,updated_at,category,source_worldcup_id,tier_labels").is("deleted_at", null)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!tierList) return res.status(404).send("Tier list not found");

    let authorNickname = "";
    if (tierList.user_id) {
      try {
        const { data: profile, error: profileError } = await supabase.from("profiles")
          .select("nickname").eq("id", tierList.user_id).maybeSingle();
        if (!profileError) authorNickname = profile?.nickname || "";
      } catch { /* A missing public nickname must not make a tier list unavailable. */ }
    }
    const detailMeta = tierDetailSeo.getTierListDetailSeo(tierList, lang, authorNickname);
    const tierTitle = detailMeta.name;
    const tierDescription = detailMeta.description;
    const tierLanguages = detailMeta.languages;
    const seoTitle = detailMeta.title;
    const indexable = true;

    const canonical = `${SITE_URL}/${lang}/tier-list/${encodeURIComponent(id)}`;

    let candidates = [];
    if (Array.isArray(tierList.candidates)) candidates = tierList.candidates;
    else if (typeof tierList.candidates === "string") {
      try {
        const parsed = JSON.parse(tierList.candidates);
        if (Array.isArray(parsed)) candidates = parsed;
      } catch {}
    }

    let image = String(tierList.thumbnail_url || "").trim();
    if (!image) {
      for (const candidate of candidates) {
        const value = String(candidate?.image || candidate?.url || "").trim();
        if (value) {
          image = value;
          break;
        }
      }
    }
    if (!image) image = "/ogimg.png";
    if (!/^https?:\/\//i.test(image)) {
      image = `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
    }

    let html = await loadSeoTemplate(SITE_URL);
    html = html
      .replace(/<title[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\s+[^>]*(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi, "")
      .replace(/<link\s+[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, "")
      .replace(/<html([^>]*)lang=["'][^"']*["']([^>]*)>/i, `<html$1lang="${lang}"$2>`);

    const hreflangTags = indexable
      ? tierLanguages.map((language) => `\n<link rel="alternate" hreflang="${language}" href="${SITE_URL}/${language}/tier-list/${encodeURIComponent(id)}"/>`).join("")
      : "";

    const xDefault = indexable && tierLanguages.includes("en")
      ? `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/tier-list/${encodeURIComponent(id)}"/>`
      : "";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: tierTitle,
      headline: tierTitle,
      description: tierDescription,
      url: canonical,
      inLanguage: lang,
      isPartOf: { "@type": "WebSite", name: "OnePickGame", url: SITE_URL },
      primaryImageOfPage: { "@type": "ImageObject", url: image },
    };

    const seoHead = `
<title>${escapeHtml(seoTitle)}</title>
<meta name="description" content="${escapeHtml(tierDescription)}"/>
<meta name="robots" content="${indexable ? "index, follow, max-image-preview:large" : "noindex, follow"}"/>
<link rel="canonical" href="${canonical}"/>
${hreflangTags}${xDefault}
<meta property="og:type" content="website"/>
<meta property="og:title" content="${escapeHtml(seoTitle)}"/>
<meta property="og:description" content="${escapeHtml(tierDescription)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:site_name" content="OnePickGame"/>
<meta property="og:locale" content="${OG_LOCALE_MAP[lang] || "en_US"}"/>
<meta property="og:image" content="${escapeHtml(image)}"/>
<meta property="og:image:alt" content="${escapeHtml(tierTitle)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(seoTitle)}"/>
<meta name="twitter:description" content="${escapeHtml(tierDescription)}"/>
<meta name="twitter:image" content="${escapeHtml(image)}"/>
<script type="application/ld+json">${safeJson(jsonLd)}</script>
`;

    const candidateNames = candidates
      .slice(0, 20)
      .map((candidate) => String(candidate?.name || candidate?.title || "").trim())
      .filter(Boolean);

    const candidateList = candidateNames.length
      ? `<section><h2>${lang === "ko" ? "주요 후보" : "Candidates"}</h2><ul>${candidateNames.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul></section>`
      : "";

    const seoBody = `
<main id="seo-content" style="max-width:900px;margin:40px auto;padding:24px;font-family:Arial,sans-serif;">
  <article>
    <h1>${escapeHtml(tierTitle)}</h1>
    <p>${escapeHtml(tierDescription)}</p>
    ${candidateList}
    ${renderDetailLinks(lang, tierList.category, tierList.source_worldcup_id)}
  </article>
</main>`;

    const loadingRoot = /<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i;
    const emptyRoot = /<div\s+id=["']root["']>\s*<\/div>/i;
    if (loadingRoot.test(html)) html = html.replace(loadingRoot, () => `<div id="root">${seoBody}</div>`);
    else if (emptyRoot.test(html)) html = html.replace(emptyRoot, () => `<div id="root">${seoBody}</div>`);

    html = html.replace("</head>", () => `${seoHead}\n</head>`);

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("티어표 SEO HTML 오류:", err);
    return res.status(500).send("Tier list temporarily unavailable");
  }
});


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

    let html = await loadSeoTemplate(SITE_URL);

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
 * 누적 우승 횟수가 가장 많은 현재 후보를 SEO 이미지로 사용합니다.
 * 통계가 없거나 조회에 실패하면 기존 후보 이미지로 대체합니다.
 */
let image = "";

try {
  const { data: winnerStats, error: winnerStatsError } = await supabase.rpc(
    "get_winner_stats",
    { p_cup_id: id, p_from: null, p_to: null }
  );

  if (winnerStatsError) throw winnerStatsError;

  const candidateById = new Map(
    candidates.map((candidate) => [String(candidate.id), candidate])
  );
  let topCandidate = null;
  let topWinCount = 0;

  for (const stat of winnerStats || []) {
    const candidate = candidateById.get(String(stat.candidate_id));
    const winCount = Number(stat.win_count || 0);
    if (candidate && winCount > topWinCount) {
      topCandidate = candidate;
      topWinCount = winCount;
    }
  }

  image = getOgImageFromCandidate(topCandidate);
} catch (winnerStatsError) {
  console.warn("Failed to load world cup winner for SEO image", winnerStatsError);
}

if (!image) {
  for (const candidate of candidates) {
    const candidateImage = getOgImageFromCandidate(candidate);
    if (candidateImage) {
      image = candidateImage;
      break;
    }
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
  `이상형 월드컵 | ${worldcupTitle} | 원픽게임`;
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
    ${renderDetailLinks(lang, worldcup.category)}

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


// Restore category HTML and known React pages before the final 404 handler.
require("./random-pick-routes.cjs")(app, SITE_URL);
require("./category-routes.cjs")(app, supabase, SITE_URL);


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

