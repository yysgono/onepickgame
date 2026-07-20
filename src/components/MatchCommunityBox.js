// src/components/MatchCommunityBox.js
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

const MAX_SUGGESTION_LENGTH = 100;
const SUGGESTION_LIST_LIMIT = 50;

function formatDate(value, language) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(language || "en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export default function MatchCommunityBox({ cupId }) {
  const { t, i18n } = useTranslation();

  const language = (i18n.language || "en").split("-")[0];

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [suggestion, setSuggestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setNickname("");
      return "";
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("MatchCommunityBox profile error:", error);
      setNickname("");
      return "";
    }

    const nextNickname = data?.nickname?.trim() || "";

    setNickname(nextNickname);
    return nextNickname;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      setAuthLoading(true);

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error) {
        console.error("MatchCommunityBox auth error:", error);
        setUser(null);
        setNickname("");
        setAuthLoading(false);
        return;
      }

      setUser(currentUser || null);

      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setNickname("");
      }

      if (mounted) {
        setAuthLoading(false);
      }
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;

      setUser(nextUser);
      setAuthLoading(false);

      if (nextUser) {
        fetchProfile(nextUser);
      } else {
        setNickname("");
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const fetchSuggestionCount = useCallback(async () => {
    if (!cupId) {
      setSuggestionCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("match_suggestions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("cup_id", cupId)
      .neq("status", "rejected");

    if (error) {
      console.error("MatchCommunityBox count error:", error);
      return;
    }

    setSuggestionCount(count || 0);
  }, [cupId]);

  const fetchSuggestions = useCallback(async () => {
    if (!cupId) {
      setSuggestions([]);
      setSuggestionCount(0);
      setSuggestionsLoaded(true);
      return;
    }

    setSuggestionsLoading(true);
    setSuggestionsError("");

    const { data, error } = await supabase
      .from("match_suggestions")
      .select("id, nickname, content, language, status, created_at")
      .eq("cup_id", cupId)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(SUGGESTION_LIST_LIMIT);

    if (error) {
      console.error("MatchCommunityBox suggestions error:", error);

      setSuggestions([]);
      setSuggestionsError(
        t("matchCommunity.suggestionLoadError", {
          defaultValue: "제출된 의견을 불러오지 못했습니다.",
        })
      );
    } else {
      const nextSuggestions = data || [];

      setSuggestions(nextSuggestions);

      /*
       * 목록은 최대 50개만 불러오므로 실제 전체 개수는
       * 별도의 count 쿼리 결과를 유지한다.
       */
      if (nextSuggestions.length < SUGGESTION_LIST_LIMIT) {
        setSuggestionCount(nextSuggestions.length);
      }
    }

    setSuggestionsLoading(false);
    setSuggestionsLoaded(true);
  }, [cupId, t]);

  useEffect(() => {
    setSuggestion("");
    setSubmitMessage("");
    setSubmitError("");

    setSuggestions([]);
    setSuggestionCount(0);
    setSuggestionsOpen(false);
    setSuggestionsLoaded(false);
    setSuggestionsLoading(false);
    setSuggestionsError("");

    fetchSuggestionCount();
  }, [cupId, fetchSuggestionCount]);

  async function handleToggleSuggestions() {
    const nextOpen = !suggestionsOpen;

    setSuggestionsOpen(nextOpen);

    if (nextOpen && !suggestionsLoaded) {
      await fetchSuggestions();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitMessage("");
    setSubmitError("");

    if (!cupId) {
      setSubmitError(
        t("matchCommunity.saveError", {
          defaultValue: "의견을 제출하지 못했습니다.",
        })
      );
      return;
    }

    if (!user?.id) {
      setSubmitError(
        t("matchCommunity.loginRequired", {
          defaultValue: "의견을 제출하려면 로그인해야 합니다.",
        })
      );
      return;
    }

    let currentNickname = nickname.trim();

    if (!currentNickname) {
      currentNickname = await fetchProfile(user);
    }

    if (!currentNickname) {
      setSubmitError(
        t("matchCommunity.nicknameRequired", {
          defaultValue: "프로필 닉네임이 필요합니다.",
        })
      );
      return;
    }

    const trimmedContent = suggestion.trim();

    if (!trimmedContent) {
      setSubmitError(
        t("matchCommunity.inputRequired", {
          defaultValue: "의견을 입력해 주세요.",
        })
      );
      return;
    }

    if (trimmedContent.length > MAX_SUGGESTION_LENGTH) {
      setSubmitError(
        t("matchCommunity.limit", {
          count: MAX_SUGGESTION_LENGTH,
          defaultValue: "의견은 최대 {{count}}자까지 입력할 수 있습니다.",
        })
      );
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("match_suggestions")
      .insert({
        cup_id: cupId,
        user_id: user.id,
        nickname: currentNickname,
        content: trimmedContent,
        language,
        status: "pending",
      })
      .select("id, nickname, content, language, status, created_at")
      .single();

    setSubmitting(false);

    if (error) {
      console.error("MatchCommunityBox suggestion insert error:", error);

      setSubmitError(
        t("matchCommunity.saveError", {
          defaultValue: "의견을 제출하지 못했습니다.",
        })
      );
      return;
    }

    setSuggestion("");

    setSubmitMessage(
      t("matchCommunity.success", {
        defaultValue: "의견이 제출되었습니다.",
      })
    );

    setSuggestionCount((current) => current + 1);

    if (data) {
      setSuggestions((current) => {
        const withoutDuplicate = current.filter(
          (item) => item.id !== data.id
        );

        return [data, ...withoutDuplicate].slice(
          0,
          SUGGESTION_LIST_LIMIT
        );
      });

      setSuggestionsLoaded(true);
    }
  }

  const inputDisabled = authLoading || !user || submitting;
  const submitDisabled =
    inputDisabled || suggestion.trim().length === 0;

  return (
    <section
      style={{
        width: "calc(100% - 24px)",
        maxWidth: 900,
        margin: "30px auto 48px",
        padding: 20,
        boxSizing: "border-box",
        border: "1px solid rgba(25, 118, 237, 0.5)",
        borderRadius: 16,
        background:
          "linear-gradient(145deg, rgba(17, 28, 53, 0.96), rgba(20, 35, 68, 0.94))",
        boxShadow:
          "0 10px 35px rgba(0, 0, 0, 0.35), 0 0 18px rgba(25, 118, 237, 0.12)",
        color: "#fff",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          <span aria-hidden="true">💡</span>

          <span>
            {t("matchCommunity.suggestionTitle", {
              defaultValue: "후보 또는 개선사항 건의",
            })}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flexWrap: "wrap",
            gap: 8,
            width: "100%",
          }}
        >
          <input
            type="text"
            value={suggestion}
            maxLength={MAX_SUGGESTION_LENGTH}
            disabled={inputDisabled}
            onChange={(event) => {
              setSuggestion(event.target.value);
              setSubmitError("");
              setSubmitMessage("");
            }}
            placeholder={
              authLoading
                ? t("loading", {
                    defaultValue: "불러오는 중...",
                  })
                : user
                  ? t("matchCommunity.placeholder", {
                      defaultValue:
                        "예: 이 월드컵에 새로운 후보를 추가해 주세요.",
                    })
                  : t("matchCommunity.loginPlaceholder", {
                      defaultValue:
                        "로그인 후 의견을 제출할 수 있습니다.",
                    })
            }
            aria-label={t("matchCommunity.suggestionTitle", {
              defaultValue: "후보 또는 개선사항 건의",
            })}
            style={{
              flex: "1 1 280px",
              minWidth: 0,
              height: 46,
              padding: "0 14px",
              boxSizing: "border-box",
              border: "1px solid rgba(95, 212, 243, 0.45)",
              borderRadius: 10,
              outline: "none",
              background: inputDisabled ? "#2b3446" : "#f8fafc",
              color: inputDisabled ? "#9ca6b8" : "#172033",
              fontSize: 15,
              fontWeight: 600,
            }}
          />

          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              flex: "0 0 auto",
              minWidth: 92,
              height: 46,
              padding: "0 18px",
              border: "none",
              borderRadius: 10,
              background: submitDisabled
                ? "#59677f"
                : "linear-gradient(135deg, #1976ed, #2796f3)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              whiteSpace: "nowrap",
              cursor: submitDisabled ? "not-allowed" : "pointer",
              boxShadow: submitDisabled
                ? "none"
                : "0 4px 14px rgba(25, 118, 237, 0.3)",
            }}
          >
            {submitting
              ? t("matchCommunity.submitting", {
                  defaultValue: "제출 중...",
                })
              : t("matchCommunity.submit", {
                  defaultValue: "제출",
                })}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            minHeight: 18,
            marginTop: 7,
            fontSize: 12,
          }}
        >
          <span
            role={submitError ? "alert" : undefined}
            style={{
              minWidth: 0,
              color: submitError
                ? "#ff8c8c"
                : submitMessage
                  ? "#73e6a4"
                  : "#94a3b8",
              fontWeight:
                submitError || submitMessage ? 700 : 500,
              wordBreak: "break-word",
            }}
          >
            {submitError || submitMessage}
          </span>

          <span
            style={{
              flexShrink: 0,
              color:
                suggestion.length >= MAX_SUGGESTION_LENGTH
                  ? "#ff8c8c"
                  : "#94a3b8",
            }}
          >
            {suggestion.length}/{MAX_SUGGESTION_LENGTH}
          </span>
        </div>
      </form>

      <div
        style={{
          height: 1,
          margin: "20px 0 14px",
          background: "rgba(255, 255, 255, 0.12)",
        }}
      />

      <button
        type="button"
        onClick={handleToggleSuggestions}
        aria-expanded={suggestionsOpen}
        aria-controls={`match-suggestions-${cupId}`}
        style={{
          width: "100%",
          minHeight: 46,
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: 10,
          background: suggestionsOpen
            ? "rgba(25, 118, 237, 0.18)"
            : "rgba(255, 255, 255, 0.06)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>
          💬{" "}
          {t("matchCommunity.viewSuggestions", {
            count: suggestionCount,
            defaultValue: "제출된 의견 보기 ({{count}})",
          })}
        </span>

        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontSize: 13,
            transform: suggestionsOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </button>

      {suggestionsOpen && (
        <div
          id={`match-suggestions-${cupId}`}
          style={{
            marginTop: 12,
            padding: "0 12px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 10,
            background: "rgba(0, 0, 0, 0.12)",
          }}
        >
          {suggestionsLoading && (
            <div
              style={{
                padding: "24px 0",
                color: "#9ba8bc",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {t("loading", {
                defaultValue: "불러오는 중...",
              })}
            </div>
          )}

          {!suggestionsLoading && suggestionsError && (
            <div
              role="alert"
              style={{
                padding: "24px 0",
                color: "#ff8c8c",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {suggestionsError}

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 8,
                    background: "#1976ed",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {t("retry", {
                    defaultValue: "다시 시도",
                  })}
                </button>
              </div>
            </div>
          )}

          {!suggestionsLoading &&
            !suggestionsError &&
            suggestions.length === 0 && (
              <div
                style={{
                  padding: "24px 0",
                  color: "#9ba8bc",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {t("matchCommunity.noSuggestions", {
                  defaultValue: "아직 제출된 의견이 없습니다.",
                })}
              </div>
            )}

          {!suggestionsLoading &&
            !suggestionsError &&
            suggestions.map((item, index) => (
              <article
                key={item.id}
                style={{
                  padding: "14px 2px",
                  borderBottom:
                    index === suggestions.length - 1
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <strong
                    style={{
                      color: "#5fd4f3",
                      fontSize: 14,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.nickname ||
                      t("matchCommunity.unknownUser", {
                        defaultValue: "알 수 없는 사용자",
                      })}
                  </strong>

                  <time
                    dateTime={item.created_at || undefined}
                    style={{
                      color: "#8492a8",
                      fontSize: 12,
                    }}
                  >
                    {formatDate(item.created_at, i18n.language)}
                  </time>
                </div>

                <div
                  style={{
                    color: "#e7edf7",
                    fontSize: 14,
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.content}
                </div>
              </article>
            ))}

          {!suggestionsLoading &&
            !suggestionsError &&
            suggestionCount > suggestions.length &&
            suggestions.length > 0 && (
              <div
                style={{
                  padding: "12px 0",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#8492a8",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {t("matchCommunity.latestSuggestionsOnly", {
                  count: SUGGESTION_LIST_LIMIT,
                  defaultValue:
                    "최근 {{count}}개의 의견만 표시됩니다.",
                })}
              </div>
            )}
        </div>
      )}
    </section>
  );
}