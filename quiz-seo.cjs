// Public quiz metadata only. Never include answers or participant records.
const TITLES = { ko: "퀴즈 맞히기", en: "Quiz", ja: "クイズ", zh: "测验", ru: "Викторины", pt: "Quiz", es: "Quiz", fr: "Quiz", id: "Kuis", hi: "क्विज़", de: "Quiz", vi: "Đố vui", ar: "اختبار", bn: "কুইজ", th: "ควิซ", tr: "Quiz" };
const LANGS = Object.keys(TITLES);
const fields = "id,title,title_translations,description,description_translations,original_language,content_languages,thumbnail_url";
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const localized = (map, fallback, lang) => map?.[lang] || map?.en || fallback || "";
const languages = q => {
  const codes = Array.isArray(q.content_languages) && q.content_languages.length ? q.content_languages : [q.original_language];
  return [...new Set(codes)].filter(l => LANGS.includes(l));
};

module.exports = function installQuizSeo(app, db, origin) {
  app.get("/api/sitemap-quizzes", async (req, res) => {
    try {
      const urls = LANGS.map(l => `${origin}/${l}/quiz`);
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from("quizzes")
          .select("id,original_language,content_languages").eq("is_published", true)
          .order("id").range(from, from + 999);
        if (error) throw error;
        for (const q of data || []) for (const l of languages(q)) urls.push(`${origin}/${l}/quiz/${encodeURIComponent(q.id)}`);
        if (!data || data.length < 1000) break;
      }
      // Fail visibly instead of publishing an invalid oversized sitemap.
      if (urls.length > 50000) throw new Error("Quiz sitemap requires pagination");
      const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>`;
      res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      res.type("application/xml").send(xml);
    } catch (error) {
      console.error("Quiz sitemap failed:", error.message);
      res.status(500).send("Quiz sitemap unavailable");
    }
  });

  app.use(async (req, res, next) => {
    if (!["quiz-list", "quiz-detail"].includes(req.query?.seo)) return next();
    const lang = String(req.query.lang || "en");
    if (!LANGS.includes(lang)) return res.status(400).send("Unsupported language");
    const detail = req.query.seo === "quiz-detail";
    const id = String(req.query.id || "");
    if (detail && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return res.status(404).send("Quiz not found");
    try {
      let query = db.from("quizzes").select(fields).eq("is_published", true);
      query = detail ? query.eq("id", id).maybeSingle() : query.contains("content_languages", [lang]).order("created_at", { ascending: false }).limit(60);
      const { data, error } = await query;
      if (error) throw error;
      if (detail && !data) return res.status(404).send("Quiz not found");
      const name = detail ? localized(data.title_translations, data.title, lang) : TITLES[lang];
      const description = detail ? localized(data.description_translations, data.description, lang) || name : TITLES[lang];
      const slug = detail ? `quiz/${id}` : "quiz";
      const canonical = `${origin}/${lang}/${slug}`;
      const alternates = detail ? languages(data) : LANGS;
      const response = await fetch(`${origin}/`);
      if (!response.ok) throw new Error("Base HTML unavailable");
      let html = await response.text();
      html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
        .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi, "")
        .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, "")
        .replace(/<html([^>]*)lang=["'][^"']*["']/i, `<html$1lang="${lang}"`);
      const title = `${name} | ${lang === "ko" ? "원픽게임" : "OnePickGame"}`;
      const image = detail && /^https?:\/\//i.test(data.thumbnail_url || "") ? data.thumbnail_url : `${origin}/onepick-social.png`;
      const head = `<title data-rh="true">${esc(title)}</title>
<meta data-rh="true" name="description" content="${esc(description)}">
<meta data-rh="true" name="robots" content="index,follow,max-image-preview:large">
<link data-rh="true" rel="canonical" href="${esc(canonical)}">
${alternates.map(l => `<link data-rh="true" rel="alternate" hreflang="${l}" href="${origin}/${l}/${slug}">`).join("\n")}
${alternates.includes("en") ? `<link data-rh="true" rel="alternate" hreflang="x-default" href="${origin}/en/${slug}">` : ""}
<meta data-rh="true" property="og:title" content="${esc(title)}">
<meta data-rh="true" property="og:description" content="${esc(description)}">
<meta data-rh="true" property="og:url" content="${esc(canonical)}">
<meta data-rh="true" property="og:type" content="website">
<meta data-rh="true" property="og:image" content="${esc(image)}">
<meta data-rh="true" name="twitter:image" content="${esc(image)}">
<meta data-rh="true" name="twitter:card" content="summary_large_image">
`;
      const links = detail ? `<a href="${origin}/${lang}/quiz">${esc(TITLES[lang])}</a>` : `<ul>${(data || []).map(q => `<li><a href="${origin}/${lang}/quiz/${encodeURIComponent(q.id)}">${esc(localized(q.title_translations, q.title, lang))}</a></li>`).join("")}</ul>`;
      const body = `<main><h1>${esc(name)}</h1><p>${esc(description)}</p>${links}</main>`;
      html = html.replace("</head>", `${head}</head>`).replace(/<div\s+id=["']root["']>\s*<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i, `<div id="root">${body}</div>`);
      res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      res.type("html").send(html);
    } catch (error) {
      console.error("Quiz SEO failed:", error.message);
      res.status(500).send("Quiz temporarily unavailable");
    }
  });
};
