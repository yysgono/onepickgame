// src/components/ReferralBanner.js
import React from "react";

/**
 * 다국어 래퍼럴 배너 (Epidemic Sound)
 * - 홈 하단은 쿠팡 유지 → 이 컴포넌트는 홈이 아닌 페이지 하단에 넣어 사용.
 * - lang: 'en' | 'ja' | 'fr' | 'es' | 'de' | 'pt' | 'ru' | 'id' | 'hi' | 'vi' | 'zh' | 'ar' | 'bn' | 'th' | 'tr' | 'ko'
 */
const COPY = {
  en: {
    title: "Looking for copyright-safe music?",
    body:
      "Epidemic Sound offers a huge library of royalty-free tracks and sound effects for YouTube, streams, podcasts, and commercial projects. Try it free and simplify music licensing.",
    cta: "Start your free trial →",
    bullets: [
      "Royalty-free for YouTube & streaming",
      "Commercial use included",
      "Thousands of curated tracks & SFX",
    ],
  },
  ja: {
    title: "著作権フリーの音楽をお探しですか？",
    body:
      "Epidemic Sound は YouTube・配信・ポッドキャスト・商用利用に対応したロイヤリティフリー楽曲と効果音を豊富に提供。無料トライアルで音源探しをもっと簡単に。",
    cta: "無料トライアルを始める →",
    bullets: ["YouTube/配信に最適", "商用利用OK", "厳選された楽曲＆効果音"],
  },
  fr: {
    title: "Besoin de musique libre de droits ?",
    body:
      "Epidemic Sound propose une immense bibliothèque de titres et d’effets sonores libres de droits pour YouTube, le streaming, les podcasts et les projets commerciaux. Essayez gratuitement.",
    cta: "Démarrer l’essai gratuit →",
    bullets: [
      "Libre de droits pour YouTube & streaming",
      "Utilisation commerciale incluse",
      "Des milliers de titres & SFX",
    ],
  },
  es: {
    title: "¿Buscas música libre de derechos?",
    body:
      "Epidemic Sound ofrece una gran librería de pistas y efectos de sonido libres de derechos para YouTube, streaming, podcasts y proyectos comerciales. Pruébalo gratis.",
    cta: "Comenzar prueba gratis →",
    bullets: [
      "Apta para YouTube y streaming",
      "Uso comercial incluido",
      "Miles de pistas y SFX",
    ],
  },
  de: {
    title: "Suchst du GEMA-freie Musik?",
    body:
      "Epidemic Sound bietet eine riesige Bibliothek an lizenzfreier Musik & Soundeffekten für YouTube, Streams, Podcasts und kommerzielle Projekte. Jetzt gratis testen.",
    cta: "Kostenlos testen →",
    bullets: [
      "GEMA-/royalty-frei für YouTube & Streaming",
      "Kommerzielle Nutzung inklusive",
      "Tausende kuratierte Tracks & SFX",
    ],
  },
  pt: {
    title: "Procurando música sem direitos autorais?",
    body:
      "A Epidemic Sound oferece uma enorme biblioteca de faixas e efeitos sonoros royalty-free para YouTube, streaming, podcasts e projetos comerciais. Experimente grátis.",
    cta: "Começar teste grátis →",
    bullets: [
      "Royalty-free para YouTube e streaming",
      "Uso comercial incluso",
      "Milhares de faixas e SFX",
    ],
  },
  ru: {
    title: "Нужна музыка без авторских прав?",
    body:
      "Epidemic Sound — большая библиотека royalty-free музыки и эффектов для YouTube, стримов, подкастов и коммерческих проектов. Попробуйте бесплатно.",
    cta: "Начать бесплатный период →",
    bullets: [
      "Royalty-free для YouTube и стриминга",
      "Коммерческое использование включено",
      "Тысячи треков и SFX",
    ],
  },
  id: {
    title: "Butuh musik bebas hak cipta?",
    body:
      "Epidemic Sound punya pustaka besar musik & efek suara royalty-free untuk YouTube, streaming, podcast, dan proyek komersial. Coba gratis sekarang.",
    cta: "Mulai uji coba gratis →",
    bullets: [
      "Cocok untuk YouTube & streaming",
      "Termasuk penggunaan komersial",
      "Ribuan track & SFX",
    ],
  },
  hi: {
    title: "कॉपिराइट-सेफ म्यूज़िक ढूंढ रहे हैं?",
    body:
      "Epidemic Sound में YouTube, स्ट्रीमिंग, पॉडकास्ट और कमर्शियल प्रोजेक्ट्स के लिए रॉयल्टी-फ्री ट्रैक्स और SFX का विशाल কलेक्शन है। फ्री ट्रायल के साथ शुरू करें।",
    cta: "फ्री ट्रायल शुरू करें →",
    bullets: [
      "YouTube/स्ट्रीमिंग के लिए उपयुक्त",
      "व्यावसायिक उपयोग शामिल",
      "हज़ारों ट्रैक्स और SFX",
    ],
  },
  vi: {
    title: "Cần nhạc không bản quyền?",
    body:
      "Epidemic Sound cung cấp thư viện lớn nhạc & hiệu ứng âm thanh royalty-free cho YouTube, streaming, podcast và dự án thương mại. Dùng thử miễn phí.",
    cta: "Bắt đầu dùng thử →",
    bullets: [
      "Phù hợp YouTube & streaming",
      "Bao gồm mục đích thương mại",
      "Hàng nghìn track & SFX",
    ],
  },
  zh: {
    title: "在找免版税音乐？",
    body:
      "Epidemic Sound 为 YouTube、直播、播客与商业项目提供大量免版税音乐与音效。立即免费试用，轻松搞定音乐授权。",
    cta: "开始免费试用 →",
    bullets: ["适用于 YouTube/直播", "含商业用途", "数千首曲目与音效"],
  },
  ar: {
    title: "تبحث عن موسيقى خالية من الحقوق؟",
    body:
      "توفّر Epidemic Sound مكتبة ضخمة من المقاطع والمؤثرات الصوتية الخالية من حقوق الملكية ليوتيوب والبثّ والبودكاست والمشاريع التجارية. ابدأ تجربة مجانية.",
    cta: "ابدأ التجربة المجانية →",
    bullets: [
      "مناسبة ليوتيوب والبثّ",
      "تشمل الاستخدام التجاري",
      "آلاف المقاطع والمؤثرات",
    ],
  },
  bn: {
    title: "কপিরাইট-ফ্রি মিউজিক খুঁজছেন?",
    body:
      "Epidemic Sound-এ আছে ইউটিউব, স্ট্রিমিং, পডকাস্ট ও বাণিজ্যিক প্রোজেক্টের জন্য বিশাল royalty-free ট্র্যাক ও SFX লাইব্রেরি। ফ্রি ট্রায়াল শুরু করুন।",
    cta: "ফ্রি ট্রায়াল শুরু করুন →",
    bullets: [
      "YouTube/স্ট্রিমিং-এর জন্য উপযোগী",
      "বাণিজ্যিক ব্যবহারে অনুমোদিত",
      "হাজারো ট্র্যাক ও SFX",
    ],
  },
  th: {
    title: "มองหาเพลงปลอดลิขสิทธิ์อยู่ไหม?",
    body:
      "Epidemic Sound มีคลังเพลงและเอฟเฟกต์เสียงแบบ royalty-free มากมาย สำหรับ YouTube, สตรีม, พอดแคสต์ และงานเชิงพาณิชย์ ลองใช้ฟรีได้เลย",
    cta: "เริ่มทดลองใช้งานฟรี →",
    bullets: [
      "เหมาะกับ YouTube และสตรีมมิง",
      "รวมสิทธิ์ใช้งานเชิงพาณิชย์",
      "เพลงและ SFX นับพัน",
    ],
  },
  tr: {
    title: "Telif derdi olmadan müzik mi arıyorsun?",
    body:
      "Epidemic Sound, YouTube, yayınlar, podcast’ler ve ticari projeler için royalty-free müzik & efekt kütüphanesi sunar. Ücretsiz dene.",
    cta: "Ücretsiz denemeyi başlat →",
    bullets: [
      "YouTube & yayınlar için uygun",
      "Ticari kullanım dahil",
      "Binlerce parça & SFX",
    ],
  },

  // 🔥 한국어(ko) — 키워드 강화 버전
  ko: {
    // Title에 핵심 키워드 전면 배치
    title: "에피데믹 사운드 무료체험｜저작권 걱정 없는 음악 사용법 & 할인코드 안내",
    // Body에 '무료', '저작권 걱정 없는 음악', '사용법', '할인코드', '무료체험' 자연 배치
    body:
      "유튜브·스트리밍·SNS·상업 프로젝트까지 ‘저작권 걱정 없는 음악’을 쉽고 안전하게 쓰고 싶다면 에피데믹 사운드가 정답! " +
      "방송·영상에 바로 쓸 수 있는 로열티 프리 트랙과 효과음을 ‘무료체험’으로 먼저 써보고, " +
      "가입 ‘사용법’과 함께 제공되는 ‘할인코드’ 팁으로 비용까지 아껴봐.",
    cta: "에피데믹 사운드 무료체험 시작하기 →",
    bullets: [
      "저작권 걱정 없는 음악 (로열티 프리) 큰 카탈로그",
      "YouTube/스트리밍/상업용 라이선스 포함",
      "쉬운 ‘사용법’ 가이드 & 할인코드 활용 팁",
    ],
  },
};

export default function ReferralBanner({ lang = "en" }) {
  const code = (lang || "en").split("-")[0];
  const text = COPY[code] || COPY.en;

  return (
    <section
      style={{
        maxWidth: 900,
        margin: "28px auto 40px",
        padding: "22px 22px",
        borderRadius: 14,
        background:
          "linear-gradient(135deg, rgba(30,60,114,0.95), rgba(42,82,152,0.95))",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 22, fontWeight: 900 }}>
        🎵 {text.title}
      </h3>

      <p
        style={{
          margin: "6px 0 12px",
          fontSize: 16,
          lineHeight: 1.55,
          opacity: 0.95,
        }}
      >
        {text.body}
      </p>

      {Array.isArray(text.bullets) && (
        <ul
          style={{
            margin: "0 0 14px 18px",
            padding: 0,
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {text.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      <a
        href="https://www.epidemicsound.com/referral/4u2zqt"
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "12px 20px",
          background: "#ff4757",
          color: "#fff",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 900,
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
        }}
      >
        {text.cta}
      </a>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        * This is a sponsored referral link.
      </div>
    </section>
  );
}
