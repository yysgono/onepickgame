// src/components/Home.js
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import MediaRenderer from "./MediaRenderer";
import FixedCupSection from "./FixedCupCarousel";

const PAGE_SIZE = 21;

// 애드센스 클라이언트 ID
const ADSENSE_CLIENT = "ca-pub-2906270915716379";

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

  // 애드센스 자동광고 스크립트 한 번만 주입
  useEffect(() => {
    if (typeof window === "undefined") return;
    const EXISTING = document.querySelector(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"][src*="${ADSENSE_CLIENT}"]`
    );
    if (!EXISTING) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    // Auto Ads는 애드센스 관리자에서 자동광고 ON이면 자동 배치됩니다.
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

  // 에피데믹 사운드 소개 텍스트 (레퍼럴 유지)
  const referralUrl = "https://www.epidemicsound.com/referral/4u2zqt";
  const epiInfo = (() => {
    const title = "Epidemic Sound";
    const line1 =
      {
        ko: "무료 저작권 걱정 없는 음악 사용법 · 할인코드 · 무료체험",
        en: "Royalty-free music for creators: how to use, discount tips & free trial",
        ja: "クリエイター向けロイヤリティフリー音源の使い方・割引情報・無料トライアル",
        fr: "Musique libre de droits pour créateurs : mode d’emploi, réductions et essai gratuit",
        es: "Música libre de derechos para creadores: uso, descuentos y prueba gratis",
        de: "GEMA-freie Musik für Creator: Nutzung, Rabatte & Gratis-Test",
        pt: "Música livre de direitos para criadores: como usar, descontos e teste grátis",
        ru: "Музыка без отчислений для авторов: как использовать, скидки и пробный период",
        id: "Musik bebas lisensi untuk kreator: cara pakai, diskon & uji coba gratis",
        hi: "क्रिएटर्स के लिए रॉयल्टी-फ्री म्यूज़िक: उपयोग, छूट टिप्स और फ्री ट्रायल",
        vi: "Nhạc miễn phí bản quyền cho creator: cách dùng, mẹo giảm giá & dùng thử",
        zh: "面向创作者的免版税音乐：使用方法、优惠与免费试用",
        ar: "موسيقى بلا حقوق للمنشئين: كيفية الاستخدام، الخصومات، والتجربة المجانية",
        bn: "ক্রিয়েটরদের জন্য রয়্যালটি-ফ্রি মিউজিক: ব্যবহার, ডিসকাউন্ট ও ফ্রি ট্রায়াল",
        th: "เพลงไร้ลิขสิทธิ์สำหรับครีเอเตอร์: วิธีใช้ ส่วนลด & ทดลองฟรี",
        tr: "Üreticiler için telifsiz müzik: kullanım, indirimler ve ücretsiz deneme",
      }[lang] ||
      "Royalty-free music for creators: how to use, discount tips & free trial";
    const line2 =
      {
        ko: "유튜브 · 트위치 · 인스타 등에서 저작권 분쟁 없이 안전하게 사용하세요.",
        en: "Use safely on YouTube, Twitch, Instagram—no copyright strikes.",
        ja: "YouTube・Twitch・Instagramで著作권トラブルを気にせず安心して利用できます。",
        fr: "Utilisez-la en toute sécurité sur YouTube, Twitch, Instagram—sans revendications.",
        es: "Úsala con seguridad en YouTube, Twitch, Instagram—sin reclamaciones de copyright.",
        de: "Sicher nutzen auf YouTube, Twitch, Instagram—ohne Copyright-Strikes.",
        pt: "Use com segurança no YouTube, Twitch e Instagram—sem strikes de direitos autorais.",
        ru: "Безопасно для YouTube, Twitch, Instagram—без страйков по авторским правам.",
        id: "Aman dipakai di YouTube, Twitch, Instagram—tanpa klaim hak cipta.",
        hi: "YouTube, Twitch, Instagram पर सुरक्षित—कॉपीराइट स्ट्राइक की चिंता नहीं।",
        vi: "An toàn trên YouTube, Twitch, Instagram—không lo bản quyền.",
        zh: "可在 YouTube、Twitch、Instagram 安全使用——无版权警告。",
        ar: "استخدمها بأمان على YouTube وTwitch وInstagram—من دون إنذارات حقوق نشر.",
        bn: "YouTube, Twitch, Instagram-এ নিরাপদে ব্যবহার করুন—কপিরাইট স্ট্রাইক নয়।",
        th: "ปลอดภัยบน YouTube, Twitch, Instagram—ไม่โดนลิขสิทธิ์",
        tr: "YouTube, Twitch, Instagram’da güvenle kullanın—hak ihlali yok.",
      }[lang] ||
      "Use safely on YouTube, Twitch, Instagram—no copyright strikes.";
    return { title, line1, line2 };
  })();

  // 라우팅 최상단 보정
  const goto = (url) => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    navigate(url);
  };

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

      {/* (헤더 밑 제휴 배너 제거) */}

      {/* 검색/정렬 바 */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
          }}
        >
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

      {/* 카드 그리드 */}
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
                  <div
                    style={{
                      position: "absolute",
                      top: "-33%",
                      left: "-12%",
                      width: "140%",
                      height: "180%",
                      zIndex: 0,
                      background:
                        "radial-gradient(circle at 50% 60%, #2a8fff33 0%, #11264c00 90%)",
                      filter: "blur(22px) brightness(1.1)",
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
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#1c2232")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = mainDark)
                      }
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
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1c2232")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = mainDark)
                          }
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
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1c2232")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = mainDark)
                          }
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
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#1c2232")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = mainDark)
                      }
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

      {/* 🔽 하단: 에피데믹 사운드 레퍼럴 카드 (유지) */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: isMobile ? 18 : 26,
          marginBottom: isMobile ? 22 : 28,
          padding: isMobile ? "0 10px" : 0,
        }}
      >
        <div
          style={{
            width: isMobile ? 320 : 728,
            background: "linear-gradient(135deg, #14213a 10%, #1f2f57 90%)",
            border: "1.2px solid #1f3c72",
            borderRadius: 14,
            boxShadow: "0 8px 28px rgba(25,118,237,0.25)",
            padding: isMobile ? "14px 14px" : "20px 22px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          {/* 1줄 제목 */}
          <div
            style={{
              fontWeight: 900,
              fontSize: isMobile ? 18 : 22,
              letterSpacing: "-0.2px",
              marginBottom: isMobile ? 6 : 8,
            }}
          >
            {epiInfo.title}
          </div>
          {/* 2줄 본문 */}
          <div
            style={{
              fontWeight: 700,
              fontSize: isMobile ? 13 : 16,
              lineHeight: 1.35,
              opacity: 0.98,
              whiteSpace: "pre-line",
            }}
          >
            {epiInfo.line1 + "\n" + epiInfo.line2}
          </div>

          {/* CTA 버튼 */}
          <div style={{ marginTop: isMobile ? 10 : 12 }}>
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener sponsored nofollow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? "9px 14px" : "11px 18px",
                borderRadius: 10,
                background: "#1976ed",
                color: "#fff",
                fontWeight: 900,
                textDecoration: "none",
                border: "1.2px solid #5aa1ff",
                boxShadow: "0 2px 10px rgba(25,118,237,0.35)",
                fontSize: isMobile ? 14 : 16,
              }}
              aria-label="Epidemic Sound free trial referral"
            >
              {lang === "ko" ? "무료체험 / 사용법 보기" : "Free trial & how to use"}
            </a>
          </div>
        </div>
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
