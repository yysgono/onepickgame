// scripts/generate-sitemap.mjs

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
    return new Date()
      .toISOString()
      .split("T")[0];
  }

  try {
    return new Date(dateValue)
      .toISOString()
      .split("T")[0];
  } catch {
    return new Date()
      .toISOString()
      .split("T")[0];
  }
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
    <lastmod>${escapeXml(lastmod)}</lastmod>
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
    let query = supabase
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
    select: "id, created_at",
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
    select: "id, created_at",
    label: "티어표",
  });
}

// ======================================================
// 언어별 sitemap 생성
// ======================================================

function generateLanguageSitemap(
  lang,
  worldcups,
  tierLists
) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

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
    loc: `${BASE_URL}/privacy-policy`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.5",
  });

  // 이용약관
  xml += makeUrlEntry({
    loc: `${BASE_URL}/terms-of-service`,
    lastmod: today,
    changefreq: "yearly",
    priority: "0.5",
  });

  // 건의사항
  xml += makeUrlEntry({
    loc: `${BASE_URL}/suggestions-board`,
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
        formatDate(cup.created_at),

      changefreq: "weekly",

      priority: "0.8",
    });
  }

  // ====================================================
  // 개별 티어표 결과
  // ====================================================

  for (const tierList of tierLists) {
    if (!tierList?.id) continue;

    xml += makeUrlEntry({
      loc:
        `${BASE_URL}/${lang}` +
        `/tier-list/${tierList.id}`,
      lastmod: formatDate(tierList.created_at),
      changefreq: "weekly",
      priority: "0.75",
    });
  }

  xml += `\n</urlset>\n`;

  return xml;
}

// ======================================================
// sitemap index 생성
// ======================================================

function generateSitemapIndex() {
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
    <loc>${BASE_URL}/api/sitemap-quizzes</loc>
  </sitemap>`;

  // 블로그 sitemap 유지
  xml += `
  <sitemap>
    <loc>${BASE_URL}/api/sitemap-blog</loc>
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

    // 언어별 sitemap 생성
    for (const lang of LANGS) {
      const xml =
        generateLanguageSitemap(
          lang,
          worldcups,
          tierLists
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
        `✅ ${lang}: ${worldcups.length}개 월드컵 + ${tierLists.length}개 티어표 → ${filePath}`
      );
    }

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

    console.log("");
    console.log(
      "✅ sitemap index 생성 완료:"
    );

    console.log(indexPath);

    console.log("");
    console.log(
      `🎉 총 ${worldcups.length}개 월드컵 + ${tierLists.length}개 티어표 × ${LANGS.length}개 언어`
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

generateSitemaps();
