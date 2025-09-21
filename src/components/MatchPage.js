// src/components/MatchPage.js
import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Match from "./Match";
import ReferralBanner from "./ReferralBanner";
import { pushRecentWorldcup } from "../utils";

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
  const { isMobile /*, isWideForSideAds*/ } = useViewport();

  const cup = useMemo(
    () => worldcupList.find((c) => String(c.id) === String(id)),
    [worldcupList, id]
  );

  // 페이지 진입 시 최근 본 기록
  useEffect(() => {
    if (cup?.id) pushRecentWorldcup(cup.id);
  }, [cup?.id]);

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
      {/* ⛔ 헤더 바로 아래 제휴 배너(쿠팡/아마존) 제거 — 애드센스 자동광고만 사용 */}

      {/* 가운데 단일 컬럼 (사이드 제휴 배너 제거) */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        {/* 메인 패널 (매치 본문) */}
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            background: "transparent",
            borderRadius: 0,
          }}
        >
          <Match cup={cup} onResult={() => {}} selectedCount={selectedCount} />

          {/* 🔻 하단은 레퍼럴 배너 유지 */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 18,
                marginBottom: 16,
              }}
            >
              <div style={{ width: "100%", maxWidth: 900 }}>
                <ReferralBanner lang={i18n.language || "en"} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⛔ 모바일 하단 고정 제휴 배너도 제거 — Match.js도 애드센스 자동광고만 사용 */}
    </div>
  );
}
