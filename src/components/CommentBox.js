import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";

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

export default function CommentBox({ cupId }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [cupId]);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("cup_id", cupId)
      .order("created_at", { ascending: false });
    setComments(data || []);
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

  // 👍 추천
  async function handleUpvote(commentId) {
    // 안전하게 DB에서 +1
    await supabase.rpc('increment_comment_upvotes', { comment_id: commentId });
    fetchComments();
  }
  // 👎 비추천
  async function handleDownvote(commentId) {
    await supabase.rpc('increment_comment_downvotes', { comment_id: commentId });
    fetchComments();
  }

  return (
    <div
      style={{
        maxWidth: 540,
        width: "100%",
        margin: "38px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 18px #1976ed11, 0 1px 6px #1976ed13",
        padding: "30px 22px",
        border: `1.3px solid ${COLORS.border}`,
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          fontWeight: 800,
          marginBottom: 18,
          color: COLORS.main,
          letterSpacing: -1,
          fontSize: 22,
        }}
      >
        💬 {t("comment.comments")}
      </h3>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: COLORS.main,
            fontSize: 16,
            background: "#f3f9fe",
            borderRadius: 8,
            padding: "7px 14px",
            border: `1.1px solid ${COLORS.border}`,
            minWidth: 80,
            textAlign: "center"
          }}
          title={nickname}
        >
          {nickname || "?"}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 80))}
          placeholder={
            user ? t("comment.placeholder") : t("comment.loginRequired")
          }
          rows={2}
          disabled={!user}
          style={{
            flex: 1,
            minWidth: 0,
            padding: 10,
            borderRadius: 9,
            border: `1.2px solid ${COLORS.border}`,
            fontSize: 15.5,
            resize: "none",
            background: user ? "#fff" : COLORS.soft,
            fontWeight: 600,
            color: COLORS.text,
          }}
          maxLength={80}
        />
        <button
          type="submit"
          disabled={!user || loading}
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            background: user
              ? `linear-gradient(90deg, ${COLORS.main} 65%, ${COLORS.sub} 100%)`
              : "#bbb",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            border: "none",
            cursor: user ? "pointer" : "not-allowed",
            boxShadow: user ? "0 1px 8px #1976ed23" : "none",
            letterSpacing: -0.5,
          }}
        >
          {loading ? t("comment.loading") || "등록중..." : t("comment.submit")}
        </button>
      </form>
      {!user && (
        <div
          style={{
            color: COLORS.main,
            textAlign: "center",
            marginBottom: 10,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {t("comment.loginRequired")}
        </div>
      )}
      {error && (
        <div
          style={{
            color: COLORS.danger,
            marginBottom: 13,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
      <div>
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
              boxShadow: "0 1.5px 4px #e3f0fb12",
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
