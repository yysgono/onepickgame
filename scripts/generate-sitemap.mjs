// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.onepickgame.com";
const LAST_MOD = new Date().toISOString().split("T")[0];
const LANGS = [
  "ko", "en", "ja", "zh", "ru", "pt", "es", "fr", "id", "hi", "de", "vi", 
  "tr", "it", "ar", "th" // 16개 언어
];

function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `;
  xml += `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  LANGS.forEach((lang) => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/${lang}</loc>\n`;
    LANGS.forEach((altLang) => {
      xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${BASE_URL}/${altLang}"/>\n`;
    });
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en"/>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const filePath = path.resolve("public", "sitemap.xml");
  fs.writeFileSync(filePath, xml);
  console.log(`✅ Sitemap generated at ${filePath}`);
}

generateSitemap();
