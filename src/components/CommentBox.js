import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";
import useBanCheck from "../hooks/useBanCheck";

function CommentSkeleton() {
  return (
    <div style={{
      width: "100%",
      maxWidth: 1200,
      margin: "36px auto",
      background: "none",
      borderRadius: 0,
      boxShadow: "none",
      padding: "0 0 50px 0",
      opacity: 0.55,
    }}>
      <div style={{ height: 32, background: "#f2f5fa", borderRadius: 7, width: 160, margin: "0 auto 26px auto" }} />
      <div style={{ display: "flex", gap: 10, marginBottom: 22, justifyContent: "center" }}>
        <div style={{ width: 92, height: 38, borderRadius: 8, background: "#e7f3fd" }} />
        <div style={{ flex: 1, height: 48, borderRadius: 11, background: "#f3f3f3" }} />
        <div style={{ width: 120, height: 38, borderRadius: 14, background: "#e3f0fb" }} />
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            borderBottom: "1.5px solid #f1f3f7",
            padding: "13px 0 9px 0",
            marginBottom: 14,
            borderRadius: 10,
            background: "#fafdff"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{ width: 58, height: 18, background: "#e3f0fb", borderRadius: 8 }} />
              <div style={{ width: 26, height: 13, background: "#f0f2f7", borderRadius: 7 }} />
              <div style={{ width: 55, height: 13, background: "#f0f2f7", borderRadius: 7 }} />
            </div>
            <div style={{ width: "90%", height: 17, background: "#f3f3f3", borderRadius: 7, marginLeft: 4, marginBottom: 2 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <div style={{ width: 48, height: 15, background: "#f0f2f7", borderRadius: 7 }} />
              <div style={{ width: 48, height: 15, background: "#f0f2f7", borderRadius: 7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLORS = {
  main: "#1976ed",
  danger: "#d33",
  like: "#1bb46e",
  gray: "#444",
  light: "#fafdff",
  border: "#e3f0fb",
  sub: "#45b7fa",
  text: "#222",
  soft: "#f5f7fa",
};

function getNow(t) {
  const d = new Date(t || Date.now());
  return (
    d.getFullYear() +
    "." +
    (d.getMonth() + 1) +
    "." +
    d.getDate() +
    " " +
    d.toTimeString().slice(0, 5)
  );
}
function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 127 ? 2 : 1;
  }
  return len;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function CommentBox({ cupId }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", data.user.id)
          .single();
        setNickname(profile?.nickname || "");
      }
    }
    fetchUser();
  }, []);

  const { isBanned, banInfo } = useBanCheck(user);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [cupId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("cup_id", cupId)
      .order("created_at", { ascending: false });
    setComments(data || []);
    setLoading(false);
  }

  function containsBadword(str) {
    return hasBadword(str, i18n.language);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!user || !nickname) {
      setError(t("comment.needLogin") || "로그인이 필요합니다.");
      return;
    }
    if (isBanned) {
      setError("정지된 유저는 댓글 작성이 제한됩니다.");
      return;
    }
    const text = content.trim();
    if (!text) return setError(t("comment.inputContent"));
    if (text.length > 80) return setError(t("comment.limit80"));
    if (text.split("\n").length > 5) return setError(t("comment.limitLines"));
    if (containsBadword(nickname))
      return setError(t("comment.badwordNickname") || "닉네임에 부적절한 단어가 포함되어 있습니다.");
    if (containsBadword(text))
      return setError(t("comment.badwordComment") || "댓글에 부적절한 단어가 포함되어 있습니다.");
    if (getByteLength(nickname) > 12)
      return setError(t("comment.limitNicknameByte") || "닉네임은 최대 12바이트까지 가능합니다.");

    setLoading(true);
    const { error: insertErr } = await supabase.from("comments").insert([
      {
        cup_id: cupId,
        nickname,
        content: text,
        user_id: user.id,
        upvotes: 0,
        downvotes: 0,
      }
    ]);
    setLoading(false);

    if (insertErr) {
      setError(insertErr.message || "댓글 저장 실패");
      return;
    }
    setContent("");
    fetchComments();
  }

  async function handleDelete(commentId, commentUserId) {
    if (!user) return;
    const isAdmin = nickname === "admin";
    if (!isAdmin && commentUserId !== user.id) {
      setError("본인 또는 관리자만 삭제할 수 있습니다.");
      return;
    }
    const { error: deleteErr } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (deleteErr) setError(deleteErr.message);
    fetchComments();
  }

  async function handleUpvote(commentId) {
    await supabase.rpc('increment_comment_upvotes', { comment_id: commentId });
    fetchComments();
  }
  async function handleDownvote(commentId) {
    await supabase.rpc('increment_comment_downvotes', { comment_id: commentId });
    fetchComments();
  }

  if (loading) return <CommentSkeleton />;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto 36px auto",
        background: "none",
        borderRadius: 0,
        boxShadow: "none",
        border: "none",
        padding: "0 0 32px 0",
        boxSizing: "border-box"
      }}
    >
      <h3
        style={{
          textAlign: "center",
          fontWeight: 800,
          margin: "0 0 18px 0",
          color: COLORS.main,
          letterSpacing: -1,
          fontSize: 23,
        }}
      >
        💬 {t("comment.comments")}
      </h3>
      {/* 로그인 필요 메시지 - 입력창 위에 1번만 표시 */}
      {!user && (
        <div
          style={{
            color: COLORS.main,
            textAlign: "left",
            margin: "0 0 8px 2px",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {t("comment.loginRequired") || "댓글을 작성하려면 로그인해야 합니다."}
        </div>
      )}
      {/* ===== 입력창(PC: 가로, 모바일: 세로) ===== */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 8 : 12,
          marginBottom: 18,
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: COLORS.main,
            fontSize: 16,
            background: "#f3f9fe",
            borderRadius: 8,
            padding: "9px 14px",
            border: `1.1px solid ${COLORS.border}`,
            minWidth: 72,
            textAlign: "center",
            width: isMobile ? "100%" : "fit-content"
          }}
          title={nickname}
        >
          {nickname || "?"}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 80))}
          placeholder={
            user ? (isBanned ? "정지된 유저는 댓글 작성이 제한됩니다." : t("comment.placeholder")) : ""
          }
          rows={3}
          disabled={!user || isBanned}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 44,
            maxHeight: 120,
            padding: "14px 14px",
            borderRadius: 11,
            border: `1.2px solid ${COLORS.border}`,
            fontSize: 16,
            resize: "vertical",
            background: (!user || isBanned) ? COLORS.soft : "#fff",
            fontWeight: 600,
            color: COLORS.text,
            lineHeight: 1.5,
            boxSizing: "border-box",
            width: isMobile ? "100%" : undefined,
          }}
          maxLength={80}
        />
        <button
          type="submit"
          disabled={!user || loading || isBanned}
          style={{
            padding: "12px 29px",
            borderRadius: 11,
            background: (!user || isBanned)
              ? "#bbb"
              : `linear-gradient(90deg, ${COLORS.main} 65%, ${COLORS.sub} 100%)`,
            color: "#fff",
            fontWeight: 800,
            fontSize: 17,
            border: "none",
            cursor: (!user || isBanned) ? "not-allowed" : "pointer",
            marginLeft: 0,
            marginTop: isMobile ? 0 : 0,
            height: 44,
            display: "flex",
            alignItems: "center",
            boxShadow: (!user || isBanned) ? "none" : "0 1px 8px #1976ed23",
            letterSpacing: -0.5,
            width: isMobile ? "100%" : undefined,
          }}
        >
          {loading ? t("comment.loading") || "등록중..." : t("comment.submit")}
        </button>
      </form>
      {isBanned && (
        <div style={{
          color: COLORS.danger,
          textAlign: "left",
          marginBottom: 10,
          fontWeight: 700,
          fontSize: 15,
        }}>
          🚫 정지된 유저는 댓글 작성이 제한됩니다.
          {banInfo && banInfo.expires_at && (
            <div>정지 해제일: {banInfo.expires_at.replace("T", " ").slice(0, 16)}</div>
          )}
          {banInfo && banInfo.reason && <div>사유: {banInfo.reason}</div>}
        </div>
      )}
      {error && (
        <div
          style={{
            color: COLORS.danger,
            marginBottom: 13,
            textAlign: "left",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {comments.length === 0 && (
          <div
            style={{
              color: "#aaa",
              textAlign: "center",
              margin: "26px 0",
              fontSize: 15.5,
            }}
          >
            {t("comment.noComments")}
          </div>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              borderBottom: "1.5px solid #f1f3f7",
              margin: "0 0 9px 0",
              padding: "13px 0 3px 0",
              background: "#fafdff",
              borderRadius: 10,
              marginBottom: 13,
              boxShadow: "none",
              transition: "box-shadow 0.15s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                width: "100%",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  minWidth: 58,
                  fontWeight: 700,
                  color: COLORS.main,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {c.nickname}
              </span>
              <span
                style={{
                  color: "#bbb",
                  fontWeight: 400,
                  fontSize: 13.2,
                  margin: "0 8px",
                }}
              >
                |
              </span>
              <span
                style={{
                  color: "#aaa",
                  fontSize: 13.3,
                  fontWeight: 500,
                  letterSpacing: 0.1,
                }}
              >
                {getNow(c.created_at)}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                textAlign: "left",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                overflowWrap: "break-word",
                color: COLORS.gray,
                fontSize: 15.7,
                fontWeight: 500,
                marginBottom: 2,
                marginLeft: 4,
                letterSpacing: 0.1,
              }}
            >
              {(c.downvotes >= 3 && c.downvotes >= (c.upvotes * 2)) ? (
                <span style={{ color: "#aaa", fontStyle: "italic" }}>
                  🚫 블라인드 처리된 댓글입니다
                </span>
              ) : (
                c.content
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 3,
                marginLeft: 4,
                alignItems: "center",
              }}
            >
              <button
                style={{
                  color: COLORS.like,
                  border: "none",
                  background: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 15,
                  padding: 0,
                }}
                onClick={() => handleUpvote(c.id)}
                title="추천"
              >
                👍 추천 {c.upvotes || 0}
              </button>
              <button
                style={{
                  color: COLORS.danger,
                  border: "none",
                  background: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 15,
                  padding: 0,
                }}
                onClick={() => handleDownvote(c.id)}
                title="비추천"
              >
                👎 비추천 {c.downvotes || 0}
              </button>
              {(user && (nickname === "admin" || c.user_id === user.id)) && (
                <button
                  style={{
                    color: "#888",
                    border: "none",
                    background: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    marginLeft: 3,
                    padding: 0,
                  }}
                  onClick={() => handleDelete(c.id, c.user_id)}
                  title={t("comment.delete")}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
