import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StatsPage from "./StatsPage";
import AdsenseSide from "./AdsenseSide";
import AdsenseTop from "./AdsenseTop";

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
    <div
      style={{
        width: "100%",
        position: "relative",
        paddingBottom: isMobile ? 110 : 0,
      }}
    >
      {/* ✅ 상단 광고 */}
      {!isMobile && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <AdsenseTop />
        </div>
      )}

      {/* ✅ 전체 레이아웃 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          marginTop: 10,
        }}
      >
        {/* ✅ 왼쪽 광고 */}
        {!isMobile && isWideForSideAds && (
          <div style={{ width: 160, marginRight: 20 }}>
            <AdsenseSide />
          </div>
        )}

        {/* ✅ 메인 */}
        <div style={{ width: "100%", maxWidth: 980 }}>
          <StatsPage selectedCup={cup} showCommentBox={true} />
        </div>

        {/* ✅ 오른쪽 광고 */}
        {!isMobile && isWideForSideAds && (
          <div style={{ width: 160, marginLeft: 20 }}>
            <AdsenseSide />
          </div>
        )}
      </div>
    </div>
  );
}