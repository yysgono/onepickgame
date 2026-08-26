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
    views: "조회수",
  },

  en: {
    loading: "Loading article.",
    notFound: "Article not found.",
    notFoundDescription:
      "This article is not available in the selected language.",
    error: "Unable to load the article.",
    back: "Back to blog",
    views: "Views",
  },

  ja: {
    loading: "記事を読み込んでいます。",
    notFound: "記事が見つかりません。",
    notFoundDescription:
      "選択した言語の記事がないか、削除されています。",
    error: "記事を読み込めませんでした。",
    back: "ブログに戻る",
    views: "閲覧数",
  },

  zh: {
    loading: "正在加载文章。",
    notFound: "未找到文章。",
    notFoundDescription:
      "所选语言的文章不存在或已被删除。",
    error: "无法加载文章。",
    back: "返回博客",
    views: "浏览量",
  },

  es: {
    loading: "Cargando el artículo.",
    notFound: "Artículo no encontrado.",
    notFoundDescription:
      "Este artículo no está disponible en el idioma seleccionado o ha sido eliminado.",
    error: "No se pudo cargar el artículo.",
    back: "Volver al blog",
    views: "Visualizaciones",
  },

  fr: {
    loading: "Chargement de l’article.",
    notFound: "Article introuvable.",
    notFoundDescription:
      "Cet article n’est pas disponible dans la langue sélectionnée ou a été supprimé.",
    error: "Impossible de charger l’article.",
    back: "Retour au blog",
    views: "Vues",
  },

  vi: {
    loading: "Đang tải bài viết.",
    notFound: "Không tìm thấy bài viết.",
    notFoundDescription:
      "Bài viết này không có sẵn bằng ngôn ngữ đã chọn hoặc đã bị xóa.",
    error: "Không thể tải bài viết.",
    back: "Quay lại blog",
    views: "Lượt xem",
  },

  de: {
    loading: "Artikel wird geladen.",
    notFound: "Artikel nicht gefunden.",
    notFoundDescription:
      "Dieser Artikel ist in der ausgewählten Sprache nicht verfügbar oder wurde gelöscht.",
    error: "Der Artikel konnte nicht geladen werden.",
    back: "Zurück zum Blog",
    views: "Aufrufe",
  },

  ru: {
    loading: "Загрузка статьи.",
    notFound: "Статья не найдена.",
    notFoundDescription:
      "Эта статья недоступна на выбранном языке или была удалена.",
    error: "Не удалось загрузить статью.",
    back: "Вернуться в блог",
    views: "Просмотры",
  },

  id: {
    loading: "Memuat artikel.",
    notFound: "Artikel tidak ditemukan.",
    notFoundDescription:
      "Artikel ini tidak tersedia dalam bahasa yang dipilih atau telah dihapus.",
    error: "Artikel tidak dapat dimuat.",
    back: "Kembali ke blog",
    views: "Tayangan",
  },

  pt: {
    loading: "Carregando o artigo.",
    notFound: "Artigo não encontrado.",
    notFoundDescription:
      "Este artigo não está disponível no idioma selecionado ou foi removido.",
    error: "Não foi possível carregar o artigo.",
    back: "Voltar ao blog",
    views: "Visualizações",
  },

  hi: {
    loading: "लेख लोड हो रहा है।",
    notFound: "लेख नहीं मिला।",
    notFoundDescription:
      "यह लेख चुनी गई भाषा में उपलब्ध नहीं है या इसे हटा दिया गया है।",
    error: "लेख लोड नहीं किया जा सका।",
    back: "ब्लॉग पर वापस जाएँ",
    views: "देखे जाने की संख्या",
  },

  tr: {
    loading: "Makale yükleniyor.",
    notFound: "Makale bulunamadı.",
    notFoundDescription:
      "Bu makale seçilen dilde mevcut değil veya silinmiş olabilir.",
    error: "Makale yüklenemedi.",
    back: "Bloga dön",
    views: "Görüntülenme",
  },

  th: {
    loading: "กำลังโหลดบทความ",
    notFound: "ไม่พบบทความ",
    notFoundDescription:
      "บทความนี้ไม่มีในภาษาที่เลือกหรืออาจถูกลบแล้ว",
    error: "ไม่สามารถโหลดบทความได้",
    back: "กลับไปที่บล็อก",
    views: "ยอดเข้าชม",
  },

  ar: {
    loading: "جارٍ تحميل المقال.",
    notFound: "لم يتم العثور على المقال.",
    notFoundDescription:
      "هذا المقال غير متاح باللغة المحددة أو ربما تم حذفه.",
    error: "تعذر تحميل المقال.",
    back: "العودة إلى المدونة",
    views: "المشاهدات",
  },

  bn: {
    loading: "নিবন্ধটি লোড হচ্ছে।",
    notFound: "নিবন্ধটি পাওয়া যায়নি।",
    notFoundDescription:
      "নির্বাচিত ভাষায় এই নিবন্ধটি পাওয়া যাচ্ছে না অথবা এটি মুছে ফেলা হয়েছে।",
    error: "নিবন্ধটি লোড করা যায়নি।",
    back: "ব্লগে ফিরে যান",
    views: "দেখা হয়েছে",
  },
};

function getDetailText(lang) {
  return detailText[lang] || detailText.en;
}

function getBrandName(lang) {
  return lang === "ko" ? "원픽게임" : "OnePickGame";
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

function formatViewCount(count, lang) {
  try {
    return new Intl.NumberFormat(lang).format(count);
  } catch {
    return String(count);
  }
}

function createFallbackVisitorId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getVisitorId() {
  const storageKey = "onepickgame_visitor_id";

  try {
    const savedVisitorId =
      localStorage.getItem(storageKey);

    if (savedVisitorId) {
      return savedVisitorId;
    }

    const newVisitorId =
      typeof window !== "undefined" &&
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : createFallbackVisitorId();

    localStorage.setItem(
      storageKey,
      newVisitorId
    );

    return newVisitorId;
  } catch (error) {
    console.error(
      "Visitor ID creation error:",
      error
    );

    return createFallbackVisitorId();
  }
}

export default function BlogPostPage() {
  const { lang = "en", slug = "" } =
    useParams();

  const currentLang =
    SUPPORTED_LANGS.includes(lang)
      ? lang
      : "en";

  const text = getDetailText(currentLang);
  const brandName =
    getBrandName(currentLang);

  const [post, setPost] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [viewCount, setViewCount] =
    useState(0);
  const [
    viewCountLoading,
    setViewCountLoading,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchPost() {
      setLoading(true);
      setErrorMessage("");
      setPost(null);
      setViewCount(0);

      try {
        const { data, error } =
          await supabase
            .from("blog_posts")
            .select(
              "id, language, slug, title, description, content, created_at"
            )
            .eq(
              "language",
              currentLang
            )
            .eq("slug", slug)
            .maybeSingle();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "Blog post fetch error:",
            error
          );
          setErrorMessage(
            error.message || text.error
          );
          setPost(null);
        } else {
          setPost(data || null);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "Blog post fetch error:",
          error
        );
        setErrorMessage(
          error?.message || text.error
        );
        setPost(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (!slug) {
      setPost(null);
      setLoading(false);
      return undefined;
    }

    fetchPost();

    return () => {
      mounted = false;
    };
  }, [
    currentLang,
    slug,
    text.error,
  ]);

  useEffect(() => {
    if (
      !post?.slug ||
      !post?.language
    ) {
      return undefined;
    }

    let mounted = true;

    async function recordViewAndFetchCount() {
      setViewCountLoading(true);

      try {
        const visitorId =
          getVisitorId();

        const { error: recordError } =
          await supabase.rpc(
            "record_blog_view",
            {
              p_slug: post.slug,
              p_language:
                post.language,
              p_visitor_id:
                visitorId,
            }
          );

        if (recordError) {
          console.error(
            "Blog view recording error:",
            recordError
          );
        }

        const {
          data,
          error: countError,
        } = await supabase.rpc(
          "get_blog_view_count",
          {
            p_slug: post.slug,
            p_language:
              post.language,
          }
        );

        if (!mounted) {
          return;
        }

        if (countError) {
          console.error(
            "Blog view count fetch error:",
            countError
          );
          setViewCount(0);
          return;
        }

        setViewCount(
          Number(data) || 0
        );
      } catch (error) {
        if (mounted) {
          console.error(
            "Blog view processing error:",
            error
          );
          setViewCount(0);
        }
      } finally {
        if (mounted) {
          setViewCountLoading(
            false
          );
        }
      }
    }

    recordViewAndFetchCount();

    return () => {
      mounted = false;
    };
  }, [
    post?.slug,
    post?.language,
  ]);

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
      <>
        <Seo
          lang={currentLang}
          slug={`blog/${slug}`}
          title={`${text.error} | ${brandName}`}
          description={text.error}
          indexable={false}
        />

        <main className="blog-page">
          <div className="blog-container">
            <div className="blog-status blog-status-error">
              <strong>
                {text.error}
              </strong>
              <span>
                {errorMessage}
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

  if (!post) {
    return (
      <>
        <Seo
          lang={currentLang}
          slug={`blog/${slug}`}
          title={`${text.notFound} | ${brandName}`}
          description={
            text.notFoundDescription
          }
          indexable={false}
        />

        <main className="blog-page">
          <div className="blog-container">
            <div className="blog-status">
              <strong>
                {text.notFound}
              </strong>

              <span>
                {
                  text.notFoundDescription
                }
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
        title={`${post.title} | ${brandName}`}
        description={
          post.description ||
          `${post.title} - ${brandName}`
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
              {currentLang === "ko"
                ? "원픽게임 블로그"
                : "ONEPICKGAME BLOG"}
            </p>

            <h1 className="blog-post-title">
              {post.title}
            </h1>

            {post.description && (
              <p className="blog-post-description">
                {post.description}
              </p>
            )}

            <div className="blog-post-meta">
              {post.created_at && (
                <time
                  className="blog-post-date"
                  dateTime={
                    post.created_at
                  }
                >
                  {formatDate(
                    post.created_at,
                    currentLang
                  )}
                </time>
              )}

              <span className="blog-post-views">
                {text.views}{" "}
                {viewCountLoading
                  ? "..."
                  : formatViewCount(
                      viewCount,
                      currentLang
                    )}
              </span>
            </div>
          </header>

          <div
            className="blog-post-content"
            dangerouslySetInnerHTML={{
              __html:
                post.content || "",
            }}
          />
        </article>
      </main>
    </>
  );
}