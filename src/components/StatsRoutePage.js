import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdSlot from "./AdSlot";
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

  const isKR =
    (i18n.language || "en").startsWith("ko") || (window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  const cup =
    worldcupList?.find((c) => String(c.id) === String(id)) ||
    location.state?.cup ||
    null;

  if (!cup) return null;

  return (
    <div style={{ width: "100%", position: "relative", paddingBottom: isMobile ? 110 : 0 }}>
      {/* 헤더 밑 */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: isMobile ? 320 : 728, height: isMobile ? 100 : 90, marginTop: isMobile ? 8 : 12 }}>
          <AdSlot id="ad-stats-header" provider={provider} width={isMobile ? 320 : 728} height={isMobile ? 100 : 90} />
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
        {/* 좌 */}
        {!isMobile && isWideForSideAds && (
          <div style={{ width: 300, minWidth: 300, height: 600, position: "sticky", top: 86, alignSelf: "flex-start" }}>
            <AdSlot id="ad-stats-left" provider={provider} width={300} height={600} />
          </div>
        )}

        {/* 본문 */}
        <div style={{ width: "100%", maxWidth: 980 }}>
          <StatsPage selectedCup={cup} showCommentBox={true} />
          {!isMobile && (
            <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "22px 0 10px" }}>
              <div style={{ width: 728, height: 90 }}>
                <AdSlot id="ad-stats-footer-pc" provider={provider} width={728} height={90} />
              </div>
            </div>
          )}
        </div>

        {/* 우 */}
        {!isMobile && isWideForSideAds && (
          <div style={{ width: 300, minWidth: 300, height: 600, position: "sticky", top: 86, alignSelf: "flex-start" }}>
            <AdSlot id="ad-stats-right" provider={provider} width={300} height={600} />
          </div>
        )}
      </div>

      {/* 모바일 하단 고정 */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            background: "rgba(10,12,18,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ width: 320, height: 100 }}>
            <AdSlot id="ad-stats-footer-mobile" provider={provider} width={320} height={100} />
          </div>
        </div>
      )}
    </div>
  );
}
