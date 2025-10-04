import React, { useEffect, useState } from "react";
import NoticeBoard from "./NoticeBoard";

// 반응형 감지 훅 (기존 유지)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// ✅ 추천 영역 제거하고 NoticeBoard만 전체 가로로 노출
function FixedCupSection({ worldcupList }) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1160,
        margin: isMobile ? "18px auto 10px auto" : "38px auto 24px auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <NoticeBoard />
    </div>
  );
}

export default FixedCupSection;
