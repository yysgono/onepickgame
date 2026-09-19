import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageIntro from "./PageIntro";
import { getQuizCopy } from "./components/quizCopy";
import MediaRenderer from "./MediaRenderer";
import {
  getQuizzes,
  getFeaturedQuizzes,
  QUIZ_LANGUAGES,
} from "../utils/supabaseQuizApi";

const CATEGORIES = [
  "all",
  "game",
  "entertainment",
  "animation",
  "food",
  "sports",
  "knowledge",
  "other",
];

function localized(map, fallback, lang) {
  if (map && typeof map === "object") {
    return map[lang] || map.en || fallback || "";
  }
  return fallback || "";
}

export default function QuizPage() {
  const { lang: routeLang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = routeLang || (i18n.language || "en").split("-")[0];
  const c = getQuizCopy(lang);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [contentLanguage, setContentLanguage] = useState(
    QUIZ_LANGUAGES.some((x) => x.code === lang) ? lang : "en"
  );
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 650 : false
  );

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 650);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (QUIZ_LANGUAGES.some((x) => x.code === lang)) {
      setContentLanguage(lang);
    }
  }, [lang]);

  useEffect(() => {
    let alive = true;
    getFeaturedQuizzes({ contentLanguage, limit: 3 })
      .then((data) => alive && setRecommended(data || []))
      .catch(() => alive && setRecommended([]));
    return () => { alive = false; };
  }, [contentLanguage]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getQuizzes({
      search: debounced,
      category,
      sort,
      contentLanguage,
    })
      .then((data) => alive && setRows(data))
      .catch((e) => alive && setError(e.message || String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debounced, category, sort, contentLanguage]);

  useEffect(() => {
    setVisibleCount(10);
  }, [debounced, category, sort, contentLanguage]);

  const cards = useMemo(
    () =>
      rows.map((q) => ({
        ...q,
        displayTitle: localized(q.title_translations, q.title, lang),
        displayDescription: localized(
          q.description_translations,
          q.description,
          lang
        ),
      })),
    [rows, lang]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "#202534",
      }}
    >
      <div
        className="tier-page-container"
        style={{
          width: "100%",
          maxWidth: mobile ? 430 : 1780,
          margin: "0 auto",
          padding: mobile ? "20px 10px" : "22px 22px",
          boxSizing: "border-box",
        }}
      >
        <PageIntro
          icon="❓"
          title={c.title}
          description={c.intro}
          buttonLabel={c.create}
          onCreate={() => navigate(`/${lang}/quiz/create`)}
          accentColor="#E53935"
        />

        <div
          style={{
            width: "100%",
            maxWidth: 980,
            margin: "0 auto 4px",
            boxSizing: "border-box",
            border: "none",
            borderRadius: 0,
            padding: mobile ? 12 : 16,
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.search}
              style={{
                flex: 1,
                minWidth: 220,
                height: 44,
                border: "1.5px solid #bccae0",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 17,
                fontWeight: 750,
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: mobile ? 6 : 8,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            {QUIZ_LANGUAGES.map((item) => (
              <React.Fragment key={item.code}>
              {item.code === "id" && <span aria-hidden="true" style={{ flexBasis: "100%", height: 0 }} />}
              <button
                type="button"
                onClick={() => setContentLanguage(item.code)}
                aria-pressed={contentLanguage === item.code}
                style={languageButton(contentLanguage === item.code, mobile)}
              >
                {item.label}
              </button>
              </React.Fragment>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid #e4e9f0",
            }}
          >
            {CATEGORIES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCategory(v)}
                style={{
                  ...toggleButton(category === v),
                  height: "auto",
                  padding: "6px 11px",
                }}
              >
                {c[v]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
            {["popular", "latest"].map((v) => (
              <button key={v} type="button" onClick={() => setSort(v)} style={toggleButton(sort === v)}>{c[v]}</button>
            ))}
          </div>
        </div>


        {recommended.length > 0 && (
          <section style={{ width: "100%", maxWidth: 1440, margin: "0 auto 28px", boxSizing: "border-box" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: mobile ? 22 : 29, textAlign: "center" }}>{c.featured}</h2>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit,minmax(459px,544px))", justifyContent: "center", gap: 18 }}>
              {recommended.slice(0, 3).map((q) => (
                <button key={q.id} type="button" onClick={() => navigate(`/${lang}/quiz/${q.id}`)} style={{ padding: 0, border: "1.5px solid #cfd8e6", borderBottom: "4px solid #E53935", borderRadius: 12, overflow: "hidden", background: "#fff", textAlign: "left", cursor: "pointer", color: "#202534" }}>
                  <div style={{ aspectRatio: "16/9", background: "#f3f6fb", overflow: "hidden" }}>
                    {q.thumbnail_url ? <MediaRenderer url={q.thumbnail_url} alt="" playable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 42 }}>?</div>}
                  </div>
                  <div style={{ padding: mobile ? 14 : 13 }}>
                    <div style={{ fontSize: mobile ? 20 : 18, fontWeight: 950, lineHeight: 1.35, minHeight: mobile ? 54 : 49, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{localized(q.title_translations, q.title, lang)}</div>
                    <div style={{ marginTop: 7, color: "#667085", fontSize: mobile ? 15 : 14 }}>▶ {q.play_count || 0} · {q.question_count || 0} {c.questions}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <h2 style={{ maxWidth: 1440, margin: "22px auto 14px", fontSize: mobile ? 22 : 27, textAlign: "center" }}>{c.allQuizzes}</h2>

        {error && (
          <div style={{ textAlign: "center", color: "#b42346", padding: 20 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#596579", fontWeight: 800 }}>
            {c.loading}
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: "center", padding: 50, color: "#596579", fontWeight: 800 }}>
            {c.empty}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 1740,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr)",
              gap: 16,
            }}
          >
            {cards.slice(0, visibleCount).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => navigate(`/${lang}/quiz/${q.id}`)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 0,
                  border: "1.5px solid #d5dde9",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "#202534",
                  display: "grid",
                  gridTemplateColumns: mobile ? "118px minmax(0,1fr)" : "320px minmax(0,1fr) 180px 150px",
                  gap: 0,
                  alignItems: "stretch",
                  minHeight: mobile ? 126 : 220,
                  height: mobile ? 126 : 220,
                }}
              >
                <div
                  style={{
                    minHeight: mobile ? 126 : 220,
                    height: mobile ? 126 : 220,
                    maxHeight: mobile ? 126 : 220,
                    background: "#f3f6fb",
                    border: "1px solid #e0e6ef",
                    borderRadius: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {q.thumbnail_url ? (
                    <MediaRenderer
                      url={q.thumbnail_url}
                      alt=""
                      playable={false}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 54 }}>?</span>
                  )}
                </div>
                <div style={{ minWidth: 0, padding: mobile ? "14px 12px" : "24px 22px", alignSelf: "center" }}>
                  <div
                    style={{
                      fontSize: mobile ? 18 : 23,
                      fontWeight: 900,
                      lineHeight: 1.35,
                      minHeight: mobile ? 0 : 30,
                      marginTop: 0,
                    }}
                  >
                    {q.displayTitle}
                  </div>
                  <div
                    style={{
                      fontSize: mobile ? 14 : 16,
                      color: "#657287",
                      lineHeight: 1.4,
                      minHeight: mobile ? 0 : 38,
                      marginTop: 5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      textOverflow: "ellipsis",
                    }}
                  >
                    {q.displayDescription || "\u00A0"}
                  </div>
                </div>
                {!mobile && (
                  <div style={{ alignSelf: "center", padding: "4px 20px", borderLeft: "1px solid #e1e6ee", color: "#465166", fontSize: 16, fontWeight: 850, lineHeight: 1.9 }}>
                    <div style={{ display: "inline-flex", maxWidth: "100%", padding: "4px 10px", marginBottom: 5, borderRadius: 999, background: "#FFF1F1", color: "#C62828", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14 }}>{c[q.category] || c.other}</div>
                    <div>▣ {q.question_count || 0} {c.questions}</div>
                    <div>▶ {q.play_count || 0}</div>
                    <div>💬 {q.comment_count || 0}</div>
                  </div>
                )}
                {!mobile && (
                  <div style={{ alignSelf: "center", margin: "0 18px", minHeight: 62, display: "grid", placeItems: "center", borderRadius: 10, background: "#E53935", color: "#fff", fontSize: 19, fontWeight: 950, boxShadow: "0 5px 12px rgba(229,57,53,.18)" }}>{c.playNow}</div>
                )}
              </button>
            ))}
          </div>
        )}
        {!loading && visibleCount < cards.length && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={() => setVisibleCount((count) => count + 10)} style={primaryButton}>{c.loadMoreQuizzes}</button>
            <button type="button" onClick={() => setVisibleCount(cards.length)} style={{ ...primaryButton, background: "#fff", color: "#C62828" }}>{c.showAll}</button>
          </div>
        )}
      </div>
    </div>
  );
}

const primaryButton = {
  border: "1px solid #E53935",
  background: "#E53935",
  color: "#fff",
  borderRadius: 8,
  padding: "11px 22px",
  fontWeight: 900,
  cursor: "pointer",
};

function toggleButton(active) {
  return {
    height: 44,
    border: active ? "1.5px solid #E53935" : "1px solid #d6deea",
    background: active ? "#E53935" : "#fff",
    color: active ? "#fff" : "#3f4a5a",
    borderRadius: 8,
    padding: "0 14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "none",
  };
}

function languageButton(active, mobile) {
  return {
    border: active ? "1.5px solid #E53935" : "1px solid #d6deea",
    background: active ? "#E53935" : "#fff",
    color: active ? "#fff" : "#3f4a5a",
    borderRadius: 8,
    padding: mobile ? "5px 9px" : "6px 11px",
    fontSize: mobile ? 13 : 14,
    fontWeight: active ? 800 : 700,
    cursor: "pointer",
    lineHeight: 1.2,
    boxShadow: "none",
  };
}
