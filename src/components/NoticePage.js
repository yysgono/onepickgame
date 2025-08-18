import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import Seo from "../seo/Seo";

export default function NoticePage() {
  const { t, i18n } = useTranslation();
  const { lang: paramLang } = useParams();
  const lang = (paramLang || i18n.language || "en").split("-")[0];

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
          // 콘솔에만 남기고, 화면은 우아하게 처리
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
        lang={lang}
        slug="notice"
        title="Notice"
        description="Latest announcements and updates for OnePickGame."
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
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
              </span>
              <br />
              <Link
                to={`/${lang}/notice/${encodeURIComponent(n.id)}`}
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
