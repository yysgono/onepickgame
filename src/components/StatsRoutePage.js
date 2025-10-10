import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StatsPage from "./StatsPage";

function useIsMobile() {
  const [m, setM] = React.useState(window.innerWidth < 700);
  React.useEffect(() => {
    const onResize = () => setM(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return m;
}
function useViewportWidth() {
  const [vw, setVw] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vw;
}

export default function StatsRoutePage({ worldcupList }) {
  const { id, lang } = useParams();
  const location = useLocation();
  const { i18n } = useTranslation();

  const isMobile = useIsMobile();
  const vw = useViewportWidth();
  const isWideForSideAds = vw >= 1200;

  const cup =
    worldcupList?.find((c) => String(c.id) === String(id)) ||
    location.state?.cup ||
    null;

  if (!cup) return null;

  return (
    <div style={{ width: "100%", position: "relative", paddingBottom: isMobile ? 110 : 0 }}>
      {/* ⛔ 헤더 아래 배너 제거 (애드센스 자동광고만 사용) */}

      <div style={{ width: "100%", display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
        {/* ⛔ 좌측/우측 사이드 배너 제거 */}

        {/* 본문 */}
        <div style={{ width: "100%", maxWidth: 980 }}>
          <StatsPage selectedCup={cup} showCommentBox={true} />

          {/* ⛔ PC 하단 배너 제거 */}
        </div>
      </div>

      {/* ⛔ 모바일 하단 고정 배너 제거 */}
    </div>
  );
}
