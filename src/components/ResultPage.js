// src/components/ResultPage.js
import React, { useEffect, useState, lazy, Suspense, useRef, useTransition } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
// import StatsPage from "./StatsPage";                // ★ 지연 로딩으로 변경
// import MediaRenderer from "./MediaRenderer";        // ★ 지연 로딩으로 변경
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
// import ReferralBanner from "./ReferralBanner";       // ★ 지연 로딩으로 변경
import { pushRecentWorldcup } from "../utils";

// ★ 무거운 것들 lazy 로드 → 초기 JS/페인트 가벼움
const StatsPage = lazy(() => import("./StatsPage"));
const MediaRenderer = lazy(() => import("./MediaRenderer"));
const ReferralBanner = lazy(() => import("./ReferralBanner"));

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

// ★ rAF 쓰로틀된 리사이즈로 과도한 리렌더 방지
function useIsMobile(breakpoint = 800) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsMobile(window.innerWidth < breakpoint));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [breakpoint]);
  return isMobile;
}

export default function ResultPage({ worldcupList }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [, startTransition] = useTransition();

  // 레이아웃: 본문 maxWidth
  const MAIN = 1200;

  // 언어코드
  const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const lang = langMatch ? langMatch[1] : "ko";

  // 통계 전용 모드: /:lang/stats/:id 경로일 때
  const isStatsOnly = /\/stats\/\d+/.test(location.pathname);

  const [cup, setCup] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = useIsMobile(800);

  const locationCup =
    location.state?.cup ||
    (worldcupList && worldcupList.find((c) => String(c.id) === id));
  const locationWinner = location.state?.winner;

  // ★ fetch 경합 방지용 시퀀스/Abort
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const seq = ++fetchSeqRef.current;
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      let thisCup = locationCup;
      let thisWinner = locationWinner;

      try {
        if (!thisCup) {
          const { data: cupData, error } = await supabase
            .from("worldcups")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
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
              const { data: candidate, error: candErr } = await supabase
                .from("candidates")
                .select("*")
                .eq("id", thisCup.winner_id)
                .single();
              if (candErr) throw candErr;
              winnerObj = candidate || null;
            }
          }
          thisWinner = winnerObj;
        }

        if (!alive || seq !== fetchSeqRef.current) return; // 늦게 온 응답 무시
        setCup(thisCup);
        setWinner(thisWinner);
        setLoading(false);
      } catch (e) {
        if (e?.name === "AbortError") return; // 취소된 요청은 조용히 무시
        if (!alive || seq !== fetchSeqRef.current) return;
        console.error("ResultPage fetch error:", e);
        setCup(thisCup ?? null);
        setWinner(thisWinner ?? null);
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
      controller.abort(); // ★ 이전 요청 취소
    };
  }, [id, locationCup, locationWinner, isStatsOnly]);

  // 최근 본 기록 (동기 로컬스토리지 → 성능 영향 적음)
  useEffect(() => {
    if (cup?.id) pushRecentWorldcup(cup.id);
  }, [cup?.id]);

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

  // 통계 전용 모드에서는 winner가 없어도 정상 동작
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
        // ★ 모바일에서 background-attachment: fixed 는 렌더링 비용이 큼 → 모바일은 scroll로
        background: "url('/onepick.png') center center / cover no-repeat",
        backgroundAttachment: isMobile ? "scroll" : "fixed",
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
          // ★ 화면 밖 페인트/레이아웃 비용 축소
          contentVisibility: "auto",
          containIntrinsicSize: "1200px 800px",
        }}
      >
        {/* 우승자 카드 (통계 전용 모드가 아닐 때만) */}
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
              {/* ★ MediaRenderer도 lazy라 초기 페인트 지연 ↓ */}
              <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#f3f4f9" }} />} >
                <MediaRenderer url={winner.image} alt={winner.name} loading="lazy" />
              </Suspense>
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
                onClick={() => startTransition(() => navigate(`/${lang}/select-round/${cup.id}`))}
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
                onClick={() => startTransition(() => navigate(`/${lang}`))}
              >
                {t("home")}
              </button>
            </div>
          </div>
        )}

        {/* 통계 + 댓글 */}
        <div style={{ margin: "0 auto 0 auto", maxWidth: MAIN, width: "100%" }}>
          {/* ★ StatsPage 자체도 lazy → 첫 페인트 가벼움 */}
          <Suspense fallback={<div style={{ padding: 16, textAlign: "center", color: "#aaa" }}>{t("loading")}</div>}>
            <StatsPage
              selectedCup={cup}
              showCommentBox={true}
              winner={winner || null}
              showShareAndReport={true}
            />
          </Suspense>
        </div>

        {/* 하단: 에피데믹 사운드 래퍼럴 */}
        <div style={{ width: "100%", maxWidth: 900, margin: "16px auto 40px" }}>
          <Suspense fallback={<div style={{ height: 48 }} />} >
            <ReferralBanner lang={typeof window !== "undefined" ? (navigator.language || "en") : "en"} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
