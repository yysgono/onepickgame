import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StatsPage from "./StatsPage";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

// 2줄(24*2byte) 초과시 ... 처리
function truncateToTwoLinesByByte(str, maxBytePerLine = 24) {
  let lines = [];
  let line = "";
  let byteCount = 0;
  let totalByte = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const b = ch.charCodeAt(0) > 127 ? 2 : 1;
    if (byteCount + b > maxBytePerLine) {
      lines.push(line);
      line = "";
      byteCount = 0;
      if (lines.length === 2) break;
    }
    line += ch;
    byteCount += b;
    totalByte += b;
  }
  if (lines.length < 2 && line) lines.push(line);

  // 2줄 넘는 경우 ... 처리
  if (totalByte > maxBytePerLine * 2) {
    let last = lines[1] || "";
    if (last.length > 0 && !last.endsWith("...")) {
      let lastByte = 0, j = 0;
      for (; j < last.length; j++) {
        lastByte += last.charCodeAt(j) > 127 ? 2 : 1;
        if (lastByte + 3 > maxBytePerLine) break; // 3은 "..."의 바이트수
      }
      last = last.slice(0, j) + "...";
      lines[1] = last;
    }
  }
  return lines;
}

// 모바일 체크 훅
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

export default function ResultPage({ worldcupList }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // DB fetch 상태
  const [cup, setCup] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = useIsMobile(800);

  // location.state로 온 데이터(있을 때만)
  const locationCup =
    location.state?.cup ||
    (worldcupList && worldcupList.find((c) => String(c.id) === id));
  const locationWinner = location.state?.winner;

  // 데이터 불러오기
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
        thisCup = cupData;
      }

      if (!thisWinner && thisCup) {
        let winnerObj = null;
        if (thisCup.winner_id) {
          if (thisCup.data) {
            winnerObj =
              thisCup.data.find((item) => String(item.id) === String(thisCup.winner_id)) ||
              null;
          } else {
            const { data: candidate } = await supabase
              .from("candidates")
              .select("*")
              .eq("id", thisCup.winner_id)
              .single();
            winnerObj = candidate;
          }
        }
        if (!winnerObj && thisCup?.data?.length > 0) winnerObj = thisCup.data[0];
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
  }, [id, locationCup, locationWinner]);

  // 1. 로딩 중
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
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 14,
            margin: "0 auto 18px",
            background: "#e7ecf7",
          }}
        />
        <div
          style={{
            height: 38,
            background: "#e3f0fb",
            width: 140,
            borderRadius: 10,
            margin: "0 auto 22px",
          }}
        />
        <div
          style={{
            height: 26,
            background: "#f3f3f3",
            width: 220,
            borderRadius: 8,
            margin: "0 auto 18px",
          }}
        />
        <div
          style={{
            height: 22,
            background: "#f0f2f7",
            width: 180,
            borderRadius: 8,
            margin: "0 auto 24px",
          }}
        />
        <div style={{ fontSize: 17, marginTop: 32, color: "#aaa" }}>
          {t("loading")}
        </div>
      </div>
    );

  // 2. 데이터 없는 경우
  if (!cup || !winner)
    return (
      <div style={{
        textAlign: "center", padding: 60, color: "#d33", minHeight: "60vh"
      }}>
        {t("error_no_data")}
        <br />
        <button onClick={() => window.location.reload()}>{t("retry")}</button>
        <br /><br />
        <a href="/" style={{ color: "#1976ed", textDecoration: "underline" }}>{t("home")}</a>
      </div>
    );

  // ==== 실제 결과/통계 화면 ====
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
      {/* 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.4)"
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "0 0 28px 0" : "0 0 44px 0",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* 상단: 통계 타이틀/우승자/재도전/홈 */}
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
              textShadow: "0 3px 8px #2228"
            }}
          >
            {/* 제목 필요시 여기에 추가 */}
          </h2>
          <div
            style={{
              fontSize: isMobile ? 24 : 29,
              fontWeight: 700,
              margin: "8px 0 3px 0",
              color: "#fff",
              textShadow: "0 3px 8px #2228"
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
              textShadow: "0 3px 8px #2228"
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
              }}
              onClick={() => navigate(`/select-round/${cup.id}`)}
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
              }}
              onClick={() => navigate("/")}
            >
              {t("home")}
            </button>
            {/* <ReportButton cupId={cup.id} size={isMobile ? "sm" : "md"} /> */}
          </div>
        </div>

        {/* 통계표 + 댓글토글 포함 */}
        <div style={{ margin: "0 auto 0 auto", maxWidth: 1200, width: "100%" }}>
          <StatsPage
            selectedCup={cup}
            showCommentBox={true}
            winner={winner}
            showShareAndReport={true}
          />
        </div>
      </div>
    </div>
  );
}
