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
      "이상형 월드컵, 랭킹 게임, 애니메이션, 스포츠, 음악 등 다양한 주제의 콘텐츠를 확인하세요.\n크리에이터를 위한 음악, 저작권 및 Epidemic Sound 관련 정보도 확인하세요.",
    empty: "아직 이 언어로 등록된 글이 없습니다.",
    loading: "블로그 글을 불러오는 중입니다.",
    error: "블로그 글을 불러오지 못했습니다.",
    readMore: "글 읽기",
  },

  en: {
    title: "Blog",
    description:
      "Explore content about tournament games, ranking games, anime, sports, music, and more.\nDiscover music, copyright, and Epidemic Sound resources for creators.",
    empty: "There are no articles available in this language yet.",
    loading: "Loading articles.",
    error: "Unable to load the articles.",
    readMore: "Read article",
  },

  ja: {
    title: "ブログ",
    description:
      "理想のタイプトーナメント、ランキングゲーム、アニメ、スポーツ、音楽など、さまざまなコンテンツをご覧ください。\nクリエイター向けの音楽、著作権、Epidemic Soundに関する情報も紹介しています。",
    empty: "この言語の記事はまだありません。",
    loading: "記事を読み込んでいます。",
    error: "記事を読み込めませんでした。",
    readMore: "記事を読む",
  },

  zh: {
    title: "博客",
    description:
      "浏览理想型淘汰赛、排名游戏、动漫、体育、音乐等多种主题内容。\n同时查看面向创作者的音乐、版权和 Epidemic Sound 相关信息。",
    empty: "该语言暂时还没有文章。",
    loading: "正在加载博客文章。",
    error: "无法加载博客文章。",
    readMore: "阅读文章",
  },

  es: {
    title: "Blog",
    description:
      "Descubre contenido sobre torneos de preferencias, juegos de clasificación, anime, deportes, música y mucho más.\nConsulta también información sobre música, derechos de autor y Epidemic Sound para creadores.",
    empty: "Todavía no hay artículos disponibles en este idioma.",
    loading: "Cargando artículos.",
    error: "No se pudieron cargar los artículos.",
    readMore: "Leer artículo",
  },

  fr: {
    title: "Blog",
    description:
      "Découvrez des contenus sur les tournois de préférences, les jeux de classement, les anime, le sport, la musique et bien plus encore.\nRetrouvez également des informations sur la musique, les droits d’auteur et Epidemic Sound pour les créateurs.",
    empty: "Aucun article n’est encore disponible dans cette langue.",
    loading: "Chargement des articles.",
    error: "Impossible de charger les articles.",
    readMore: "Lire l’article",
  },

  vi: {
    title: "Blog",
    description:
      "Khám phá nội dung về các giải đấu lựa chọn, trò chơi xếp hạng, anime, thể thao, âm nhạc và nhiều chủ đề khác.\nXem thêm thông tin về âm nhạc, bản quyền và Epidemic Sound dành cho nhà sáng tạo.",
    empty: "Hiện chưa có bài viết nào bằng ngôn ngữ này.",
    loading: "Đang tải các bài viết.",
    error: "Không thể tải các bài viết.",
    readMore: "Đọc bài viết",
  },

  de: {
    title: "Blog",
    description:
      "Entdecke Inhalte zu Auswahlturnieren, Ranking-Spielen, Anime, Sport, Musik und vielen weiteren Themen.\nHier findest du außerdem Informationen zu Musik, Urheberrecht und Epidemic Sound für Kreative.",
    empty: "In dieser Sprache sind noch keine Artikel verfügbar.",
    loading: "Artikel werden geladen.",
    error: "Die Artikel konnten nicht geladen werden.",
    readMore: "Artikel lesen",
  },

  ru: {
    title: "Блог",
    description:
      "Читайте материалы о турнирах предпочтений, рейтинговых играх, аниме, спорте, музыке и других темах.\nЗдесь также представлена информация о музыке, авторских правах и Epidemic Sound для создателей контента.",
    empty: "На этом языке пока нет статей.",
    loading: "Загрузка статей.",
    error: "Не удалось загрузить статьи.",
    readMore: "Читать статью",
  },

  id: {
    title: "Blog",
    description:
      "Jelajahi konten tentang turnamen pilihan, permainan peringkat, anime, olahraga, musik, dan berbagai topik lainnya.\nTemukan juga informasi tentang musik, hak cipta, dan Epidemic Sound untuk kreator.",
    empty: "Belum ada artikel yang tersedia dalam bahasa ini.",
    loading: "Memuat artikel.",
    error: "Artikel tidak dapat dimuat.",
    readMore: "Baca artikel",
  },

  pt: {
    title: "Blog",
    description:
      "Explore conteúdos sobre torneios de preferências, jogos de classificação, anime, esportes, música e muito mais.\nConfira também informações sobre música, direitos autorais e Epidemic Sound para criadores.",
    empty: "Ainda não há artigos disponíveis neste idioma.",
    loading: "Carregando artigos.",
    error: "Não foi possível carregar os artigos.",
    readMore: "Ler artigo",
  },

  hi: {
    title: "ब्लॉग",
    description:
      "पसंदीदा विकल्प टूर्नामेंट, रैंकिंग गेम, एनीमे, खेल, संगीत और कई अन्य विषयों से जुड़ी सामग्री देखें।\nक्रिएटर्स के लिए संगीत, कॉपीराइट और Epidemic Sound से संबंधित जानकारी भी प्राप्त करें।",
    empty: "इस भाषा में अभी कोई लेख उपलब्ध नहीं है।",
    loading: "लेख लोड हो रहे हैं।",
    error: "लेख लोड नहीं किए जा सके।",
    readMore: "लेख पढ़ें",
  },

  tr: {
    title: "Blog",
    description:
      "Tercih turnuvaları, sıralama oyunları, anime, spor, müzik ve daha birçok konu hakkında içerikleri keşfedin.\nİçerik üreticileri için müzik, telif hakkı ve Epidemic Sound hakkında bilgilere de ulaşın.",
    empty: "Bu dilde henüz bir makale bulunmuyor.",
    loading: "Makaleler yükleniyor.",
    error: "Makaleler yüklenemedi.",
    readMore: "Makaleyi oku",
  },

  th: {
    title: "บล็อก",
    description:
      "พบกับเนื้อหาเกี่ยวกับทัวร์นาเมนต์ตัวเลือก เกมจัดอันดับ อนิเมะ กีฬา ดนตรี และหัวข้ออื่น ๆ อีกมากมาย\nพร้อมข้อมูลเกี่ยวกับดนตรี ลิขสิทธิ์ และ Epidemic Sound สำหรับครีเอเตอร์",
    empty: "ยังไม่มีบทความในภาษานี้",
    loading: "กำลังโหลดบทความ",
    error: "ไม่สามารถโหลดบทความได้",
    readMore: "อ่านบทความ",
  },

  ar: {
    title: "المدونة",
    description:
      "استكشف محتوى عن بطولات الاختيار وألعاب التصنيف والأنمي والرياضة والموسيقى والعديد من الموضوعات الأخرى.\nواطّلع أيضًا على معلومات حول الموسيقى وحقوق النشر وEpidemic Sound لصنّاع المحتوى.",
    empty: "لا توجد مقالات متاحة بهذه اللغة حتى الآن.",
    loading: "جارٍ تحميل المقالات.",
    error: "تعذر تحميل المقالات.",
    readMore: "قراءة المقال",
  },

  bn: {
    title: "ব্লগ",
    description:
      "পছন্দের টুর্নামেন্ট, র‍্যাঙ্কিং গেম, অ্যানিমে, খেলাধুলা, সঙ্গীত এবং আরও নানা বিষয়ের কনটেন্ট দেখুন।\nকনটেন্ট নির্মাতাদের জন্য সঙ্গীত, কপিরাইট এবং Epidemic Sound সম্পর্কিত তথ্যও জানুন।",
    empty: "এই ভাষায় এখনো কোনো নিবন্ধ পাওয়া যাচ্ছে না।",
    loading: "নিবন্ধগুলো লোড হচ্ছে।",
    error: "নিবন্ধগুলো লোড করা যায়নি।",
    readMore: "নিবন্ধ পড়ুন",
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

      try {
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
      } catch (error) {
        if (!mounted) return;

        console.error("Blog posts fetch error:", error);
        setPosts([]);
        setErrorMessage(error?.message || text.error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
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
        description={text.description.replace("\n", " ")}
      />

      <main className="blog-page">
        <section className="blog-container">
          <header className="blog-page-header">
            <p className="blog-eyebrow">ONEPICKGAME</p>

            <h1 className="blog-page-title">
              {text.title}
            </h1>

            <p
              className="blog-page-description"
              style={{ whiteSpace: "pre-line" }}
            >
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