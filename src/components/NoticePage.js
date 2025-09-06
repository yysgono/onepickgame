import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import Seo from "../seo/Seo";

export default function NoticePage() {
  const { t } = useTranslation();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchNotices() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("notice")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          // eslint-disable-next-line no-console
          console.error("Fetch notice error:", error);
        }
        if (mounted) setNotices(Array.isArray(data) ? data : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Unexpected notice fetch error:", e);
        if (mounted) setNotices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchNotices();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Seo
        lang="en"
        slug="notice"                       // 실제 경로: /notice
        title="Notice"
        description="Latest announcements and updates for OnePickGame."
        langPrefix={false}                  // ✅ /[slug] 형식으로 canonical 생성
        hreflangLangs={["en"]}              // ✅ 영어 전용 페이지
      />
      <div
        style={{
          maxWidth: 800,
          margin: "60px auto",
          padding: 28,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 2px 14px #2222",
          minHeight: 420,
          color: "#1c2335",
        }}
      >
        <h2 style={{ color: "#1976ed", fontWeight: 900, marginBottom: 18 }}>
          📢 {t("notice", "Notice")}
        </h2>

        {loading && <div style={{ color: "#888" }}>{t("loading", "Loading...")}</div>}

        {!loading && (notices || []).length === 0 && (
          <div style={{ color: "#888" }}>{t("no_notices", "No notices yet.")}</div>
        )}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {(notices || []).map((n) => (
            <li
              key={n.id}
              style={{
                padding: "15px 0 13px 0",
                borderBottom: "1px solid #dde5f7",
              }}
            >
              <b style={{ fontSize: 19, color: "#23366b" }}>{n.title}</b>
              <span style={{ color: "#aaa", fontSize: 13, marginLeft: 10 }}>
                {n.created_at ? new Date(n.created_at).toLocaleDateString("en", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                }) : ""}
              </span>
              <br />
              <Link
                to={`/notice/${encodeURIComponent(n.id)}`}   // ✅ 언어 프리픽스 제거
                style={{
                  color: "#1676ed",
                  fontSize: 15,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {t("view_detail", "View Detail")}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
