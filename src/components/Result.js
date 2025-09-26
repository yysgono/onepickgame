import React, { Suspense, useEffect, useRef, useState, useTransition, lazy } from "react";
import { useTranslation } from "react-i18next";

// 지연 로딩
const StatsPage = React.lazy(() => import("./StatsPage"));
const MediaRenderer = lazy(() => import("./MediaRenderer"));

function useOnScreen(options) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let obs;
    try {
      obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // 한 번 보이면 관찰 종료
        }
      }, options);
      obs.observe(ref.current);
    } catch {
      // IntersectionObserver 미지원 브라우저 대비: 즉시 표시
      setVisible(true);
    }
    return () => obs && obs.disconnect();
  }, [options]);

  return [ref, visible];
}

function Result({ winner, cup, onRestart, onStats }) {
  const { t } = useTranslation();
  const [, startTransition] = useTransition();

  // StatsPage를 뷰포트에 들어오면 로드
  const [statsAnchorRef, statsVisible] = useOnScreen({ rootMargin: "200px 0px" });

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 10 }}>🥇 {t("winner")}</h2>

      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 14,
          marginBottom: 12,
          background: "#eee",
          border: "3px solid #1976ed",
          overflow: "hidden",
        }}
      >
        <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#f3f4f9" }} />}>
          <MediaRenderer url={winner.image} alt={winner.name} loading="lazy" />
        </Suspense>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 26,
          maxWidth: 380,
          margin: "0 auto 26px auto",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "normal",
          lineHeight: 1.24,
          wordBreak: "break-all",
        }}
        title={winner.name}
      >
        {winner.name}
      </div>

      <button
        style={{
          padding: "10px 32px",
          borderRadius: 10,
          background: "#1976ed",
          color: "#fff",
          fontWeight: 700,
          border: "none",
          fontSize: 20,
          marginTop: 8,
          cursor: "pointer",
        }}
        onClick={() => startTransition(() => onRestart())}
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
          marginLeft: 20,
          marginTop: 8,
          cursor: "pointer",
        }}
        onClick={() => startTransition(() => onStats())}
      >
        {t("stats")}
      </button>

      {/* StatsPage를 화면에 보일 때만 마운트 → 초기 페인트 훨씬 가벼움 */}
      <div ref={statsAnchorRef} style={{ margin: "60px auto 0", maxWidth: 840 }}>
        <Suspense
          fallback={
            <div
              style={{
                width: "100%",
                minHeight: 200,
                borderRadius: 12,
                background: "#f6f8fc",
                boxShadow: "0 2px 12px #0001",
              }}
            />
          }
        >
          {statsVisible ? <StatsPage selectedCup={cup} mode="lite" /> : null}
        </Suspense>
      </div>
    </div>
  );
}

export default Result;
