// src/components/SelectRoundPage.js
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import MediaRenderer from "./MediaRenderer";
import AdsenseSide from "./AdsenseSide";
import { fetchWinnerStatsFromDB, pushRecentWorldcup } from "../utils.js"; // ✅ 통계/최근본

const SEO_SUFFIX = {
  ko: "이상형 월드컵",
  en: "Ultimate Bracket",
  ja: "究極の二択トーナメント",
  zh: "终极二选一",
  es: "Torneo de Elección",
  fr: "Tournoi de Choix",
  de: "Entscheidungs-Turnier",
  pt: "Torneio de Escolhas",
  ru: "Турнир выбора",
  ar: "بطولة الاختيار",
  th: "ทัวร์นาเมนต์ตัวเลือก",
  tr: "Seçim Turnuvası",
  vi: "Giải đấu lựa chọn",
  id: "Turnamen Pilihan",
  hi: "चयन टूर्नामेंट",
  bn: "পছন্দের টুর্নামেন্ট",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setIsMobile(window.innerWidth < 700);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

function useViewportWidth() {
  const [vw, setVw] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setVw(window.innerWidth);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vw;
}

// ✅ 통계 기반 1,2등 계산 (없으면 candidates 앞 2개)
function pickTop2(cup, candidates, winStats) {
  const data = Array.isArray(candidates) ? candidates : [];
  const stats = Array.isArray(winStats) ? winStats : [];

  if (!stats.length) {
    return [data?.[0] || null, data?.[1] || null];
  }

  const sorted = [...stats]
    .map((row, i) => ({
      ...row,
      _i: i,
    }))
    .sort((a, b) => {
      if ((b.win_count || 0) !== (a.win_count || 0)) {
        return (b.win_count || 0) - (a.win_count || 0);
      }

      if ((b.match_wins || 0) !== (a.match_wins || 0)) {
        return (b.match_wins || 0) - (a.match_wins || 0);
      }

      return a._i - b._i;
    });

  const byId = (id) =>
    data.find((c) => c.id === id) || null;

  const first =
    byId(sorted[0]?.candidate_id) ||
    data?.[0] ||
    null;

  const second =
    byId(sorted[1]?.candidate_id) ||
    data?.[1] ||
    null;

  return [first, second];
}

export default function SelectRoundPage({
  cup,
  maxRound,
  candidates,
  onSelect,
}) {
  const { t, i18n } = useTranslation();

  const [selectedRound, setSelectedRound] =
    useState(maxRound);

  const [winStats, setWinStats] =
    useState([]);

  const isMobile = useIsMobile();

  const vw = useViewportWidth();

  const isWideForSideAds = vw >= 1300;

  const navigate = useNavigate();

  const { lang: langParam } = useParams();

  // ✅ 통계 가져오기
  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        if (cup?.id) {
          const statsArr =
            await fetchWinnerStatsFromDB(cup.id);

          if (mounted) {
            setWinStats(
              Array.isArray(statsArr)
                ? statsArr
                : []
            );
          }
        } else {
          setWinStats([]);
        }
      } catch {
        if (mounted) {
          setWinStats([]);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [cup?.id]);

  // ✅ 이 페이지로 바로 들어와도 최근본 기록
  useEffect(() => {
    if (cup?.id) {
      pushRecentWorldcup(cup.id);
    }
  }, [cup?.id]);

  // ======================================================
  // 현재 언어
  // ======================================================

  let lang =
    langParam ||
    (i18n.language || "en").split("-")[0] ||
    "en";

  const normalizedLang =
    String(lang || "en")
      .toLowerCase()
      .split("-")[0];

  // ======================================================
  // 언어별 제목
  // ======================================================

  const translatedTitle =
    cup?.title_translations?.[
      normalizedLang
    ] ||
    cup?.title_translations?.en ||
    cup?.title ||
    "";

  // ======================================================
  // 언어별 설명
  // ======================================================

  const translatedDescription =
    cup?.description_translations?.[
      normalizedLang
    ] ||
    cup?.description_translations?.en ||
    cup?.description ||
    cup?.desc ||
    "";

  // ======================================================
  // ✅ 개별 월드컵 다국어 SEO
  // ======================================================

  useEffect(() => {
    if (
      !cup?.id ||
      !translatedTitle ||
      typeof document === "undefined"
    ) {
      return;
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.onepickgame.com";

    const pageUrl =
      `${origin}/${normalizedLang}/select-round/${cup.id}`;

    const suffix =
      SEO_SUFFIX[normalizedLang] ||
      SEO_SUFFIX.en;

    const seoTitle =
      `${translatedTitle} | ${suffix} - OnePickGame`;

    const seoDescription =
      translatedDescription ||
      `${translatedTitle} - OnePickGame`;

    // TITLE
    document.title = seoTitle;

    // 메타 태그 생성/수정 함수
    const setMeta = (
      selector,
      attrs
    ) => {
      let el =
        document.querySelector(
          selector
        );

      if (!el) {
        el =
          document.createElement(
            "meta"
          );

        Object.entries(
          attrs
        ).forEach(
          ([key, value]) => {
            if (
              key !== "content"
            ) {
              el.setAttribute(
                key,
                value
              );
            }
          }
        );

        document.head.appendChild(
          el
        );
      }

      el.setAttribute(
        "content",
        attrs.content
      );
    };

    // DESCRIPTION
    setMeta(
      'meta[name="description"]',
      {
        name: "description",
        content:
          seoDescription.slice(
            0,
            160
          ),
      }
    );

    // OG TITLE
    setMeta(
      'meta[property="og:title"]',
      {
        property: "og:title",
        content: seoTitle,
      }
    );

    // OG DESCRIPTION
    setMeta(
      'meta[property="og:description"]',
      {
        property:
          "og:description",

        content:
          seoDescription.slice(
            0,
            160
          ),
      }
    );

    // OG URL
    setMeta(
      'meta[property="og:url"]',
      {
        property: "og:url",
        content: pageUrl,
      }
    );

    // TWITTER TITLE
    setMeta(
      'meta[name="twitter:title"]',
      {
        name:
          "twitter:title",

        content:
          seoTitle,
      }
    );

    // TWITTER DESCRIPTION
    setMeta(
      'meta[name="twitter:description"]',
      {
        name:
          "twitter:description",

        content:
          seoDescription.slice(
            0,
            160
          ),
      }
    );

    // CANONICAL
    let canonical =
      document.querySelector(
        'link[rel="canonical"]'
      );

    if (!canonical) {
      canonical =
        document.createElement(
          "link"
        );

      canonical.setAttribute(
        "rel",
        "canonical"
      );

      document.head.appendChild(
        canonical
      );
    }

    canonical.setAttribute(
      "href",
      pageUrl
    );
  }, [
    cup?.id,
    translatedTitle,
    translatedDescription,
    normalizedLang,
  ]);

  // ======================================================
  // 라운드 후보군 계산
  // ======================================================

  const possibleRounds =
    useMemo(() => {
      const count =
        candidates.length;

      const maxPossibleRound =
        Math.min(
          count,
          10000
        );

      let arr = [];

      for (
        let n = 1;
        Math.pow(2, n) <=
        maxPossibleRound;
        n++
      ) {
        arr.push(
          Math.pow(2, n)
        );
      }

      if (
        count >= 2 &&
        count <= 10000 &&
        !arr.includes(count)
      ) {
        arr.push(count);
      }

      return arr.sort(
        (a, b) => a - b
      );
    }, [candidates.length]);

  // 선택 라운드 보정
  useEffect(() => {
    const fallback =
      possibleRounds[
        possibleRounds.length -
          1
      ] || 2;

    setSelectedRound(
      (prev) =>
        possibleRounds.includes(
          prev
        )
          ? prev
          : fallback
    );
  }, [possibleRounds]);

  const hasBye =
    candidates.length <
    selectedRound;

  // ======================================================
  // 버튼 스타일
  // ======================================================

  const mainBtn = {
    background:
      "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",

    color: "#fff",

    fontWeight: 900,

    border: "none",

    borderRadius: 11,

    fontSize:
      isMobile ? 17 : 19,

    padding:
      isMobile
        ? "10px 22px"
        : "13px 35px",

    minWidth:
      isMobile ? 87 : 115,

    cursor: "pointer",

    boxShadow:
      "0 1px 11px #1976ed22",

    marginLeft: 4,

    marginRight: 4,

    outline: "none",

    height:
      isMobile ? 48 : 60,

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",
  };
    const selectBtnStyle = {
    fontSize: isMobile ? 19 : 25,
    padding: isMobile ? "10px 17px" : "12px 33px",
    borderRadius: isMobile ? 9 : 12,
    minWidth: isMobile ? 85 : 130,
    fontWeight: 900,
    background: "#16213a",
    color: "#fff",
    border: "2px solid #1976ed",
    height: isMobile ? 48 : 60,
    textAlign: "left",
    boxSizing: "border-box",
    margin: "0 auto",
    display: "block",
    cursor: "pointer",
    direction: "ltr",
  };

  const selectArrowStyle = {
    position: "absolute",
    right: isMobile ? 16 : 25,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#fff",
    fontSize: isMobile ? 19 : 26,
    zIndex: 1,
  };

  const candidateCountText = {
    fontSize: isMobile ? 15 : 19,
    fontWeight: 800,
    color: "#fff",
    background: "#243152",
    borderRadius: 8,
    padding: isMobile ? "6px 16px" : "8px 26px",
    marginLeft: isMobile ? 0 : 8,
    height: isMobile ? 48 : 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.07em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    border: "1.5px solid #1976ed33",
  };

  const resultBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    right: isMobile ? 11 : 26,
    zIndex: 20,
    background: "linear-gradient(90deg, #13e67e 80%, #23d6a0 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 15 : 17,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 1px 11px #23e6ad22",
    outline: "none",
    height: isMobile ? 38 : 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // ======================================================
  // 공유 버튼 스타일
  // ======================================================

  const shareBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    left: isMobile ? 11 : 26,
    zIndex: 20,
    background: "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 15 : 17,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 1px 11px #1976ed22",
    outline: "none",
    height: isMobile ? 38 : 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // ======================================================
  // 공유 URL
  // ======================================================

  const shareUrl =
    cup?.id &&
    typeof window !== "undefined"
      ? `${window.location.origin}/${normalizedLang}/select-round/${cup.id}`
      : "";

  function handleShare() {
    if (
      typeof navigator?.clipboard?.writeText === "function" &&
      shareUrl
    ) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() =>
          window?.toast?.success
            ? window.toast.success(t("share_link_copied"))
            : alert(t("share_link_copied"))
        )
        .catch(() => alert(shareUrl));
    } else if (shareUrl) {
      alert(shareUrl);
    }
  }

  // ======================================================
  // 결과 페이지
  // ======================================================

  function handleShowStats() {
    if (cup?.id && normalizedLang) {
      navigate(`/${normalizedLang}/stats/${cup.id}`);
    }
  }

  // ======================================================
  // 게임 시작
  // ======================================================

  function handleStart(round) {
    if (cup?.id) {
      pushRecentWorldcup(cup.id);
    }

    if (onSelect) {
      onSelect(round);
    } else if (cup?.id && normalizedLang) {
      navigate(
        `/${normalizedLang}/match/${cup.id}/${round}`
      );
    }
  }

  // ======================================================
  // 후보 이름만 unique
  // ======================================================

  const uniqueNames = Array.from(
    new Set(
      (candidates || []).map(
        (c) => c.name || c.title || c
      )
    )
  );

  // ======================================================
  // 버튼과 썸네일 겹침 방지용 여백
  // ======================================================

  const topSpacerH = isMobile ? 20 : 25;
  const thumbH = isMobile ? 150 : 190;

  // ======================================================
  // 1등 / 2등 결정
  // ======================================================

const [first, second] = pickTop2(
  cup,
  candidates,
  winStats
);

const totalPlays = winStats.reduce(
  (sum, row) => sum + (row.win_count || 0),
  0
);


  return (
    <div
      style={{
        width: "100%",
        position: "relative",
      }}
    >
      {/* 가운데 콘텐츠 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* 왼쪽 사이드 광고 */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 160,
              marginRight: 20,
            }}
          >
            <AdsenseSide />
          </div>
        )}

        {/* 메인 컨텐츠 패널 */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            padding: isMobile ? 12 : 38,
            paddingTop:
              (isMobile ? 12 : 38) +
              topSpacerH,
            width: "100%",
            maxWidth: isMobile
              ? "100%"
              : 880,
            background:
              "rgba(20, 24, 37, 0.95)",
            borderRadius:
              isMobile ? 0 : 23,
            boxShadow:
              isMobile
                ? "none"
                : "0 4px 44px #171c2747",
            minHeight:
              isMobile ? 520 : 580,
          }}
        >
          {/* 왼쪽 상단 공유 버튼 */}
          {cup && (
            <button
              style={shareBtn}
              onClick={handleShare}
              aria-label={t("share_worldcup")}
            >
              {t("share_worldcup")}
            </button>
          )}

          {/* 상단 START NOW 버튼 */}
          <button
            onClick={() =>
              handleStart(selectedRound)
            }
            style={{
              display: "block",
              margin: "15px auto",
              padding: isMobile
                ? "10px 22px"
                : "16px 48px",
              fontSize: isMobile
                ? 14
                : 20,
              fontWeight: "900",
              borderRadius: 14,
              border: "none",
              background:
                "linear-gradient(135deg, #00c6ff, #0072ff)",
              color: "#fff",
              cursor: "pointer",
              boxShadow:
                "0 6px 20px rgba(0, 114, 255, 0.5)",
            }}
          >
            🚀 START NOW
          </button>

          {/* 오른쪽 상단 결과 보기 */}
          <button
            style={resultBtn}
            onClick={handleShowStats}
            aria-label={t("show_result")}
          >
            {t("show_result")}
          </button>

          {/* 상단 간단 라운드 선택 */}
          <div
            style={{
              textAlign: "center",
              marginTop: 12,
            }}
          >
            <select
              value={selectedRound}
              onChange={(e) =>
                setSelectedRound(
                  Number(e.target.value)
                )
              }
              style={{
                padding: "10px 20px",
                fontSize: 15,
                borderRadius: 10,
                border:
                  "2px solid #1976ed",
                background: "#16213a",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {possibleRounds.map((r) => (
                <option
                  key={r}
                  value={r}
                >
                  Round of {r}
                </option>
              ))}
            </select>
          </div>

          {cup && (
            <>
              {/* 제목 위 썸네일 */}
              <div
                style={{
                  width: "100%",
                  maxWidth: isMobile
                    ? "98vw"
                    : 710,
                  height: thumbH,
                  margin: isMobile
                    ? "4px auto 12px"
                    : "6px auto 16px",
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  boxShadow:
                    "0 8px 28px 0 #1e254877, 0 1.5px 8px #1976ed22",
                  background:
                    "linear-gradient(90deg, #162d52 0%, #284176 100%)",
                  zIndex: 1,
                }}
              >
                {/* 왼쪽 1등 */}
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    background: "#192145",
                  }}
                >
                  {first?.image ? (
                    <MediaRenderer
                      url={first.image}
                      alt={t(
                        "first_place",
                        "1st"
                      )}
                      playable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          "50% 32%",
                        background: "#111",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#222",
                      }}
                    />
                  )}
                </div>

                {/* 오른쪽 2등 */}
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    background: "#1f2540",
                  }}
                >
                  {second?.image ? (
                    <MediaRenderer
                      url={second.image}
                      alt={t(
                        "second_place",
                        "2nd"
                      )}
                      playable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          "50% 32%",
                        background: "#111",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "#15182b",
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
                      "translate(-50%, -56%)",
                    width: isMobile
                      ? 56
                      : 74,
                    height: isMobile
                      ? 56
                      : 74,
                    pointerEvents:
                      "none",
                    zIndex: 5,
                  }}
                >
                  <img
                    src="/vs.png"
                    alt={t("vs")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit:
                        "contain",
                      userSelect:
                        "none",
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* 제목 */}
              <h1
                style={{
                  fontWeight: 900,
                  fontSize: isMobile
                    ? 23
                    : 31,
                  color: "#fff",
                  marginBottom:
                    isMobile
                      ? 20
                      : 27,
                  letterSpacing:
                    "-1.2px",
                  lineHeight: 1.18,
                  textAlign: "center",
                  background:
                    "#171C27",
                  borderRadius: 14,
                  padding: isMobile
                    ? "12px 0 8px 0"
                    : "18px 0 9px 0",
                  marginLeft: "auto",
                  marginRight: "auto",
                  whiteSpace:
                    "pre-line",
                  wordBreak:
                    "break-all",
                  maxWidth: isMobile
                    ? "98vw"
                    : 710,
                  boxShadow:
                    "0 2px 16px #1976ed18",
                  marginTop: isMobile
                    ? 12
                    : 16,
                }}
                title={translatedTitle}
              >
                {translatedTitle}
              </h1>

              {/* 설명 */}
              {translatedDescription && (
                <div
                  style={{
                    fontWeight: 400,
                    fontSize:
                      isMobile
                        ? 16
                        : 20,
                    color: "#b9d3ff",
                    textAlign:
                      "center",
                    background:
                      "rgba(30,45,70,0.93)",
                    borderRadius: 9,
                    padding: isMobile
                      ? "7px 6px 4px 6px"
                      : "11px 18px 6px 18px",
                    marginBottom:
                      isMobile
                        ? 18
                        : 24,
                    marginLeft:
                      "auto",
                    marginRight:
                      "auto",
                    maxWidth: isMobile
                      ? "95vw"
                      : 590,
                    lineHeight: 1.45,
                    minHeight: 24,
                    whiteSpace:
                      "pre-line",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {
                    translatedDescription
                  }
                </div>
              )}
            </>
          )}
                    {/* 라운드 / 시작 / 후보수 */}
          <div
            style={{
              marginBottom: isMobile ? 16 : 24,
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? 8 : 16,
              width: "100%",
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-block",
                minWidth: 130,
                textAlign: "center",
              }}
            >
              <select
                value={selectedRound}
                onChange={(e) =>
                  setSelectedRound(Number(e.target.value))
                }
                style={selectBtnStyle}
                aria-label={t("round_of", {
                  count: selectedRound,
                })}
              >
                {possibleRounds.map((r) => (
                  <option key={r} value={r}>
                    {t("round_of", { count: r })}
                  </option>
                ))}
              </select>

              <span style={selectArrowStyle}>▼</span>
            </span>

            <button
              style={mainBtn}
              onClick={() =>
                handleStart(selectedRound)
              }
              aria-label={t("start")}
            >
              {t("start")}
            </button>

            <span style={candidateCountText}>
              {t("candidates_count", {
                count: candidates.length,
              })}

              {hasBye && (
                <span
                  style={{
                    marginLeft: 7,
                    color: "#FFD740",
                    fontSize: isMobile ? 12 : 15,
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {t("bye_round")}
                </span>
              )}
            </span>
          </div>

          {/* 부전승 안내 */}
          {hasBye && (
            <div
              style={{
                margin: "6px auto 8px auto",
                padding: isMobile
                  ? "7px 11px"
                  : "10px 17px",
                color: "#a85c07",
                background: "#fffbe5",
                borderRadius: 7,
                fontSize: isMobile ? 13 : 15,
                fontWeight: 900,
                boxShadow: "0 1px 5px #1976ed09",
                display: "inline-block",
                maxWidth: 400,
                border: "1.1px solid #ffd452",
              }}
            >
              ⚠️{" "}
              {t("auto_bye_message", {
                selectedRound,
              })}
            </div>
          )}

          {/* 후보 이름 나열 */}
          <div
            style={{
              margin: "40px auto 0 auto",
              background: "rgba(32, 37, 59, 0.88)",
              borderRadius: 18,
              padding: isMobile
                ? "15px 9px 20px 9px"
                : "23px 26px 27px 26px",
              maxWidth: 670,
              boxShadow: "0 2px 26px #1976ed19",
            }}
          >
<h2
  style={{
    fontWeight: 700,
    color: "#ffe067",
    fontSize: isMobile ? 17 : 21,
    marginTop: 0,
    marginBottom: 10,
    letterSpacing: "-0.5px",
  }}
>
  {t("candidates") || "Candidates"}
</h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile
                  ? "7px 11px"
                  : "11px 20px",
                justifyContent: "center",
              }}
            >
              {uniqueNames.map((name, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#181d2c",
                    color: "#fff",
                    borderRadius: 8,
                    padding: isMobile
                      ? "5px 11px"
                      : "7px 17px",
                    fontWeight: 600,
                    fontSize: isMobile ? 14 : 16,
                    marginBottom: "5px",
                    boxShadow: "0 2px 8px #11223319",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

{/* 게임 정보 */}
<div
  style={{
    margin: "20px auto 0",
    maxWidth: 670,
    background: "#20253b",
    borderRadius: 14,
    padding: 18,
    color: "#fff",
  }}
>
  <h2
    style={{
      fontWeight: 800,
      fontSize: 18,
      marginBottom: 12,
      color: "#ffe067",
    }}
  >
    게임 정보
  </h2>

  <div>후보 수 : {candidates.length}</div>

  <div>
    참여 횟수 : {totalPlays.toLocaleString()}회
  </div>

  <div>
    등록일 :{" "}
    {cup?.created_at
      ? new Date(cup.created_at).toLocaleDateString()
      : "-"}
  </div>
</div>

        </div>

        {/* 오른쪽 사이드 광고 */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 160,
              marginLeft: 20,
            }}
          >
            <AdsenseSide />
          </div>
        )}
      </div>
    </div>
  );
}