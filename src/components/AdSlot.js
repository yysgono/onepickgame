// src/components/AdSlot.js
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * 통합 광고/어필리에이트 슬롯
 * props:
 *  - id: DOM id (광고차단 피하려면 'ad-' 같은 접두어 금지)
 *  - provider: 'coupang' | 'amazon' | 'none'
 *  - width, height: 숫자(px)
 *  - html: (선택) 쿠팡 코드 문자열 (width/height만 반영되어도 됨)
 *  - style: 래퍼 스타일
 *  - mobile: 강제 모바일 폰트/레이아웃 적용 여부
 */
export default function AdSlot({
  id,
  provider = "none",
  width = 300,
  height = 250,
  html,
  style = {},
  mobile = false,
}) {
  const containerRef = useRef(null);
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];

  // -------- 공통 스타일 --------
  const wrapperStyle = {
    width,
    height,
    overflow: "hidden",
    ...style,
  };

  // -------- 쿠팡: 스크립트 로더 + 코드 주입 --------
  const loadCoupangLib = () => {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.PartnersCoupang) return Promise.resolve();
    if (window.__coupangLoader) return window.__coupangLoader;

    window.__coupangLoader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://ads-partners.coupang.com/g.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
    return window.__coupangLoader;
  };

  const renderCoupang = async () => {
    try {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      // 라이브러리 로드
      await loadCoupangLib();

      // html 우선, 없으면 기본 템플릿
      const code =
        html ||
        `<script>
          try {
            new PartnersCoupang.G({
              "id":"920431",
              "template":"carousel",
              "trackingCode":"AF6207831",
              "width":"${width}",
              "height":"${height}",
              "tsource":""
            });
          } catch(e){}
        </script>`;

      // g.js 태그가 없으면 추가
      const hasLib = [...document.scripts].some((s) =>
        (s.src || "").includes("ads-partners.coupang.com/g.js")
      );
      if (!hasLib) {
        const lib = document.createElement("script");
        lib.src = "https://ads-partners.coupang.com/g.js";
        lib.async = true;
        document.head.appendChild(lib);
      }

      // 인라인 스크립트 주입
      const holder = document.createElement("div");
      const inline = document.createElement("script");
      inline.type = "text/javascript";
      inline.innerHTML = code;
      holder.appendChild(inline);
      containerRef.current.appendChild(holder);
    } catch (e) {
      // 실패 시 플레이스홀더
      renderPlaceholder("Coupang");
      console.warn("Coupang render failed", e);
    }
  };

  // -------- 아마존: 텍스트 배너(앵커) 렌더 --------
  const amazonUrl = "https://amzn.to/4peMZCt"; // Xbox Series X
  const amazonCopyByLang = {
    en: "Xbox Series X — 4K gaming, ultra-fast load times, next-gen performance. Check today’s price →",
    ja: "Xbox Series X — 4Kゲーム、超高速ロード、次世代パフォーマンス。今すぐ価格をチェック →",
    fr: "Xbox Series X — Jeux 4K, chargements ultra-rapides, performances nouvelle génération. Voir le prix →",
    es: "Xbox Series X — Juegos en 4K, cargas ultrarrápidas, rendimiento next-gen. Ver precio →",
    de: "Xbox Series X — 4K-Gaming, ultraschnelle Ladezeiten, Next-Gen-Leistung. Preis ansehen →",
    pt: "Xbox Series X — Jogos em 4K, carregamentos ultra-rápidos, performance next-gen. Ver preço →",
    ru: "Xbox Series X — 4K-игры, сверхбыстрая загрузка, производительность нового поколения. Цена →",
    id: "Xbox Series X — Gaming 4K, loading super cepat, performa next-gen. Cek harga →",
    hi: "Xbox Series X — 4K गेमिंग, बेहद तेज़ लोड, नेक्स्ट-जेन परफ़ॉर्मेंस. कीमत देखें →",
    vi: "Xbox Series X — Chơi game 4K, tải siêu nhanh, hiệu năng next-gen. Xem giá →",
    zh: "Xbox Series X — 4K 游戏、超快载入、次世代性能。查看价格 →",
    ar: "Xbox Series X — ألعاب 4K، تحميل فائق السرعة، أداء من الجيل التالي. اطّلع على السعر →",
    bn: "Xbox Series X — 4K গেমিং, সুপার ফাস্ট লোড, নেক্সট-জেন পারফরম্যান্স। দাম দেখুন →",
    th: "Xbox Series X — เกม 4K โหลดไว ประสิทธิภาพยุคใหม่ ดูราคา →",
    tr: "Xbox Series X — 4K oyun, çok hızlı yükleme, yeni nesil performans. Fiyatı gör →",
  };
  const amazonCopy = amazonCopyByLang[lang] || amazonCopyByLang.en;

  const renderAmazonText = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const a = document.createElement("a");
    a.href = amazonUrl;
    a.target = "_blank";
    a.rel = "noopener sponsored nofollow";
    Object.assign(a.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      borderRadius: "12px",
      textDecoration: "none",
      background:
        "linear-gradient(90deg,#0f1626 0%,#22375f 50%,#0f1626 100%)",
      boxShadow: "0 8px 28px rgba(25,118,237,0.25)",
      border: "1.2px solid #1f3c72",
      overflow: "hidden",
    });

    const text = document.createElement("div");
    text.textContent = amazonCopy;
    Object.assign(text.style, {
      color: "#fff",
      fontWeight: 900,
      fontSize: `${mobile ? 14 : 18}px`,
      letterSpacing: mobile ? "0" : ".2px",
      textShadow: "0 1px 8px #0008",
      padding: mobile ? "0 12px" : "0 18px",
      lineHeight: 1.25,
      textAlign: "center",
    });

    a.appendChild(text);
    containerRef.current.appendChild(a);
  };

  // -------- 플레이스홀더 --------
  const renderPlaceholder = (label = "Ad") => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const ph = document.createElement("div");
    Object.assign(ph.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1626",
      border: "1px dashed #1f3c72",
      borderRadius: "12px",
      color: "#6c86c9",
      fontWeight: 700,
    });
    ph.textContent = label;
    containerRef.current.appendChild(ph);
  };

  // -------- 마운트/변경 시 렌더 --------
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (provider === "coupang") {
      renderCoupang();
    } else if (provider === "amazon") {
      renderAmazonText();
    } else {
      renderPlaceholder();
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [provider, width, height, html, lang, mobile]);

  // 광고 차단 회피: id 기본값을 'slot-...'로
  const safeId = id || `slot-${Math.random().toString(36).slice(2, 8)}`;

  return <div id={safeId} ref={containerRef} style={wrapperStyle} />;
}
