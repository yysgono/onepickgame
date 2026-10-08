const CATEGORY_SEO_COPY = {
  ko: {
    title: "{category} 이상형 월드컵 모음 | 원픽게임",
    description: "{category} 카테고리의 이상형 월드컵을 인기순과 최신순으로 찾아보고 플레이하세요.",
  },
  en: {
    title: "{category} Bracket Games | OnePickGame",
    description: "Browse and play popular and latest {category} tournament bracket games on OnePickGame.",
  },
  ja: {
    title: "{category} 人気投票トーナメント | OnePickGame",
    description: "{category}カテゴリの人気投票トーナメントを人気順・最新順で探してプレイできます。",
  },
  zh: {
    title: "{category} 人气投票淘汰赛 | OnePickGame",
    description: "在OnePickGame按热门和最新浏览并游玩{category}人气投票淘汰赛。",
  },
  ru: {
    title: "{category}: турниры голосований | OnePickGame",
    description: "Играйте в популярные и новые турниры голосований категории {category} на OnePickGame.",
  },
  pt: {
    title: "Jogos de torneio {category} | OnePickGame",
    description: "Explore e jogue torneios de votação populares e recentes de {category} no OnePickGame.",
  },
  es: {
    title: "Torneos de {category} | OnePickGame",
    description: "Explora y juega torneos de votación populares y recientes de {category} en OnePickGame.",
  },
  fr: {
    title: "Tournois {category} | OnePickGame",
    description: "Parcourez et jouez aux tournois de vote {category} populaires et récents sur OnePickGame.",
  },
  id: {
    title: "Game Turnamen {category} | OnePickGame",
    description: "Jelajahi dan mainkan turnamen voting {category} populer dan terbaru di OnePickGame.",
  },
  hi: {
    title: "{category} वोटिंग टूर्नामेंट | OnePickGame",
    description: "OnePickGame पर {category} के लोकप्रिय और नए वोटिंग टूर्नामेंट खोजें और खेलें।",
  },
  de: {
    title: "{category} Abstimmungsturniere | OnePickGame",
    description: "Entdecke und spiele beliebte und neue {category}-Abstimmungsturniere auf OnePickGame.",
  },
  vi: {
    title: "Trò chơi bình chọn {category} | OnePickGame",
    description: "Khám phá và chơi các giải đấu bình chọn {category} phổ biến và mới nhất trên OnePickGame.",
  },
  ar: {
    title: "بطولات تصويت {category} | OnePickGame",
    description: "تصفح والعب بطولات التصويت الشائعة والأحدث في فئة {category} على OnePickGame.",
  },
  bn: {
    title: "{category} ভোটিং টুর্নামেন্ট | OnePickGame",
    description: "OnePickGame-এ {category} বিভাগের জনপ্রিয় ও নতুন ভোটিং টুর্নামেন্ট খুঁজুন এবং খেলুন।",
  },
  th: {
    title: "เกมโหวต {category} | OnePickGame",
    description: "ค้นหาและเล่นเกมโหวตแบบทัวร์นาเมนต์หมวด {category} ทั้งยอดนิยมและล่าสุดบน OnePickGame",
  },
  tr: {
    title: "{category} Oylama Turnuvaları | OnePickGame",
    description: "OnePickGame'de popüler ve en yeni {category} oylama turnuvalarını keşfet ve oyna.",
  },
};

const labels = require("./categoryLabels.json");
const CATEGORY_KEYS = {person:"person",music:"music",korea:"korea",game:"game",sports:"sports","anime-manga":"anime_manga","movie-drama":"movie_drama",food:"food",etc:"etc"};
function getCategorySeo(lang, slug) {
 const key = CATEGORY_KEYS[slug];
 if (!key || !labels[lang]) return null;
 const label = labels[lang][key];
 const copy = CATEGORY_SEO_COPY[lang] || CATEGORY_SEO_COPY.en;
 return {key,label,title:copy.title.replace(/\{category\}/g,label),description:copy.description.replace(/\{category\}/g,label),slug:`category/${slug}`};
}
module.exports = {CATEGORY_SEO_COPY, CATEGORY_KEYS, getCategorySeo};
