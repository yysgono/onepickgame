// src/components/NoticeBoard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// 반응형 감지 훅 (FixedCupSection과 동일)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// Notice array (content is not translated)
const notices = [
  {
    id: "notice-1",
    title: "What is One Pick Game?",
    content: `
One Pick Game is a tournament-style platform where you can find your personal “One Pick” among various candidates across different topics—such as food, celebrities, movies, music, and more.

Simply select a tournament that interests you, then choose your favorite from two options in each round. Keep picking until only one candidate—the one you like best—remains.
At the end, you’ll see not only your own “winner,” but also which choices are the most popular among other users.

You can also create your own custom tournaments, share them with friends, and enjoy a fun way to discover everyone’s favorites together!
    `.trim()
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
    `.trim()
  }
];

function NoticeBoard() {
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lang = "en" } = useParams();
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchRecent() {
      setLoading(true);
      const { data } = await supabase
        .from("comments")
        .select(`
          id, content, nickname, cup_id,
          worldcups ( title )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentComments((data || []).map(row => ({
        ...row,
        cupTitle: row.worldcups?.title || row.cup_id
      })));
      setLoading(false);
    }
    fetchRecent();
  }, []);

  return (
    <div
      style={{
        width: isMobile ? "98vw" : "100%",
        maxWidth: isMobile ? "99vw" : "1160px",
        minWidth: 0,
        borderRadius: 22,
        background: "linear-gradient(135deg,#181e2a 80%,#1c2335 100%)",
        boxShadow: "0 6px 28px 0 #12203f77",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: isMobile ? "18px 2vw 18px 2vw" : "28px 32px 28px 32px",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      {/* Title */}
      <div
        style={{
          fontWeight: 900,
          fontSize: isMobile ? 22 : 27,
          color: "#3faaff",
          letterSpacing: "-1.2px",
          marginBottom: 14,
          width: "100%",
          lineHeight: 1.09,
        }}
      >
        {t("notice_and_comments", "Notice & Recent Comments")}
      </div>

      {/* Notices */}
      <div style={{ marginBottom: 8, width: "100%" }}>
        {notices.map(notice => (
          <div
            key={notice.id}
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: "#ffe081",
              lineHeight: 1.18,
              cursor: "pointer",
              marginBottom: 3,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              width: "100%",
              padding: "2px 0 2px 2px",
              borderRadius: 5,
              transition: "background 0.12s",
            }}
            onClick={() => navigate(`/${lang}/notice/${notice.id}`)}
            title={t("see_details", "Click to see details")}
          >
            <span
              style={{
                paddingRight: 8,
                display: "inline-block",
                maxWidth: "100%",
                verticalAlign: "middle"
              }}
            >
              📢 {t(`notice_title_${notice.id}`, notice.title)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: 1,
          background: "#23355299",
          margin: "7px 0 6px 0"
        }}
      />

      {/* Recent Comments Title */}
      <div
        style={{
          width: "100%",
          fontWeight: 800,
          color: "#7ad6ff",
          fontSize: 16,
          margin: "0 0 5px 0"
        }}
      >
        {t("recent_comments", "Recent Comments")}
      </div>

      {/* Recent Comments List */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "none",
        }}
      >
        {loading ? (
          <div style={{ color: "#aaa", fontSize: 15 }}>
            {t("loading", "Loading...")}
          </div>
        ) : recentComments.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 15 }}>
            {t("no_comments", "No comments")}
          </div>
        ) : (
          recentComments.map(cmt => {
            const onClick = () => (window.location.href = `/${lang}/stats/${cmt.cup_id}`);

            // 공통 행 스타일
            const rowBase = {
              background: "#213046",
              borderRadius: 7,
              padding: isMobile ? "9px 12px" : "9px 14px",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              boxShadow: "0 1px 7px #1676ed10",
              cursor: "pointer",
              width: "100%",
            };

            if (isMobile) {
              // 모바일: 내용 2줄, 아래 메타 라인
              return (
                <div
                  key={cmt.id}
                  style={{ ...rowBase, display: "flex", flexDirection: "column", gap: 6 }}
                  title={`${cmt.content} / ${cmt.nickname} / ${cmt.cupTitle}`}
                  onClick={onClick}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cmt.content}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#cde9ff",
                      fontSize: 14,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <span style={{ color: "#ffe381", fontWeight: 800 }}>{cmt.nickname}</span>
                    {" • "}
                    <span style={{ color: "#a3d8ff", fontWeight: 600 }}>{cmt.cupTitle}</span>
                  </span>
                </div>
              );
            }

            // 데스크톱: grid 3열(내용 넓게 + 2줄 표시)
            return (
              <div
                key={cmt.id}
                style={{
                  ...rowBase,
                  display: "grid",
                  gridTemplateColumns: "minmax(360px, 2.2fr) 120px minmax(220px, 1.4fr)",
                  alignItems: "center",
                  columnGap: 16
                }}
                title={`${cmt.content} / ${cmt.nickname} / ${cmt.cupTitle}`}
                onClick={onClick}
              >
                {/* Comment Content (최대 2줄) */}
                <span
                  style={{
                    fontWeight: 900,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cmt.content}
                </span>

                {/* Nickname */}
                <span
                  style={{
                    color: "#ffe381",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cmt.nickname}
                </span>

                {/* Worldcup Title */}
                <span
                  style={{
                    color: "#a3d8ff",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cmt.cupTitle}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NoticeBoard;
