// src/components/Home.js
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import MediaRenderer from "./MediaRenderer";
import FixedCupSection from "./FixedCupCarousel";
import AdSlot from "./AdSlot";

const PAGE_SIZE = 21;

const useSlideFadeIn = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.style.opacity = "0";
        ref.style.transform = "translateY(20px) scale(0.97)";
        setTimeout(() => {
          ref.style.transition =
            "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 60 + 18 * i);
      }
    });
  }, [length]);
  return refs;
};

function SkeletonCard({ cardHeight, thumbHeight }) {
  return (
    <div
      style={{
        width: "100%",
        height: cardHeight,
        background: "rgba(24,27,34,0.66)",
        border: "none",
        borderRadius: 18,
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        backdropFilter: "blur(5px)",
        boxShadow: "0 8px 28px 0 #1e254877, 0 1.5px 8px #1976ed22",
      }}
    >
      <div
        style={{
          width: "100%",
          height: thumbHeight,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
      />
    </div>
  );
}

function Home({
  worldcupList,
  fetchWorldcups,
  onSelect,
  onMakeWorldcup,
  onDelete,
  user,
  nickname,
  isAdmin,
  fixedWorldcups,
  showFixedWorldcups = true,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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
  const [sort, setSort] = useState("popular");
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [winStatsMap, setWinStatsMap] = useState({});

  useEffect(() => {
    setWinStatsMap({});
    if (Array.isArray(worldcupList) && worldcupList.length > 0) {
      worldcupList.forEach((cup) => {
        fetchWinnerStatsFromDB(cup.id).then((statsArr) => {
          setWinStatsMap((prev) => ({
            ...prev,
            [cup.id]: statsArr,
          }));
        });
      });
    }
  }, [worldcupList]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 600;
  const CARD_WIDTH = isMobile ? 320 : 420;
  const CARD_HEIGHT = isMobile ? 325 : 350;
  const CARD_GAP = isMobile ? 7 : 13;
  const SKELETON_COUNT = isMobile ? 3 : 6;
  const THUMB_HEIGHT = isMobile ? 148 : 168 * 1.05;

  const [fixedCupsWithStats, setFixedCupsWithStats] = useState([]);
  useEffect(() => {
    let mounted = true;
    async function fillFixedStats() {
      if (!fixedWorldcups || !fixedWorldcups.length) {
        setFixedCupsWithStats([]);
        return;
      }
      const list = await Promise.all(
        fixedWorldcups.map(async (cup) => {
          if (Array.isArray(cup.winStats) && cup.winStats.length > 0) return cup;
          const statsArr = await fetchWinnerStatsFromDB(cup.id);
          return { ...cup, winStats: statsArr };
        })
      );
      if (mounted) setFixedCupsWithStats(list);
    }
    fillFixedStats();
    return () => {
      mounted = false;
    };
  }, [fixedWorldcups]);

  const filtered = Array.isArray(worldcupList)
    ? (worldcupList || [])
        .filter(
          (cup) =>
            (cup.title || "").toLowerCase().includes(search.toLowerCase()) ||
            ((cup.description || cup.desc || "") || "")
              .toLowerCase()
              .includes(search.toLowerCase())
        )
        .sort((a, b) => {
          if (sort === "recent") {
            return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
          } else {
            const aw =
              winStatsMap[a.id]?.reduce(
                (sum, row) => sum + (row.win_count || 0),
                0
              ) || 0;
            const bw =
              winStatsMap[b.id]?.reduce(
                (sum, row) => sum + (row.win_count || 0),
                0
              ) || 0;
            return bw - aw;
          }
        })
    : [];

  const visibleList = filtered.slice(0, visibleCount);
  const cardRefs = useSlideFadeIn(visibleList.length);

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

  const mainDark = "#171C27";
  const buttonStyle = {
    background: mainDark,
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 8,
    fontSize: isMobile ? 13 : 14,
    padding: isMobile ? "5px 12px" : "7px 17px",
    outline: "none",
    cursor: "pointer",
    letterSpacing: "0.5px",
    fontFamily: "'Orbitron', 'Pretendard', sans-serif",
    margin: "0 2px",
    boxShadow: "none",
    transition: "background 0.15s",
    marginTop: 0,
    marginBottom: 0,
    display: "inline-block",
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: isMobile ? "4px 7px" : "6px 10px",
    fontSize: isMobile ? 12 : 13,
  };

  const sortButton = (label, value) => (
    <button
      type="button"
      style={{
        background: sort === value ? "#1976ed" : "#222c3d",
        color: "#fff",
        fontWeight: 800,
        border: "none",
        borderRadius: 7,
        fontSize: isMobile ? 13 : 14,
        padding: isMobile ? "6px 14px" : "7px 18px",
        marginRight: 6,
        marginLeft: 0,
        cursor: "pointer",
        boxShadow: sort === value ? "0 2px 14px #1976ed55" : "none",
        outline: sort === value ? "2px solid #22c1ff99" : "none",
        transition: "background .15s, box-shadow .13s",
      }}
      onClick={() => setSort(value)}
    >
      {label}
    </button>
  );

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  // 언어코드
  const lang = (i18n.language || "en").split("-")[0];
  const getRoute = (base, cupId) => `/${lang}${base}/${cupId}`;

  // 카드 설명 스타일
  const cardDescStyle = {
    color: "#b9dafb",
    fontSize: isMobile ? 14 : 16,
    lineHeight: 1.33,
    textAlign: "center",
    padding: isMobile ? "4px 10px 0 10px" : "8px 18px 0 18px",
    minHeight: isMobile ? 24 : 33,
    maxHeight: isMobile ? 36 : 42,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "keep-all",
    margin: 0,
    marginBottom: 3,
    background: "none",
  };

  // 카드 하단 바
  const cardBottomBarStyle = {
    width: "100%",
    height: 4,
    background: "linear-gradient(90deg, #1976ed 45%, #25e5fd 100%)",
    borderRadius: "0 0 18px 18px",
    margin: 0,
    marginTop: "auto",
    boxShadow: "0 2px 10px #1976ed44",
  };

  // 한국 여부 → 한국: 쿠팡 / 그 외: 아마존
  const isKR =
    (i18n.language || "en").startsWith("ko") ||
    (typeof window !== "undefined" && window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  // 쿠팡 배너(캐러셀) HTML
  const makeCoupangHtml = (w, h) =>
    `<script src="https://ads-partners.coupang.com/g.js"></script><script>
      try { new PartnersCoupang.G({"id":"920431","template":"carousel","trackingCode":"AF6207831","width":"${w}","height":"${h}","tsource":""}); } catch(e){}
    </script>`;

  // 아마존 상단 배너: Xbox Series X (네가 준 링크 사용)
  const amazonUrl = "https://amzn.to/4peMZCt";
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

  // 라우팅 최상단 보정
  const goto = (url) => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    navigate(url);
  };

  // 에피데믹 사운드(하단 배너) 텍스트
  const referralUrl = "https://www.epidemicsound.com/referral/4u2zqt";
  const referralCopyByLang = {
    ko: "에피데믹 사운드 — 무료 저작권 걱정 없는 음악 사용법 · 할인코드 · 무료체험",
    en: "Epidemic Sound — royalty-free music for creators: how to use, discount tips & free trial",
    ja: "Epidemic Sound — ロイヤリティフリー音源。使い方・割引情報・無料トライアル",
    fr: "Epidemic Sound — Musique libre de droits : mode d’emploi, réductions et essai gratuit",
    es: "Epidemic Sound — Música libre de derechos: cómo usar, descuentos y prueba gratis",
    de: "Epidemic Sound — GEMA-freie Musik: Nutzung, Rabatte & Gratis-Test",
    pt: "Epidemic Sound — Música livre de direitos: como usar, descontos e teste grátis",
    ru: "Epidemic Sound — музыка без авторских отчислений: как пользоваться, скидки и пробный период",
    id: "Epidemic Sound — Musik bebas lisensi: cara gunakan, diskon & uji coba gratis",
    hi: "Epidemic Sound — रॉयल्टी-फ्री म्यूज़िक: उपयोग तरीका, डिस्काउंट और फ्री ट्रायल",
    vi: "Epidemic Sound — Nhạc miễn phí bản quyền: cách dùng, mẹo giảm giá & dùng thử",
    zh: "Epidemic Sound — 免版税音乐：使用方法、优惠信息与免费试用",
    ar: "Epidemic Sound — موسيقى بدون حقوق: طريقة الاستخدام والخصومات والتجربة المجانية",
    bn: "Epidemic Sound — রয়্যালটি-ফ্রি মিউজিক: ব্যবহার পদ্ধতি, ডিসকাউন্ট ও ফ্রি ট্রায়াল",
    th: "Epidemic Sound — เพลงไร้กังวลลิขสิทธิ์: วิธีใช้, ส่วนลด & ทดลองฟรี",
    tr: "Epidemic Sound — telifsiz müzik: kullanım, indirimler ve ücretsiz deneme",
  };
  const referralCopy = referralCopyByLang[lang] || referralCopyByLang.en;

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: `url('/83243377_1669883362558_1_600x600.avif') center center / cover no-repeat fixed`,
        position: "relative",
      }}
    >
      {showFixedWorldcups !== false && (
        <FixedCupSection worldcupList={fixedCupsWithStats || []} />
      )}

      {/* 헤더 바로 밑 배너: 한국=쿠팡 / 그 외=아마존(텍스트 배너) */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: isMobile ? 320 : 728,
            height: isMobile ? 100 : 90,
            marginTop: isMobile ? 8 : 14,
            marginBottom: 12,
          }}
        >
          {typeof window !== "undefined" &&
            (provider === "coupang" ? (
              <AdSlot
                id="ad-home-header"
                provider="coupang"
                width={isMobile ? 320 : 728}
                height={isMobile ? 100 : 90}
                html={makeCoupangHtml(isMobile ? 320 : 728, isMobile ? 100 : 90)}
              />
            ) : (
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener sponsored nofollow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                  textDecoration: "none",
                  background:
                    "linear-gradient(90deg,#0f1626 0%,#22375f 50%,#0f1626 100%)",
                  boxShadow: "0 8px 28px rgba(25,118,237,0.25)",
                  border: "1.2px solid #1f3c72",
                  overflow: "hidden",
                }}
                aria-label="Amazon affiliate: Xbox Series X"
              >
                <div
                  style={{
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: isMobile ? 14 : 18,
                    letterSpacing: isMobile ? 0 : ".2px",
                    textShadow: "0 1px 8px #0008",
                    padding: isMobile ? "0 12px" : "0 18px",
                    lineHeight: 1.25,
                    textAlign: "center",
                  }}
                >
                  {amazonCopy}
                </div>
              </a>
            ))}
        </div>
      </div>

      {/* 검색/정렬 */}
      <div
        style={{
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: isMobile ? 10 : 20,
          margin: isMobile ? "12px 0 8px" : "22px 0 14px",
          padding: isMobile ? "0 8px" : "0 12px",
          flexDirection: isMobile ? "column" : "row",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {sortButton(t("popular"), "popular")}
          {sortButton(t("latest"), "recent")}
        </div>
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "#fff",
            color: "#1b2236",
            border: "2px solid #fff",
            borderRadius: 8,
            padding: isMobile ? "9px 13px" : "13px 20px",
            fontSize: isMobile ? 16 : 17,
            minWidth: isMobile ? 0 : 220,
            maxWidth: 400,
            outline: "none",
            fontWeight: 700,
            boxShadow: "0 2px 12px #fff5",
            transition: "border .14s, box-shadow .14s",
            letterSpacing: ".1px",
          }}
        />
      </div>

      {/* 카드 리스트 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_WIDTH}px, 1fr))`,
          gap: CARD_GAP,
          width: "100vw",
          maxWidth: "100vw",
          margin: "0 auto",
          padding: 0,
          boxSizing: "border-box",
          justifyItems: "center",
          alignItems: "start",
          zIndex: 2,
        }}
      >
        {visibleList.length > 0 &&
          visibleList.map((cup, idx) => {
            const winStats = winStatsMap[cup.id] || [];
            const [first, second] = getTop2Winners(winStats, cup.data);

            return (
              <React.Fragment key={cup.id}>
                <div
                  ref={(el) => (cardRefs.current[idx] = el)}
                  style={{
                    width: "100%",
                    height: CARD_HEIGHT,
                    borderRadius: 18,
                    background: "rgba(17,27,55,0.77)",
                    boxShadow: "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44",
                    border: "1.5px solid #233a74",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.18s, transform 0.16s",
                    marginBottom: 0,
                    cursor: "pointer",
                    backdropFilter: "blur(13px) brightness(1.04)",
                    WebkitBackdropFilter: "blur(13px) brightness(1.04)",
                    willChange: "transform",
                    maxWidth: CARD_WIDTH,
                    minWidth: CARD_WIDTH,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-7px) scale(1.025)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 50px 0 #1976ed88, 0 2.5px 16px #4abfff77";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow =
                      "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44";
                  }}
                  onClick={() => {
                    goto(getRoute("/select-round", cup.id));
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    style={{
                      width: "100%",
                      height: THUMB_HEIGHT,
                      display: "flex",
                      flexDirection: "row",
                      background:
                        "linear-gradient(90deg, #162d52 0%, #284176 100%)",
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
                        background: "#192145",
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
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center center",
                            background: "#111",
                          }}
                        />
                      ) : (
                        <div
                          style={{ width: "100%", height: "100%", background: "#222" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        background: "#1f2540",
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
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center center",
                            background: "#111",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "#15182b",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-55%)",
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
                      maxWidth: "100%",
                      minHeight: isMobile ? 32 : 38,
                      maxHeight: isMobile ? 90 : 105,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      padding: isMobile ? "4px 10px 0 10px" : "6px 18px 0 18px",
                      fontWeight: 900,
                      fontSize: isMobile ? 17 : 20,
                      color: "#fff",
                      fontFamily: "'Orbitron', 'Pretendard', sans-serif",
                      textAlign: "center",
                      wordBreak: "break-all",
                      lineHeight: 1.17,
                      letterSpacing: "0.4px",
                      boxSizing: "border-box",
                      background: mainDark,
                      margin: 0,
                      marginBottom: 0,
                      whiteSpace: "normal",
                      textShadow: "0 1.5px 8px #191b25cc",
                    }}
                    title={cup.title}
                  >
                    <span
                      style={{
                        width: "100%",
                        display: "block",
                        textAlign: "center",
                        lineHeight: 1.18,
                        margin: 0,
                        padding: 0,
                        whiteSpace: "pre-line",
                        wordBreak: "keep-all",
                        fontFamily: "'Orbitron', 'Pretendard', sans-serif",
                        fontWeight: 900,
                      }}
                    >
                      {(() => {
                        const title = (cup.title || "").slice(0, 70);
                        if (title.length <= 40) return title;
                        const breakpoint = (() => {
                          const i = title.lastIndexOf(" ", 40);
                          return i === -1 ? 40 : i;
                        })();
                        return (
                          title.slice(0, breakpoint) +
                          "\n" +
                          title.slice(breakpoint + 1)
                        );
                      })()}
                    </span>
                  </div>

                  {/* 설명 */}
                  <div style={cardDescStyle}>
                    {cup.description || cup.desc || ""}
                  </div>

                  {/* 버튼/액션영역 */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile ? "3px 8px 6px 8px" : "6px 16px 7px 16px",
                      minHeight: isMobile ? 23 : 27,
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
                        goto(getRoute("/select-round", cup.id));
                      }}
                      style={buttonStyle}
                    >
                      {t("start")}
                    </button>

                    {isMine(cup) ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goto(getRoute("/edit-worldcup", cup.id));
                          }}
                          style={smallButtonStyle}
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !window.confirm(
                                t("delete_confirm") ||
                                  "Are you sure you want to delete?"
                              )
                            )
                              return;
                            if (onDelete) onDelete(cup.id);
                            else window.location.reload();
                          }}
                          style={smallButtonStyle}
                        >
                          {t("delete")}
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: isMobile ? 29 : 40 }} />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goto(getRoute("/stats", cup.id));
                      }}
                      style={buttonStyle}
                    >
                      {t("stats_comment")}
                    </button>
                  </div>

                  {/* 맨 하단 파란 밑줄 */}
                  <div style={cardBottomBarStyle}></div>
                </div>
              </React.Fragment>
            );
          })}

        {visibleList.length === 0 &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard
              key={i}
              cardHeight={CARD_HEIGHT}
              thumbHeight={THUMB_HEIGHT}
            />
          ))}
      </div>

      {/* 하단: 에피데믹 사운드 래퍼럴 (브랜드 1줄 + 설명 2줄) */}
      <div style={{ textAlign: "center", margin: "32px 0 20px 0" }}>
        <a
          href={referralUrl}
          target="_blank"
          rel="noopener sponsored nofollow"
          style={{ textDecoration: "none" }}
          aria-label="Epidemic Sound referral"
        >
          <div
            style={{
              display: "inline-block",
              maxWidth: 920,
              width: "calc(100vw - 40px)",
              padding: "18px 22px",
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(21,30,50,.9) 0%, rgba(21,30,50,.88) 100%)",
              boxShadow:
                "0 10px 28px rgba(25,118,237,.25), 0 2px 10px rgba(25,118,237,.18)",
              border: "1px solid #2a3f74",
              color: "#fff",
              textAlign: "center",
            }}
          >
            {(() => {
              const full = referralCopy;
              const parts = full.split("—"); // em-dash 기준 분리
              const brand = (parts[0] || full).trim();
              const rest = parts.slice(1).join("—").trim();

              return (
                <div style={{ lineHeight: 1.25 }}>
                  {/* 1줄: 브랜드 */}
                  <span
                    style={{
                      display: "block",
                      fontWeight: 900,
                      fontFamily: "'Orbitron','Pretendard',sans-serif",
                      fontSize: 18,
                      marginBottom: 6,
                      letterSpacing: ".2px",
                    }}
                  >
                    {brand}
                  </span>

                  {/* 2줄: 설명 (최대 2줄 말줄임) */}
                  {rest && (
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#e6f0ff",
                        lineHeight: 1.35,
                        wordBreak: "keep-all",
                        whiteSpace: "normal",
                      }}
                    >
                      {rest}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </a>
      </div>

      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", margin: "18px 0 60px 0" }}>
          <button
            style={{
              padding: "13px 44px",
              background: "#1976ed",
              color: "#fff",
              fontWeight: 900,
              borderRadius: 10,
              border: "none",
              fontSize: 17,
              boxShadow: "0 2px 12px #1976ed33",
              cursor: "pointer",
              letterSpacing: "0.4px",
            }}
            onClick={handleLoadMore}
          >
            {t("load_more")}
          </button>
        </div>
      )}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
          button:focus, button:active {
            outline: none !important;
            box-shadow: none !important;
          }
        `}
      </style>
    </div>
  );
}

export default Home;
