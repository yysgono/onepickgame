import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import Seo from "../seo/Seo";

// 기본 내장 공지 (DB에 없을 때 폴백)
const notices = [
  {
    id: "notice-1",
    title: "What is One Pick Game?",
    content: `
One Pick Game is a tournament-style platform where you can find your personal “One Pick” among various candidates across different topics—such as food, celebrities, movies, music, and more.

Simply select a tournament that interests you, then choose your favorite from two options in each round. Keep picking until only one candidate—the one you like best—remains.
At the end, you’ll see not only your own “winner,” but also which choices are the most popular among other users.

You can also create your own custom tournaments, share them with friends, and enjoy a fun way to discover everyone’s favorites together!
    `.trim(),
  },
  {
    id: "notice-2",
    title: "How to Create Your Own World Cup",
    content: `
Want to make your own World Cup tournament? It's easy!

1. Click the “Create World Cup” button on the main page.
2. Enter a title, a description, and add images (or text) for each candidate.
3. You can upload images directly, or use links. Make sure to add at least 4 candidates for a fun tournament.
4. When you’re done, click “Save.” Your World Cup will appear on the main page and can be played by anyone.
5. Share the link with your friends and see who becomes the top pick!

Tip: You can always edit or delete your tournaments later.  
Have fun making and sharing your own unique One Pick World Cups!
    `.trim(),
  },
];

export default function NoticeDetail() {
  const { t, i18n } = useTranslation();
  const { id: rawId, lang: paramLang } = useParams();
  const lang = (paramLang || i18n.language || "en").split("-")[0];
  const id = String(rawId || "");
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchNotice() {
      try {
        setLoading(true);
        let found = null;

        // DB에서 조회 (내장 notice-*는 제외)
        if (!id.startsWith("notice-")) {
          const { data, error } = await supabase
            .from("notice")
            .select("*")
            .eq("id", id)
            .single();

          if (!error && data) {
            found = data;
          }
        }

        // DB에 없으면 내장 배열에서 폴백
        if (!found) {
          found = notices.find((n) => n.id === id) || null;
        }

        if (mounted) setNotice(found);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Fetch notice detail error:", e);
        if (mounted) setNotice(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) fetchNotice();
    else {
      setNotice(null);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", color: "#222" }}>
        <h2>{t("loading", "Loading...")}</h2>
      </div>
    );
  }

  if (!notice) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", color: "#222" }}>
        <h2>{t("notice_not_found", "Notice not found")}</h2>
        <button
          onClick={() => navigate(`/${lang}/notice`)}
          style={{
            marginTop: 12,
            padding: "8px 14px",
            background: "#1976ed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {t("back_to_list", "Back to Notices")}
        </button>
      </div>
    );
  }

  const createdAtText = notice.created_at
    ? new Date(notice.created_at).toLocaleString()
    : "";

  return (
    <>
      <Seo
        lang={lang}
        slug={`notice/${encodeURIComponent(id)}`}
        title={notice.title || "Notice"}
        description={(notice.content || "").slice(0, 140)}
      />
      <div
        style={{
          maxWidth: 700,
          margin: "60px auto",
          background: "#f7fbff",
          borderRadius: 16,
          boxShadow: "0 2px 16px #1976ed22",
          color: "#1c2335",
          padding: 38,
        }}
      >
        <h2
          style={{
            color: "#1976ed",
            fontWeight: 900,
            fontSize: 26,
            marginBottom: 16,
          }}
        >
          {notice.title}
        </h2>
        <div style={{ color: "#888", marginBottom: 14, fontSize: 14 }}>
          {createdAtText}
        </div>
        <div
          style={{
            fontSize: 18,
            marginTop: 18,
            lineHeight: 1.88,
            whiteSpace: "pre-line",
          }}
        >
          {notice.content}
        </div>
        {/* 필요 시 목록 복귀 버튼을 쓰고 싶다면 아래 주석 해제
        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => navigate(`/${lang}/notice`)}
            style={{
              padding: "8px 14px",
              background: "#1976ed",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {t("back_to_list", "Back to Notices")}
          </button>
        </div>
        */}
      </div>
    </>
  );
}
