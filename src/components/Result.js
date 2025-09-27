// src/components/Result.jsx
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
  lazy,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";

// ——— Lazy imports
const StatsPage = React.lazy(() => import(/* webpackPrefetch: true */ "./StatsPage"));
const MediaRenderer = lazy(() => import("./MediaRenderer"));

// ——— requestIdleCallback 폴리필 (사파리 등)
const ric =
  typeof window !== "undefined" && window.requestIdleCallback
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 200);

// ——— StatsPage 청크 프리페치(한 번만)
let statsPrefetchPromise = null;
function prefetchStatsPage() {
  if (!statsPrefetchPromise) {
    statsPrefetchPromise = import(/* webpackPrefetch: true */ "./StatsPage").catch(() => {
      // 실패해도 앱 흐름에 영향 없도록 무시
    });
  }
  return statsPrefetchPromise;
}

function useOnScreen(options) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let obs;
    try {
      obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          prefetchStatsPage(); // ★ 근접만 해도 미리 당겨오기
          setVisible(true);
          obs.disconnect();
        }
      }, options);
      obs.observe(ref.current);
    } catch {
      setVisible(true);
    }
    return () => obs && obs.disconnect();
  }, [options]);

  return [ref, visible, setVisible];
}

function Result({ winner, cup, onRestart, onStats }) {
  const { t } = useTranslation();
  const [, startTransition] = useTransition();

  // StatsPage를 뷰포트에 들어오면 로드
  const [statsAnchorRef, statsVisible, setStatsVisible] = useOnScreen({ rootMargin: "1600px 0px" }); // ★ 더 일찍

  // ★ 1) 들어오자마자 프리페치(Idle 기다리지 않음)
  useEffect(() => {
    prefetchStatsPage();
  }, []);

  // ★ 2) 사용자가 Stats 버튼에 손만 올려도(hint) 프리페치
  const handleStatsHover = useCallback(() => {
    prefetchStatsPage();
  }, []);

  // ★ 3) Stats 클릭 시 즉시 보이도록 가속(선택)
  const handleStatsClick = useCallback(() => {
    // 먼저 프리페치 시도(이미 되었으면 즉시 resolve)
    prefetchStatsPage()?.finally(() => {
      setStatsVisible(true); // 바로 마운트
      startTransition(() => onStats && onStats());
    });
  }, [onStats, setStatsVisible, startTransition]);

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
        <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#f3f4f9" }} />} >
          <MediaRenderer url={winner.image} alt={winner.name} loading="lazy" decoding="async" />
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
        onClick={() => startTransition(() => onRestart && onRestart())}
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
        onMouseEnter={handleStatsHover}
        onFocus={handleStatsHover}
        onClick={handleStatsClick}
      >
        {t("stats")}
      </button>

      {/* ★ 숨김 프리마운트: 화면엔 안 보이지만 StatsPage는 마운트되어 fetch/캐시가 즉시 동작 */}
      <Suspense fallback={null}>
        <div style={{ display: "none" }} aria-hidden>
          <StatsPage selectedCup={cup} headless />
        </div>
      </Suspense>

      {/* StatsPage를 화면에 보일 때만 마운트 → 초기 페인트 훨씬 가벼움 (rootMargin 확대로 “더 빨리” 마운트됨) */}
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
