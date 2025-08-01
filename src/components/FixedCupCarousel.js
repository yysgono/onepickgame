import React, { useEffect, useState } from "react";
import MediaRenderer from "./MediaRenderer";
import NoticeBoard from "./NoticeBoard";

// 1,2위 후보 뽑는 함수
function getTop2Winners(winStats, cupData) {
  if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];
  const sorted = [...winStats]
    .map((row, i) => ({ ...row, _originIdx: i }))
    .sort((a, b) => {
      if ((b.win_count || 0) !== (a.win_count || 0))
        return (b.win_count || 0) - (a.win_count || 0);
      if ((b.match_wins || 0) !== (a.match_wins || 0))
        return (b.match_wins || 0) - (a.match_wins || 0);
      return a._originIdx - b._originIdx;
    });
  const first =
    cupData?.find((c) => c.id === sorted[0]?.candidate_id) ||
    cupData?.[0] ||
    null;
  const second =
    cupData?.find((c) => c.id === sorted[1]?.candidate_id) ||
    cupData?.[1] ||
    null;
  return [first, second];
}

// ⭐ 스켈레톤 카드 (로딩중 더미)
function SkeletonRecommendCard({ isMobile }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: isMobile ? "90vw" : 340,
        maxWidth: isMobile ? "98vw" : 440,
        margin: isMobile ? "0 auto 22px auto" : "0 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 15,
        background: "#22304c44",
        boxShadow: "0 2px 18px #16264d22",
        padding: "0 0 16px 0",
        opacity: 0.8,
        position: "relative",
        animation: "pulse 1.25s infinite",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 168,
          borderRadius: 13,
          marginBottom: 18,
          background: "#283b6144",
        }}
      />
      <div
        style={{
          width: "90%",
          height: 38,
          borderRadius: 8,
          background: "#26385a33",
        }}
      />
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.75 }
            50% { opacity: 1 }
            100% { opacity: 0.75 }
          }
        `}
      </style>
    </div>
  );
}

// 반응형 감지 훅
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// 메인 추천 월드컵 박스 (좌측)
function FixedCupSection({ worldcupList }) {
  const lang = "en";
  const recommends = worldcupList?.slice(0, 2) || [];
  const isMobile = useIsMobile();

  function renderRecommendCups() {
    return (
      <div
        style={{
          width: "100%",
          minHeight: isMobile ? 180 : 230,
          borderRadius: 22,
          background: "linear-gradient(135deg,#181e2a 80%,#1c2335 100%)",
          boxShadow: "0 8px 36px 0 #12203f55",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "18px 6vw 18px 6vw" : "34px 42px 30px 42px",
          boxSizing: "border-box",
        }}
      >
        {/* 추천 문구는 항상 보여주기 */}
        <div
          style={{
            fontWeight: 900,
            fontSize: isMobile ? 22 : 33,
            color: "#3faaff",
            letterSpacing: "-1.4px",
            textAlign: "center",
            marginBottom: isMobile ? 16 : 28,
            marginTop: -2,
            width: "100%",
          }}
        >
          Recommend World Cup
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 22 : 34,
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {(!recommends || recommends.length === 0 || !recommends[0]?.id) ? (
            <>
              <SkeletonRecommendCard isMobile={isMobile} />
              <SkeletonRecommendCard isMobile={isMobile} />
            </>
          ) : (
            recommends.map((recommend) => {
              if (!recommend) return null;
              const [first, second] = getTop2Winners(recommend.winStats, recommend.data);
              return (
                <div
                  key={recommend.id}
                  style={{
                    flex: 1,
                    minWidth: isMobile ? "90vw" : 340,
                    maxWidth: isMobile ? "98vw" : 440,
                    margin: isMobile ? "0 auto 22px auto" : "0 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    borderRadius: 15,
                    background: "#22304c",
                    boxShadow: "0 2px 18px #16264d33",
                    transition: "box-shadow 0.13s, transform 0.13s",
                    padding: "0 0 16px 0",
                    position: "relative",
                  }}
                  onClick={() =>
                    (window.location.href = `/${lang}/select-round/${recommend.id}`)
                  }
                  title={recommend.title}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 32px #1976ed77";
                    e.currentTarget.style.transform = "translateY(-3.5px) scale(1.033)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 18px #16264d33";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* 썸네일 크게 */}
                  <div
                    style={{
                      width: "100%",
                      height: isMobile ? 120 : 168,
                      display: "flex",
                      flexDirection: "row",
                      borderRadius: 13,
                      overflow: "hidden",
                      marginBottom: 18,
                      background: "linear-gradient(90deg, #243151 75%, #344972 100%)",
                      position: "relative",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ width: "50%", height: "100%", background: "#162147" }}>
                      {first?.image
                        ? <MediaRenderer url={first.image} alt="1st place" />
                        : <div style={{ width: "100%", height: "100%", background: "#283b61" }} />}
                    </div>
                    <div style={{ width: "50%", height: "100%", background: "#232b50" }}>
                      {second?.image
                        ? <MediaRenderer url={second.image} alt="2nd place" />
                        : <div style={{ width: "100%", height: "100%", background: "#233" }} />}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        width: isMobile ? 36 : 61,
                        height: isMobile ? 36 : 61,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img src="/vs.png" alt="vs" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  </div>
                  {/* 타이틀 분리 - 아래쪽 */}
                  <div
                    style={{
                      width: "90%",
                      background: "#26385a",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: isMobile ? 15 : 21,
                      borderRadius: 8,
                      textAlign: "center",
                      padding: isMobile ? "10px 4px" : "13px 4px 13px 4px",
                      margin: "0 auto",
                      letterSpacing: "-0.1px",
                      overflow: "hidden",
                      boxShadow: "0 1.5px 6px #1976ed11",
                    }}
                  >
                    {recommend.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // 전체 레이아웃 - 반응형
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1160,
        margin: isMobile ? "18px auto 10px auto" : "38px auto 24px auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? "22px" : "40px",
        alignItems: "start",
        minHeight: 410,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          minHeight: 410,
        }}
      >
        {renderRecommendCups()}
      </div>
      <div
        style={{
          width: "100%",
          minHeight: 410,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <NoticeBoard />
      </div>
    </div>
  );
}

export default FixedCupSection;
