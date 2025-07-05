// ResultPage.js

import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StatsPage from "./StatsPage";
import CommentBox from "./CommentBox";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

// 신고버튼(동일)
function ReportButton({ cupId, size = "md" }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const style =
    size === "sm"
      ? {
          color: "#d33",
          background: "#fff4f4",
          border: "1.2px solid #f6c8c8",
          borderRadius: 8,
          padding: "3px 11px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          minWidth: 50,
        }
      : {
          color: "#d33",
          background: "#fff4f4",
          border: "1.5px solid #f6c8c8",
          borderRadius: 8,
          padding: "6px 18px",
          fontSize: 17,
          fontWeight: 700,
          cursor: "pointer",
          minWidth: 60,
        };
  async function handleReport() {
    setError("");
    setOk("");
    const { data } = await supabase.auth.getUser();
    if (!data?.user?.id) return setError("로그인 필요");
    const { error } = await supabase.from("reports").insert([
      {
        type: "worldcup",
        target_id: cupId,
        reporter_id: data.user.id,
        reason,
      },
    ]);
    if (error) setError(error.message);
    else setOk("신고가 접수되었습니다. 감사합니다.");
  }
  return (
    <>
      <button onClick={() => setShow(true)} style={style}>
        🚩 신고
      </button>
      {show && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "#0006",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              minWidth: 270,
            }}
          >
            <b>신고 사유</b>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "95%", minHeight: 60, marginTop: 12 }}
              placeholder="신고 사유를 입력하세요 (선택)"
            />
            <div style={{ marginTop: 12 }}>
              <button onClick={handleReport} style={{ marginRight: 10 }}>
                신고하기
              </button>
              <button onClick={() => setShow(false)}>닫기</button>
            </div>
            {ok && <div style={{ color: "#1976ed", marginTop: 7 }}>{ok}</div>}
            {error && <div style={{ color: "#d33", marginTop: 7 }}>{error}</div>}
          </div>
        </div>
      )}
    </>
  );
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

export default function ResultPage({ worldcupList }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ====== DB fetch용 추가 상태 ======
  const [cup, setCup] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = useIsMobile(800);

  // location.state로 온 데이터(있을 때만)
  const locationCup =
    location.state?.cup ||
    (worldcupList && worldcupList.find((c) => String(c.id) === id));
  const locationWinner = location.state?.winner;

  // URL 파라미터에서 round도 있으면 사용
  const url = new URL(window.location.href);
  const round = url.pathname.split("/")[3] || null;

  // 데이터 불러오기 (location.state 없으면 DB에서)
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);

      let thisCup = locationCup;
      let thisWinner = locationWinner;

      // 월드컵 데이터 없으면 DB에서
      if (!thisCup) {
        // 월드컵 본체
        const { data: cupData } = await supabase
          .from("worldcups")
          .select("*")
          .eq("id", id)
          .single();
        thisCup = cupData;
      }

      // 우승자도 없으면 월드컵에서 계산 (winner가 있으면 바로, 없으면 서버에서 우승자 fetch)
      if (!thisWinner && thisCup) {
        // 우승자 추정 로직: 가장 많이 이긴 후보? (아니면 stats 따로 있으면 그걸 fetch)
        // 여기서는 worldcup 테이블에 winner_id 저장했다고 가정
        let winnerObj = null;
        if (thisCup.winner_id) {
          // winner_id가 있으면 후보 중에서 찾기
          if (thisCup.data) {
            winnerObj =
              thisCup.data.find((item) => String(item.id) === String(thisCup.winner_id)) ||
              null;
          } else {
            // candidates 별도 테이블에서 찾아오기
            const { data: candidate } = await supabase
              .from("candidates")
              .select("*")
              .eq("id", thisCup.winner_id)
              .single();
            winnerObj = candidate;
          }
        }
        // winner_id가 없거나 못 찾으면 첫번째 후보로 fallback
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
    // eslint-disable-next-line
  }, [id, locationCup, locationWinner]);

  // 로딩/에러 처리
  if (loading || !cup || !winner)
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
      </div>
    );

  // ==== 실제 결과화면 ====
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: isMobile ? "0 0 28px 0" : "0 0 44px 0",
        background: "#f5f7fa",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* 상단: 통계 타이틀/우승자/재도전/홈/신고/공유 */}
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
            color: "#222",
            fontSize: isMobile ? 35 : 48,
            margin: "32px 0 6px 0",
            letterSpacing: -2,
            lineHeight: 1.08,
          }}
        >
          통계
        </h2>
        <div
          style={{
            fontSize: isMobile ? 24 : 29,
            fontWeight: 700,
            margin: "8px 0 3px 0",
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
          }}
        >
          {winner.name}
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
            홈
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            margin: "13px auto 0 auto",
          }}
        >
          <ReportButton cupId={cup.id} size="sm" />
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              window?.toast?.success
                ? window.toast.success("링크가 복사되었습니다!")
                : alert("링크가 복사되었습니다!");
            }}
            style={{
              color: "#1976ed",
              background: "#e8f2fe",
              border: "1.2px solid #b8dafe",
              borderRadius: 8,
              padding: "4px 14px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 15,
              minWidth: 60,
            }}
          >
            📢 월드컵 공유하기
          </button>
        </div>
      </div>

      {/* 통계표 + 댓글토글 포함 */}
      <div style={{ margin: "0 auto 0 auto", maxWidth: 1200, width: "100%" }}>
        <StatsPage
          selectedCup={cup}
          showCommentBox={false}
          winner={winner}
        />
      </div>
    </div>
  );
}
