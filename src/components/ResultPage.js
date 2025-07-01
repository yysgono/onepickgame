import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StatsPage from "./StatsPage";
import CommentBox from "./CommentBox";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";

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

function ResultPage({ worldcupList }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const winner = location.state?.winner;
  const cup = worldcupList.find(c => String(c.id) === id);
  const isMobile = useIsMobile(800);

  if (!cup || !winner)
    return <div style={{ padding: 80 }}>{t("cannotShowResult")}</div>;

  if (isMobile) {
    return (
      <div style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#f5f7fa",
      }}>
        <div style={{
          maxWidth: "96vw",
          margin: "0 auto",
          background: "#fff",
          borderRadius: 18,
          padding: "24px 3vw 12px 3vw",
          textAlign: "center"
        }}>
          {/* 결과 */}
          <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 10 }}>
            🥇 {t("winner")}
          </h2>
          <div style={{
            width: 180,
            height: 180,
            borderRadius: 14,
            margin: "0 auto 12px auto",
            background: "#eee",
            border: "3px solid #1976ed",
            overflow: "hidden",
          }}>
            <MediaRenderer url={winner.image} alt={winner.name} />
          </div>
          <div style={{
            fontSize: 23,
            fontWeight: 600,
            margin: "0 auto 12px auto",
            maxWidth: 170,
            wordBreak: "break-all",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            whiteSpace: "normal",
            lineHeight: 1.18,
            textAlign: "center",
          }}>
            {winner.name}
          </div>
          <div className="page-title" style={{
            fontWeight: 800,
            fontSize: "1.62em",
            marginBottom: 16,
            wordBreak: "break-all"
          }}>
            {cup.title}
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            marginBottom: 18,
            flexWrap: "wrap"
          }}>
            <button
              style={{
                padding: "10px 32px",
                borderRadius: 10,
                background: "#1976ed",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                fontSize: 18,
                marginTop: 8
              }}
              onClick={() => navigate(`/select-round/${cup.id}`)}
            >
              {t("retry")}
            </button>
            <button
              style={{
                padding: "10px 28px",
                borderRadius: 10,
                background: "#ddd",
                color: "#333",
                fontWeight: 700,
                border: "none",
                fontSize: 17,
                marginTop: 8
              }}
              onClick={() => navigate("/")}
            >
              홈
            </button>
          </div>
          {/* 통계 */}
          <div style={{
            margin: "30px auto 0",
            maxWidth: 700,
            width: "100%",
            overflowX: "auto"
          }}>
            <StatsPage selectedCup={cup} showCommentBox={false} />
          </div>
          {/* 댓글 */}
          <div style={{
            maxWidth: "96vw",
            margin: "16px auto 0 auto",
            background: "#fff",
            borderRadius: 18,
            padding: "18px 0 26px 0",
          }}>
            <CommentBox cupId={cup.id} />
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑: 왼쪽 결과/통계, 오른쪽 댓글 (두 컬럼)
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 44,
        padding: "60px 0",
        boxSizing: "border-box",
        background: "#f5f7fa"
      }}
    >
      {/* 왼쪽: 결과 + 통계 */}
      <div style={{
        flex: 1,
        maxWidth: 650,
        minWidth: 400,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 3px 16px #0002",
        padding: "36px 40px",
        textAlign: "center"
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 10 }}>
          🥇 {t("winner")}
        </h2>
        <div style={{
          width: 180,
          height: 180,
          borderRadius: 14,
          margin: "0 auto 12px auto",
          background: "#eee",
          border: "3px solid #1976ed",
          overflow: "hidden",
        }}>
          <MediaRenderer url={winner.image} alt={winner.name} />
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 600,
          margin: "0 auto 12px auto",
          maxWidth: 260,
          wordBreak: "break-all",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          whiteSpace: "normal",
          lineHeight: 1.18,
          textAlign: "center",
        }}>
          {winner.name}
        </div>
        <div className="page-title" style={{
          fontWeight: 800,
          fontSize: "2.34em",
          marginBottom: 16,
          wordBreak: "break-all"
        }}>
          {cup.title}
        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap"
        }}>
          <button
            style={{
              padding: "10px 32px",
              borderRadius: 10,
              background: "#1976ed",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              fontSize: 20,
              marginTop: 8
            }}
            onClick={() => navigate(`/select-round/${cup.id}`)}
          >
            {t("retry")}
          </button>
          <button
            style={{
              padding: "10px 28px",
              borderRadius: 10,
              background: "#ddd",
              color: "#333",
              fontWeight: 700,
              border: "none",
              fontSize: 19,
              marginTop: 8
            }}
            onClick={() => navigate("/")}
          >
            홈
          </button>
        </div>
        {/* 통계 */}
        <div style={{
          margin: "30px auto 0",
          maxWidth: 840,
          width: "100%",
          overflowX: "auto"
        }}>
          <StatsPage selectedCup={cup} showCommentBox={false} />
        </div>
      </div>
      {/* 오른쪽: 댓글창 */}
      <div style={{
        flex: 1,
        maxWidth: 650,
        minWidth: 400,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 3px 16px #0002",
        padding: "36px 40px",
        alignSelf: "flex-start"
      }}>
        <CommentBox cupId={cup.id} />
      </div>
    </div>
  );
}

export default ResultPage;
