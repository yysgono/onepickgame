// src/components/ResultPage.js
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StatsPage from "./StatsPage";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import AdSlot from "./AdSlot";
import ReferralBanner from "./ReferralBanner";

// 2줄(24*2byte) 초과시 ... 처리
function truncateToTwoLinesByByte(str, maxBytePerLine = 24) {
  if (!str) return [];
  let lines = [], line = "", byteCount = 0, totalByte = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const b = ch.charCodeAt(0) > 127 ? 2 : 1;
    if (byteCount + b > maxBytePerLine) {
      lines.push(line);
      line = ""; byteCount = 0;
      if (lines.length === 2) break;
    }
    line += ch; byteCount += b; totalByte += b;
  }
  if (lines.length < 2 && line) lines.push(line);
  if (totalByte > maxBytePerLine * 2) {
    let last = lines[1] || "";
    if (last.length > 0 && !last.endsWith("...")) {
      let lastByte = 0, j = 0;
      for (; j < last.length; j++) {
        lastByte += last.charCodeAt(j) > 127 ? 2 : 1;
        if (lastByte + 3 > maxBytePerLine) break;
      }
      last = last.slice(0, j) + "...";
      lines[1] = last;
    }
  }
  return lines;
}

function useIsMobile(breakpoint = 800) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function useViewport() {
  const [vw, setVw] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vw;
}

export default function ResultPage({ worldcupList }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // 레이아웃 상수: 본문폭/배너폭/여백
  const MAIN = 1200;     // 본문 maxWidth
  const BANNER = 300;    // 사이드배너 width
  const GAP = 24;        // 본문과 배너 사이 여백

  // 배너를 겹치지 않고 띄울 수 있는 최소 뷰포트 폭
  const MIN_VW_FOR_SIDE = MAIN + 2 * (BANNER + GAP);

  // 배너 좌/우 위치(calc) 문자열
  const leftPos = `calc(50% - ${MAIN / 2 + GAP + BANNER}px)`;
  const rightPos = `calc(50% - ${MAIN / 2 + GAP + BANNER}px)`;

  // 언어코드
  const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const lang = langMatch ? langMatch[1] : "ko";

  // 통계 전용 모드: /:lang/stats/:id 경로일 때
  const isStatsOnly = /\/stats\/\d+/.test(location.pathname);

  const [cup, setCup] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = useIsMobile(800);
  const vw = useViewport();
  const canShowSideAds = !isMobile && vw >= MIN_VW_FOR_SIDE;

  // 광고 프로바이더
  const isKR =
    (i18n?.language || "en").startsWith("ko") ||
    (typeof window !== "undefined" && window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  const locationCup =
    location.state?.cup ||
    (worldcupList && worldcupList.find((c) => String(c.id) === id));
  const locationWinner = location.state?.winner;

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      let thisCup = locationCup;
      let thisWinner = locationWinner;

      if (!thisCup) {
        const { data: cupData } = await supabase
          .from("worldcups")
          .select("*")
          .eq("id", id)
          .single();
        thisCup = cupData || null;
      }

      // 통계 전용 모드가 아니고, winner가 없고, cup이 있을 때만 우승자 로딩 시도
      if (!isStatsOnly && !thisWinner && thisCup) {
        let winnerObj = null;
        if (thisCup.winner_id) {
          if (thisCup.data) {
            winnerObj =
              thisCup.data.find(
                (item) => String(item.id) === String(thisCup.winner_id)
              ) || null;
          } else {
            const { data: candidate } = await supabase
              .from("candidates")
              .select("*")
              .eq("id", thisCup.winner_id)
              .single();
            winnerObj = candidate || null;
          }
        }
        // 🔴 여기서 첫 번째 후보를 강제로 우승자로 세팅하던 코드를 제거했습니다.
        // if (!winnerObj && thisCup?.data?.length > 0) winnerObj = thisCup.data[0];
        thisWinner = winnerObj;
      }

      if (mounted) {
        setCup(thisCup);
        setWinner(thisWinner);
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
    // isStatsOnly가 경로에 따라 달라질 수 있으니 의존성에 포함
  }, [id, locationCup, locationWinner, isStatsOnly]);

  if (loading)
    return (
      <div
        style={{
          width: isMobile ? "96vw" : 650,
          minHeight: isMobile ? "60vh" : 400,
          margin: "40px auto",
          padding: isMobile ? 30 : 60,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 3px 16px #0002",
          textAlign: "center",
          opacity: 0.6,
        }}
      >
        <div style={{ width: 180, height: 180, borderRadius: 14, margin: "0 auto 18px", background: "#e7ecf7" }} />
        <div style={{ height: 38, background: "#e3f0fb", width: 140, borderRadius: 10, margin: "0 auto 22px" }} />
        <div style={{ height: 26, background: "#f3f3f3", width: 220, borderRadius: 8, margin: "0 auto 18px" }} />
        <div style={{ height: 22, background: "#f0f2f7", width: 180, borderRadius: 8, margin: "0 auto 24px" }} />
        <div style={{ fontSize: 17, marginTop: 32, color: "#aaa" }}>{t("loading")}</div>
      </div>
    );

  // 통계 전용 모드에서는 winner가 없어도 정상 동작해야 하므로 cup만 확인
  if (!cup)
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#d33", minHeight: "60vh" }}>
        {t("error_no_data")}
        <br />
        <button onClick={() => window.location.reload()}>{t("retry")}</button>
        <br />
        <br />
        <a href={`/${lang}`} style={{ color: "#1976ed", textDecoration: "underline" }}>
          {t("home")}
        </a>
      </div>
    );

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "url('/onepick.png') center center / cover no-repeat fixed",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* 배경 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.4)",
        }}
      />

      {/* 좌/우 사이드 배너 */}
      {canShowSideAds && (
        <div
          style={{
            position: "fixed",
            top: 120,
            left: leftPos,
            width: BANNER,
            height: 600,
            zIndex: 10,
          }}
        >
          <AdSlot
            id="ad-result-left"
            provider={provider}
            width={BANNER}
            height={600}
          />
        </div>
      )}
      {canShowSideAds && (
        <div
          style={{
            position: "fixed",
            top: 120,
            right: rightPos,
            width: BANNER,
            height: 600,
            zIndex: 10,
          }}
        >
          <AdSlot
            id="ad-result-right"
            provider={provider}
            width={BANNER}
            height={600}
          />
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: MAIN,
          margin: "0 auto",
          padding: isMobile ? "0 0 28px 0" : "0 0 44px 0",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* 헤더 바로 아래 가로 배너 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginTop: isMobile ? 8 : 12,
            marginBottom: isMobile ? 6 : 10,
          }}
        >
          <div style={{ width: isMobile ? 320 : 728, height: isMobile ? 100 : 90 }}>
            <AdSlot
              id="ad-result-top"
              provider={provider}
              width={isMobile ? 320 : 728}
              height={isMobile ? 100 : 90}
              mobile={isMobile}
            />
          </div>
        </div>

        {/* 우승자 카드 + 버튼 (우승자 확정 & 통계 전용 모드가 아닐 때만) */}
        {winner && !isStatsOnly && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px auto",
              width: "100%",
            }}
          >
            <h2
              style={{
                fontWeight: 900,
                color: "#fff",
                fontSize: isMobile ? 35 : 48,
                margin: "32px 0 6px 0",
                letterSpacing: -2,
                lineHeight: 1.08,
                textShadow: "0 3px 8px #2228",
              }}
            />
            <div
              style={{
                fontSize: isMobile ? 24 : 29,
                fontWeight: 700,
                margin: "8px 0 3px 0",
                color: "#fff",
                textShadow: "0 3px 8px #2228",
              }}
            >
              🥇 {t("winner")}
            </div>
            <div
              style={{
                width: isMobile ? 135 : 170,
                height: isMobile ? 135 : 170,
                borderRadius: 18,
                margin: "0 auto 0px auto",
                background: "#eee",
                border: "3.5px solid #1976ed",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MediaRenderer url={winner.image} alt={winner.name} />
            </div>
            <div
              style={{
                fontSize: isMobile ? 26 : 32,
                fontWeight: 700,
                margin: "14px auto 6px auto",
                textAlign: "center",
                wordBreak: "break-all",
                maxWidth: 260,
                lineHeight: 1.13,
                color: "#fff",
                textShadow: "0 3px 8px #2228",
              }}
              title={winner.name}
            >
              {truncateToTwoLinesByByte(winner.name, 24).map((line, i) => (
                <span key={i} style={{ display: "block" }}>{line}</span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                margin: "18px auto 0 auto",
              }}
            >
              <button
                style={{
                  padding: isMobile ? "11px 26px" : "12px 32px",
                  borderRadius: 10,
                  background: "#1976ed",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  fontSize: isMobile ? 17 : 20,
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/${lang}/select-round/${cup.id}`)}
              >
                {t("retry")}
              </button>
              <button
                style={{
                  padding: isMobile ? "11px 24px" : "12px 28px",
                  borderRadius: 10,
                  background: "#eee",
                  color: "#333",
                  fontWeight: 700,
                  border: "none",
                  fontSize: isMobile ? 16 : 20,
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/${lang}`)}
              >
                {t("home")}
              </button>
            </div>
          </div>
        )}

        {/* 통계 + 댓글 (우승자 유무와 상관없이 표시) */}
        <div style={{ margin: "0 auto 0 auto", maxWidth: MAIN, width: "100%" }}>
          <StatsPage
            selectedCup={cup}
            showCommentBox={true}
            winner={winner || null}
            showShareAndReport={true}
          />
        </div>

        {/* 🔻 하단: 레퍼럴 배너 (홈은 쿠팡, 여긴 레퍼럴) */}
        <div style={{ width: "100%", maxWidth: 900, margin: "16px auto 40px" }}>
          <ReferralBanner lang={(i18n?.language || "en")} />
        </div>
      </div>
    </div>
  );
}
