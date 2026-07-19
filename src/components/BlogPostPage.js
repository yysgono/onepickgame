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
      "選択した言語の記事がないか、削除されています。",
    error: "記事を読み込めませんでした。",
    back: "ブログに戻る",
    affiliate:
      "この記事にはアフィリエイトリンクが含まれています。リンクから登録すると、追加料金なしで報酬を受け取る場合があります。",
  },

  zh: {
    loading: "正在加载文章。",
    notFound: "未找到文章。",
    notFoundDescription:
      "所选语言的文章不存在或已被删除。",
    error: "无法加载文章。",
    back: "返回博客",
    affiliate:
      "本文包含联盟链接。如果您通过这些链接注册，我可能会获得佣金，您无需支付额外费用。",
  },

  es: {
    loading: "Cargando el artículo.",
    notFound: "Artículo no encontrado.",
    notFoundDescription:
      "Este artículo no está disponible en el idioma seleccionado o ha sido eliminado.",
    error: "No se pudo cargar el artículo.",
    back: "Volver al blog",
    affiliate:
      "Este artículo contiene enlaces de afiliados. Puedo recibir una comisión sin ningún coste adicional para ti.",
  },

  fr: {
    loading: "Chargement de l’article.",
    notFound: "Article introuvable.",
    notFoundDescription:
      "Cet article n’est pas disponible dans la langue sélectionnée ou a été supprimé.",
    error: "Impossible de charger l’article.",
    back: "Retour au blog",
    affiliate:
      "Cet article contient des liens d’affiliation. Je peux recevoir une commission sans frais supplémentaires pour vous.",
  },

  vi: {
    loading: "Đang tải bài viết.",
    notFound: "Không tìm thấy bài viết.",
    notFoundDescription:
      "Bài viết này không có sẵn bằng ngôn ngữ đã chọn hoặc đã bị xóa.",
    error: "Không thể tải bài viết.",
    back: "Quay lại blog",
    affiliate:
      "Bài viết này có chứa liên kết tiếp thị liên kết. Tôi có thể nhận được hoa hồng mà bạn không phải trả thêm chi phí.",
  },

  de: {
    loading: "Artikel wird geladen.",
    notFound: "Artikel nicht gefunden.",
    notFoundDescription:
      "Dieser Artikel ist in der ausgewählten Sprache nicht verfügbar oder wurde gelöscht.",
    error: "Der Artikel konnte nicht geladen werden.",
    back: "Zurück zum Blog",
    affiliate:
      "Dieser Artikel enthält Affiliate-Links. Ich kann eine Provision erhalten, ohne dass für Sie zusätzliche Kosten entstehen.",
  },

  ru: {
    loading: "Загрузка статьи.",
    notFound: "Статья не найдена.",
    notFoundDescription:
      "Эта статья недоступна на выбранном языке или была удалена.",
    error: "Не удалось загрузить статью.",
    back: "Вернуться в блог",
    affiliate:
      "Эта статья содержит партнерские ссылки. Я могу получить комиссию без дополнительных расходов для вас.",
  },

  id: {
    loading: "Memuat artikel.",
    notFound: "Artikel tidak ditemukan.",
    notFoundDescription:
      "Artikel ini tidak tersedia dalam bahasa yang dipilih atau telah dihapus.",
    error: "Artikel tidak dapat dimuat.",
    back: "Kembali ke blog",
    affiliate:
      "Artikel ini mengandung tautan afiliasi. Saya mungkin menerima komisi tanpa biaya tambahan bagi Anda.",
  },

  pt: {
    loading: "Carregando o artigo.",
    notFound: "Artigo não encontrado.",
    notFoundDescription:
      "Este artigo não está disponível no idioma selecionado ou foi removido.",
    error: "Não foi possível carregar o artigo.",
    back: "Voltar ao blog",
    affiliate:
      "Este artigo contém links de afiliados. Posso receber uma comissão sem nenhum custo adicional para você.",
  },

  hi: {
    loading: "लेख लोड हो रहा है।",
    notFound: "लेख नहीं मिला।",
    notFoundDescription:
      "यह लेख चुनी गई भाषा में उपलब्ध नहीं है या इसे हटा दिया गया है।",
    error: "लेख लोड नहीं किया जा सका।",
    back: "ब्लॉग पर वापस जाएँ",
    affiliate:
      "इस लेख में एफिलिएट लिंक शामिल हैं। इन लिंक से साइन अप करने पर मुझे बिना किसी अतिरिक्त लागत के कमीशन मिल सकता है।",
  },

  tr: {
    loading: "Makale yükleniyor.",
    notFound: "Makale bulunamadı.",
    notFoundDescription:
      "Bu makale seçilen dilde mevcut değil veya silinmiş olabilir.",
    error: "Makale yüklenemedi.",
    back: "Bloga dön",
    affiliate:
      "Bu makale bağlı kuruluş bağlantıları içerir. Size ek bir maliyet oluşturmadan komisyon kazanabilirim.",
  },

  th: {
    loading: "กำลังโหลดบทความ",
    notFound: "ไม่พบบทความ",
    notFoundDescription:
      "บทความนี้ไม่มีในภาษาที่เลือกหรืออาจถูกลบแล้ว",
    error: "ไม่สามารถโหลดบทความได้",
    back: "กลับไปที่บล็อก",
    affiliate:
      "บทความนี้มีลิงก์แนะนำ หากคุณสมัครผ่านลิงก์ดังกล่าว ฉันอาจได้รับค่าคอมมิชชันโดยที่คุณไม่เสียค่าใช้จ่ายเพิ่มเติม",
  },

  ar: {
    loading: "جارٍ تحميل المقال.",
    notFound: "لم يتم العثور على المقال.",
    notFoundDescription:
      "هذا المقال غير متاح باللغة المحددة أو ربما تم حذفه.",
    error: "تعذر تحميل المقال.",
    back: "العودة إلى المدونة",
    affiliate:
      "تحتوي هذه المقالة على روابط تسويق بالعمولة. قد أحصل على عمولة دون أي تكلفة إضافية عليك.",
  },

  bn: {
    loading: "নিবন্ধটি লোড হচ্ছে।",
    notFound: "নিবন্ধটি পাওয়া যায়নি।",
    notFoundDescription:
      "নির্বাচিত ভাষায় এই নিবন্ধটি পাওয়া যাচ্ছে না অথবা এটি মুছে ফেলা হয়েছে।",
    error: "নিবন্ধটি লোড করা যায়নি।",
    back: "ব্লগে ফিরে যান",
    affiliate:
      "এই নিবন্ধে অ্যাফিলিয়েট লিঙ্ক রয়েছে। এসব লিঙ্কের মাধ্যমে নিবন্ধন করলে অতিরিক্ত কোনো খরচ ছাড়াই আমি কমিশন পেতে পারি।",
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
    const savedVisitorId = localStorage.getItem(storageKey);

    if (savedVisitorId) {
      return savedVisitorId;
    }

    const newVisitorId =
      typeof window !== "undefined" &&
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : createFallbackVisitorId();

    localStorage.setItem(storageKey, newVisitorId);

    return newVisitorId;
  } catch (error) {
    console.error("Visitor ID creation error:", error);
    return createFallbackVisitorId();
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

      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select(
            "id, language, slug, title, description, content, created_at"
          )
          .eq("language", currentLang)
          .eq("slug", slug)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error("Blog post fetch error:", error);
          setErrorMessage(error.message || text.error);
          setPost(null);
        } else {
          setPost(data || null);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error("Blog post fetch error:", error);
        setErrorMessage(error?.message || text.error);
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
  }, [currentLang, slug, text.error]);

  useEffect(() => {
    if (!post?.slug || !post?.language) {
      return undefined;
    }

    let cancelled = false;

    async function recordBlogView() {
      try {
        const visitorId = getVisitorId();

        const { error } = await supabase.rpc(
          "record_blog_view",
          {
            p_slug: post.slug,
            p_language: post.language,
            p_visitor_id: visitorId,
          }
        );

        if (!cancelled && error) {
          console.error(
            "Blog view recording error:",
            error
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Blog view recording error:",
            error
          );
        }
      }
    }

    recordBlogView();

    return () => {
      cancelled = true;
    };
  }, [post?.slug, post?.language]);

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
          title={`${text.error} | OnePickGame`}
          description={text.error}
          noindex={true}
        />

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
      </>
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