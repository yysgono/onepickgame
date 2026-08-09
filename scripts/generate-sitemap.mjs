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
// 월드컵 데이터 가져오기
// ======================================================

async function fetchWorldcups() {
  console.log("🔎 Supabase worldcups 조회 중...");

  const { data, error } = await supabase
    .from("worldcups")
    .select("id, created_at")
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "❌ worldcups 조회 실패:",
      error
    );

    throw error;
  }

  console.log(
    `✅ 활성 월드컵 ${data?.length || 0}개 조회 완료`
  );

  return data || [];
}

// ======================================================
// 언어별 sitemap 생성
// ======================================================

function generateLanguageSitemap(
  lang,
  worldcups
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

    // 언어별 sitemap 생성
    for (const lang of LANGS) {
      const xml =
        generateLanguageSitemap(
          lang,
          worldcups
        );

      const filePath =
        path.join(
          sitemapDir,
          `sitemap-${lang}-v2.xml`
        );

      fs.writeFileSync(
        filePath,
        xml,
        "utf8"
      );

      console.log(
        `✅ ${lang}: ${worldcups.length}개 월드컵 → ${filePath}`
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

    fs.writeFileSync(
      indexPath,
      indexXml,
      "utf8"
    );

    console.log("");
    console.log(
      "✅ sitemap index 생성 완료:"
    );

    console.log(indexPath);

    console.log("");
    console.log(
      `🎉 총 ${worldcups.length}개 월드컵 × ${LANGS.length}개 언어`
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