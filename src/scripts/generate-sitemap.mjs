// scripts/generate-sitemap.mjs
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// ✅ 반드시 본인 도메인으로 교체하세요 (https + www 권장)
const SITE_URL = "https://www.onepickgame.com";

// ✅ 지원 언어 (App.js의 LanguageWrapper와 반드시 일치)
const LOCALES = [
  "ko","en","ru","ja","zh","pt","es","fr","id","hi","de","vi","ar","bn","th","tr",
];

// ✅ 정적 라우트 슬러그들 (/:lang/ 아래 경로들)
// "" 는 홈(/:lang) 의미. 필요시 더 추가하세요.
const SLUGS = [
  "", // home
  "privacy-policy",
  "terms-of-service",
  "suggestions",
  "signup",
  "login",
  "find-id",
  "find-pw",
  "backup",
  "manage",
  "admin",
  "admin-stats",
  "my-worldcups",
  "recent-worldcups",
  "notice",
  // notice/:id, select-round/:id, match/result/stats 등은 동적이라 여기선 제외
];

// -------- 유틸 --------
const urlOf = (lang, slug) =>
  `${SITE_URL}/${lang}/${slug ? slug.replace(/^\/+|\/+$/g, "") + "/" : ""}`;

const makeAlternateLinks = (slug) => {
  const links = LOCALES
    .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${urlOf(l, slug)}" />`)
    .join("");
  const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${urlOf("en", slug)}" />`;
  return links + xDefault;
};

// -------- 본문 생성 --------
let items = "";

for (const slug of SLUGS) {
  for (const lang of LOCALES) {
    const loc = urlOf(lang, slug);
    items += `
  <url>
    <loc>${loc}</loc>
    ${makeAlternateLinks(slug)}
    <changefreq>weekly</changefreq>
    <priority>${slug === "" ? "0.7" : "0.6"}</priority>
  </url>`;
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${items.trim()}
</urlset>
`;

// -------- 파일 쓰기 --------
const outPath = "public/sitemap.xml";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, "utf8");
console.log("✅ Generated:", outPath);
