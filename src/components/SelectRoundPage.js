import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import MediaRenderer from "./MediaRenderer";
import { fetchWinnerStatsFromDB, pushRecentWorldcup } from "../utils.js"; // ✅ 통계/최근본
import AdSlot from "./AdSlot"; // ✅ 광고 공통 컴포넌트

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

  if (!stats.length) return [data?.[0] || null, data?.[1] || null];

  const sorted = [...stats]
    .map((row, i) => ({ ...row, _i: i }))
    .sort((a, b) => {
      if ((b.win_count || 0) !== (a.win_count || 0))
        return (b.win_count || 0) - (a.win_count || 0);
      if ((b.match_wins || 0) !== (a.match_wins || 0))
        return (b.match_wins || 0) - (a.match_wins || 0);
      return a._i - b._i;
    });

  const byId = (id) => data.find((c) => c.id === id) || null;
  const first = byId(sorted[0]?.candidate_id) || data?.[0] || null;
  const second = byId(sorted[1]?.candidate_id) || data?.[1] || null;
  return [first, second];
}

export default function SelectRoundPage({
  cup,
  maxRound,
  candidates,
  onSelect,
}) {
  const { t, i18n } = useTranslation();
  const [selectedRound, setSelectedRound] = useState(maxRound);
  const [winStats, setWinStats] = useState([]);
  const isMobile = useIsMobile();
  const vw = useViewportWidth();
  const isWideForSideAds = vw >= 1300; // ✅ 사이드 300px*2 + 가운데 영역 확보 여유

  const navigate = useNavigate();
  const { lang: langParam } = useParams();

  // 🇰🇷 한국이면 쿠팡, 그 외는 아마존
  const isKR =
    (i18n.language || "en").startsWith("ko") ||
    (typeof window !== "undefined" && window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  // ✅ 통계 가져오기 (홈 카드와 동일)
  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        if (cup?.id) {
          const statsArr = await fetchWinnerStatsFromDB(cup.id);
          if (mounted) setWinStats(Array.isArray(statsArr) ? statsArr : []);
        } else {
          setWinStats([]);
        }
      } catch {
        if (mounted) setWinStats([]);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [cup?.id]);

  // ✅ 이 페이지로 바로 들어와도 최근본에 기록되도록
  useEffect(() => {
    if (cup?.id) pushRecentWorldcup(cup.id);
  }, [cup?.id]);

  // 언어코드 추출 (하이픈 변형은 앞 두 글자만)
  let lang = langParam || (i18n.language || "ko").split("-")[0] || "ko";

  // 라운드 후보군 계산을 useMemo 로
  const possibleRounds = useMemo(() => {
    const count = candidates.length;
    const maxPossibleRound = Math.min(count, 10000);
    let arr = [];
    for (let n = 1; Math.pow(2, n) <= maxPossibleRound; n++) {
      arr.push(Math.pow(2, n));
    }
    if (count >= 2 && count <= 10000 && !arr.includes(count)) {
      arr.push(count);
    }
    return arr.sort((a, b) => a - b);
  }, [candidates.length]);

  // ✅ 선택 라운드 보정 (후보 변경 시 불일치 방지) — deps 를 possibleRounds 로!
  useEffect(() => {
    const fallback = possibleRounds[possibleRounds.length - 1] || 2;
    setSelectedRound((prev) => (possibleRounds.includes(prev) ? prev : fallback));
  }, [possibleRounds]);

  const hasBye = candidates.length < selectedRound;

  // ---- 버튼 스타일 ----
  const mainBtn = {
    background: "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 17 : 19,
    padding: isMobile ? "10px 22px" : "13px 35px",
    minWidth: isMobile ? 87 : 115,
    cursor: "pointer",
    boxShadow: "0 1px 11px #1976ed22",
    marginLeft: 4,
    marginRight: 4,
    outline: "none",
    height: isMobile ? 48 : 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

  // --- 공유 버튼 스타일 & 함수 ---
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
  const shareUrl =
    cup?.id && typeof window !== "undefined"
      ? `${window.location.origin}/${lang}/select-round/${cup.id}`
      : "";
  function handleShare() {
    if (typeof navigator?.clipboard?.writeText === "function" && shareUrl) {
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

  function handleShowStats() {
    if (cup?.id && lang) {
      navigate(`/${lang}/stats/${cup.id}`);
    }
  }

  function handleStart(selectedRound) {
    if (cup?.id) pushRecentWorldcup(cup.id); // 기록 보강
    if (onSelect) onSelect(selectedRound);
    else if (cup?.id && lang) {
      navigate(`/${lang}/match/${cup.id}/${selectedRound}`);
    }
  }

  // 후보 이름만 unique
  const uniqueNames = Array.from(
    new Set((candidates || []).map((c) => c.name || c.title || c))
  );

  // ✅ 버튼과 썸네일 겹침 방지용 여백
  const topSpacerH = isMobile ? 60 : 70;
  const thumbH = isMobile ? 150 : 190;

  // ✅ 1등/2등 결정
  const [first, second] = pickTop2(cup, candidates, winStats);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* ✅ 헤더 바로 밑 배너: 728x90(PC) / 320x100(모바일) */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: isMobile ? 320 : 728,
            height: isMobile ? 100 : 90,
            marginTop: isMobile ? 8 : 12,
          }}
        >
          {typeof window !== "undefined" && (
            <AdSlot
              id="ad-select-header"
              provider={provider}
              width={isMobile ? 320 : 728}
              height={isMobile ? 100 : 90}
            />
          )}
        </div>
      </div>

      {/* ✅ 가운데 콘텐츠 + 사이드 배너 2열 레이아웃 */}
      <div
        style={{
          width: "100%",
          marginTop: 10,
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {/* 좌측 사이드 배너 (PC 와이드에서만) */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 300,
              minWidth: 300,
              height: 600,
              position: "sticky",
              top: 86, // 헤더 높이만큼
              alignSelf: "flex-start",
            }}
          >
            {typeof window !== "undefined" && (
              <AdSlot
                id="ad-select-left"
                provider={provider}
                width={300}
                height={600}
              />
            )}
          </div>
        )}

        {/* 메인 컨텐츠 패널 */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            padding: isMobile ? 12 : 38,
            paddingTop: (isMobile ? 12 : 38) + topSpacerH,
            width: "100%",
            maxWidth: isMobile ? "100%" : 880,
            background: "rgba(20, 24, 37, 0.95)",
            borderRadius: isMobile ? 0 : 23,
            boxShadow: isMobile ? "none" : "0 4px 44px #171c2747",
            minHeight: isMobile ? 520 : 580,
          }}
        >
          {/* 왼쪽 상단 월드컵 공유하기 버튼 */}
          {cup && (
            <button
              style={shareBtn}
              onClick={handleShare}
              aria-label={t("share_worldcup")}
            >
              📢 {t("share_worldcup")}
            </button>
          )}

          {/* 오른쪽 상단 결과/통계 보기 버튼 */}
          <button
            style={resultBtn}
            onClick={handleShowStats}
            aria-label={t("show_result")}
          >
            {t("show_result")}
          </button>

          {cup && (
            <>
              {/* ✅ 제목 위 썸네일 */}
              <div
                style={{
                  width: "100%",
                  maxWidth: isMobile ? "98vw" : 710,
                  height: thumbH,
                  margin: isMobile ? "4px auto 12px" : "6px auto 16px",
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
                {/* left (1등) */}
                <div
                  style={{ width: "50%", height: "100%", background: "#192145" }}
                >
                  {first?.image ? (
                    <MediaRenderer
                      url={first.image}
                      alt={t("first_place", "1st")}
                      playable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "50% 32%",
                        background: "#111",
                      }}
                    />
                  ) : (
                    <div
                      style={{ width: "100%", height: "100%", background: "#222" }}
                    />
                  )}
                </div>

                {/* right (2등) */}
                <div
                  style={{ width: "50%", height: "100%", background: "#1f2540" }}
                >
                  {second?.image ? (
                    <MediaRenderer
                      url={second.image}
                      alt={t("second_place", "2nd")}
                      playable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "50% 32%",
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

                {/* VS 아이콘 */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -56%)",
                    width: isMobile ? 56 : 74,
                    height: isMobile ? 56 : 74,
                    pointerEvents: "none",
                    zIndex: 5,
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
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* 제목 */}
              <div
                style={{
                  fontWeight: 900,
                  fontSize: isMobile ? 23 : 31,
                  color: "#fff",
                  marginBottom: isMobile ? 20 : 27,
                  letterSpacing: "-1.2px",
                  lineHeight: 1.18,
                  textAlign: "center",
                  background: "#171C27",
                  borderRadius: 14,
                  padding: isMobile ? "12px 0 8px 0" : "18px 0 9px 0",
                  marginLeft: "auto",
                  marginRight: "auto",
                  whiteSpace: "pre-line",
                  wordBreak: "break-all",
                  maxWidth: isMobile ? "98vw" : 710,
                  boxShadow: "0 2px 16px #1976ed18",
                  marginTop: isMobile ? 12 : 16,
                }}
                title={cup?.title}
              >
                {cup?.title}
              </div>

              {(cup?.desc || cup?.description) && (
                <div
                  style={{
                    fontWeight: 400,
                    fontSize: isMobile ? 16 : 20,
                    color: "#b9d3ff",
                    textAlign: "center",
                    background: "rgba(30,45,70,0.93)",
                    borderRadius: 9,
                    padding: isMobile
                      ? "7px 6px 4px 6px"
                      : "11px 18px 6px 18px",
                    marginBottom: isMobile ? 18 : 24,
                    marginLeft: "auto",
                    marginRight: "auto",
                    maxWidth: isMobile ? "95vw" : 590,
                    lineHeight: 1.45,
                    minHeight: 24,
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {cup.desc || cup.description}
                </div>
              )}
            </>
          )}

          {/* ---- 라운드/시작/후보수 ---- */}
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
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                style={selectBtnStyle}
                aria-label={t("round_of", { count: selectedRound })}
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
              onClick={() => handleStart(selectedRound)}
              aria-label={t("start")}
            >
              {t("start")}
            </button>
            <span style={candidateCountText}>
              {t("candidates_count", { count: candidates.length })}
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

          {/* 부전승 안내문구 */}
          {hasBye && (
            <div
              style={{
                margin: "6px auto 8px auto",
                padding: isMobile ? "7px 11px" : "10px 17px",
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
              ⚠️ {t("auto_bye_message", { selectedRound })}
            </div>
          )}

          {/* ==== 후보 이름 나열 ==== */}
          <div
            style={{
              margin: "40px auto 0 auto",
              background: "rgba(32, 37, 59, 0.88)",
              borderRadius: 18,
              padding: isMobile ? "15px 9px 20px 9px" : "23px 26px 27px 26px",
              maxWidth: 670,
              boxShadow: "0 2px 26px #1976ed19",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#ffe067",
                fontSize: isMobile ? 17 : 21,
                marginBottom: 10,
                letterSpacing: "-0.5px",
              }}
            >
              {t("candidates") || "Candidates"}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile ? "7px 11px" : "11px 20px",
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
                    padding: isMobile ? "5px 11px" : "7px 17px",
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

          {/* ✅ PC 하단 배너 (페이지 하단 영역) */}
          {!isMobile && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: 26,
              }}
            >
              <div style={{ width: 728, height: 90 }}>
                {typeof window !== "undefined" && (
                  <AdSlot
                    id="ad-select-footer-pc"
                    provider={provider}
                    width={728}
                    height={90}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 우측 사이드 배너 (PC 와이드에서만) */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 300,
              minWidth: 300,
              height: 600,
              position: "sticky",
              top: 86,
              alignSelf: "flex-start",
            }}
          >
            {typeof window !== "undefined" && (
              <AdSlot
                id="ad-select-right"
                provider={provider}
                width={300}
                height={600}
              />
            )}
          </div>
        )}
      </div>

      {/* ✅ 모바일 하단 고정 배너 (320x100) */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            background: "rgba(10,12,18,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ width: 320, height: 100 }}>
            {typeof window !== "undefined" && (
              <AdSlot
                id="ad-select-footer-mobile"
                provider={provider}
                width={320}
                height={100}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
