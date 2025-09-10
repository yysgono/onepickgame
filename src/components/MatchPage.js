// src/components/MatchPage.js
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Match from "./Match";
import AdSlot from "./AdSlot";

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
  return { vw, isMobile: vw < 1000, isWideForSideAds: vw >= 1300 };
}

/**
 * props:
 *  - worldcupList: App에서 내려준 전체 리스트
 */
export default function MatchPage({ worldcupList = [] }) {
  const { id, round } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isMobile, isWideForSideAds } = useViewport();

  const cup = useMemo(
    () => worldcupList.find((c) => String(c.id) === String(id)),
    [worldcupList, id]
  );

  // 광고 공급자 (ko -> coupang, 그 외 -> amazon)
  const isKR =
    (i18n.language || "en").startsWith("ko") ||
    (typeof window !== "undefined" && window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  // 라운드 수
  const selectedCount = Math.max(2, Math.min(Number(round) || 2, 10000));

  if (!cup) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>
        Not found.
        <br />
        <button
          onClick={() =>
            navigate(`/${(i18n.language || "en").split("-")[0]}`)
          }
          style={{
            marginTop: 12,
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#1976ed",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* ✅ 헤더 바로 아래 광고: 데스크톱 728×90 / 모바일 320×100  (여기 1개만) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
        <div
          style={{
            width: isMobile ? 320 : 728,
            height: isMobile ? 100 : 90,
            marginBottom: 8,
          }}
        >
          {typeof window !== "undefined" && (
            <AdSlot
              id="ad-matchpage-header"
              provider={provider}
              width={isMobile ? 320 : 728}
              height={isMobile ? 100 : 90}
            />
          )}
        </div>
      </div>

      {/* 가운데 + 사이드 2칼럼 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        {/* 좌측 사이드 광고 (와이드에서만) */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 300,
              minWidth: 300,
              height: 600,
              position: "sticky",
              top: 100, // 헤더 높이에 맞춘 여백
              alignSelf: "flex-start",
            }}
          >
            {typeof window !== "undefined" && (
              <AdSlot
                id="ad-match-left"
                provider={provider}
                width={300}
                height={600}
              />
            )}
          </div>
        )}

        {/* 메인 패널 (매치 본문) */}
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            background: "transparent",
            borderRadius: 0,
          }}
        >
          {/* 후보 카드 뒤 흰 배경 광고 없음 — Match.js에서 제거되어 있어야 함 */}
          <Match cup={cup} onResult={() => {}} selectedCount={selectedCount} />

          {/* 하단 728×90 (PC에서만) */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 18,
                marginBottom: 16,
              }}
            >
              <div style={{ width: 728, height: 90 }}>
                {typeof window !== "undefined" && (
                  <AdSlot
                    id="ad-match-bottom-pc"
                    provider={provider}
                    width={728}
                    height={90}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 우측 사이드 광고 (와이드에서만) */}
        {!isMobile && isWideForSideAds && (
          <div
            style={{
              width: 300,
              minWidth: 300,
              height: 600,
              position: "sticky",
              top: 100,
              alignSelf: "flex-start",
            }}
          >
            {typeof window !== "undefined" && (
              <AdSlot
                id="ad-match-right"
                provider={provider}
                width={300}
                height={600}
              />
            )}
          </div>
        )}
      </div>

      {/* ✅ 모바일 하단 고정 광고는 Match.js 안에서 이미 렌더됨 */}
    </div>
  );
}
