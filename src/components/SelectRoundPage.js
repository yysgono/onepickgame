// src/components/SelectRoundPage.js
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import MediaRenderer from "./MediaRenderer";
import AdsenseSide from "./AdsenseSide";
import { fetchWinnerStatsFromDB, pushRecentWorldcup } from "../utils.js"; // ✅ 통계/최근본
import { supabase } from "../utils/supabaseClient";

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
  worldcupList = [],
}) {
  const { t, i18n } = useTranslation();

  const [selectedRound, setSelectedRound] =
    useState(maxRound);

  const [winStats, setWinStats] =
    useState([]);
    const [creatorNickname, setCreatorNickname] =
  useState("");
  const [detailTags, setDetailTags] = useState(
  Array.isArray(cup?.tags) ? cup.tags : []
);

useEffect(() => {
  let mounted = true;

  async function loadLatestTags() {
    if (!cup?.id) return;

    try {
      const { data, error } = await supabase
        .from("worldcups")
        .select("tags")
        .eq("id", cup.id)
        .single();

      if (error) throw error;

      if (mounted) {
        setDetailTags(
          Array.isArray(data?.tags) ? data.tags : []
        );
      }
    } catch (error) {
      console.error("태그 조회 실패:", error);
    }
  }

  loadLatestTags();

  return () => {
    mounted = false;
  };
}, [cup?.id]);
    const [showAllCandidates, setShowAllCandidates] =
  useState(false);

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
useEffect(() => {
  let mounted = true;

  async function loadCreator() {
    const creatorId =
      cup?.owner || cup?.creator;

    if (!creatorId) {
      if (mounted) {
        setCreatorNickname("");
      }
      return;
    }

    try {
      const { data, error } =
        await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", creatorId)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (mounted) {
        setCreatorNickname(
          data?.nickname || ""
        );
      }
    } catch (error) {
      console.error(
        "제작자 조회 실패:",
        error
      );

      if (mounted) {
        setCreatorNickname("");
      }
    }
  }

  loadCreator();

  return () => {
    mounted = false;
  };
}, [cup?.owner, cup?.creator]);
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
      "#6650d8",

    color: "#ffffff",

    fontWeight: 900,

    border: "none",

    borderRadius: 11,

    fontSize:
      isMobile ? 19 : 21,

    padding:
      isMobile
        ? "10px 22px"
        : "13px 35px",

    minWidth:
      isMobile ? 87 : 115,

    cursor: "pointer",

    boxShadow:
      "0 4px 16px rgba(25,32,52,0.07)",

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
  fontSize: isMobile ? 20 : 25,
  padding: isMobile
    ? "10px 42px 10px 16px"
    : "12px 48px 12px 20px",

  borderRadius: isMobile ? 10 : 12,
  minWidth: isMobile ? 120 : 150,

  fontWeight: 900,

  background:
    "linear-gradient(180deg,#ffffff 0%,#f3f0ff 100%)",

  color: "#392a96",

  border:
    "2px solid #6650d8",

  height: isMobile ? 48 : 60,

  textAlign: "center",
  boxSizing: "border-box",
  margin: "0 auto",
  display: "block",

  cursor: "pointer",
  direction: "ltr",

  boxShadow:
    "0 4px 12px rgba(102,80,216,0.18)",

  outline: "none",
};

const selectArrowStyle = {
  position: "absolute",

  right: isMobile ? 13 : 18,
  top: "50%",

  transform:
    "translateY(-50%)",

  pointerEvents: "none",

  color: "#4d38bd",

  fontSize:
    isMobile ? 20 : 24,

  fontWeight: 900,

  zIndex: 1,
};

  const candidateCountText = {
    fontSize: isMobile ? 17 : 21,
    fontWeight: 800,
    color: "#202534",
    background: "#ffffff",
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
    border: "1.5px solid #dde2ea",
  };

  const resultBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    right: isMobile ? 11 : 26,
    zIndex: 20,
background: "#13e67e",
color: "#062414",
fontWeight: 1000,
textShadow: "none",
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 17 : 19,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
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
background: "#13e67e",
color: "#062414",
fontWeight: 1000,
textShadow: "none",
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 17 : 19,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
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

const visibleCandidateNames = showAllCandidates
  ? uniqueNames
  : uniqueNames.slice(0, 20);

const remainingCandidateCount = Math.max(
  uniqueNames.length - 20,
  0
);

  // ======================================================
  // 버튼과 썸네일 겹침 방지용 여백
  // ======================================================

 const topSpacerH = isMobile ? 58 : 25;
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
// ======================================================
// 관련 월드컵
// 같은 카테고리 + 현재 월드컵 제외 + 최대 4개
// ======================================================

const relatedWorldcups = (worldcupList || [])
  .filter((item) => {
    if (!item?.id) return false;

    if (String(item.id) === String(cup?.id)) {
      return false;
    }

    return (
      (item.category || "etc") ===
      (cup?.category || "etc")
    );
  })
  .slice(0, 4);

  const creatorId =
  cup?.owner || cup?.creator;

const creatorOtherWorldcups =
  (worldcupList || []).filter((item) => {
    if (!item?.id) return false;

    // 현재 보고 있는 월드컵 제외
    if (
      String(item.id) ===
      String(cup?.id)
    ) {
      return false;
    }

    const itemCreator =
      item?.owner || item?.creator;

    return (
      creatorId &&
      String(itemCreator) ===
        String(creatorId)
    );
  });

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
        <div className="round-detail-panel"
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
              boxSizing: "border-box",
background: "#ffffff",

border: isMobile
  ? "none"
  : "1.5px solid #c9c1ff",

borderRadius: isMobile ? 0 : 23,

boxShadow:
  isMobile
    ? "none"
    : "0 6px 22px rgba(72,56,170,0.12)",
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
{/* 오른쪽 상단 결과 보기 */}
<button
  style={resultBtn}
  onClick={handleShowStats}
  aria-label={t("show_result")}
>
  {t("show_result")}
</button>
      {/* 상단 START NOW + 라운드 선택 */}
<div
  style={{
    width: isMobile ? "78%" : 300,
    maxWidth: 300,
    margin: isMobile
      ? "-2px auto 18px"
      : "15px auto 18px",
  }}
>
  <button
    onClick={() => handleStart(selectedRound)}
    style={{
      width: "100%",
      height: isMobile ? 58 : 68,
      fontSize: isMobile ? 21 : 26,
      fontWeight: 900,
      borderRadius: 14,
      border: "none",
background:
  "#6650d8",
color: "#ffffff",
textShadow: "none",
      cursor: "pointer",
      boxShadow:
        "0 4px 16px rgba(25,32,52,0.07)",
    }}
  >
 🚀 {t("start")}
  </button>

  <div
  style={{
    position: "relative",
    width: "100%",
    marginTop: 9,
  }}
>
  <select
    value={selectedRound}
    onChange={(e) =>
      setSelectedRound(Number(e.target.value))
    }
  style={{
  width: "100%",

  height:
    isMobile ? 50 : 56,

  padding:
    "0 48px 0 16px",

  fontSize:
    isMobile ? 19 : 22,

  fontWeight: 900,

  textAlign:
    "center",

  borderRadius: 11,

  border:
    "2px solid #6650d8",

  background:
    "linear-gradient(180deg,#ffffff 0%,#f3f0ff 100%)",

  color:
    "#392a96",

  cursor:
    "pointer",

  boxSizing:
    "border-box",

  appearance:
    "none",

  WebkitAppearance:
    "none",

  outline:
    "none",

  boxShadow:
    "0 4px 14px rgba(102,80,216,0.17)",
}}
  >
    {possibleRounds.map((r) => (
      <option key={r} value={r}>
        {t("round_of", { count: r })}
      </option>
    ))}
  </select>

  <span
    style={{
      position: "absolute",
      right: 17,
      top: "50%",
      transform: "translateY(-50%)",
 color: "#4d38bd",
      fontSize: isMobile ? 20 : 23,
      fontWeight: 900,
      pointerEvents: "none",
    }}
  >
    ▼
  </span>
</div>
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
                    "0 4px 16px rgba(25,32,52,0.07)",
                  background:
                    "#f5f6fa",
                  zIndex: 1,
                }}
              >
                {/* 왼쪽 1등 */}
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    background: "#ffffff",
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

                {/* 오른쪽 2등 */}
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    background: "#ffffff",
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
                        background: "#ffffff",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "#ffffff",
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
                    ? 25
                    : 33,
                  color: "#202534",
                  marginBottom:
                    isMobile
                      ? 20
                      : 27,
                  letterSpacing:
                    "-1.2px",
                  lineHeight: 1.18,
                  textAlign: "center",
                  background:
                    "#ffffff",
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
                    "0 4px 16px rgba(25,32,52,0.07)",
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
                        ? 18
                        : 22,
                    color: "#5542b8",
                    textAlign:
                      "center",
                    background:
                      "#ffffff",
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
                    color: "#202534",
                    fontSize: isMobile ? 14 : 17,
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
                fontSize: isMobile ? 15 : 17,
                fontWeight: 900,
                boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
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
  className="round-candidates round-detail-section"
  style={{
    margin: "40px auto 0 auto",
    background: "#ffffff",

    border: "1.5px solid #8d7cff",

    borderRadius: 18,

    padding: isMobile
      ? "15px 9px 20px 9px"
      : "23px 26px 27px 26px",

    maxWidth: 670,

    boxShadow:
      "0 5px 18px rgba(84,66,184,0.10)",
  }}
>
<h2
  style={{
    fontWeight: 700,
    color: "#202534",
    fontSize: isMobile ? 19 : 23,
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
         {visibleCandidateNames.map((name, idx) => (
  <span
    key={idx}
    style={{
      background: "#ffffff",
      color: "#202534",

      border: "1px solid #d2d6e3",

      borderRadius: 8,
      padding: isMobile
        ? "5px 11px"
        : "7px 17px",
      fontWeight: 600,
      fontSize: isMobile ? 16 : 18,
      marginBottom: "5px",
      boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
    }}
  >
    {name}
  </span>
))}

{remainingCandidateCount > 0 && !showAllCandidates && (
  <button
    type="button"
    onClick={() => setShowAllCandidates(true)}
    style={{
      background: "transparent",
      border: "none",
      color: "#5542b8",
      fontWeight: 700,
      fontSize: isMobile ? 16 : 18,
      padding: isMobile
        ? "5px 11px"
        : "7px 17px",
      marginBottom: "5px",
      cursor: "pointer",
    }}
  >
    {t("candidates_remaining", {
      count: remainingCandidateCount,
    })}
  </button>
)}
            </div>
          </div>
{/* 게임 이용 안내 */}
<div className="round-detail-section"
  style={{
    margin: "20px auto 0",
    maxWidth: 670,
    background: "#ffffff",
    borderRadius: 14,
    padding: isMobile ? "14px 16px" : "18px 22px",
    color: "#202534",
    boxSizing: "border-box",
    border: "1.5px solid #8d7cff",
boxShadow: "0 5px 18px rgba(84,66,184,0.08)",
  }}
>
  <h2
    style={{
      fontWeight: 800,
     fontSize: isMobile ? 20 : 22,
      marginTop: 0,
      marginBottom: 12,
      color: "#202534",
    }}
  >
    {t("game_guide")}
  </h2>

  <div
    style={{
fontSize: isMobile ? 17 : 19,
lineHeight: 1.8,
      color: "#202534",
      textAlign: "left",
      whiteSpace: "pre-line",
      wordBreak: "keep-all", 
    }}
  >
{`• ${t("game_guide_reset")}
• ${t("game_guide_random")}
• ${t("game_guide_revive")}`}
  </div>
</div>
{/* 게임 정보 */}
<div className="round-detail-section"
  style={{
    margin: "20px auto 0",
    maxWidth: 670,
    background: "#ffffff",
    borderRadius: 14,
    padding: 18,
    color: "#202534",
    border: "1.5px solid #8d7cff",
boxShadow: "0 5px 18px rgba(84,66,184,0.08)",
  }}
>
<h2
  style={{
    fontWeight: 800,
    fontSize: 20,
    marginTop: 0,
    marginBottom: 12,
    color: "#202534",
  }}
>
   {t("game_info")}
  </h2>

  {creatorNickname && (
  <div>
    {t("creator") || "Creator"} :{" "}
    <span
      style={{
        fontWeight: 800,
        color: "#5542b8",
      }}
    >
      {creatorNickname}
    </span>
  </div>
)}

  <div>
    {t("category")} :{" "}
    {t(`category_${cup?.category || "etc"}`, {
      defaultValue: cup?.category || "etc",
    })}
  </div>

  <div>{t("candidate_count")} : {candidates.length}</div>

  <div>
{t("play_count")} : {totalPlays.toLocaleString()}
  </div>

  <div>
 {t("created_date")} :{" "}
    {cup?.created_at
      ? new Date(cup.created_at).toLocaleDateString()
      : "-"}
  </div>

  <div>
    {t("updated_date")} :{" "}
    {cup?.updated_at
      ? new Date(cup.updated_at).toLocaleDateString()
      : "-"}
  </div>
  {Array.isArray(detailTags) &&
detailTags.length > 0 && (
    <div
      style={{
        marginTop: 13,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
   {detailTags.slice(0, 3).map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() =>
            navigate(
              `/${normalizedLang}?search=${encodeURIComponent(
                tag
              )}`
            )
          }
          style={{
            border: "1px solid #dde2ea",
            background: "#ffffff",
            color: "#5542b8",
            borderRadius: 20,
            padding: "5px 10px",
            fontSize: isMobile ? 14 : 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          #{tag}
        </button>
      ))}
    </div>
  )}
</div>
{creatorNickname &&
  creatorOtherWorldcups.length > 0 && (
    <button
      type="button"
      onClick={() =>
        navigate(
          `/${normalizedLang}?creator=${encodeURIComponent(
            creatorId
          )}`
        )
      }
      style={{
        marginTop: 14,
        border: "none",
        background: "transparent",
        color: "#5542b8",
        fontSize: isMobile ? 18 : 20,
        fontWeight: 800,
        cursor: "pointer",
        textDecoration: "underline",
      }}
    >
      {creatorNickname}
      {t("creator_other_worldcups") ||
        "'s other brackets"} →
    </button>
  )}
{/* 관련 월드컵 */}
{relatedWorldcups.length > 0 && (
  <div
style={{
  margin: "20px auto 0",
  maxWidth: 670,
  background: "#ffffff",

  border: "1.5px solid #8d7cff",
  borderRadius: 14,

  padding: isMobile ? 14 : 18,
  color: "#202534",

  boxShadow:
    "0 5px 18px rgba(84,66,184,0.08)",
}}
  >
    <h2
      style={{
        fontWeight: 800,
        fontSize: isMobile ? 19 : 20,
        marginTop: 0,
        marginBottom: 14,
        color: "#202534",
      }}
>
  {t("recommended_worldcups")}
</h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr 1fr"
          : "repeat(4, 1fr)",
        gap: 10,
      }}
    >
      {relatedWorldcups.map((item) => {
        const relatedTitle =
          item?.title_translations?.[normalizedLang] ||
          item?.title_translations?.en ||
          item?.title ||
          "";

        const relatedImage =
          item?.thumbnail ||
          item?.image ||
          item?.data?.[0]?.image ||
          "";

        return (
          <div
            key={item.id}
            onClick={() =>
              navigate(
                `/${normalizedLang}/select-round/${item.id}`
              )
            }
            style={{
              background: "#ffffff",
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid #dde2ea",
            }}
          >
            <div
              style={{
                width: "100%",
                height: isMobile ? 80 : 95,
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              {relatedImage && (
                <MediaRenderer
                  url={relatedImage}
                  alt={relatedTitle}
                  playable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>

            <div
              style={{
                padding: "8px 7px",
                fontSize: isMobile ? 14 : 15,
                fontWeight: 700,
                lineHeight: 1.3,
                color: "#202534",
                minHeight: isMobile ? 46 : 50,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {relatedTitle}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

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