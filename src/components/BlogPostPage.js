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

const detailText = {
  ko: {
    loading: "글을 불러오는 중입니다.",
    notFound: "글을 찾을 수 없습니다.",
    notFoundDescription:
      "이 언어로 작성된 글이 없거나 삭제된 글입니다.",
    error: "글을 불러오지 못했습니다.",
    back: "블로그로 돌아가기",
    affiliate:
      "이 글에는 제휴 링크가 포함되어 있습니다. 링크를 통해 가입할 경우 추가 비용 없이 일정 수수료를 받을 수 있습니다.",
  },

  en: {
    loading: "Loading article.",
    notFound: "Article not found.",
    notFoundDescription:
      "This article is not available in the selected language.",
    error: "Unable to load the article.",
    back: "Back to blog",
    affiliate:
      "This article contains affiliate links. I may receive a commission at no additional cost to you.",
  },

  ja: {
    loading: "記事を読み込んでいます。",
    notFound: "記事が見つかりません。",
    notFoundDescription:
      "選択した言語の記事はまだありません。",
    error: "記事を読み込めませんでした。",
    back: "ブログに戻る",
    affiliate:
      "この記事にはアフィリエイトリンクが含まれています。",
  },
};

function getDetailText(lang) {
  return detailText[lang] || detailText.en;
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

export default function BlogPostPage() {
  const { lang = "en", slug = "" } = useParams();

  const currentLang = SUPPORTED_LANGS.includes(lang)
    ? lang
    : "en";

  const text = getDetailText(currentLang);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchPost() {
      setLoading(true);
      setErrorMessage("");
      setPost(null);

      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, language, slug, title, description, content, created_at"
        )
        .eq("language", currentLang)
        .eq("slug", slug)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Blog post fetch error:", error);

        setErrorMessage(
          error.message || text.error
        );
      } else {
        setPost(data || null);
      }

      setLoading(false);
    }

    fetchPost();

    return () => {
      mounted = false;
    };
  }, [currentLang, slug, text.error]);

  if (loading) {
    return (
      <main className="blog-page">
        <div className="blog-container">
          <div className="blog-status">
            {text.loading}
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="blog-page">
        <div className="blog-container">
          <div className="blog-status blog-status-error">
            <strong>{text.error}</strong>
            <span>{errorMessage}</span>
          </div>

          <Link
            className="blog-back-link"
            to={`/${currentLang}/blog`}
          >
            ← {text.back}
          </Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <>
        <Seo
          lang={currentLang}
          slug={`blog/${slug}`}
          title={`${text.notFound} | OnePickGame`}
          description={text.notFoundDescription}
          noindex={true}
        />

        <main className="blog-page">
          <div className="blog-container">
            <div className="blog-status">
              <strong>{text.notFound}</strong>

              <span>
                {text.notFoundDescription}
              </span>
            </div>

            <Link
              className="blog-back-link"
              to={`/${currentLang}/blog`}
            >
              ← {text.back}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo
        lang={currentLang}
        slug={`blog/${post.slug}`}
        title={`${post.title} | OnePickGame`}
        description={
          post.description ||
          `${post.title} - OnePickGame`
        }
      />

      <main className="blog-page">
        <article className="blog-post">
          <Link
            className="blog-back-link"
            to={`/${currentLang}/blog`}
          >
            ← {text.back}
          </Link>

          <header className="blog-post-header">
            <p className="blog-eyebrow">
              ONEPICKGAME BLOG
            </p>

            <h1 className="blog-post-title">
              {post.title}
            </h1>

            {post.description && (
              <p className="blog-post-description">
                {post.description}
              </p>
            )}

            {post.created_at && (
              <time
                className="blog-post-date"
                dateTime={post.created_at}
              >
                {formatDate(
                  post.created_at,
                  currentLang
                )}
              </time>
            )}
          </header>

          <aside className="affiliate-disclosure">
            {text.affiliate}
          </aside>

          <div
            className="blog-post-content"
            dangerouslySetInnerHTML={{
              __html: post.content || "",
            }}
          />
        </article>
      </main>
    </>
  );
}