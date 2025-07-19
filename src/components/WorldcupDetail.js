// src/components/WorldcupDetail.jsx

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mainButtonStyle, grayButtonStyle } from "../styles/common";
import MediaRenderer from "./MediaRenderer";

const DEFAULT_IMAGE = "/default-thumb.png";

function WorldcupDetail({ worldcupList }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const cup = worldcupList?.find(c => String(c.id) === id);
  if (!cup) return <div style={{ padding: 40 }}>{t("not_found") || "월드컵을 찾을 수 없습니다."}</div>;

  const shareUrl = `${window.location.origin}/worldcup/${cup.id}`;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    alert(t("link_copied") || "공유 링크가 복사되었습니다!");  // <-- 번역 적용!
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: isMobile ? "18px auto" : "40px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 24px #0001",
        padding: isMobile ? 18 : 32
      }}
    >
      <h2 style={{ marginBottom: 10, fontWeight: 800, fontSize: isMobile ? 22 : 30 }}>
        {cup.title}
      </h2>
      <div style={{ color: "#555", marginBottom: 20, fontSize: isMobile ? 15 : 18 }}>
        {cup.desc}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 8 : 18,
          marginBottom: 24,
          justifyContent: "flex-start"
        }}
      >
        {cup.data.map(item => (
          <div key={item.id} style={{ width: isMobile ? 74 : 120, textAlign: "center" }}>
            <div
              style={{
                width: isMobile ? 74 : 120,
                height: isMobile ? 56 : 90,
                borderRadius: 10,
                marginBottom: 6,
                overflow: "hidden",
                background: "#f8f8fa"
              }}
            >
              <MediaRenderer
                url={item.image || DEFAULT_IMAGE}
                alt={item.name}
              />
            </div>
            <div style={{ fontSize: isMobile ? 12 : 16 }}>{item.name}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
        <button
          onClick={() => navigate("/")}
          style={{
            ...grayButtonStyle(isMobile),
            padding: isMobile ? "7px 0" : "8px 22px",
            fontWeight: 700,
            minWidth: 80
          }}
        >
          {t("home") || "홈으로"}
        </button>
        <button
          onClick={handleCopy}
          style={{
            ...mainButtonStyle(isMobile),
            padding: isMobile ? "7px 0" : "8px 22px",
            fontWeight: 700,
            minWidth: 110
          }}
        >
          {t("copy_share_link") || "공유링크 복사"}
        </button>
      </div>
      <div style={{ marginTop: 20, color: "#888", fontSize: isMobile ? 11 : 13 }}>
        <b>{t("share_link") || "공유링크"}: </b>
        <input
          value={shareUrl}
          readOnly
          onFocus={e => e.target.select()}
          style={{
            width: isMobile ? 180 : 320,
            border: "1px solid #eee",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: isMobile ? 11 : 14
          }}
        />
      </div>
    </div>
  );
}

export default WorldcupDetail;
