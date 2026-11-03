import ContentCommentNotices from "./ContentCommentNotices";
// src/components/CommentBox.js
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";
import useBanCheck from "../hooks/useBanCheck";
import { addGuestComment, manageGuestComment } from "../utils/guestComments";

function CommentSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "36px auto",
        background: "#ffffff",
        borderRadius: 18,
        border: "2px solid #c9d5e6",
        boxShadow:
          "0 10px 28px rgba(31,50,84,0.08)",
        padding: "22px 24px 50px",
        opacity: 0.55,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 32,
          background: "#f2f5fa",
          borderRadius: 7,
          width: 160,
          margin: "0 auto 26px auto",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 22,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 92,
            height: 38,
            borderRadius: 8,
            background: "#e7f3fd",
          }}
        />

        <div
          style={{
            flex: 1,
            height: 48,
            borderRadius: 11,
            background: "#f3f3f3",
          }}
        />

        <div
          style={{
            width: 120,
            height: 38,
            borderRadius: 14,
            background: "#e3f0fb",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              border: "1.5px solid #d7e0ec",
              padding: "13px 14px 9px",
              marginBottom: 14,
              borderRadius: 12,
              background: "#fafdff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 18,
                  background: "#e3f0fb",
                  borderRadius: 8,
                }}
              />

              <div
                style={{
                  width: 26,
                  height: 13,
                  background: "#f0f2f7",
                  borderRadius: 7,
                }}
              />

              <div
                style={{
                  width: 55,
                  height: 13,
                  background: "#f0f2f7",
                  borderRadius: 7,
                }}
              />
            </div>

            <div
              style={{
                width: "90%",
                height: 17,
                background: "#f3f3f3",
                borderRadius: 7,
                marginLeft: 4,
                marginBottom: 2,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 15,
                  background: "#f0f2f7",
                  borderRadius: 7,
                }}
              />

              <div
                style={{
                  width: 48,
                  height: 15,
                  background: "#f0f2f7",
                  borderRadius: 7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLORS = {
  main: "#6650d8",
  danger: "#c83232",
  like: "#1bb46e",
  gray: "#444",
  light: "#fafdff",
  border: "#c4d1e3",
  sub: "#6650d8",
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
    typeof window !== "undefined"
      ? window.innerWidth < 700
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onResize = () =>
      setIsMobile(window.innerWidth < 700);

    window.addEventListener(
      "resize",
      onResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        onResize
      );
  }, []);

  return isMobile;
}

export default function CommentBox({
  cupId,
}) {
  const { t, i18n } = useTranslation();

  const [user, setUser] =
    useState(null);

  const [nickname, setNickname] =
    useState("");

  const [guestNickname, setGuestNickname] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  const [comments, setComments] =
    useState([]);

  const [content, setContent] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const isMobile =
    useIsMobile();

  useEffect(() => {
    async function fetchUser() {
      const { data } =
        await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);

        const { data: profile } =
          await supabase
            .from("public_member_names")
            .select("nickname")
            .eq(
              "id",
              data.user.id
            )
            .single();

        setNickname(
          profile?.nickname || ""
        );
      }
    }

    fetchUser();
  }, []);

  const {
    isBanned,
    banInfo,
  } = useBanCheck(user);

  useEffect(() => {
    fetchComments();

    // eslint-disable-next-line
  }, [cupId]);

  async function fetchComments() {
    setLoading(true);

    const { data } =
      await supabase
        .from("comments")
        .select("*")
        .eq(
          "cup_id",
          cupId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    setComments(
      data || []
    );

    setLoading(false);
  }

  function containsBadword(str) {
    return hasBadword(
      str,
      i18n.language
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    const authorName = user ? nickname : guestNickname.trim();
    if (!authorName || (!user && !guestPassword)) {
      setError(i18n.language.startsWith("ko") ? "닉네임과 수정·삭제용 비밀번호를 입력해주세요." : "Enter a nickname and password for editing/deleting.");
      return;
    }

    if (isBanned) {
      setError(
        t(
          "comment.banned"
        )
      );

      return;
    }

    const text =
      content.trim();

    if (!text) {
      return setError(
        t(
          "comment.inputContent"
        )
      );
    }

    if (
      text.length > 500
    ) {
      return setError(
        t(
          "comment.limit500"
        )
      );
    }

    if (
      text.split("\n").length >
      15
    ) {
      return setError(
        t(
          "comment.limitLines"
        )
      );
    }

    if (
      containsBadword(
        authorName
      )
    ) {
      return setError(
        t(
          "comment.badwordNickname"
        )
      );
    }

    if (
      containsBadword(
        text
      )
    ) {
      return setError(
        t(
          "comment.badwordComment"
        )
      );
    }

    if (
      user && getByteLength(authorName) > 12
    ) {
      return setError(
        t(
          "comment.limitNicknameByte"
        )
      );
    }

    setLoading(true);

    let insertErr = null;
    try {
      if (user) {
        const { error } = await supabase.from("comments").insert([{ cup_id: cupId, nickname: authorName, content: text, user_id: user.id, upvotes: 0, downvotes: 0 }]);
        insertErr = error;
      } else {
        await addGuestComment({ kind: "worldcup", targetId: cupId, nickname: authorName, password: guestPassword, content: text });
        setGuestPassword("");
      }
    } catch (error) { insertErr = error; }

    setLoading(false);

    if (insertErr) {
      setError(
        insertErr.message ||
          t(
            "comment.saveError"
          )
      );

      return;
    }

    setContent("");

    fetchComments();
  }

  async function handleDelete(commentId, commentUserId) {
    try {
      if (commentUserId) {
        if (!user || (nickname !== "admin" && commentUserId !== user.id)) throw new Error(t("comment.deleteAuth"));
        const { error } = await supabase.from("comments").delete().eq("id", commentId);
        if (error) throw error;
      } else {
        const password = window.prompt(i18n.language.startsWith("ko") ? "댓글 작성 때 입력한 비밀번호를 입력하세요." : "Enter the password used for this comment.");
        if (password === null) return;
        await manageGuestComment({ kind: "worldcup", commentId, password, action: "delete" });
      }
      fetchComments();
    } catch (deleteError) { setError(deleteError.message || t("comment.saveError")); }
  }

  async function handleGuestEdit(comment) {
    const password = window.prompt(i18n.language.startsWith("ko") ? "댓글 작성 때 입력한 비밀번호를 입력하세요." : "Enter the password used for this comment.");
    if (password === null) return;
    const next = window.prompt(i18n.language.startsWith("ko") ? "수정할 댓글 내용을 입력하세요." : "Enter the edited comment.", comment.content);
    if (next === null) return;
    const clean = next.trim();
    if (!clean || clean.length > 500 || clean.split("\n").length > 15 || containsBadword(clean)) return setError(t("comment.badwordComment"));
    try { await manageGuestComment({ kind: "worldcup", commentId: comment.id, password, action: "edit", content: clean }); fetchComments(); }
    catch (editError) { setError(editError.message || t("comment.saveError")); }
  }

  async function handleUpvote(
    commentId
  ) {
    await supabase.rpc(
      "vote_worldcup_comment",
      {
        p_comment_id:
          commentId,
        p_direction: "up",
      }
    );

    fetchComments();
  }

  async function handleDownvote(
    commentId
  ) {
    await supabase.rpc(
      "vote_worldcup_comment",
      {
        p_comment_id:
          commentId,
        p_direction: "down",
      }
    );

    fetchComments();
  }

  if (loading) {
    return (
      <CommentSkeleton />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,

        margin:
          "0 auto 36px auto",

        background:
          "#ffffff",

        borderRadius:
          18,

        border:
          "2px solid #c9d5e6",

        boxShadow:
          "0 10px 28px rgba(31,50,84,0.10), 0 0 0 1px rgba(102,80,216,0.04)",

        padding:
          isMobile
            ? "16px 12px 26px"
            : "22px 24px 30px",

        boxSizing:
          "border-box",
      }}
    >
      <h3
        style={{
          textAlign:
            "center",

          fontWeight:
            900,

          margin:
            "0 0 18px 0",

          color:
            COLORS.main,

          letterSpacing:
            -1,

          fontSize:
            isMobile
              ? 22
              : 25,
        }}
      >
        💬{" "}
        {t(
          "comment.comments"
        )}
      </h3>

      <ContentCommentNotices key={`worldcup-${cupId}`} kind="worldcup" targetId={cupId} />

      {!user && (
        <div
          style={{
            color:
              COLORS.main,

            textAlign:
              "left",

            margin:
              "0 0 8px 2px",

            fontWeight:
              700,

            fontSize:
              17,
          }}
        >
          {t(
            "comment.loginRequired"
          )}
        </div>
      )}

      {user && <form
        onSubmit={
          handleSubmit
        }
        style={{
          display:
            "flex",

          flexDirection:
            isMobile
              ? "column"
              : "row",

          alignItems:
            isMobile
              ? "stretch"
              : "center",

          gap:
            isMobile
              ? 8
              : 12,

          marginBottom:
            20,

          flexWrap:
            "wrap",

          padding:
            isMobile
              ? 10
              : 14,

          background:
            "#fbfcff",

          border:
            "1.5px solid #d7e0ec",

          borderRadius:
            14,
        }}
      >
        <div
          style={{
            fontWeight:
              700,

            color:
              COLORS.main,

            fontSize:
              18,

            background:
              "#f3f9fe",

            borderRadius:
              9,

            padding:
              "9px 14px",

            border:
              "1.7px solid #c4d1e3",

            minWidth:
              72,

            textAlign:
              "center",

            width:
              isMobile
                ? "100%"
                : "fit-content",

            boxSizing:
              "border-box",
          }}
          title={
            nickname
          }
        >
          {nickname ||
            t(
              "comment.unknownUser"
            )}
        </div>

        {!user ? (
          <div
            style={{
              flex:
                1,

              minHeight:
                44,

              display:
                "flex",

              alignItems:
                "center",

              color:
                "#596579",

              background:
                COLORS.soft,

              fontWeight:
                600,

              fontSize:
                18,

              borderRadius:
                11,

              border:
                "1.7px solid #c4d1e3",

              padding:
                "0 14px",

              width:
                isMobile
                  ? "100%"
                  : undefined,

              boxSizing:
                "border-box",
            }}
          >
            {t(
              "comment.loginRequired"
            )}
          </div>
        ) : (
          <textarea
            value={
              content
            }
            onChange={(
              e
            ) =>
              setContent(
                e.target.value.slice(
                  0,
                  500
                )
              )
            }
            placeholder={
              isBanned
                ? t(
                    "comment.banned"
                  )
                : t(
                    "comment.placeholder"
                  )
            }
            rows={
              5
            }
            disabled={
              !user ||
              isBanned
            }
            style={{
              flex:
                1,

              minWidth:
                0,

              minHeight:
                110,

              maxHeight:
                260,

              padding:
                "14px 14px",

              borderRadius:
                12,

              border:
                "2px solid #b9c8dc",

              fontSize:
                18,

              resize:
                "vertical",

              background:
                !user ||
                isBanned
                  ? COLORS.soft
                  : "#fff",

              fontWeight:
                600,

              color:
                COLORS.text,

              lineHeight:
                1.5,

              boxSizing:
                "border-box",

              width:
                isMobile
                  ? "100%"
                  : undefined,

              outline:
                "none",

              boxShadow:
                "inset 0 1px 3px rgba(31,50,84,0.06)",

              transition:
                "border-color .15s, box-shadow .15s",
            }}
            onFocus={(
              e
            ) => {
              e.currentTarget.style.borderColor =
                "#6650d8";

              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(102,80,216,0.10)";
            }}
            onBlur={(
              e
            ) => {
              e.currentTarget.style.borderColor =
                "#b9c8dc";

              e.currentTarget.style.boxShadow =
                "inset 0 1px 3px rgba(31,50,84,0.06)";
            }}
            maxLength={
              500
            }
          />
        )}

        <button
          type="submit"
          disabled={
            !user ||
            loading ||
            isBanned
          }
          style={{
            padding:
              "12px 29px",

            borderRadius:
              11,

            background:
              !user ||
              isBanned
                ? "#bbb"
                : `linear-gradient(90deg, ${COLORS.main} 65%, ${COLORS.sub} 100%)`,

            color:
              "#ffffff",

            fontWeight:
              800,

            fontSize:
              19,

            border:
              "none",

            cursor:
              !user ||
              isBanned
                ? "not-allowed"
                : "pointer",

            marginLeft:
              0,

            marginTop:
              0,

            height:
              44,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            boxShadow:
              !user ||
              isBanned
                ? "none"
                : "0 4px 16px rgba(102,80,216,0.22)",

            letterSpacing:
              -0.5,

            width:
              isMobile
                ? "100%"
                : undefined,
          }}
        >
          {loading
            ? t(
                "comment.loading"
              )
            : t(
                "comment.submit"
              )}
        </button>
      </form>}

      {!user && <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, margin: "0 0 20px", padding: 12, border: "1.5px solid #d7e0ec", borderRadius: 12, background: "#fbfcff" }}>
        <input value={guestNickname} onChange={e => setGuestNickname(e.target.value)} maxLength={20} autoComplete="nickname" placeholder={i18n.language.startsWith("ko") ? "임시 닉네임" : "Guest nickname"} style={{ minWidth: 0, height: 42, boxSizing: "border-box", padding: "0 10px", borderRadius: 8, border: "1px solid #c4d1e3" }} />
        <input type="password" value={guestPassword} onChange={e => setGuestPassword(e.target.value)} minLength={4} maxLength={50} autoComplete="new-password" placeholder={i18n.language.startsWith("ko") ? "수정·삭제용 비밀번호 (4~50자)" : "Password for editing/deleting (4–50 characters)"} style={{ minWidth: 0, height: 42, boxSizing: "border-box", padding: "0 10px", borderRadius: 8, border: "1px solid #c4d1e3" }} />
        <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 500))} maxLength={500} rows={4} placeholder={t("comment.placeholder")} style={{ gridColumn: "1 / -1", width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #c4d1e3" }} />
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><small>{i18n.language.startsWith("ko") ? "비밀번호를 잊으면 수정·삭제할 수 없습니다." : "Keep your password; it cannot be recovered."}</small><button disabled={loading || isBanned}>{t("comment.submit")}</button></div>
      </form>}

      {isBanned && (
        <div
          style={{
            color:
              COLORS.danger,

            textAlign:
              "left",

            marginBottom:
              10,

            fontWeight:
              700,

            fontSize:
              17,
          }}
        >
          🚫{" "}
          {t(
            "comment.banned"
          )}

          {banInfo &&
            banInfo.expires_at && (
              <div>
                {t(
                  "comment.banExpiresAt"
                )}
                :{" "}
                {banInfo.expires_at
                  .replace(
                    "T",
                    " "
                  )
                  .slice(
                    0,
                    16
                  )}
              </div>
            )}

          {banInfo &&
            banInfo.reason && (
              <div>
                {t(
                  "comment.banReason"
                )}
                :{" "}
                {
                  banInfo.reason
                }
              </div>
            )}
        </div>
      )}

      {error && (
        <div
          style={{
            color:
              COLORS.danger,

            marginBottom:
              13,

            textAlign:
              "left",

            fontWeight:
              600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          maxWidth:
            900,

          margin:
            "0 auto",
        }}
      >
        {comments.length ===
          0 && (
          <div
            style={{
              color:
                "#596579",

              textAlign:
                "center",

              margin:
                "26px 0",

              fontSize:
                17.5,
            }}
          >
            {t(
              "comment.noComments"
            )}
          </div>
        )}

        {comments.map(
          (c) => (
            <div
              key={
                c.id
              }
              style={{
                border:
                  "1.5px solid #d7e0ec",

                margin:
                  "0 0 13px 0",

                padding:
                  "14px 14px 10px",

                background:
                  "#fbfdff",

                borderRadius:
                  12,

                boxShadow:
                  "0 3px 10px rgba(31,50,84,0.05)",

                transition:
                  "box-shadow 0.15s, border-color 0.15s",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    7,

                  width:
                    "100%",

                  marginBottom:
                    5,
                }}
              >
                <span
                  style={{
                    minWidth:
                      58,

                    fontWeight:
                      800,

                    color:
                      COLORS.main,

                    fontSize:
                      17,

                    textAlign:
                      "left",
                  }}
                >
                  {
                    c.nickname
                  }
                </span>

                <span
                  style={{
                    color:
                      "#596579",

                    fontWeight:
                      400,

                    fontSize:
                      15.2,

                    margin:
                      "0 5px",
                  }}
                >
                  |
                </span>

                <span
                  style={{
                    color:
                      "#596579",

                    fontSize:
                      15.3,

                    fontWeight:
                      500,

                    letterSpacing:
                      0.1,
                  }}
                >
                  {getNow(
                    c.created_at
                  )}
                </span>
              </div>

              <div
                style={{
                  width:
                    "100%",

                  textAlign:
                    "left",

                  whiteSpace:
                    "pre-line",

                  wordBreak:
                    "break-all",

                  overflowWrap:
                    "break-word",

                  color:
                    COLORS.gray,

                  fontSize:
                    17.7,

                  fontWeight:
                    500,

                  marginBottom:
                    6,

                  letterSpacing:
                    0.1,

                  lineHeight:
                    1.55,
                }}
              >
                {c.downvotes >=
                  3 &&
                c.downvotes >=
                  c.upvotes *
                    2 ? (
                  <span
                    style={{
                      color:
                        "#596579",

                      fontStyle:
                        "italic",
                    }}
                  >
                    🚫{" "}
                    {t(
                      "comment.blinded"
                    )}
                  </span>
                ) : (
                  c.content
                )}
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    10,

                  marginTop:
                    4,

                  alignItems:
                    "center",
                }}
              >
                <button
                  style={{
                    color:
                      COLORS.like,

                    border:
                      "none",

                    background:
                      "none",

                    fontWeight:
                      700,

                    cursor:
                      "pointer",

                    fontSize:
                      17,

                    padding:
                      0,
                  }}
                  onClick={() =>
                    handleUpvote(
                      c.id
                    )
                  }
                  title={t(
                    "comment.upvote"
                  )}
                >
                  👍{" "}
                  {t(
                    "comment.upvote"
                  )}{" "}
                  {c.upvotes ||
                    0}
                </button>

                <button
                  style={{
                    color:
                      COLORS.danger,

                    border:
                      "none",

                    background:
                      "none",

                    fontWeight:
                      700,

                    cursor:
                      "pointer",

                    fontSize:
                      17,

                    padding:
                      0,
                  }}
                  onClick={() =>
                    handleDownvote(
                      c.id
                    )
                  }
                  title={t(
                    "comment.downvote"
                  )}
                >
                  👎{" "}
                  {t(
                    "comment.downvote"
                  )}{" "}
                  {c.downvotes ||
                    0}
                </button>

                {!c.user_id && <><button type="button" onClick={() => handleGuestEdit(c)} style={{ color: COLORS.main, border: "none", background: "none", fontWeight: 700, cursor: "pointer" }}>{i18n.language.startsWith("ko") ? "수정" : "Edit"}</button><button type="button" onClick={() => handleDelete(c.id, null)} style={{ color: COLORS.danger, border: "none", background: "none", fontWeight: 700, cursor: "pointer" }}>{t("comment.delete")}</button></>}

                {user &&
                  (nickname ===
                    "admin" ||
                    c.user_id ===
                      user.id) && (
                    <button
                      style={{
                        color:
                          "#596579",

                        border:
                          "none",

                        background:
                          "none",

                        fontWeight:
                          700,

                        cursor:
                          "pointer",

                        fontSize:
                          16,

                        marginLeft:
                          3,

                        padding:
                          0,
                      }}
                      onClick={() =>
                        handleDelete(
                          c.id,
                          c.user_id
                        )
                      }
                      title={t(
                        "comment.delete"
                      )}
                    >
                      {t(
                        "comment.delete"
                      )}
                    </button>
                  )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}