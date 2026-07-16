import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import Seo from "../seo/Seo";

const SUPPORTED_LANGS = [
  "ko",
  "en",
  "ja",
  "zh",
  "es",
  "fr",
  "vi",
  "de",
  "ru",
  "id",
  "pt",
  "hi",
  "tr",
  "th",
  "ar",
  "bn",
];

const blogText = {
  ko: {
    title: "블로그",
    description:
      "크리에이터를 위한 음악, 저작권 및 Epidemic Sound 관련 정보를 확인하세요.",
    empty: "아직 이 언어로 등록된 글이 없습니다.",
    loading: "블로그 글을 불러오는 중입니다.",
    error: "블로그 글을 불러오지 못했습니다.",
    readMore: "글 읽기",
  },

  en: {
    title: "Blog",
    description:
      "Read creator guides about music, copyright and Epidemic Sound.",
    empty: "There are no articles available in this language yet.",
    loading: "Loading articles.",
    error: "Unable to load the articles.",
    readMore: "Read article",
  },

  ja: {
    title: "ブログ",
    description:
      "音楽、著作権、Epidemic Soundに関するクリエイター向けガイドです。",
    empty: "この言語の記事はまだありません。",
    loading: "記事を読み込んでいます。",
    error: "記事を読み込めませんでした。",
    readMore: "記事を読む",
  },
};

function getBlogText(lang) {
  return blogText[lang] || blogText.en;
}

function formatDate(date, lang) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

export default function BlogPage() {
  const { lang = "en" } = useParams();

  const currentLang = SUPPORTED_LANGS.includes(lang) ? lang : "en";
  const text = getBlogText(currentLang);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchPosts() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, language, slug, title, description, created_at"
        )
        .eq("language", currentLang)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Blog posts fetch error:", error);
        setPosts([]);
        setErrorMessage(error.message || text.error);
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    }

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, [currentLang, text.error]);

  return (
    <>
      <Seo
        lang={currentLang}
        slug="blog"
        title={`${text.title} | OnePickGame`}
        description={text.description}
      />

      <main className="blog-page">
        <section className="blog-container">
          <header className="blog-page-header">
            <p className="blog-eyebrow">ONEPICKGAME</p>

            <h1 className="blog-page-title">
              {text.title}
            </h1>

            <p className="blog-page-description">
              {text.description}
            </p>
          </header>

          {loading && (
            <div className="blog-status">
              {text.loading}
            </div>
          )}

          {!loading && errorMessage && (
            <div className="blog-status blog-status-error">
              <strong>{text.error}</strong>
              <span>{errorMessage}</span>
            </div>
          )}

          {!loading &&
            !errorMessage &&
            posts.length === 0 && (
              <div className="blog-status">
                {text.empty}
              </div>
            )}

          {!loading &&
            !errorMessage &&
            posts.length > 0 && (
              <div className="blog-list">
                {posts.map((post) => (
                  <article
                    className="blog-card"
                    key={post.id}
                  >
                    <div className="blog-card-content">
                      {post.created_at && (
                        <time
                          className="blog-card-date"
                          dateTime={post.created_at}
                        >
                          {formatDate(
                            post.created_at,
                            currentLang
                          )}
                        </time>
                      )}

                      <h2 className="blog-card-title">
                        <Link
                          to={`/${currentLang}/blog/${post.slug}`}
                        >
                          {post.title}
                        </Link>
                      </h2>

                      {post.description && (
                        <p className="blog-card-description">
                          {post.description}
                        </p>
                      )}

                      <Link
                        className="blog-read-more"
                        to={`/${currentLang}/blog/${post.slug}`}
                      >
                        {text.readMore}
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </main>
    </>
  );
}