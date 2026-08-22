// scripts/generate-prerender-seo.mjs

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ======================================================
// 기본 설정
// ======================================================

const BASE_URL = "https://www.onepickgame.com";

const SUPABASE_URL =
  "https://irfyuvuazhujtlgpkfci.supabase.co";

const SUPABASE_KEY =
  "sb_publishable__U91j22eqCETuyJ4-O1wUQ_WMu_Hk5r";

const LANGS = [
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

// ======================================================
// 언어별 SEO 앞부분
// App.js의 bracketTitleMap과 맞춤
// ======================================================

const BRACKET_TITLE_MAP = {
  en: "Ideal Type World Cup - Bracket Game",
  ko: "이상형 월드컵",
  ja: "人気投票トーナメント",
  zh: "淘汰赛游戏",
  es: "Torneo de Votación",
  fr: "Tournoi de Vote",
  vi: "Giải đấu bình chọn",
  de: "Abstimmungsturnier",
  ru: "Турнир голосований",
  id: "Turnamen Voting",
  pt: "Torneio de Votação",
  hi: "वोटिंग टूर्नामेंट",
  tr: "Turnuva Oyunu",
  th: "เกมโหวตแบบทัวร์นาเมนต์",
  ar: "بطولة التصويت",
  bn: "ভোটিং টুর্নামেন্ট",
};

// ======================================================
// Supabase
// ======================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ======================================================
// HTML escape
// ======================================================

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// JSON-LD 안전 처리
// ======================================================

function safeJson(value) {
  return JSON.stringify(value).replace(
    /</g,
    "\\u003c"
  );
}

// ======================================================
// 월드컵 데이터 조회
// ======================================================

async function fetchWorldcups() {
  console.log(
    "🔎 SEO 프리렌더용 월드컵 데이터 조회 중..."
  );

  const { data, error } = await supabase
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
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "❌ 월드컵 데이터 조회 실패:",
      error
    );

    throw error;
  }

  console.log(
    `✅ ${data?.length || 0}개 월드컵 조회 완료`
  );

  return data || [];
}

// ======================================================
// 현재 언어 제목
// ======================================================

function getTranslatedTitle(cup, lang) {
  return (
    cup?.title_translations?.[lang] ||
    cup?.title_translations?.en ||
    cup?.title ||
    "OnePickGame"
  );
}

// ======================================================
// 현재 언어 설명
// ======================================================

function getTranslatedDescription(
  cup,
  lang,
  title
) {
  return (
    cup?.description_translations?.[lang] ||
    cup?.description_translations?.en ||
    cup?.description ||
    `${title} - OnePickGame`
  );
}

// ======================================================
// 대표 이미지
// ======================================================

function getImage(cup) {
  const image =
    cup?.thumbnail ||
    cup?.image ||
    cup?.data?.[0]?.image ||
    "/onepick-social.png";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${BASE_URL}${
    String(image).startsWith("/")
      ? image
      : `/${image}`
  }`;
}

// ======================================================
// hreflang 생성
// ======================================================

function makeHreflangs(cupId) {
  let html = "";

  for (const lang of LANGS) {
    html += `
<link
  rel="alternate"
  hreflang="${lang}"
  href="${BASE_URL}/${lang}/select-round/${cupId}"
/>`;
  }

  html += `
<link
  rel="alternate"
  hreflang="x-default"
  href="${BASE_URL}/en/select-round/${cupId}"
/>`;

  return html;
}

// ======================================================
// SEO HEAD 생성
// ======================================================

function makeSeoHead(cup, lang) {
  const translatedTitle =
    getTranslatedTitle(cup, lang);

  const translatedDescription =
    getTranslatedDescription(
      cup,
      lang,
      translatedTitle
    );

  const bracketTitle =
    BRACKET_TITLE_MAP[lang] ||
    BRACKET_TITLE_MAP.en;

  const seoTitle =
    `${bracketTitle} | ${translatedTitle} | One Pick Game`;

  const canonical =
    `${BASE_URL}/${lang}/select-round/${cup.id}`;

  const image = getImage(cup);

  const description =
    translatedDescription.slice(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoTitle,
    description:
      translatedDescription,
    url: canonical,
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: "OnePickGame",
      url: BASE_URL,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: image,
    },
  };

  return `
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
  href="${escapeHtml(canonical)}"
/>

${makeHreflangs(cup.id)}

<meta
  property="og:type"
  content="website"
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
  content="${escapeHtml(canonical)}"
/>

<meta
  property="og:site_name"
  content="OnePickGame"
/>

<meta
  property="og:image"
  content="${escapeHtml(image)}"
/>

<meta
  property="og:image:alt"
  content="${escapeHtml(translatedTitle)}"
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
  content="${escapeHtml(image)}"
/>

<script type="application/ld+json">
${safeJson(jsonLd)}
</script>
`;
}

// ======================================================
// HTML 생성
// ======================================================

function buildHtml(
  baseHtml,
  cup,
  lang
) {
  const seoHead =
    makeSeoHead(cup, lang);

  let html = baseHtml;

  // html lang 변경
  html = html.replace(
    /<html[^>]*lang="[^"]*"[^>]*>/i,
    `<html lang="${lang}">`
  );

  // </head> 직전에 SEO 삽입
  html = html.replace(
    "</head>",
    `${seoHead}\n</head>`
  );

  return html;
}

// ======================================================
// 프리렌더 실행
// ======================================================

async function generatePrerenderSeo() {
  try {
    console.log("");
    console.log(
      "🚀 OnePickGame SEO 프리렌더 시작"
    );

    const buildIndexPath =
      path.resolve(
        "build",
        "index.html"
      );

    if (!fs.existsSync(buildIndexPath)) {
      throw new Error(
        "build/index.html이 없습니다. react-scripts build가 먼저 실행되어야 합니다."
      );
    }

    const baseHtml =
      fs.readFileSync(
        buildIndexPath,
        "utf8"
      );

    const worldcups =
      await fetchWorldcups();

    let createdCount = 0;

    for (const cup of worldcups) {
      if (!cup?.id) {
        continue;
      }

      for (const lang of LANGS) {
        const outputDir =
          path.resolve(
            "build",
            lang,
            "select-round",
            String(cup.id)
          );

        fs.mkdirSync(
          outputDir,
          {
            recursive: true,
          }
        );

        const html =
          buildHtml(
            baseHtml,
            cup,
            lang
          );

        const outputPath =
          path.join(
            outputDir,
            "index.html"
          );

        fs.writeFileSync(
          outputPath,
          html,
          "utf8"
        );

        createdCount += 1;
      }
    }

    console.log("");
    console.log(
      `✅ SEO HTML ${createdCount}개 생성 완료`
    );

    console.log(
      `🌍 ${worldcups.length}개 월드컵 × ${LANGS.length}개 언어`
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "❌ SEO 프리렌더 실패:"
    );

    console.error(error);

    process.exit(1);
  }
}

generatePrerenderSeo();