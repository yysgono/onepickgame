import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";

// 색상
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

const COMMENT_KEY = "comments";

// 시간 포맷
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

function isSpam(newComment, cupId, comments) {
  const now = Date.now();
  const list = comments[cupId] || [];
  return list.some(
    (c) =>
      c.nickname === newComment.nickname &&
      c.content === newComment.content &&
      now - c.time < 60 * 1000
  );
}

function isTripleRepeatNickname(nickname, cupId, comments) {
  const list = comments[cupId] || [];
  if (list.length < 3) return false;
  return (
    list[0].nickname === nickname &&
    list[1].nickname === nickname &&
    list[2].nickname === nickname
  );
}

export default function CommentBox({ cupId }) {
  const { t, i18n } = useTranslation();
  const currentUser = localStorage.getItem("onepickgame_user") || "";
  const isAdmin = currentUser === "admin";
  const [nickname, setNickname] = useState(currentUser || "");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
    setComments((all[cupId] || []).sort((a, b) => b.time - a.time));
  }, [cupId]);

  function containsBadword(str) {
    return hasBadword(str, i18n.language);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const nick = (currentUser || nickname).trim();
    const text = content.trim();

    if (!currentUser) return setError(t("comment.needLogin"));
    if (!nick) return setError(t("comment.inputNickname"));
    if (!text) return setError(t("comment.inputContent"));
    if (text.length > 80) return setError(t("comment.limit80"));
    if (text.split("\n").length > 5) return setError(t("comment.limitLines"));
    if (containsBadword(nick))
      return setError(t("comment.badwordNickname") || "닉네임에 부적절한 단어가 포함되어 있습니다.");
    if (containsBadword(text))
      return setError(t("comment.badwordComment") || "댓글에 부적절한 단어가 포함되어 있습니다.");
    const all = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
    if (isSpam({ nickname: nick, content: text }, cupId, all))
      return setError(t("spam_warning") || "You can't post the same comment too frequently. (1 min)");
    if (isTripleRepeatNickname(nick, cupId, all))
      return setError(t("triple_warning") || "You can't post 4 consecutive comments with the same nickname.");

    const newComment = {
      id: Date.now() + Math.random(),
      nickname: nick,
      content: text,
      time: Date.now(),
      like: 0,
      dislike: 0,
      likedUsers: [],
      dislikedUsers: [],
    };
    all[cupId] = [newComment, ...(all[cupId] || [])].slice(0, 50); // 최대 50개
    localStorage.setItem(COMMENT_KEY, JSON.stringify(all));
    setComments(all[cupId]);
    setContent("");
  };

  const handleVote = (commentId, type) => {
    const nick = (currentUser || nickname).trim() || t("anonymous");
    const all = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
    const list = all[cupId] || [];
    const idx = list.findIndex((c) => c.id === commentId);
    if (idx === -1) return;
    const c = list[idx];
    if (type === "like") {
      if (c.likedUsers.includes(nick)) {
        c.like = Math.max(0, c.like - 1);
        c.likedUsers = c.likedUsers.filter((u) => u !== nick);
      } else {
        c.like += 1;
        c.likedUsers.push(nick);
        c.dislikedUsers = c.dislikedUsers.filter((u) => u !== nick);
        c.dislike = c.dislikedUsers.length;
      }
    } else {
      if (c.dislikedUsers.includes(nick)) {
        c.dislike = Math.max(0, c.dislike - 1);
        c.dislikedUsers = c.dislikedUsers.filter((u) => u !== nick);
      } else {
        c.dislike += 1;
        c.dislikedUsers.push(nick);
        c.likedUsers = c.likedUsers.filter((u) => u !== nick);
        c.like = c.likedUsers.length;
      }
    }
    all[cupId] = list;
    localStorage.setItem(COMMENT_KEY, JSON.stringify(all));
    setComments([...list]);
  };

  // 관리자: 모든 댓글 삭제 가능, 일반: 자기 것만 삭제 가능
  const handleDelete = (commentId) => {
    const all = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
    let newComments;
    if (isAdmin) {
      newComments = (all[cupId] || []).filter((c) => c.id !== commentId);
    } else {
      newComments = (all[cupId] || []).filter((c) => !(c.id === commentId && c.nickname === currentUser));
    }
    all[cupId] = newComments;
    localStorage.setItem(COMMENT_KEY, JSON.stringify(all));
    setComments(newComments);
  };

  return (
    <div
      style={{
        maxWidth: 540,
        margin: "38px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 18px #1976ed11, 0 1px 6px #1976ed13",
        padding: "30px 22px",
        border: `1.3px solid ${COLORS.border}`,
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
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 16))}
          placeholder={t("comment.nickname")}
          maxLength={16}
          disabled={!!currentUser}
          style={{
            width: 120,
            padding: 10,
            borderRadius: 9,
            border: `1.2px solid ${COLORS.border}`,
            textAlign: "center",
            fontSize: 15.5,
            background: currentUser ? "#eee" : "#fff",
            fontWeight: 600,
            color: COLORS.gray,
          }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 80))}
          placeholder={
            currentUser
              ? t("comment.placeholder")
              : t("comment.loginRequired")
          }
          rows={2}
          disabled={!currentUser}
          style={{
            flex: 1,
            minWidth: 0,
            padding: 10,
            borderRadius: 9,
            border: `1.2px solid ${COLORS.border}`,
            fontSize: 15.5,
            resize: "none",
            background: currentUser ? "#fff" : COLORS.soft,
            fontWeight: 600,
            color: COLORS.text,
          }}
          maxLength={80}
        />
        <button
          type="submit"
          disabled={!currentUser}
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            background: currentUser
              ? `linear-gradient(90deg, ${COLORS.main} 65%, ${COLORS.sub} 100%)`
              : "#bbb",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            border: "none",
            cursor: currentUser ? "pointer" : "not-allowed",
            boxShadow: currentUser ? "0 1px 8px #1976ed23" : "none",
            letterSpacing: -0.5,
          }}
        >
          {t("comment.submit")}
        </button>
      </form>
      {!currentUser && (
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
                {getNow(c.time)}
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
              {c.content}
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
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 14.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: 0,
                }}
                onClick={() => handleVote(c.id, "like")}
                title={t("comment.like")}
                disabled={!currentUser}
              >
                👍 {c.like || 0}
              </button>
              <button
                style={{
                  color: COLORS.danger,
                  border: "none",
                  background: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 14.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: 0,
                }}
                onClick={() => handleVote(c.id, "dislike")}
                title={t("comment.report")}
                disabled={!currentUser}
              >
                🚩 {c.dislike || 0}
              </button>
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
                onClick={() => handleDelete(c.id)}
                title={t("comment.delete")}
                disabled={
                  !(currentUser && (isAdmin || c.nickname === currentUser))
                }
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
