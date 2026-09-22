// scripts/generate-sitemap.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

// ======================================================
// 기본 설정
// ======================================================

const BASE_URL = "https://www.onepickgame.com";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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

const CATEGORY_SLUGS = [
  "korea",
  "person",
  "anime-manga",
  "game",
  "sports",
  "music",
  "movie-drama",
  "food",
  "etc",
];

const QUIZ_CATEGORY_SLUGS = [
  "game",
  "entertainment",
  "animation",
  "food",
  "sports",
  "knowledge",
  "other",
];

const TIER_CATEGORY_SLUGS = [
  "game",
  "entertainment",
  "animation",
  "food",
  "sports",
  "other",
];

// ======================================================
// Supabase
// ======================================================

let supabase;
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Sitemap requires SUPABASE_URL and a public/anon key in the existing environment.");
  if (!supabase) supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
  return supabase;
}

// ======================================================
// XML escape
// ======================================================

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ======================================================
// 날짜 변환
// ======================================================

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  try {
    return new Date(dateValue)
      .toISOString()
      .split("T")[0];
  } catch {
    return "";
  }
}

function getContentLastmod(item) {
  return formatDate(item?.updated_at || item?.modified_at);
}

// ======================================================
// sitemap URL entry
// ======================================================

function makeUrlEntry({
  loc,
  lastmod,
  changefreq = "weekly",
  priority = "0.7",
}) {
  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// ======================================================
// DB 전체 페이지 순회
// ======================================================

const DB_PAGE_SIZE = 1000;

async function fetchAllRows({ table, select, applyFilters, label }) {
  const allRows = [];
  let from = 0;

  while (true) {
    let query = getSupabase()
      .from(table)
      .select(select)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + DB_PAGE_SIZE - 1);

    if (typeof applyFilters === "function") {
      query = applyFilters(query);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ ${label} 조회 실패:`, error);
      throw error;
    }

    const rows = Array.isArray(data) ? data : [];
    allRows.push(...rows);

    if (rows.length < DB_PAGE_SIZE) {
      break;
    }

    from += DB_PAGE_SIZE;
  }

  console.log(`✅ ${label} ${allRows.length}개 조회 완료`);
  return allRows;
}

// ======================================================
// 월드컵 데이터 가져오기
// ======================================================

async function fetchWorldcups() {
  console.log("🔎 Supabase worldcups 전체 조회 중...");

  return fetchAllRows({
    table: "worldcups",
    select: "id, created_at, updated_at",
    applyFilters: (query) => query.is("deleted_at", null),
    label: "활성 월드컵",
  });
}

// ======================================================
// 티어표 데이터 가져오기
// ======================================================

async function fetchTierLists() {
  console.log("🔎 Supabase tier_lists 전체 조회 중...");

  return fetchAllRows({
    table: "tier_lists",
    select: "id, created_at, updated_at, original_language, title_translations, description_translations",
    label: "티어표",
  });
}

// ======================================================
// 퀴즈 데이터 가져오기
// ======================================================

async function fetchQuizzes() {
  console.log("🔎 Supabase quizzes 전체 조회 중...");

  return fetchAllRows({
    table: "quizzes",
    select: "id, created_at, original_language, content_languages, title_translations, description_translations",
    applyFilters: (query) => query.eq("is_published", true),
    label: "공개 퀴즈",
  });
}

// ======================================================
// 블로그 데이터 가져오기
// ======================================================

async function fetchBlogPosts() {
  console.log("🔎 Supabase blog_posts 전체 조회 중...");

  return fetchAllRows({
    table: "blog_posts",
    select: "id, language, slug, created_at",
    label: "블로그 글",
  });
}

// ======================================================
// 언어별 sitemap 생성
// ======================================================

export function generateLanguageSitemap(
  lang,
  worldcups,
  tierLists,
  quizzes = []
) {
  // Do not advertise the build date as a content modification date.
  const today = "";

  let xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n`;

  xml +=
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 홈
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}`,
    lastmod: today,
    changefreq: "daily",
    priority: "1.0",
  });

  // 개인정보 처리방침
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}/privacy-policy`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.5",
  });

  // 이용약관
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}/terms-of-service`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.5",
  });

  // 건의사항
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}/suggestions`,
    lastmod: today,
    changefreq: "weekly",
    priority: "0.6",
  });

  // 티어표 목록
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}/tier-list`,
    lastmod: today,
    changefreq: "daily",
    priority: "0.9",
  });

  // 퀴즈 목록
  xml += makeUrlEntry({
    loc: `${BASE_URL}/${lang}/quiz`,
    lastmod: today,
    changefreq: "daily",
    priority: "0.9",
  });

  for (const categorySlug of QUIZ_CATEGORY_SLUGS) {
    xml += makeUrlEntry({
      loc: `${BASE_URL}/${lang}/quiz?category=${categorySlug}`,
      lastmod: today,
      changefreq: "daily",
      priority: "0.82",
    });
  }

  for (const categorySlug of TIER_CATEGORY_SLUGS) {
    xml += makeUrlEntry({
      loc: `${BASE_URL}/${lang}/tier-list?category=${categorySlug}`,
      lastmod: today,
      changefreq: "daily",
      priority: "0.82",
    });
  }

  for (const categorySlug of CATEGORY_SLUGS) {
    xml += makeUrlEntry({
      loc: `${BASE_URL}/${lang}/category/${categorySlug}`,
      lastmod: today,
      changefreq: "daily",
      priority: "0.85",
    });
  }

  // Creation forms are not included in the sitemap.

  // ====================================================
  // 개별 월드컵
  // ====================================================

  for (const cup of worldcups) {
    if (!cup?.id) continue;

    xml += makeUrlEntry({
      loc:
        `${BASE_URL}/${lang}` +
        `/select-round/${cup.id}`,

      lastmod:
        getContentLastmod(cup),

      changefreq: "weekly",

      priority: "0.8",
    });
  }

  // ====================================================
  // 개별 티어표 결과
  // ====================================================

  for (const tierList of tierLists) {
    if (!tierList?.id) continue;

    const parseMap = (value) => {
      if (!value) return {};
      if (typeof value === "object" && !Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    };

    const titleMap = parseMap(tierList.title_translations);
    const descriptionMap = parseMap(tierList.description_translations);
    const availableLanguages = new Set([
      ...Object.keys(titleMap),
      ...Object.keys(descriptionMap),
      String(tierList.original_language || "").toLowerCase().split("-")[0],
    ].filter(Boolean));

    if (availableLanguages.size > 0 && !availableLanguages.has(lang)) continue;

    xml += makeUrlEntry({
      loc:
        `${BASE_URL}/${lang}` +
        `/tier-list/${tierList.id}`,
      lastmod: getContentLastmod(tierList),
      changefreq: "weekly",
      priority: "0.75",
    });
  }

  // ====================================================
  // 개별 퀴즈
  // ====================================================

  for (const quiz of quizzes) {
    if (!quiz?.id) continue;

    const availableLanguages = new Set([
      ...(Array.isArray(quiz.content_languages)
        ? quiz.content_languages
        : []),
      String(quiz.original_language || "").toLowerCase().split("-")[0],
    ].map((value) => String(value || "").toLowerCase().split("-")[0]).filter(Boolean));

    if (!availableLanguages.has(lang)) continue;

    xml += makeUrlEntry({
      loc:
        `${BASE_URL}/${lang}` +
        `/quiz/${quiz.id}`,
      lastmod: getContentLastmod(quiz),
      changefreq: "weekly",
      priority: "0.74",
    });
  }

  xml += `\n</urlset>\n`;

  return xml;
}

// ======================================================
// 블로그 sitemap 생성
// ======================================================

export function generateBlogSitemap(blogPosts = []) {
  let xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n`;

  xml +=
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const lang of LANGS) {
    xml += makeUrlEntry({
      loc: `${BASE_URL}/${lang}/blog`,
      changefreq: "daily",
      priority: "0.8",
    });
  }

  for (const post of blogPosts) {
    const lang =
      String(post?.language || "")
        .toLowerCase()
        .split("-")[0];
    const slug = String(post?.slug || "").trim();

    if (!LANGS.includes(lang) || !slug) {
      continue;
    }

    xml += makeUrlEntry({
      loc: `${BASE_URL}/${lang}/blog/${encodeURIComponent(slug)}`,
      lastmod: formatDate(post.created_at),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  xml += `\n</urlset>\n`;

  return xml;
}

// ======================================================
// sitemap index 생성
// ======================================================

export function generateSitemapIndex() {
  let xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n`;

  xml +=
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const lang of LANGS) {
    xml += `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/sitemap-${lang}-v2.xml</loc>
  </sitemap>`;
  }

  xml += `
  <sitemap>
    <loc>${BASE_URL}/sitemap-quizzes.xml</loc>
  </sitemap>`;

  // 네이버/검색엔진이 안정적으로 읽을 수 있도록 정적 블로그 sitemap을 광고한다.
  xml += `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/sitemap-blog.xml</loc>
  </sitemap>`;

  xml += `\n</sitemapindex>\n`;

  return xml;
}

// ======================================================
// 실행
// ======================================================

async function generateSitemaps() {
  try {
    console.log("");
    console.log(
      "🚀 OnePickGame sitemap 생성 시작"
    );

    const sitemapDir =
      path.resolve(
        "public",
        "sitemaps"
      );

    if (!fs.existsSync(sitemapDir)) {
      fs.mkdirSync(
        sitemapDir,
        {
          recursive: true,
        }
      );
    }

    // DB 월드컵 조회
    const worldcups =
      await fetchWorldcups();

    const tierLists =
      await fetchTierLists();

    const quizzes =
      await fetchQuizzes();

    const blogPosts =
      await fetchBlogPosts();

    // 언어별 sitemap 생성
    for (const lang of LANGS) {
      const xml =
        generateLanguageSitemap(
          lang,
          worldcups,
          tierLists,
          quizzes
        );

      const filePath =
        path.join(
          sitemapDir,
          `sitemap-${lang}-v2.xml`
        );

      const tempPath = `${filePath}.tmp`;

      fs.writeFileSync(
        tempPath,
        xml,
        "utf8"
      );

      fs.renameSync(tempPath, filePath);

      console.log(
        `✅ ${lang}: ${worldcups.length}개 월드컵 + ${tierLists.length}개 티어표 + ${quizzes.length}개 퀴즈 → ${filePath}`
      );
    }

    const blogSitemapXml =
      generateBlogSitemap(blogPosts);

    const blogSitemapPath =
      path.join(
        sitemapDir,
        "sitemap-blog.xml"
      );

    fs.writeFileSync(
      `${blogSitemapPath}.tmp`,
      blogSitemapXml,
      "utf8"
    );

    fs.renameSync(
      `${blogSitemapPath}.tmp`,
      blogSitemapPath
    );

    console.log(
      `✅ 블로그 sitemap: ${blogPosts.length}개 글 → ${blogSitemapPath}`
    );

    // sitemap index 생성
    const indexXml =
      generateSitemapIndex();

    const indexPath =
      path.resolve(
        "public",
        "sitemap_index-v2.xml"
      );

    const tempIndexPath = `${indexPath}.tmp`;

    fs.writeFileSync(
      tempIndexPath,
      indexXml,
      "utf8"
    );

    fs.renameSync(tempIndexPath, indexPath);

    // Keep old Search Console submissions in sync with the advertised index.
    const compatibilityPath = path.resolve("public", "sitemap.xml");
    fs.writeFileSync(`${compatibilityPath}.tmp`, indexXml, "utf8");
    fs.renameSync(`${compatibilityPath}.tmp`, compatibilityPath);

    console.log("");
    console.log(
      "✅ sitemap index 생성 완료:"
    );

    console.log(indexPath);

    console.log("");
    console.log(
      `🎉 총 ${worldcups.length}개 월드컵 + ${tierLists.length}개 티어표 + ${quizzes.length}개 퀴즈 × ${LANGS.length}개 언어 + 블로그 ${blogPosts.length}개`
    );

    console.log(
      `🌍 최대 ${worldcups.length * LANGS.length}개의 개별 월드컵 URL 생성`
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "❌ Sitemap 생성 실패:"
    );

    console.error(error);

    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSitemaps();
}
export { generateSitemaps };
