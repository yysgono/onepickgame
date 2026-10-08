import PageIntro from "./PageIntro";

import "../registerHeaderTranslations";

// src/components/Home.js

import React, { useState, useRef, useEffect } from "react";

import { useTranslation } from "react-i18next";

import {

  Link,
  useNavigate,

  useLocation,

} from "react-router-dom";

import { fetchWinnerStatsFromDB } from "../utils";

import { supabase } from "../utils/supabaseClient";

import MediaRenderer from "./MediaRenderer";
import {
  getWorldcupDescription,
  getWorldcupTitle,
} from "../utils/localization";





const LANGUAGES = [

  { code: "en", label: "English" },

  { code: "ko", label: "한국어" },

  { code: "ja", label: "日本語" },

  { code: "zh", label: "简体中文" },

  { code: "es", label: "Español" },

  { code: "fr", label: "Français" },

  { code: "vi", label: "Tiếng Việt" },

  { code: "de", label: "Deutsch" },

  { code: "ru", label: "Русский" },

  { code: "id", label: "Bahasa Indonesia" },

  { code: "pt", label: "Português" },

  { code: "hi", label: "हिन्दी" },

  { code: "tr", label: "Türkçe" },

  { code: "th", label: "ภาษาไทย" },

  { code: "ar", label: "العربية" },

  { code: "bn", label: "বাংলা" },

];

const WORLDCUP_CARD_META_COPY = {
  ko: { candidates: "후보", plays: "플레이", updated: "수정" },
  en: { candidates: "Candidates", plays: "Plays", updated: "Updated" },
  ja: { candidates: "候補", plays: "プレイ", updated: "更新" },
  zh: { candidates: "候选", plays: "游玩", updated: "更新" },
  es: { candidates: "Candidatos", plays: "Partidas", updated: "Actualizado" },
  fr: { candidates: "Candidats", plays: "Parties", updated: "Mis à jour" },
  vi: { candidates: "Ứng viên", plays: "Lượt chơi", updated: "Cập nhật" },
  de: { candidates: "Kandidaten", plays: "Spiele", updated: "Aktualisiert" },
  ru: { candidates: "Кандидаты", plays: "Игры", updated: "Обновлено" },
  id: { candidates: "Kandidat", plays: "Main", updated: "Diperbarui" },
  pt: { candidates: "Candidatos", plays: "Jogadas", updated: "Atualizado" },
  hi: { candidates: "उम्मीदवार", plays: "खेल", updated: "अपडेट" },
  tr: { candidates: "Aday", plays: "Oynama", updated: "Güncellendi" },
  th: { candidates: "ผู้สมัคร", plays: "เล่น", updated: "อัปเดต" },
  ar: { candidates: "المرشحون", plays: "مرات اللعب", updated: "تحديث" },
  bn: { candidates: "প্রার্থী", plays: "খেলা", updated: "আপডেট" },
};

const HOME_SIDE_PANEL_COPY = {
  ko: {
    recentCreated: "최근 만들어진 월드컵",
    recentPlayed: "최근 플레이",
    empty: "표시할 월드컵이 없습니다.",
  },
  en: {
    recentCreated: "Recently Created Brackets",
    recentPlayed: "Recent Plays",
    empty: "No brackets to show yet.",
  },
  ja: {
    recentCreated: "最近作成されたワールドカップ",
    recentPlayed: "最近のプレイ",
    empty: "表示できるワールドカップがありません。",
  },
  zh: {
    recentCreated: "最近创建的淘汰赛",
    recentPlayed: "最近游玩",
    empty: "暂无可显示的淘汰赛。",
  },
  es: {
    recentCreated: "Torneos creados recientemente",
    recentPlayed: "Jugadas recientes",
    empty: "No hay torneos para mostrar.",
  },
  fr: {
    recentCreated: "Tournois créés récemment",
    recentPlayed: "Parties récentes",
    empty: "Aucun tournoi à afficher.",
  },
  vi: {
    recentCreated: "Bracket mới tạo",
    recentPlayed: "Lượt chơi gần đây",
    empty: "Chưa có bracket để hiển thị.",
  },
  de: {
    recentCreated: "Neu erstellte Turniere",
    recentPlayed: "Letzte Spiele",
    empty: "Noch keine Turniere vorhanden.",
  },
  ru: {
    recentCreated: "Недавно созданные турниры",
    recentPlayed: "Недавние игры",
    empty: "Пока нечего показать.",
  },
  id: {
    recentCreated: "Bracket Terbaru",
    recentPlayed: "Baru Dimainkan",
    empty: "Belum ada bracket untuk ditampilkan.",
  },
  pt: {
    recentCreated: "Torneios recentes",
    recentPlayed: "Jogadas recentes",
    empty: "Nenhum torneio para mostrar.",
  },
  hi: {
    recentCreated: "हाल में बनाए गए ब्रैकेट",
    recentPlayed: "हाल की खेलें",
    empty: "दिखाने के लिए कोई ब्रैकेट नहीं है।",
  },
  tr: {
    recentCreated: "Yeni Oluşturulan Turnuvalar",
    recentPlayed: "Son Oynananlar",
    empty: "Gösterilecek turnuva yok.",
  },
  th: {
    recentCreated: "เวิลด์คัพที่สร้างล่าสุด",
    recentPlayed: "เล่นล่าสุด",
    empty: "ยังไม่มีรายการให้แสดง",
  },
  ar: {
    recentCreated: "بطولات أُنشئت حديثًا",
    recentPlayed: "آخر مرات اللعب",
    empty: "لا توجد بطولات لعرضها.",
  },
  bn: {
    recentCreated: "সাম্প্রতিক তৈরি ব্র্যাকেট",
    recentPlayed: "সাম্প্রতিক খেলা",
    empty: "দেখানোর মতো কোনো ব্র্যাকেট নেই।",
  },
};

const HOME_SEO_SUMMARY_COPY = {
  ko: "이상형 월드컵 원픽게임은 전 세계 사용자가 함께 즐기는 이상형 월드컵 및 투표 플랫폼입니다. 원픽게임에서 나만의 이상형 월드컵을 만들고, 인기 후보를 비교하며 결과를 공유해보세요.",
  en: "One Pick Game is a global platform for bracket games, voting, tier lists, and quizzes. Create your own tournament, compare popular candidates, and share the results.",
  ja: "One Pick Gameは、世界中のユーザーが楽しめるワールドカップ形式の投票・トーナメントプラットフォームです。自分だけのトーナメントを作成し、人気候補を比較して結果を共有できます。",
  zh: "One Pick Game 是面向全球用户的淘汰赛投票平台。你可以创建自己的主题比赛，比较热门候选，并分享结果。",
  es: "One Pick Game es una plataforma global para torneos, votaciones, tier lists y quizzes. Crea tu propio torneo, compara candidatos populares y comparte los resultados.",
  fr: "One Pick Game est une plateforme mondiale de tournois, votes, tier lists et quiz. Créez votre propre tournoi, comparez les candidats populaires et partagez les résultats.",
  vi: "One Pick Game là nền tảng toàn cầu cho bracket game, bình chọn, tier list và quiz. Tạo giải đấu của riêng bạn, so sánh các ứng viên phổ biến và chia sẻ kết quả.",
  de: "One Pick Game ist eine globale Plattform für Turniere, Abstimmungen, Tier Lists und Quizze. Erstelle dein eigenes Turnier, vergleiche beliebte Kandidaten und teile Ergebnisse.",
  ru: "One Pick Game — глобальная платформа для турнирных игр, голосований, тир-листов и квизов. Создавайте свои турниры, сравнивайте популярных кандидатов и делитесь результатами.",
  id: "One Pick Game adalah platform global untuk bracket game, voting, tier list, dan kuis. Buat turnamen sendiri, bandingkan kandidat populer, lalu bagikan hasilnya.",
  pt: "One Pick Game é uma plataforma global para torneios, votações, tier lists e quizzes. Crie seu próprio torneio, compare candidatos populares e compartilhe resultados.",
  hi: "One Pick Game bracket games, voting, tier lists और quizzes के लिए एक global platform है। अपना tournament बनाएं, popular candidates की तुलना करें और results शेयर करें।",
  tr: "One Pick Game; turnuva oyunları, oylamalar, tier listler ve quizler için global bir platformdur. Kendi turnuvanı oluştur, popüler adayları karşılaştır ve sonuçları paylaş.",
  th: "One Pick Game คือแพลตฟอร์มระดับโลกสำหรับ bracket game การโหวต tier list และ quiz สร้างทัวร์นาเมนต์ของคุณ เปรียบเทียบตัวเลือกยอดนิยม และแชร์ผลลัพธ์ได้",
  ar: "One Pick Game منصة عالمية لألعاب البطولات والتصويت وقوائم التصنيف والاختبارات. أنشئ بطولتك، قارن المرشحين الشائعين وشارك النتائج.",
  bn: "One Pick Game হলো bracket game, voting, tier list এবং quiz-এর জন্য একটি global platform। নিজের tournament তৈরি করুন, popular candidates তুলনা করুন এবং result শেয়ার করুন।",
};

function formatWorldcupCardDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}




const HOME_CATEGORIES = [

  { key: "korea", slug: "korea", label: "K-Celeb" },

  { key: "person", slug: "person", label: "People" },

  { key: "anime_manga", slug: "anime-manga", label: "Anime / Manga" },

  { key: "game", slug: "game", label: "Games" },

  { key: "sports", slug: "sports", label: "Sports" },

  { key: "music", slug: "music", label: "Music" },

  { key: "movie_drama", slug: "movie-drama", label: "Movies / TV" },

  { key: "food", slug: "food", label: "Food" },

  { key: "etc", slug: "etc", label: "Other" },

];

const HOME_CATEGORY_SHORTCUT_KEYS = [
  "game",
  "anime_manga",
  "music",
  "movie_drama",
  "korea",
  "person",
  "sports",
  "food",
];

const KO_HOME_CATEGORY_SHORTCUT_LABELS = {
  game: "게임 월드컵",
  anime_manga: "애니 이상형 월드컵",
  music: "음악 월드컵",
  movie_drama: "영화·드라마 월드컵",
  korea: "K-POP 아이돌 월드컵",
  person: "인물 이상형 월드컵",
  sports: "스포츠 월드컵",
  food: "음식 이상형 월드컵",
};



const PRIMARY_HOME_CATEGORY_KEYS = new Set([

  "korea",

  "person",

  "anime_manga",

]);



let playCountsPromise = null;

let playCountsCache = null;



// 애드센스 클라이언트 ID

const ADSENSE_CLIENT = "ca-pub-2906270915716379";



const AdsenseMid = () => {

  useEffect(() => {

    try {

      (window.adsbygoogle = window.adsbygoogle || []).push({});

    } catch (e) {}

  }, []);



  return (

    <div style={{ width: "100%", textAlign: "center", margin: "20px 0" }}>

      <ins

        className="adsbygoogle"

        style={{ display: "block" }}

   data-ad-client={ADSENSE_CLIENT}

        data-ad-slot="3294216783"

        data-ad-format="auto"

        data-full-width-responsive="true"

      />

    </div>

  );

};







const WORLDCUP_INFO_COPY = {
  "ko": {
    "ariaLabel": "이상형 월드컵이란?",
    "title": "이상형 월드컵이란?",
    "description": "이상형 월드컵은 두 후보 중 더 마음에 드는 쪽을 선택하며 최종 우승자를 고르는 토너먼트 게임입니다. 원픽게임에서는 아이돌, 애니, 게임, 영화, 음식, 스포츠 등 다양한 주제의 이상형 월드컵을 무료로 플레이하고 직접 만들 수 있습니다.",
    "cards": [
      {
        "title": "무료 이상형 월드컵 만들기",
        "body": "사진과 후보 이름을 추가하면 나만의 월드컵을 만들고 링크로 공유할 수 있습니다.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "카테고리별 월드컵 탐색",
        "body": "게임, 애니, 음식 등 관심 주제별로 월드컵을 찾을 수 있습니다."
      },
      {
        "title": "결과와 통계 확인",
        "body": "우승 후보와 순위를 확인하고 다른 사람들의 선택과 비교할 수 있습니다."
      }
    ],
    "faqs": [
      {
        "q": "로그인 없이 플레이할 수 있나요?",
        "a": "네. 공개된 월드컵은 로그인 없이 바로 플레이할 수 있습니다."
      },
      {
        "q": "직접 월드컵을 만들 수 있나요?",
        "a": "네. 월드컵 만들기에서 후보를 추가해 나만의 월드컵을 만들 수 있습니다."
      },
      {
        "q": "티어표나 퀴즈도 이용할 수 있나요?",
        "a": "네. 원픽게임에서는 티어표와 퀴즈도 만들고 즐길 수 있습니다."
      }
    ]
  },
  "en": {
    "ariaLabel": "What is an Ideal Type World Cup?",
    "title": "What is an Ideal Type World Cup?",
    "description": "Choose your favorite of two candidates in each round until one winner remains. On OnePickGame, play and create free tournaments about idols, anime, games, movies, food, sports and more.",
    "cards": [
      {
        "title": "Create a free World Cup",
        "body": "Add images and candidate names, then share your tournament with a link.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Explore by category",
        "body": "Find tournaments about games, anime, food and other interests."
      },
      {
        "title": "View results and statistics",
        "body": "Check winners and rankings and compare your choices with others."
      }
    ],
    "faqs": [
      {
        "q": "Can I play without signing in?",
        "a": "Yes. Public tournaments can be played without signing in."
      },
      {
        "q": "Can I create my own tournament?",
        "a": "Yes. Add candidates in Create World Cup to make your own tournament."
      },
      {
        "q": "Are tier lists and quizzes available?",
        "a": "Yes. You can also create and enjoy tier lists and quizzes on OnePickGame."
      }
    ]
  },
  "ja": {
    "ariaLabel": "理想のタイプワールドカップとは？",
    "title": "理想のタイプワールドカップとは？",
    "description": "2つの候補から好きな方を選び、最後の優勝者を決めるトーナメントゲームです。OnePickGameではアイドル、アニメ、ゲーム、映画、食べ物、スポーツなどの大会を無料で遊んだり作ったりできます。",
    "cards": [
      {
        "title": "無料でワールドカップを作成",
        "body": "画像と候補名を追加し、リンクで大会を共有できます。",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "カテゴリ別に探す",
        "body": "ゲーム、アニメ、食べ物など好きなテーマの大会を探せます。"
      },
      {
        "title": "結果と統計を見る",
        "body": "優勝者や順位を確認し、他の人の選択と比較できます。"
      }
    ],
    "faqs": [
      {
        "q": "ログインせずに遊べますか？",
        "a": "はい。公開された大会はログインなしで遊べます。"
      },
      {
        "q": "自分で大会を作れますか？",
        "a": "はい。ワールドカップ作成で候補を追加して作れます。"
      },
      {
        "q": "ティアリストやクイズもありますか？",
        "a": "はい。OnePickGameではティアリストやクイズも作成して楽しめます。"
      }
    ]
  },
  "zh": {
    "ariaLabel": "什么是理想型世界杯？",
    "title": "什么是理想型世界杯？",
    "description": "每轮从两个候选中选择更喜欢的一个，直到选出冠军。在OnePickGame，你可以免费游玩和创建偶像、动漫、游戏、电影、美食、体育等主题的比赛。",
    "cards": [
      {
        "title": "免费创建世界杯",
        "body": "添加图片和候选名称，通过链接分享比赛。",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "按类别探索",
        "body": "查找游戏、动漫、美食等感兴趣的主题。"
      },
      {
        "title": "查看结果与统计",
        "body": "查看冠军和排名，并与其他人的选择比较。"
      }
    ],
    "faqs": [
      {
        "q": "不登录也能玩吗？",
        "a": "可以。公开比赛无需登录即可游玩。"
      },
      {
        "q": "能创建自己的比赛吗？",
        "a": "可以。在创建世界杯中添加候选即可。"
      },
      {
        "q": "也有等级榜和测验吗？",
        "a": "有。你也可以在OnePickGame创建和体验等级榜与测验。"
      }
    ]
  },
  "es": {
    "ariaLabel": "¿Qué es un Mundial de favoritos?",
    "title": "¿Qué es un Mundial de favoritos?",
    "description": "Elige tu favorito entre dos candidatos en cada ronda hasta encontrar al ganador. En OnePickGame puedes jugar y crear torneos gratis sobre ídolos, anime, juegos, cine, comida y deportes.",
    "cards": [
      {
        "title": "Crea un Mundial gratis",
        "body": "Añade imágenes y nombres y comparte tu torneo con un enlace.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Explora por categoría",
        "body": "Encuentra torneos de juegos, anime, comida y otros temas."
      },
      {
        "title": "Consulta resultados y estadísticas",
        "body": "Mira ganadores y clasificaciones y compara tus elecciones."
      }
    ],
    "faqs": [
      {
        "q": "¿Puedo jugar sin iniciar sesión?",
        "a": "Sí. Los torneos públicos no requieren iniciar sesión."
      },
      {
        "q": "¿Puedo crear mi propio torneo?",
        "a": "Sí. Añade candidatos en Crear Mundial."
      },
      {
        "q": "¿Hay listas de niveles y cuestionarios?",
        "a": "Sí. También puedes crearlos y disfrutarlos en OnePickGame."
      }
    ]
  },
  "fr": {
    "ariaLabel": "Qu’est-ce qu’un tournoi de favoris ?",
    "title": "Qu’est-ce qu’un tournoi de favoris ?",
    "description": "Choisissez votre favori entre deux candidats à chaque tour jusqu’au vainqueur. OnePickGame propose des tournois gratuits à jouer et à créer sur les idoles, les animés, les jeux, le cinéma, la cuisine et le sport.",
    "cards": [
      {
        "title": "Créer un tournoi gratuit",
        "body": "Ajoutez des images et des noms, puis partagez le lien du tournoi.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Explorer par catégorie",
        "body": "Trouvez des tournois sur les jeux, les animés, la cuisine et vos centres d’intérêt."
      },
      {
        "title": "Voir les résultats et statistiques",
        "body": "Consultez les gagnants et classements et comparez vos choix."
      }
    ],
    "faqs": [
      {
        "q": "Puis-je jouer sans me connecter ?",
        "a": "Oui. Les tournois publics sont accessibles sans connexion."
      },
      {
        "q": "Puis-je créer mon tournoi ?",
        "a": "Oui. Ajoutez des candidats dans Créer un tournoi."
      },
      {
        "q": "Y a-t-il des tier lists et des quiz ?",
        "a": "Oui. Vous pouvez aussi les créer et y jouer sur OnePickGame."
      }
    ]
  },
  "vi": {
    "ariaLabel": "World Cup sở thích là gì?",
    "title": "World Cup sở thích là gì?",
    "description": "Chọn ứng viên bạn thích hơn trong mỗi cặp cho đến khi tìm ra người chiến thắng. Trên OnePickGame, bạn có thể chơi và tạo miễn phí các giải đấu về thần tượng, anime, trò chơi, phim, món ăn và thể thao.",
    "cards": [
      {
        "title": "Tạo World Cup miễn phí",
        "body": "Thêm ảnh và tên ứng viên rồi chia sẻ giải đấu bằng liên kết.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Khám phá theo danh mục",
        "body": "Tìm giải đấu về trò chơi, anime, món ăn và chủ đề yêu thích."
      },
      {
        "title": "Xem kết quả và thống kê",
        "body": "Xem người chiến thắng, thứ hạng và so sánh lựa chọn với người khác."
      }
    ],
    "faqs": [
      {
        "q": "Có thể chơi mà không đăng nhập không?",
        "a": "Có. Giải đấu công khai không yêu cầu đăng nhập."
      },
      {
        "q": "Tôi có thể tự tạo giải đấu không?",
        "a": "Có. Thêm ứng viên trong mục Tạo World Cup."
      },
      {
        "q": "Có bảng xếp hạng tier và câu đố không?",
        "a": "Có. Bạn cũng có thể tạo và chơi chúng trên OnePickGame."
      }
    ]
  },
  "de": {
    "ariaLabel": "Was ist ein Favoriten-Turnier?",
    "title": "Was ist ein Favoriten-Turnier?",
    "description": "Wähle in jeder Runde deinen Favoriten aus zwei Kandidaten, bis ein Sieger feststeht. Auf OnePickGame kannst du kostenlos Turniere über Idole, Anime, Spiele, Filme, Essen und Sport spielen und erstellen.",
    "cards": [
      {
        "title": "Kostenloses Turnier erstellen",
        "body": "Füge Bilder und Namen hinzu und teile dein Turnier per Link.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Nach Kategorie entdecken",
        "body": "Finde Turniere über Spiele, Anime, Essen und weitere Interessen."
      },
      {
        "title": "Ergebnisse und Statistiken ansehen",
        "body": "Sieh dir Sieger und Ranglisten an und vergleiche deine Auswahl."
      }
    ],
    "faqs": [
      {
        "q": "Kann ich ohne Anmeldung spielen?",
        "a": "Ja. Öffentliche Turniere sind ohne Anmeldung spielbar."
      },
      {
        "q": "Kann ich ein eigenes Turnier erstellen?",
        "a": "Ja. Füge unter Turnier erstellen Kandidaten hinzu."
      },
      {
        "q": "Gibt es auch Tierlisten und Quiz?",
        "a": "Ja. Auf OnePickGame kannst du diese ebenfalls erstellen und spielen."
      }
    ]
  },
  "ru": {
    "ariaLabel": "Что такое турнир предпочтений?",
    "title": "Что такое турнир предпочтений?",
    "description": "В каждом раунде выбирайте одного из двух кандидатов, пока не останется победитель. На OnePickGame можно бесплатно играть и создавать турниры об айдолах, аниме, играх, кино, еде и спорте.",
    "cards": [
      {
        "title": "Создать бесплатный турнир",
        "body": "Добавьте изображения и имена кандидатов и поделитесь ссылкой.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Поиск по категориям",
        "body": "Находите турниры об играх, аниме, еде и других интересах."
      },
      {
        "title": "Результаты и статистика",
        "body": "Смотрите победителей и рейтинги и сравнивайте свой выбор с другими."
      }
    ],
    "faqs": [
      {
        "q": "Можно играть без входа?",
        "a": "Да. Публичные турниры доступны без входа."
      },
      {
        "q": "Можно создать свой турнир?",
        "a": "Да. Добавьте кандидатов в разделе создания турнира."
      },
      {
        "q": "Есть тир-листы и викторины?",
        "a": "Да. На OnePickGame их тоже можно создавать и проходить."
      }
    ]
  },
  "id": {
    "ariaLabel": "Apa itu World Cup favorit?",
    "title": "Apa itu World Cup favorit?",
    "description": "Pilih favorit dari dua kandidat di setiap ronde hingga tersisa satu pemenang. Di OnePickGame, mainkan dan buat turnamen gratis tentang idol, anime, gim, film, makanan dan olahraga.",
    "cards": [
      {
        "title": "Buat World Cup gratis",
        "body": "Tambahkan gambar dan nama kandidat, lalu bagikan tautan turnamen.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Jelajahi berdasarkan kategori",
        "body": "Temukan turnamen gim, anime, makanan dan minat lainnya."
      },
      {
        "title": "Lihat hasil dan statistik",
        "body": "Lihat pemenang dan peringkat serta bandingkan pilihan dengan orang lain."
      }
    ],
    "faqs": [
      {
        "q": "Bisakah bermain tanpa masuk?",
        "a": "Ya. Turnamen publik dapat dimainkan tanpa masuk."
      },
      {
        "q": "Bisakah membuat turnamen sendiri?",
        "a": "Ya. Tambahkan kandidat di Buat World Cup."
      },
      {
        "q": "Apakah ada tier list dan kuis?",
        "a": "Ya. Kamu juga dapat membuat dan memainkannya di OnePickGame."
      }
    ]
  },
  "pt": {
    "ariaLabel": "O que é uma Copa de favoritos?",
    "title": "O que é uma Copa de favoritos?",
    "description": "Escolha seu favorito entre dois candidatos em cada rodada até chegar ao vencedor. No OnePickGame, jogue e crie torneios gratuitos sobre ídolos, anime, jogos, filmes, comida e esportes.",
    "cards": [
      {
        "title": "Crie uma Copa grátis",
        "body": "Adicione imagens e nomes e compartilhe seu torneio por um link.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Explore por categoria",
        "body": "Encontre torneios de jogos, anime, comida e outros interesses."
      },
      {
        "title": "Veja resultados e estatísticas",
        "body": "Confira vencedores e classificações e compare suas escolhas."
      }
    ],
    "faqs": [
      {
        "q": "Posso jogar sem entrar?",
        "a": "Sim. Torneios públicos podem ser jogados sem entrar."
      },
      {
        "q": "Posso criar meu próprio torneio?",
        "a": "Sim. Adicione candidatos em Criar Copa."
      },
      {
        "q": "Há listas de tiers e quizzes?",
        "a": "Sim. Você também pode criá-los e jogá-los no OnePickGame."
      }
    ]
  },
  "hi": {
    "ariaLabel": "पसंदीदा विकल्पों का विश्व कप क्या है?",
    "title": "पसंदीदा विकल्पों का विश्व कप क्या है?",
    "description": "हर दौर में दो विकल्पों में से अपना पसंदीदा चुनें और अंत में विजेता तय करें। OnePickGame पर आइडल, एनीमे, गेम, फ़िल्म, भोजन और खेल के टूर्नामेंट मुफ़्त खेलें और बनाएँ।",
    "cards": [
      {
        "title": "मुफ़्त विश्व कप बनाएँ",
        "body": "तस्वीरें और विकल्पों के नाम जोड़ें, फिर लिंक से टूर्नामेंट साझा करें।",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "श्रेणी के अनुसार खोजें",
        "body": "गेम, एनीमे, भोजन और अपनी रुचि के विषयों के टूर्नामेंट खोजें।"
      },
      {
        "title": "नतीजे और आँकड़े देखें",
        "body": "विजेता और रैंकिंग देखें और दूसरों की पसंद से तुलना करें।"
      }
    ],
    "faqs": [
      {
        "q": "क्या बिना लॉगिन के खेल सकते हैं?",
        "a": "हाँ। सार्वजनिक टूर्नामेंट बिना लॉगिन के खेल सकते हैं।"
      },
      {
        "q": "क्या मैं अपना टूर्नामेंट बना सकता हूँ?",
        "a": "हाँ। विश्व कप बनाएँ में विकल्प जोड़ें।"
      },
      {
        "q": "क्या टियर सूची और क्विज़ भी हैं?",
        "a": "हाँ। OnePickGame पर उन्हें भी बना और खेल सकते हैं।"
      }
    ]
  },
  "tr": {
    "ariaLabel": "Favoriler Dünya Kupası nedir?",
    "title": "Favoriler Dünya Kupası nedir?",
    "description": "Her turda iki adaydan favorini seçerek kazananı belirle. OnePickGame’de idoller, anime, oyunlar, filmler, yemek ve spor hakkında ücretsiz turnuvalar oyna ve oluştur.",
    "cards": [
      {
        "title": "Ücretsiz Dünya Kupası oluştur",
        "body": "Görseller ve aday adları ekleyip turnuvanı bağlantıyla paylaş.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "Kategoriye göre keşfet",
        "body": "Oyun, anime, yemek ve diğer ilgi alanlarına ait turnuvaları bul."
      },
      {
        "title": "Sonuçları ve istatistikleri gör",
        "body": "Kazananları ve sıralamaları gör, seçimlerini başkalarıyla karşılaştır."
      }
    ],
    "faqs": [
      {
        "q": "Giriş yapmadan oynayabilir miyim?",
        "a": "Evet. Herkese açık turnuvalar giriş yapmadan oynanabilir."
      },
      {
        "q": "Kendi turnuvamı oluşturabilir miyim?",
        "a": "Evet. Dünya Kupası oluştur bölümünde aday ekle."
      },
      {
        "q": "Tier listeleri ve testler de var mı?",
        "a": "Evet. OnePickGame’de bunları da oluşturabilir ve oynayabilirsin."
      }
    ]
  },
  "th": {
    "ariaLabel": "เวิลด์คัพตัวเลือกที่ชอบคืออะไร?",
    "title": "เวิลด์คัพตัวเลือกที่ชอบคืออะไร?",
    "description": "เลือกตัวเลือกที่ชอบมากกว่าจากสองตัวเลือกในแต่ละรอบจนได้ผู้ชนะ บน OnePickGame คุณเล่นและสร้างการแข่งขันเกี่ยวกับไอดอล อนิเมะ เกม หนัง อาหาร และกีฬาได้ฟรี",
    "cards": [
      {
        "title": "สร้างเวิลด์คัพฟรี",
        "body": "เพิ่มรูปภาพและชื่อตัวเลือก แล้วแชร์การแข่งขันด้วยลิงก์",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "ค้นหาตามหมวดหมู่",
        "body": "ค้นหาการแข่งขันเกี่ยวกับเกม อนิเมะ อาหาร และเรื่องที่สนใจ"
      },
      {
        "title": "ดูผลลัพธ์และสถิติ",
        "body": "ดูผู้ชนะและอันดับ แล้วเปรียบเทียบกับตัวเลือกของคนอื่น"
      }
    ],
    "faqs": [
      {
        "q": "เล่นโดยไม่เข้าสู่ระบบได้ไหม?",
        "a": "ได้ การแข่งขันสาธารณะเล่นได้โดยไม่ต้องเข้าสู่ระบบ"
      },
      {
        "q": "สร้างการแข่งขันเองได้ไหม?",
        "a": "ได้ เพิ่มตัวเลือกในหน้าสร้างเวิลด์คัพ"
      },
      {
        "q": "มีเทียร์ลิสต์และแบบทดสอบไหม?",
        "a": "มี คุณสร้างและเล่นได้บน OnePickGame เช่นกัน"
      }
    ]
  },
  "ar": {
    "ariaLabel": "ما هي بطولة الخيارات المفضلة؟",
    "title": "ما هي بطولة الخيارات المفضلة؟",
    "description": "اختر المفضل لديك من بين مرشحين في كل جولة حتى يتبقى فائز واحد. على OnePickGame يمكنك لعب وإنشاء بطولات مجانية عن النجوم والأنمي والألعاب والأفلام والطعام والرياضة.",
    "cards": [
      {
        "title": "أنشئ بطولة مجانية",
        "body": "أضف الصور وأسماء المرشحين ثم شارك البطولة عبر رابط.",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "استكشف حسب الفئة",
        "body": "ابحث عن بطولات الألعاب والأنمي والطعام وغيرها من اهتماماتك."
      },
      {
        "title": "شاهد النتائج والإحصاءات",
        "body": "اطّلع على الفائزين والترتيب وقارن اختياراتك بالآخرين."
      }
    ],
    "faqs": [
      {
        "q": "هل يمكن اللعب دون تسجيل الدخول؟",
        "a": "نعم. يمكن لعب البطولات العامة دون تسجيل الدخول."
      },
      {
        "q": "هل يمكنني إنشاء بطولتي؟",
        "a": "نعم. أضف المرشحين في صفحة إنشاء البطولة."
      },
      {
        "q": "هل توجد قوائم تصنيف واختبارات؟",
        "a": "نعم. يمكنك أيضًا إنشاؤها ولعبها على OnePickGame."
      }
    ]
  },
  "bn": {
    "ariaLabel": "পছন্দের বিশ্বকাপ কী?",
    "title": "পছন্দের বিশ্বকাপ কী?",
    "description": "প্রতি রাউন্ডে দুটি প্রার্থীর মধ্যে পছন্দেরটি বেছে নিন, যতক্ষণ না একজন বিজয়ী থাকে। OnePickGame-এ আইডল, অ্যানিমে, গেম, সিনেমা, খাবার ও খেলাধুলার টুর্নামেন্ট বিনামূল্যে খেলুন এবং তৈরি করুন।",
    "cards": [
      {
        "title": "বিনামূল্যে বিশ্বকাপ তৈরি করুন",
        "body": "ছবি ও প্রার্থীর নাম যোগ করে লিংকের মাধ্যমে টুর্নামেন্ট শেয়ার করুন।",
        "blogSlug": "how-to-create-ideal-type-world-cup"
      },
      {
        "title": "বিভাগ অনুযায়ী খুঁজুন",
        "body": "গেম, অ্যানিমে, খাবার ও আগ্রহের বিষয়ের টুর্নামেন্ট খুঁজুন।"
      },
      {
        "title": "ফলাফল ও পরিসংখ্যান দেখুন",
        "body": "বিজয়ী ও র‌্যাঙ্কিং দেখুন এবং অন্যদের পছন্দের সঙ্গে তুলনা করুন।"
      }
    ],
    "faqs": [
      {
        "q": "লগইন ছাড়া খেলা যায়?",
        "a": "হ্যাঁ। প্রকাশ্য টুর্নামেন্ট লগইন ছাড়াই খেলা যায়।"
      },
      {
        "q": "নিজের টুর্নামেন্ট তৈরি করা যায়?",
        "a": "হ্যাঁ। বিশ্বকাপ তৈরি পাতায় প্রার্থী যোগ করুন।"
      },
      {
        "q": "টিয়ার তালিকা ও কুইজও আছে?",
        "a": "হ্যাঁ। OnePickGame-এ সেগুলোও তৈরি ও খেলা যায়।"
      }
    ]
  }
};

function Home({

  worldcupList,

  onMakeWorldcup,

  onDelete,

  user,

  isAdmin,

  fixedWorldcups,

  showFixedWorldcups = true,

  personalView = false,

}) {

const { t, i18n } = useTranslation();

const navigate = useNavigate();

const location = useLocation();



const lang = (i18n.language || "en").split("-")[0];
const worldcupInfoCopy = WORLDCUP_INFO_COPY[lang] || WORLDCUP_INFO_COPY.en;



const getRoute = (base, cupId) =>

  `/${lang}${base}/${cupId}`;



// 홈 화면 아래쪽 언어 선택기

const changeHomeLanguage = async (newLang) => {

  try {

    // i18next 언어 변경

    await i18n.changeLanguage(newLang);



    // 선택 언어 저장

    localStorage.setItem("onepickgame_lang", newLang);



    // 현재 주소 유지하면서 언어 부분만 변경

    const parts = window.location.pathname

      .split("/")

      .filter(Boolean);



    if (

      parts.length > 0 &&

      LANGUAGES.some((item) => item.code === parts[0])

    ) {

      parts[0] = newLang;

    } else {

      parts.unshift(newLang);

    }



    const newPath = "/" + parts.join("/");



    navigate(

      newPath +

        window.location.search +

        window.location.hash,

      { replace: true }

    );

  } catch (error) {

    console.error("언어 변경 실패:", error);

  }

};



const getDisplayTitle = (cup) => {
  return getWorldcupTitle(cup, lang);

};



  // 최상단 이동

  useEffect(() => {

    try {

      if ("scrollRestoration" in window.history) {

        window.history.scrollRestoration = "manual";

      }

    } catch {}

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    document.documentElement.scrollTop = 0;

    document.body.scrollTop = 0;

  }, []);





const [search, setSearch] = useState("");

const [categorySorts, setCategorySorts] = useState({});

const getCategorySort = (categoryKey) =>
  categorySorts[categoryKey] || "popular";

const setCategorySort = (categoryKey, nextSort) => {
  setCategorySorts((current) => ({
    ...current,
    [categoryKey]: nextSort,
  }));
};

const sortCategoryCups = (cups, categoryKey) => {
  const selectedSort =
    getCategorySort(categoryKey);

  return [...(cups || [])].sort((a, b) => {
    if (selectedSort === "recent") {
      const aDate =
        a?.created_at || "";
      const bDate =
        b?.created_at || "";

      if (aDate === bDate) {
        return String(b?.id || "").localeCompare(
          String(a?.id || "")
        );
      }

      return bDate > aDate ? 1 : -1;
    }

    const aPlays =
      playCountMap[String(a?.id)] || 0;
    const bPlays =
      playCountMap[String(b?.id)] || 0;

    return bPlays - aPlays;
  });
};

const searchInputRef = useRef(null);



useEffect(() => {

  const params =

    new URLSearchParams(location.search);



  const searchParam = params.get("search");


  const focusParam = params.get("focus");



  if (searchParam) {

    setSearch(searchParam);

  }
if (focusParam === "search") {

    window.setTimeout(() => {

      searchInputRef.current?.focus();

      searchInputRef.current?.scrollIntoView({

        behavior: "smooth",

        block: "center",

      });

    }, 80);

  }

}, [location.search]);





  const [otherVisibleCount, setOtherVisibleCount] = useState(8);

  const [rowVisibleCounts, setRowVisibleCounts] = useState({});

  const [showMoreCategories, setShowMoreCategories] = useState(false);

  const [vw, setVw] = useState(

    typeof window !== "undefined" ? window.innerWidth : 1200

  );



  const SEARCH_COOLDOWN =

  30 * 60 * 1000;



const normalizeSearchQuery = (value) =>

  String(value || "")

    .trim()

    .replace(/^#+/, "")

    .toLowerCase()

    .slice(0, 50);

const collectSearchTextValues = (...values) => {

  const result = [];



  const visit = (value) => {

    if (value == null) {

      return;

    }



    if (Array.isArray(value)) {

      value.forEach(visit);

      return;

    }



    if (typeof value === "object") {

      Object.values(value).forEach(visit);

      return;

    }



    const text =

      normalizeSearchQuery(value);



    if (text) {

      result.push(text);

    }

  };



  values.forEach(visit);

  return result;

};

const searchTextMatches = (keyword, ...values) =>

  collectSearchTextValues(...values).some((value) =>

    value.includes(keyword)

  );

const cupMatchesSearch = (cup, keyword, lang) => {

  if (!keyword) {

    return true;

  }



  const hasMatchingMainText =

    searchTextMatches(

      keyword,

      getDisplayTitle(cup),

      getWorldcupDescription(cup, lang),

      cup?.title,

      cup?.description,

      cup?.desc,

      cup?.title_translations,

      cup?.description_translations

    );



  const hasMatchingCandidate =

    Array.isArray(cup?.data) &&

    cup.data.some((candidate) =>

      searchTextMatches(

        keyword,

        candidate?.name,

        candidate?.title,

        candidate?.name_translations,

        candidate?.title_translations

      )

    );



  const hasMatchingTag =

    Array.isArray(cup?.tags) &&

    cup.tags.some((tag) =>

      normalizeSearchQuery(tag).includes(keyword)

    );



  return (

    hasMatchingMainText ||

    hasMatchingCandidate ||

    hasMatchingTag

  );

};



const loadPopularSearches = async () => {

  try {

    const { data, error } = await supabase.rpc(

      "get_popular_searches",

      {

        p_language: lang,

        p_limit: 4,

      }

    );



    if (error) {

      throw error;

    }



    setPopularSearches(

      Array.isArray(data) ? data : []

    );

  } catch (error) {

    console.error(

      "인기 검색어 조회 실패:",

      error

    );

  }

};



const recordSearch = async (value) => {

  const query =

    normalizeSearchQuery(value);



  if (!query) return;



  try {

    const storageKey =

      `onepick_search_${lang}_${encodeURIComponent(query)}`;



    const lastRecorded =

      Number(

        localStorage.getItem(storageKey) || 0

      );



    const now = Date.now();



    if (

      now - lastRecorded <

      SEARCH_COOLDOWN

    ) {

      return;

    }



    const { error } = await supabase.rpc(

      "record_search",

      {

        p_query: query,

        p_language: lang,

      }

    );



    if (error) {

      throw error;

    }



    localStorage.setItem(

      storageKey,

      String(now)

    );



      } catch (error) {

    console.error(

      "검색 통계 기록 실패:",

      error

    );

  }

};





const [winStatsMap, setWinStatsMap] = useState({});

const [playCountMap, setPlayCountMap] = useState({});

const [recentPlayLogs, setRecentPlayLogs] = useState([]);



const requestedStatsRef = useRef(new Set());



useEffect(() => {

  let mounted = true;



  async function fetchPlayCounts() {

    try {

let data;



if (playCountsCache) {

  data = playCountsCache;

} else {

  if (!playCountsPromise) {

    playCountsPromise = supabase

      .rpc("get_worldcup_play_counts")

      .then(({ data, error }) => {

        if (error) {

          throw error;

        }



        playCountsCache = data || [];

        return playCountsCache;

      })

      .finally(() => {

        playCountsPromise = null;

      });

  }



  data = await playCountsPromise;

}





      if (!mounted) return;



      const nextMap = {};



      (data || []).forEach((row) => {

        nextMap[String(row.cup_id)] =

          Number(row.play_count || 0);

      });



      setPlayCountMap(nextMap);

    } catch (error) {

      console.error(

        "참여 횟수 조회 오류:",

        error

      );

    }

  }



  fetchPlayCounts();



  return () => {

    mounted = false;

  };

}, []);

useEffect(() => {
  let mounted = true;

  async function fetchRecentPlays() {
    try {
      const { data, error } = await supabase
        .from("winner_logs")
        .select("cup_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      if (mounted) {
        setRecentPlayLogs(data || []);
      }
    } catch (error) {
      console.error("최근 플레이 조회 오류:", error);
    }
  }

  fetchRecentPlays();

  return () => {
    mounted = false;
  };
}, []);



  useEffect(() => {

    if (typeof window === "undefined") return;

    const onResize = () => setVw(window.innerWidth);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);

  }, []);

  const isMobile = vw < 600;

const CARD_WIDTH = isMobile

  ? Math.min(360, window.innerWidth - 32)

  : 504;

const CARD_HEIGHT = isMobile ? 418 : 452;

const CARD_GAP = isMobile ? 7 : 13;

const THUMB_HEIGHT = isMobile ? 196 : 214;



const creatorFilter =

  new URLSearchParams(

    location.search

  ).get("creator");



const filtered = Array.isArray(worldcupList)

  ? (worldcupList || [])

    .filter((cup) => {



      if (creatorFilter) {

        const cupCreator =

          cup?.owner || cup?.creator;



        if (

          String(cupCreator || "") !==

          String(creatorFilter)

        ) {

          return false;

        }

      }

const keyword =

  normalizeSearchQuery(search);



  return cupMatchesSearch(cup, keyword, lang);

})

  : [];

const sidePanelCopy =
  HOME_SIDE_PANEL_COPY[lang] ||
  HOME_SIDE_PANEL_COPY.en;

const cupById = new Map(
  (Array.isArray(worldcupList) ? worldcupList : [])
    .filter((cup) => cup?.id)
    .map((cup) => [String(cup.id), cup])
);

const recentCreatedCups = [...cupById.values()]
  .sort(
    (a, b) =>
      new Date(b?.created_at || 0).getTime() -
      new Date(a?.created_at || 0).getTime()
  )
  .slice(0, 6)
  .map((cup) => ({
    cup,
    time: cup?.created_at,
  }));

const seenRecentPlayIds = new Set();
const recentPlayedCups = (recentPlayLogs || [])
  .map((log) => {
    const cup = cupById.get(String(log?.cup_id));
    if (!cup) return null;

    const key = String(cup.id);
    if (seenRecentPlayIds.has(key)) return null;
    seenRecentPlayIds.add(key);

    return {
      cup,
      time: log?.created_at,
    };
  })
  .filter(Boolean)
  .slice(0, 6);

const showHomeActivityPanels =
  !isMobile &&
  !personalView &&
  !search.trim();





  const categoryRowRefs = useRef({});

  const [categoryScrollState, setCategoryScrollState] = useState({});

const getInitialRowCount = () => {

  const horizontalPadding = isMobile ? 84 : 152;

  const availableWidth = Math.max(

    CARD_WIDTH,

    vw - horizontalPadding

  );



  return Math.max(

    1,

    Math.ceil(

      availableWidth / (CARD_WIDTH + CARD_GAP)

    )

  );

};



const getRowVisibleCount = (rowKey) => {

  return (

    rowVisibleCounts[rowKey] ||

    getInitialRowCount()

  );

};



const loadMoreRow = (rowKey, totalCount) => {

  setRowVisibleCounts((prev) => {

const current =

  prev[rowKey] || getInitialRowCount();



    if (current >= totalCount) {

      return prev;

    }



    return {

      ...prev,

      [rowKey]: Math.min(

        current + getInitialRowCount(),

        totalCount

      ),

    };

  });

};



const updateCategoryScrollState = (rowKey) => {

  const el = categoryRowRefs.current[rowKey];

  if (!el) return;



  const maxScrollLeft =

    el.scrollWidth - el.clientWidth;



  const canScrollLeft =

    el.scrollLeft > 5;



  const canScrollRight =

    el.scrollLeft < maxScrollLeft - 5;



  setCategoryScrollState((prev) => {

    const current = prev[rowKey];



    if (

      current?.canScrollLeft === canScrollLeft &&

      current?.canScrollRight === canScrollRight

    ) {

      return prev;

    }



    return {

      ...prev,

      [rowKey]: {

        canScrollLeft,

        canScrollRight,

      },

    };

  });

};



const scrollCategoryRow = (

  rowKey,

  direction,

  totalCount = 0

) => {

  const el = categoryRowRefs.current[rowKey];

  if (!el) return;



  const amount = isMobile

    ? CARD_WIDTH + CARD_GAP

    : (CARD_WIDTH + CARD_GAP) * 2;



  const doScroll = () => {

    const target = categoryRowRefs.current[rowKey];

    if (!target) return;



    target.scrollBy({

      left: direction * amount,

      behavior: "smooth",

    });

  };



  if (

    direction > 0 &&

    getRowVisibleCount(rowKey) < totalCount

  ) {

    loadMoreRow(rowKey, totalCount);



    requestAnimationFrame(() => {

      requestAnimationFrame(doScroll);

    });



    return;

  }



  doScroll();

};



  const currentUserId = user?.id || "";

  const currentUserEmail = user?.email || "";



  function getTop2Winners(winStats, cupData) {

    if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];

    const sorted = [...winStats]

      .map((row, i) => ({ ...row, _originIdx: i }))

      .sort((a, b) => {

        if ((b.win_count || 0) !== (a.win_count || 0))

          return (b.win_count || 0) - (a.win_count || 0);

        if ((b.match_wins || 0) !== (a.match_wins || 0))

          return (b.match_wins || 0) - (a.match_wins || 0);

        return a._originIdx - b._originIdx;

      });

    const first =

      cupData?.find((c) => c.id === sorted[0]?.candidate_id) ||

      cupData?.[0] ||

      null;

    const second =

      cupData?.find((c) => c.id === sorted[1]?.candidate_id) ||

      cupData?.[1] ||

      null;

    return [first, second];

  }

  function getCandidateName(candidate) {
    return (
      candidate?.name_translations?.[lang] ||
      candidate?.name_translations?.en ||
      candidate?.name ||
      candidate?.title ||
      ""
    ).toString().trim();
  }

  function getPopularCandidateLine(cup, winStats) {
    const candidates = Array.isArray(cup?.data) ? cup.data : [];

    if (!candidates.length) {
      return getWorldcupDescription(cup, lang);
    }

    const rankedFromStats = Array.isArray(winStats) && winStats.length
      ? [...winStats]
          .map((row, index) => ({ ...row, _originIdx: index }))
          .sort((a, b) => {
            if ((b.win_count || 0) !== (a.win_count || 0)) {
              return (b.win_count || 0) - (a.win_count || 0);
            }
            if ((b.match_wins || 0) !== (a.match_wins || 0)) {
              return (b.match_wins || 0) - (a.match_wins || 0);
            }
            return a._originIdx - b._originIdx;
          })
          .map((row) =>
            candidates.find((candidate) => String(candidate.id) === String(row.candidate_id))
          )
          .filter(Boolean)
      : [];

    const rankedIds = new Set(rankedFromStats.map((candidate) => String(candidate.id)));
    const ranked = [
      ...rankedFromStats,
      ...candidates.filter((candidate) => !rankedIds.has(String(candidate.id))),
    ];

    const names = ranked
      .map(getCandidateName)
      .filter(Boolean);

    if (!names.length) {
      return getWorldcupDescription(cup, lang);
    }

    return names.join(" · ");
  }



  function isMine(cup) {

    return (

      isAdmin ||

      cup.owner === currentUserId ||

      cup.creator === currentUserId ||

      cup.creator_id === currentUserId ||

      cup.owner === currentUserEmail ||

      cup.creator === currentUserEmail ||

      cup.creator_id === currentUserEmail

    );

  }



  const mainDark =  "#fffaf7";

const buttonStyle = {

  background: "#fff7ed",

  color: "#9A3412",

  fontWeight: 900,

  border: "1px solid #fed7aa",

  borderRadius: 8,



fontSize: isMobile ? 17 : 19,

  padding: isMobile ? "6px 8px" : "7px 11px",



  outline: "none",

  cursor: "pointer",

  letterSpacing: "0.2px",

fontFamily: "'Pretendard', sans-serif",

  margin: "0 1px",

  boxShadow: "0 4px 12px rgba(234,88,12,0.10)",

  transition: "background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s",

  marginTop: 0,

  marginBottom: 0,



  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",



  whiteSpace: "nowrap",

  lineHeight: 1.05,

};



const smallButtonStyle = {

  ...buttonStyle,

  padding: isMobile ? "5px 6px" : "7px 8px",

fontSize: isMobile ? 17 : 19,

};

const startButtonStyle = {

  ...buttonStyle,

  background: "#F97316",

  color: "#ffffff",

  border: "1px solid #F97316",

  boxShadow: "0 8px 18px rgba(249,115,22,0.26)",

};





const cardDescStyle = {

  color: "#475569",

  fontSize: isMobile ? 16 : 18,

  lineHeight: 1.35,

  textAlign: "center",



  padding: isMobile

    ? "5px 10px 0 10px"

    : "7px 16px 0 16px",



  height: isMobile ? 54 : 72,

  boxSizing: "border-box",



  display: "-webkit-box",

  WebkitLineClamp: 2,

  WebkitBoxOrient: "vertical",



  overflow: "hidden",

  textOverflow: "ellipsis",



  wordBreak: "keep-all",

  overflowWrap: "break-word",

  whiteSpace: "normal",



  margin: 0,

  marginBottom: 3,

  background: "none",

};



  const cardBottomBarStyle = {

    width: "100%",

    height: 5,

    background: "#F97316",

    borderRadius: "0 0 18px 18px",

    margin: 0,

    marginTop: "auto",

    boxShadow: "none",

  };



const goto = (url) => {

  navigate(url);



  requestAnimationFrame(() => {

    window.scrollTo({

      top: 0,

      left: 0,

      behavior: "instant",

    });



    document.documentElement.scrollTop = 0;

    document.body.scrollTop = 0;

  });

};

const renderHomeActivityPanel = ({
  title,
  items,
  accentColor = "#F97316",
}) => {
  return (
    <aside
      className="home-activity-panel"
      style={{
        minWidth: 0,
        background: "#ffffff",
        border: "1px solid #fed7aa",
        borderRadius: 10,
       padding: "18px 18px 16px",
        boxSizing: "border-box",
        minHeight: 302,
        boxShadow: "0 12px 28px rgba(249,115,22,0.10)",
      }}
    >
      <h2
        style={{
          margin: "0 0 13px",
          color: accentColor,
          fontSize: 22,
          lineHeight: 1.25,
          fontWeight: 900,
          textAlign: "left",
          borderLeft: `4px solid ${accentColor}`,
          paddingLeft: 9,
        }}
      >
        {title}
      </h2>

      {items.length ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {items.map(({ cup, time }) => {
            const titleText = getDisplayTitle(cup);

            return (
              <li key={`${title}-${cup.id}`}>
                <button
                  type="button"
                  onClick={() =>
                    goto(
                      `/${lang}/select-round/${cup.id}`
                    )
                  }
                  title={titleText}
                  style={{
                    width: "100%",
                    border: "1px solid #ffedd5",
                    borderRadius: 8,
                    background: "#fffaf7",
                    color: "#202534",
                    padding: "11px 11px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    {titleText}
                  </span>

                  <span
                    style={{
                      color: "#C2410C",
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatWorldcupCardDate(time)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 700,
          }}
        >
          {sidePanelCopy.empty}
        </p>
      )}
    </aside>
  );
};





const renderWorldcupCard = (cup) => {

  const categoryAccent = ({korea:"#F97316",person:"#de5276",anime_manga:"#db8a20",game:"#1687e8",sports:"#24945d",music:"#9a55cd",movie_drama:"#db6544",food:"#c38b17"})[cup.category] || "#F97316";

  const winStats = winStatsMap[cup.id] || [];



  // 후보들의 누적 우승 횟수 합계 = 총 참여 횟수

const totalPlays =

  playCountMap[String(cup.id)] ??

  winStats.reduce(

    (sum, row) =>

      sum + (row.win_count || 0),

    0

  );





  const [first, second] = getTop2Winners(

    winStats,

    cup.data

  );



  const displayTitle = getDisplayTitle(cup);

  const cardMetaCopy =
    WORLDCUP_CARD_META_COPY[lang] ||
    WORLDCUP_CARD_META_COPY.en;

  const candidateCount =
    Array.isArray(cup?.data)
      ? cup.data.length
      : 0;

  const lastUpdatedDate =
    formatWorldcupCardDate(
      cup?.updated_at ||
      cup?.modified_at ||
      cup?.created_at
    );




  return (

    <div

      key={cup.id}

      className="worldcup-card"

       style={{

        width: "100%",

        height: CARD_HEIGHT,

        borderRadius: 16,

        background: "#ffffff",

        boxShadow:

          "0 16px 38px rgba(15,23,42,0.11)",

        border: "1px solid #fed7aa",

        display: "flex",

        flexDirection: "column",

        position: "relative",

        overflow: "hidden",

        transition:

          "box-shadow 0.18s, transform 0.16s, border-color 0.18s",

        marginBottom: 0,

        cursor: "pointer",

        backdropFilter:

          "blur(13px) brightness(1.04)",

        WebkitBackdropFilter:

          "blur(13px) brightness(1.04)",

        willChange: "transform",

        maxWidth: CARD_WIDTH,

        minWidth: CARD_WIDTH,

      }}

      onMouseEnter={(e) => {

        e.currentTarget.style.transform =

          "translateY(-7px) scale(1.025)";



        e.currentTarget.style.boxShadow =

          "0 22px 48px rgba(15,23,42,0.16)";

        e.currentTarget.style.borderColor =

          "#fb923c";

      }}

      onMouseLeave={(e) => {

        e.currentTarget.style.transform = "";



        e.currentTarget.style.boxShadow =

          "0 16px 38px rgba(15,23,42,0.11)";

        e.currentTarget.style.borderColor =

          "#fed7aa";

      }}

      onClick={() => {

        goto(

          getRoute(

            "/select-round",

            cup.id

          )

        );

      }}

      onMouseDown={(e) => {

        if (e.button === 1) {

          e.preventDefault();

          e.stopPropagation();



          const url = getRoute(

            "/select-round",

            cup.id

          );



          const newWindow =

            window.open(

              url,

              "_blank"

            );



          if (newWindow) {

            newWindow.opener = null;

          }

        }

      }}

    >

      {/* 배경 효과 */}

      <div

        style={{

          position: "absolute",

          top: "-33%",

          left: "-12%",

          width: "140%",

          height: "180%",

          zIndex: 0,

          background:

            "none",

          filter:

            "blur(22px) brightness(1.1)",

          opacity: 0.92,

          pointerEvents: "none",

        }}

      />



      {/* 썸네일 */}

      <div

        style={{

          width: "100%",

          height: THUMB_HEIGHT,

          display: "flex",

          flexDirection: "row",

          background:

            "linear-gradient(135deg, #fff7ed 0%, #eef6ff 100%)",

          borderTopLeftRadius: 18,

          borderTopRightRadius: 18,

          overflow: "hidden",

          position: "relative",

          zIndex: 2,

        }}

      >

        <div

          style={{

            width: "50%",

            height: "100%",

            background: "#fff7ed",

            borderTopLeftRadius: 18,

            overflow: "hidden",

            position: "relative",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

          }}

        >

          {first?.image ? (

            <MediaRenderer

              url={first.image}

              alt={t("first_place")}

              playable={false}

              loading="lazy"

              style={{

                width: "100%",

                height: "100%",

                objectFit: "cover",

                objectPosition: "center 20%",

                background: "#ffffff",

              }}

            />

          ) : (

            <div

              style={{

                width: "100%",

                height: "100%",

                background: "#ffffff",

              }}

            />

          )}

        </div>



        <div

          style={{

            width: "50%",

            height: "100%",

            background: "#eef6ff",

            borderTopRightRadius: 18,

            overflow: "hidden",

            position: "relative",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

          }}

        >

          {second?.image ? (

            <MediaRenderer

              url={second.image}

              alt={t("second_place")}

              playable={false}

              loading="lazy"

              style={{

                width: "100%",

                height: "100%",

                objectFit: "cover",

                objectPosition: "center 20%",

                background: "#ffffff",

              }}

            />

          ) : (

            <div

              style={{

                width: "100%",

                height: "100%",

                background: "#ffffff",

              }}

            />

          )}

        </div>



        {/* VS */}

        <div

          style={{

            position: "absolute",

            top: "50%",

            left: "50%",

            transform:

              "translate(-50%,-55%)",

            zIndex: 5,

            pointerEvents: "none",

            width: isMobile ? 55 : 70,

            height: isMobile ? 55 : 70,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

          }}

        >

          <img

            src="/vs.png"

            alt={t("vs")}

            style={{

              width: "100%",

              height: "100%",

              objectFit: "contain",

              userSelect: "none",

              pointerEvents: "none",

            }}

            draggable={false}

          />

        </div>

      </div>



      {/* 제목 */}

      <div

        style={{

          width: "100%",

          height: isMobile ? 60 : 66,

          boxSizing: "border-box",

          padding: isMobile

            ? "7px 11px 3px 11px"

            : "8px 15px 3px 15px",

          background: "#fff7ed",
          borderTop: "1px solid #ffedd5",
          borderBottom: "1px solid #ffedd5",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          overflow: "hidden",

          margin: 0,

        }}

        title={displayTitle}

      >

        <Link to={`/${lang}/select-round/${cup.id}`} onClick={(event) => event.stopPropagation()}

          className="worldcup-card-title"

          style={{ textDecoration: "none",

            width: "100%",

            display: "-webkit-box",

            WebkitBoxOrient:

              "vertical",

            WebkitLineClamp: 2,

            overflow: "hidden",

            textOverflow:

              "ellipsis",

            whiteSpace: "normal",

            wordBreak: "keep-all",

            overflowWrap:

              "break-word",

            textAlign: "center",

            lineHeight: 1.14,

            fontSize:

              isMobile ? 19 : 22,

            letterSpacing: "0.1px",

            color: "#111827",

fontFamily:

  "'Pretendard', sans-serif",



fontWeight: 800,

            textShadow:

              "none",

            margin: 0,

            padding: 0,

          }}

        >

          {displayTitle}

        </Link>

      </div>



      {/* 설명 */}

      <div className="worldcup-card-description" style={cardDescStyle}><span className="card-description-text">

        {getPopularCandidateLine(cup, winStats)}

      </span></div>



      {/* 후보 수 / 플레이 수 / 최근 수정일 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: isMobile ? "3px 8px" : "0 10px",
          color: "#596579",
          fontSize: isMobile ? 14 : 16,
          fontWeight: 800,
          lineHeight: 1.3,
          padding: isMobile
            ? "6px 10px 6px"
            : "8px 12px 7px",
          background: "#fffaf7",
          boxSizing: "border-box",
          whiteSpace: isMobile ? "normal" : "nowrap",
          marginTop: isMobile ? 2 : 4,
        }}
      >
        <span>
          👤 {cardMetaCopy.candidates}{" "}
          <strong style={{ color: "#202534" }}>
            {candidateCount.toLocaleString()}
          </strong>
        </span>

        <span aria-hidden="true" style={{ color: "#b3bdcb" }}>
          ·
        </span>

        <span>
          ▶ {cardMetaCopy.plays}{" "}
          <strong style={{ color: "#C2410C" }}>
            {totalPlays.toLocaleString()}
          </strong>
        </span>

        <span aria-hidden="true" style={{ color: "#b3bdcb" }}>
          ·
        </span>

        <span>
          🕒 {cardMetaCopy.updated}{" "}
          <strong style={{ color: "#202534" }}>
            {lastUpdatedDate}
          </strong>
        </span>
      </div>


      {/* 버튼 */}

      <div

        style={{

          width: "100%",

          display: "flex",

          alignItems: "center",

          justifyContent:

            "space-between",

          padding: isMobile
            ? "9px 7px 7px 7px"
            : "12px 10px 8px 10px",
          minHeight:
            isMobile ? 38 : 42,
          background: mainDark,
          boxSizing: "border-box",
          marginTop: "auto",

          borderTop: "none",

          borderBottom: "none",

          borderRadius: 0,

          gap: 0,

        }}

      >



        <button

          onClick={(e) => {

            e.stopPropagation();



            goto(

              getRoute(

                "/stats",

                cup.id

              )

            );

          }}

          style={buttonStyle}

          onMouseOver={(e) =>

            (e.currentTarget.style.background =

              "#ffedd5")

          }

          onMouseOut={(e) =>

            (e.currentTarget.style.background =

              "#fff7ed")

          }

        >

          {t("stats_comment")}

        </button>



        {isMine(cup) ? (

          <div

            style={{

              display: "flex",

              gap: 5,

            }}

          >

            <button

              onClick={(e) => {

                e.stopPropagation();



                goto(

                  getRoute(

                    "/edit-worldcup",

                    cup.id

                  )

                );

              }}

              style={smallButtonStyle}

              onMouseOver={(e) =>

                (e.currentTarget.style.background =

                  "#ffffff")

              }

              onMouseOut={(e) =>

                (e.currentTarget.style.background =

                  mainDark)

              }

            >

              {t("edit")}

            </button>



            <button

              onClick={(e) => {

                e.stopPropagation();



                if (

                  !window.confirm(

                    t(

                      "delete_confirm"

                    ) ||

                      "Are you sure you want to delete?"

                  )

                ) {

                  return;

                }



                if (onDelete) {

                  onDelete(cup.id);

                } else {

                  window.location.reload();

                }

              }}

              style={smallButtonStyle}

              onMouseOver={(e) =>

                (e.currentTarget.style.background =

                  "#ffffff")

              }

              onMouseOut={(e) =>

                (e.currentTarget.style.background =

                  mainDark)

              }

            >

              {t("delete")}

            </button>

          </div>

        ) : (

          <div

            style={{

              width:

                isMobile ? 29 : 40,

            }}

          />

        )}

        <button

          onClick={(e) => {

            e.stopPropagation();



            goto(

              getRoute(

                "/select-round",

                cup.id

              )

            );

          }}

          style={startButtonStyle}

          onMouseOver={(e) =>

            (e.currentTarget.style.background =

              "#ea580c")

          }

          onMouseOut={(e) =>

            (e.currentTarget.style.background =

              "#F97316")

          }

        >

          {t("start")}

        </button>

      </div>



      <div

        className="worldcup-card-accent" style={{...cardBottomBarStyle, background: categoryAccent}}

      />

    </div>

  );

};





const renderCategorySection = ({

  rowKey,

  title,

  cups,

  slug = null,

  featured = false,

}) => {

  if (!Array.isArray(cups) || cups.length === 0) {

    return null;

  }



  return (

    <section

      key={rowKey}

      className={`home-category-section${featured ? " is-featured" : ""}`}

style={{

  width: "100%",

  margin: featured ? "2px 0 12px" : (isMobile ? "10px 0 14px" : "14px 0 18px"),

}}

    >

      {/* 카테고리 제목 */}

      <div

        className={featured ? "home-category-heading" : undefined}

        style={{

          width: "100%",

          maxWidth: featured ? 1400 : "none",

          margin: featured ? "0 auto" : 0,

          padding: isMobile

            ? "0 14px 6px"

            : featured

              ? "0 24px 8px"

              : "0 20px 8px",

          boxSizing: "border-box",

          display: "flex",

          alignItems: "center",

          justifyContent: featured ? "center" : "flex-start",

          gap: isMobile ? 8 : 11,

        }}

      >

        <h2

          style={{

            margin: 0,

color: "#202534",

fontSize: isMobile ? 29 : 38,

fontWeight: 900,

            lineHeight: 1.2,

            fontFamily:

              "'Orbitron', 'Pretendard', sans-serif",

          }}

        >

          {title}

        </h2>



        {!featured && slug && (

          <button

            type="button"

            onClick={() =>

              goto(`/${lang}/category/${slug}`)

            }

            style={{

              padding: 0,

              border: "none",

              background: "transparent",

              color: "#C2410C",

              fontSize: isMobile ? 16 : 19,

              fontWeight: 800,

              cursor: "pointer",

              whiteSpace: "nowrap",

            }}

            onMouseEnter={(e) => {

              e.currentTarget.style.color =

                "#C2410C";

              e.currentTarget.style.textDecoration =

                "underline";

            }}

            onMouseLeave={(e) => {

              e.currentTarget.style.color =

                "#C2410C";

              e.currentTarget.style.textDecoration =

                "none";

            }}

          >

            {t("view_all", {

              defaultValue: "View all",

            })}{" "}

            ›

          </button>

        )}

        {!featured && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: isMobile ? 0 : 4,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCategorySort(
                  rowKey,
                  "popular"
                )
              }
              aria-pressed={
                getCategorySort(rowKey) ===
                "popular"
              }
              style={{
                border:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "1.5px solid #F97316"
                    : "1px solid #dde2ea",
                background:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "#F97316"
                    : "#ffffff",
                color:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "#ffffff"
                    : "#C2410C",
                borderRadius: 7,
                padding: isMobile
                  ? "5px 9px"
                  : "6px 11px",
                fontSize: isMobile
                  ? 13
                  : 14,
                fontWeight: 900,
                cursor: "pointer",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {t("popular")}
            </button>

            <button
              type="button"
              onClick={() =>
                setCategorySort(
                  rowKey,
                  "recent"
                )
              }
              aria-pressed={
                getCategorySort(rowKey) ===
                "recent"
              }
              style={{
                border:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "1.5px solid #F97316"
                    : "1px solid #dde2ea",
                background:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "#F97316"
                    : "#ffffff",
                color:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "#ffffff"
                    : "#C2410C",
                borderRadius: 7,
                padding: isMobile
                  ? "5px 9px"
                  : "6px 11px",
                fontSize: isMobile
                  ? 13
                  : 14,
                fontWeight: 900,
                cursor: "pointer",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {t("latest")}
            </button>
          </div>
        )}

      </div>



{/* 가로 슬라이드 */}

<div

  style={{

    width: "100%",

    position: "relative",

  }}

>



{/* 왼쪽 화살표 */}

{rowKey !== "etc" && categoryScrollState[rowKey]?.canScrollLeft && (

  <button

    type="button"

    aria-label="Scroll left"

    onClick={() =>

      scrollCategoryRow(rowKey, -1, cups.length)

    }

    style={{

      position: "absolute",

      left: isMobile ? 6 : 14,

      top: "50%",

      transform: "translateY(-50%)",

      zIndex: 20,



      width: isMobile ? 52 : 68,

      height: isMobile ? 96 : 140,



      border: "2px solid rgba(255,255,255,0.96)",

      borderRadius: 16,



      background:

        "linear-gradient(180deg, rgba(112,88,232,0.98) 0%, rgba(72,49,181,0.98) 100%)",

      color: "#ffffff",



      fontSize: isMobile ? 42 : 58,

      fontWeight: 900,

      lineHeight: 1,



      cursor: "pointer",



      display: "flex",

      alignItems: "center",

      justifyContent: "center",



      boxShadow:

        "0 10px 28px rgba(65,45,170,0.42), 0 0 0 4px rgba(102,80,216,0.16)",

      textShadow: "0 2px 8px rgba(0,0,0,0.35)",

      transition: "transform .16s ease, box-shadow .16s ease",

    }}

  >

    ‹

  </button>

)}



{/* 카드들 */}

<div

  ref={(el) => {

    categoryRowRefs.current[rowKey] = el;



    if (el && rowKey !== "etc") {

      requestAnimationFrame(() => {

        updateCategoryScrollState(rowKey);

      });

    }

  }}

onScroll={(e) => {

  if (rowKey === "etc") {

    return;

  }



  updateCategoryScrollState(rowKey);



  const el = e.currentTarget;



  const remaining =

    el.scrollWidth -

    el.scrollLeft -

    el.clientWidth;



  if (remaining < CARD_WIDTH * 2) {

    loadMoreRow(

      rowKey,

      cups.length

    );

  }

}}

  className="home-category-scroll"

  style={{

    width: "100%",

    display: "flex",



    flexWrap: rowKey === "etc" ? "wrap" : "nowrap",



justifyContent:

  rowKey === "etc"

    ? "center"

    : Math.min(

        cups.length,

        getRowVisibleCount(rowKey)

      ) *

        (CARD_WIDTH + CARD_GAP) <

      vw

    ? "center"

    : "flex-start",

    gap: CARD_GAP,



    overflowX: rowKey === "etc" ? "hidden" : "auto",

    overflowY: "hidden",



    scrollBehavior: "smooth",

    WebkitOverflowScrolling: "touch",



    padding: isMobile

      ? "8px 42px 12px"

      : "10px 76px 16px",



    boxSizing: "border-box",

  }}

>

{(rowKey === "etc"

  ? cups.slice(0, otherVisibleCount)

  : cups.slice(

      0,

      getRowVisibleCount(rowKey)

    )

).map((cup) => (

    <React.Fragment key={`${rowKey}-${cup.id}`}>

      <div

        style={{

          flex: `0 0 ${CARD_WIDTH}px`,

          width: CARD_WIDTH,

          minWidth: CARD_WIDTH,

        }}

      >

        {renderWorldcupCard(cup)}

      </div>

    </React.Fragment>

  ))}



{rowKey === "etc" && otherVisibleCount < cups.length && (

  <div

    style={{

      width: "100%",

      display: "flex",

      justifyContent: "center",

      marginTop: isMobile ? 10 : 14,

    }}

  >

    <button

      type="button"

      onClick={() =>

        setOtherVisibleCount((prev) => prev + 8)

      }

      style={{

        border: "1px solid #dde2ea",

        borderRadius: 8,

        background: "#F97316",

        color: "#ffffff",

        padding: isMobile

          ? "9px 22px"

          : "11px 30px",

        fontSize: isMobile ? 16 : 18,

        fontWeight: 900,

        cursor: "pointer",

      }}

    >

      {t("load_more")}

    </button>

  </div>

)}



</div>



     {/* 오른쪽 화살표 */}

{(

  getRowVisibleCount(rowKey) < cups.length ||

  categoryScrollState[rowKey]?.canScrollRight

) && (

  <button

    type="button"

    aria-label="Scroll right"

    onClick={() =>

      scrollCategoryRow(rowKey, 1, cups.length)

    }

    style={{

      position: "absolute",

      right: isMobile ? 6 : 14,

      top: "50%",

      transform: "translateY(-50%)",

      zIndex: 20,



      width: isMobile ? 52 : 68,

      height: isMobile ? 96 : 140,



      border: "2px solid rgba(255,255,255,0.96)",

      borderRadius: 16,



      background:

        "linear-gradient(180deg, rgba(112,88,232,0.98) 0%, rgba(72,49,181,0.98) 100%)",

      color: "#ffffff",



      fontSize: isMobile ? 42 : 58,

      fontWeight: 900,

      lineHeight: 1,



      cursor: "pointer",



      display: "flex",

      alignItems: "center",

      justifyContent: "center",



      boxShadow:

        "0 10px 28px rgba(65,45,170,0.42), 0 0 0 4px rgba(102,80,216,0.16)",

      textShadow: "0 2px 8px rgba(0,0,0,0.35)",

      transition: "transform .16s ease, box-shadow .16s ease",

    }}

  >

    ›

  </button>

)}

      </div>

    </section>

  );

};





const featuredCups = Array.isArray(worldcupList)

  ? [...worldcupList]

     .filter((cup) => {

  if (cup.is_featured !== true) {

    return false;

  }



  const keyword = normalizeSearchQuery(search);



  return cupMatchesSearch(cup, keyword, lang);

})

.sort((a, b) => {

  const aOrder = a.featured_order ?? 999999;

  const bOrder = b.featured_order ?? 999999;



  return aOrder - bOrder;

})

  : [];



const categorySections = HOME_CATEGORIES.map(

  (category) => ({

    ...category,



    cups: sortCategoryCups(
      filtered.filter(
        (cup) =>
          (cup.category || "etc") ===
          category.key
      ),
      category.key
    ),

  })

);



const visibleCategorySections = categorySections.filter(

  (section) => section.cups.length > 0

);



const shouldShowAllCategories =

  showMoreCategories ||

  Boolean(search.trim()) ||

  Boolean(creatorFilter) ||

  personalView;



const primaryCategorySections =

  visibleCategorySections.filter((section) =>

    PRIMARY_HOME_CATEGORY_KEYS.has(section.key)

  );



const deferredCategorySections =

  visibleCategorySections.filter((section) =>

    !PRIMARY_HOME_CATEGORY_KEYS.has(section.key)

  );



const renderedCategorySections = shouldShowAllCategories

  ? visibleCategorySections

  : primaryCategorySections;

const worldcupIntroDescription =
  lang === "ko"
    ? "이상형 월드컵을 만들고 플레이하는 원픽게임입니다. 아이돌, 애니, 게임, 영화, 음식 등 다양한 주제의 월드컵을 무료로 즐기고 공유해보세요."
    : t("gameModeNav.introLine2", {
        defaultValue:
          "Create and play tournament bracket games, tier lists, quizzes, and blind rankings on One Pick Game.",
      });

const homeSeoSummary =
  HOME_SEO_SUMMARY_COPY[lang] ||
  HOME_SEO_SUMMARY_COPY.en;
const homeSeoSummaryParts = homeSeoSummary
  .split(/(?<=\.|。|।)\s+/)
  .filter(Boolean);
useEffect(() => {

  const visibleCups = [];



  featuredCups

    .slice(

      0,

      getRowVisibleCount("featured")

    )

    .forEach((cup) => {

      visibleCups.push(cup);

    });



  renderedCategorySections.forEach(

    (section) => {

      const visible =

        section.key === "etc"

          ? section.cups.slice(

              0,

              otherVisibleCount

            )

          : section.cups.slice(

              0,

              getRowVisibleCount(

                section.key

              )

            );



      visible.forEach((cup) => {

        visibleCups.push(cup);

      });

    }

  );



  const uniqueCups = [

    ...new Map(

      visibleCups.map((cup) => [

        String(cup.id),

        cup,

      ])

    ).values(),

  ];



  uniqueCups.forEach((cup) => {

    const key = String(cup.id);



    if (

      requestedStatsRef.current.has(key)

    ) {

      return;

    }



    requestedStatsRef.current.add(key);



    fetchWinnerStatsFromDB(cup.id)

      .then((statsArr) => {

        setWinStatsMap((prev) => ({

          ...prev,

          [cup.id]:

            Array.isArray(statsArr)

              ? statsArr

              : [],

        }));

      })

      .catch((error) => {

        console.error(

          "카드 상세 통계 조회 실패:",

          cup.id,

          error

        );



        requestedStatsRef.current.delete(

          key

        );

      });

  });

}, [

  rowVisibleCounts,

  otherVisibleCount,

  search,

  categorySorts,

  playCountMap,

  worldcupList,

  showMoreCategories,

  creatorFilter,

  personalView,

]);

return (

  <div className={`home-page${personalView ? " is-personal" : ""}`}

    style={{

      width: "100%",

      minHeight: "100vh",

      background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 220px, #f8fafc 100%)",

      position: "relative",

    }}

  >



  {!personalView && !search.trim() && (
    <section
      aria-label={lang === "ko" ? "원픽게임 소개" : "One Pick Game introduction"}
      style={{
        width: "100%",
        maxWidth: isMobile ? 430 : 1060,
        margin: isMobile ? "0 auto 8px" : "0 auto 10px",
        padding: isMobile ? "14px 18px 0" : "18px 24px 0",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
<p
  style={{
    margin: 0,
    color: "#475569",
    fontSize: isMobile ? 14 : 15,
    lineHeight: 1.65,
    fontWeight: 750,
  }}
>
  {homeSeoSummaryParts.map((line, index) => (
    <span key={`${line}-${index}`} style={{ display: "block" }}>
      {line}
    </span>
  ))}
</p>
    </section>
  )}



  <div
    className="home-top-layout"
    style={{
      width: "100%",
      maxWidth: showHomeActivityPanels ? 1900 : isMobile ? 430 : 1000,
      margin: "0 auto",
      padding: showHomeActivityPanels ? "0 32px" : isMobile ? "0 12px" : "0 16px",
      boxSizing: "border-box",
      display: showHomeActivityPanels ? "grid" : "block",
      gridTemplateColumns: showHomeActivityPanels
        ? "minmax(280px, 1fr) minmax(660px, 860px) minmax(280px, 1fr)"
        : undefined,
      gap: showHomeActivityPanels ? 28 : undefined,
      alignItems: showHomeActivityPanels ? "start" : undefined,
    }}
  >
    {showHomeActivityPanels && (
      <div style={{ paddingTop: 18 }}>
        {renderHomeActivityPanel({
          title: sidePanelCopy.recentCreated,
          items: recentCreatedCups,
          accentColor: "#EA580C",
        })}
      </div>
    )}

    <div style={{ minWidth: 0 }}>
      <PageIntro icon="🏆" title={t('gameModeNav.worldcup')} description={worldcupIntroDescription} hideDescription buttonLabel={t('create_worldcup')} createTo={`/${lang}/worldcup-maker`} onCreate={() => onMakeWorldcup ? onMakeWorldcup() : goto(`/${lang}/worldcup-maker`)} personal={false} accentColor="#F97316" />

      {/* 언어 선택 / 검색 */}

      <div

        style={{

          width: "100%",

          maxWidth: isMobile ? 430 : 1000,

          margin: isMobile ? "4px auto 14px" : "6px auto 18px",

          padding: showHomeActivityPanels ? "0" : isMobile ? "0 12px" : "0 16px",

          boxSizing: "border-box",

        }}

      >

    {/* 언어 선택 - 다른 홈과 동일하게 박스 없이 검색창 위 */}

    <div
      className="worldcup-home-language-shortcuts"

      style={{

        display: "flex",

        flexWrap: "wrap",

        gap: isMobile ? 8 : 10,

        justifyContent: "center",

        alignItems: "center",

        marginBottom: isMobile ? 10 : 12,

      }}

    >

      {LANGUAGES.map((item) => {

        const active = item.code === lang;



        return (

          <React.Fragment key={item.code}>

            {item.code === "de" && (

              <span

                aria-hidden="true"

                style={{ flexBasis: isMobile ? "100%" : 0, height: 0 }}

              />

            )}



            <button

              type="button"

              onClick={() => changeHomeLanguage(item.code)}

              aria-pressed={active}

              style={{

                border: active

                  ? "1.5px solid #F97316"

                  : "1px solid #fed7aa",

                background: active ? "#F97316" : "#fffaf7",

                color: active ? "#ffffff" : "#9A3412",

                borderRadius: 999,

                padding: isMobile ? "8px 12px" : "9px 15px",

                fontSize: isMobile ? 15 : 16,

                fontWeight: active ? 900 : 800,

                cursor: "pointer",

                lineHeight: 1.2,
                boxShadow: active
                  ? "0 8px 16px rgba(249,115,22,0.22)"
                  : "0 3px 10px rgba(234,88,12,0.08)",

              }}

            >

              {item.label}

            </button>

          </React.Fragment>

        );

      })}

    </div>



    {/* 검색 */}

    <div

      style={{

        width: "100%",

        maxWidth: 760,

        margin: "0 auto",

        display: "flex",

        alignItems: "center",

      }}

    >

      <div

        style={{

          flex: 1,

          minWidth: 0,

          position: "relative",

        }}

      >

        <input

          ref={searchInputRef}

          className="home-search-input"

          type="text"

          placeholder={t("search_placeholder")}

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          onKeyDown={(e) => {

            if (e.key === "Enter") {

              recordSearch(search);

            }

          }}

          style={{

            width: "100%",

            height: isMobile ? 50 : 56,

            background: "#ffffff",

            color: "#202534",

            border: "1.5px solid #fb923c",

            borderRadius: 14,

            padding: isMobile ? "0 40px 0 13px" : "0 46px 0 16px",

            boxSizing: "border-box",

            fontSize: isMobile ? 16 : 19,

            fontWeight: 700,

            outline: "none",
            boxShadow: "0 12px 30px rgba(249,115,22,0.15)",

          }}

        />



        <style>

          {`

            .home-search-input::placeholder {

              color: #8b98ad;

              opacity: 1;

              font-weight: 600;

            }

          `}

        </style>



        <span

          style={{

            position: "absolute",

            right: isMobile ? 10 : 12,

            top: "50%",

            transform: "translateY(-50%)",

            color: "#C2410C",

            fontSize: isMobile ? 15 : 17,

            pointerEvents: "none",

          }}

        >

          🔍

        </span>

      </div>

    </div>

      </div>
    </div>

    {showHomeActivityPanels && (
      <div style={{ paddingTop: 18 }}>
        {renderHomeActivityPanel({
          title: sidePanelCopy.recentPlayed,
          items: recentPlayedCups,
          accentColor: "#7C3AED",
        })}
      </div>
    )}
  </div>



{/* 검색 결과 없음 */}

{search.trim() && filtered.length === 0 && (

  <div

    style={{

      width: "100%",

      maxWidth: 700,

      margin: isMobile

        ? "30px auto 50px"

        : "46px auto 70px",

      padding: "0 20px",

      boxSizing: "border-box",

      textAlign: "center",

      color: "#C2410C",

      fontSize: isMobile ? 17 : 20,

      fontWeight: 700,

      lineHeight: 1.6,

    }}

  >

    {t("no_search_results", {

      defaultValue:

        lang === "ko"

          ? "검색 결과가 없습니다."

          : "No results found.",

    })}

  </div>

)}

{/* 추천 */}

<section
  aria-label={
    lang === "ko"
      ? "월드컵 카테고리 바로가기"
      : "Worldcup category shortcuts"
  }
  className="worldcup-home-category-shortcuts"
  style={{
    width: "100%",
    maxWidth: 1400,
    margin: isMobile ? "2px auto 10px" : "4px auto 14px",
    padding: isMobile ? "0 14px" : "0 24px",
    boxSizing: "border-box",
  }}
>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: isMobile ? 8 : 10,
    }}
  >
    {HOME_CATEGORY_SHORTCUT_KEYS.map((categoryKey) => {
      const category = HOME_CATEGORIES.find(
        (item) => item.key === categoryKey
      );

      if (!category) return null;

      return (
        <Link
          key={category.key}
          to={`/${lang}/category/${category.slug}`}
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center",
            minHeight: isMobile ? 36 : 40,
            padding: isMobile ? "8px 13px" : "9px 16px",
            borderRadius: 999,
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            color: "#9A3412",
            fontSize: isMobile ? 14 : 15,
            fontWeight: 900,
            lineHeight: 1.15,
            cursor: "pointer",
            boxShadow: "0 5px 14px rgba(249,115,22,0.08)",
          }}
        >
          {lang === "ko"
            ? KO_HOME_CATEGORY_SHORTCUT_LABELS[category.key] ||
              t(`category_${category.key}`, {
                defaultValue: category.label,
              })
            : t(`category_${category.key}`, {
                defaultValue: category.label,
              })}
        </Link>
      );
    })}
  </div>
</section>

{renderCategorySection({

  rowKey: "featured",

  title: t("category_featured", {

    defaultValue: "Featured",

  }),

  cups: featuredCups,

  featured: true,

})}



{/* 카테고리 */}

{renderedCategorySections.map((section, index) => (

  <React.Fragment key={section.key}>

    {renderCategorySection({

      rowKey: section.key,



      title: t(`category_${section.key}`, {

        defaultValue: section.label,

      }),



      cups: section.cups,

      slug: section.slug,

    })}



{(index === 1 ||

  index === 3 ||

  index === 5 ||

  index === 7) && (

  <AdsenseMid />

)}



  </React.Fragment>

))}



{!shouldShowAllCategories && deferredCategorySections.length > 0 && (

  <div

    style={{

      width: "100%",

      display: "flex",

      justifyContent: "center",

      padding: isMobile ? "8px 16px 24px" : "14px 24px 34px",

      boxSizing: "border-box",

    }}

  >

    <button

      type="button"

      onClick={() => setShowMoreCategories(true)}

      style={{

        minWidth: isMobile ? 220 : 280,

        minHeight: 48,

        padding: isMobile ? "11px 18px" : "13px 24px",

        borderRadius: 12,

        border: "1.5px solid #F97316",

        background: "#ffffff",

        color: "#C2410C",

        fontSize: isMobile ? 16 : 18,

        fontWeight: 900,

        cursor: "pointer",

      }}

    >

      {t("show_more_categories", {

        defaultValue: "More categories",

      })} ↓

    </button>

  </div>

)}





{!personalView && (
  <section
    aria-label={worldcupInfoCopy.ariaLabel}
    dir={lang === "ar" ? "rtl" : undefined}
    style={{
      width: "100%",
      maxWidth: 1000,
      margin: isMobile ? "4px auto 30px" : "10px auto 44px",
      padding: isMobile ? "0 18px" : "0 24px",
      boxSizing: "border-box",
      color: "#202534",
    }}
  >
    <div
      style={{
        borderTop: "1px solid #fed7aa",
        paddingTop: isMobile ? 20 : 26,
      }}
    >
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: isMobile ? 22 : 28,
          fontWeight: 900,
          lineHeight: 1.25,
          letterSpacing: 0,
        }}
      >
        {worldcupInfoCopy.title}
      </h2>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: isMobile ? 15 : 17,
          lineHeight: 1.75,
          color: "#475569",
          fontWeight: 700,
        }}
      >
        {worldcupInfoCopy.description}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 10 : 14,
          marginTop: 18,
        }}
      >
        {worldcupInfoCopy.cards.map((item) => (
          <article
            key={item.title}
            style={{
              border: "1px solid #fed7aa",
              borderRadius: 10,
              background: "#fffaf7",
              padding: isMobile ? "14px 14px" : "16px 16px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: isMobile ? 16 : 18,
                fontWeight: 900,
                lineHeight: 1.3,
                color: "#9A3412",
              }}
            >
              {item.blogSlug ? (
                <a
                  href={`/${lang}/blog/${item.blogSlug}`}
                  style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  {item.title}
                </a>
              ) : item.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.65,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {item.body}
            </p>
          </article>
        ))}
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gap: 10,
        }}
      >
        {worldcupInfoCopy.faqs.map((item) => (
          <details
            key={item.q}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#ffffff",
              padding: isMobile ? "12px 13px" : "13px 15px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: isMobile ? 15 : 16,
                fontWeight: 900,
                color: "#202534",
              }}
            >
              {item.q}
            </summary>
            <p
              style={{
                margin: "9px 0 0",
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.65,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
)}

      <style>

        {`

            @media (max-width: 599px) {
              .worldcup-home-language-shortcuts,
              .worldcup-home-category-shortcuts {
                display: none !important;
              }
            }

            .home-category-scroll {

  scrollbar-width: none;

  -ms-overflow-style: none;

}



.home-category-scroll::-webkit-scrollbar {

  display: none;

}

        `}

      </style>

    </div>

  );

}



export default Home;
