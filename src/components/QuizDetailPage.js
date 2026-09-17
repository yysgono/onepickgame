import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getQuiz,
  getQuizQuestions,
  incrementQuizPlay,
  getQuizzes,
  saveQuizAttempt,
  getQuizRankingStats,
  reportQuizQuestion,
  deleteQuiz,
} from "../utils/supabaseQuizApi";
import QuizCommentBox from "./QuizCommentBox";
import Seo from "../seo/Seo";
import { getQuizSeo } from "../seo/quizSeo";
// The supplied project contains the completed locale bundle in this folder.
import { getQuizCopy } from "./components/quizCopy";
import MediaRenderer from "./MediaRenderer";
import { supabase } from "../utils/supabaseClient";

function localize(map, fallback, lang) {
  return map && typeof map === "object"
    ? map[lang] || map.en || fallback || ""
    : fallback || "";
}

function shuffle(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeAnswer(value, settings = {}) {
  let text = String(value || "").trim();
  if (settings.ignore_case !== false) text = text.toLocaleLowerCase();
  if (settings.ignore_spaces) text = text.replace(/\s+/g, "");
  return text;
}

function formatCopy(text, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)), text || "");
}

function ensureFourOptions(options, choiceLabel = "Choice") {
  const result = (Array.isArray(options) ? options : [])
    .map((value) => String(value || "").trim())
    .slice(0, 4);
  while (result.length < 4) result.push("");
  return result.map((value, index) => value || `${choiceLabel} ${index + 1}`);
}

function preloadQuestionImages(questions) {
  const urls = Array.from(new Set((questions || []).map((q) => q.image_url).filter(Boolean)));
  return Promise.all(urls.map((url) => new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(resolve, 8000);
    const done = () => {
      clearTimeout(timeout);
      resolve();
    };
    img.onload = done;
    img.onerror = done;
    img.src = url;
  })));
}

function buildSession(allQuestions, count, shuffleOrder = true, choiceLabel = "Choice") {
  const answerPool = allQuestions
    .filter(
      (q) =>
        q.question_type === "multiple_choice" &&
        q.source_candidate_id &&
        Array.isArray(q.options) &&
        q.options[q.correct_index]
    )
    .map((q) => String(q.options[q.correct_index]).trim())
    .filter(Boolean);

  const orderedQuestions = shuffleOrder ? shuffle(allQuestions) : [...allQuestions];
  return orderedQuestions
    .slice(0, Math.min(count, allQuestions.length))
    .map((q) => {
      if (q.question_type !== "multiple_choice") {
        return { ...q };
      }
      if (!q.auto_choices) {
        return { ...q, options: ensureFourOptions(q.options, choiceLabel) };
      }
      const correct = String(q.options?.[q.correct_index] || "").trim();
      const originalWrong = (Array.isArray(q.options) ? q.options : [])
        .map((x) => String(x || "").trim())
        .filter((name) => name && name !== correct);
      const wrongPool = Array.from(new Set([...answerPool, ...originalWrong]))
        .filter((name) => name && name !== correct);
      const wrong = shuffle(wrongPool).slice(0, 3);
      let options = shuffle([correct, ...wrong]);
      while (options.length < 4) {
        const fallback = originalWrong.find((name) => !options.includes(name));
        if (!fallback) break;
        options.push(fallback);
      }
      options = ensureFourOptions(options, choiceLabel);
      return {
        ...q,
        options,
        correct_index: Math.max(0, options.indexOf(correct)),
      };
    });
}

export default function QuizDetailPage() {
  const { id, lang: routeLang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = routeLang || (i18n.language || "en").split("-")[0];
  const c = getQuizCopy(lang);

  const [quiz, setQuiz] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [playerRevealMode, setPlayerRevealMode] = useState("both");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [shortAnswerWarning, setShortAnswerWarning] = useState("");
  const [locked, setLocked] = useState(false);
  const [records, setRecords] = useState([]);
  const [phase, setPhase] = useState("setup");
  const [resultFilter, setResultFilter] = useState("all");
  const [resultVisibleCount, setResultVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommended, setRecommended] = useState([]);
  const [randomLoading, setRandomLoading] = useState(false);
  const [attemptToken, setAttemptToken] = useState("");
  const [rankingStats, setRankingStats] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportType, setReportType] = useState("wrong_answer");
  const [reportDetail, setReportDetail] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const timerRef = useRef(null);
  const deadlineRef = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id || ""));
  }, []);

  const isOwner = Boolean(currentUserId && quiz?.user_id && String(currentUserId) === String(quiz.user_id));

  async function removeOwnedQuiz() {
    if (!isOwner || deletingQuiz) return;
    if (!window.confirm(c.deleteQuizConfirm)) return;
    setDeletingQuiz(true);
    try {
      await deleteQuiz(id);
      sessionStorage.removeItem(`quiz-result:${id}`);
      navigate(`/${lang}/quiz`, { replace: true });
    } catch (e) {
      alert(e?.message === "LOGIN_REQUIRED" ? c.deleteQuizLogin : (e?.message || c.deleteQuizFailed));
    } finally {
      setDeletingQuiz(false);
    }
  }

  const ownerControls = isOwner ? (
    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
      <button type="button" onClick={() => navigate(`/${lang}/quiz/create?edit=${id}`)} style={{ ...secondaryButton, minHeight: 46, padding: "10px 18px", color: "#2459a6", borderColor: "#93b4e8" }}>✏️ {c.editQuiz}</button>
      <button type="button" disabled={deletingQuiz} onClick={removeOwnedQuiz} style={{ ...secondaryButton, minHeight: 46, padding: "10px 18px", color: "#b42346", borderColor: "#e7aab3" }}>🗑️ {deletingQuiz ? c.deletingQuiz : c.deleteQuiz}</button>
    </div>
  ) : null;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setQuiz(null);
    setAllQuestions([]);
    setSessionQuestions([]);
    setRecords([]);
    setPhase("setup");
    setRankingStats(null);
    setPreviousResult(null);
    setReportTarget(null);
    Promise.all([getQuiz(id), getQuizQuestions(id)])
      .then(([q, questions]) => {
        if (!alive) return;
        setQuiz(q);
        setAllQuestions(questions);
        setQuestionCount(Math.min(10, Math.max(1, questions.length)));
        setPlayerRevealMode(q.answer_reveal_mode || "both");
        try {
          const saved = JSON.parse(sessionStorage.getItem(`quiz-result:${id}`) || "null");
          const switchKey = `quiz-language-switch:${id}`;
          const switchedAt = Number(sessionStorage.getItem(switchKey) || 0);
          sessionStorage.removeItem(switchKey);
          if (saved && Date.now() - saved.savedAt < 2 * 60 * 60 * 1000 && saved.records?.length) {
            setPreviousResult(saved);
            if (switchedAt && Date.now() - switchedAt < 30000) {
              setRecords(saved.records);
              setSessionQuestions(saved.sessionQuestions || saved.records.map((item) => item.question));
              setQuestionCount(saved.questionCount || saved.records.length);
              setTimerSeconds(saved.timerSeconds || 0);
              setPlayerRevealMode(saved.playerRevealMode || q.answer_reveal_mode || "both");
              setAttemptToken(saved.attemptToken || "");
              setPhase("result");
            }
          }
        } catch (_) {}
      })
      .catch((e) => alive && setError(e.message || String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (id) sessionStorage.setItem(`quiz-view-phase:${id}`, phase);
  }, [id, phase]);

  useEffect(() => {
    if (!quiz) return;
    getQuizzes({ category: quiz.category || "all", sort: "popular", contentLanguage: lang, limit: 6 })
      .then((rows) => setRecommended((rows || []).filter((item) => String(item.id) !== String(id)).slice(0, 4)))
      .catch(() => setRecommended([]));
  }, [quiz, lang, id]);

  const title = useMemo(
    () => localize(quiz?.title_translations, quiz?.title, lang),
    [quiz, lang]
  );

  const current = sessionQuestions[index];
  const score = records.filter((x) => x.correct).length;
  const revealMode = playerRevealMode || quiz?.answer_reveal_mode || "both";
  const revealImmediately = revealMode === "both" || revealMode === "immediate";
  const showAnswersInResult = revealMode === "both" || revealMode === "final";

  useEffect(() => {
    if (phase !== "playing" || !current || timerSeconds <= 0 || locked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;
    }

    const totalMs = timerSeconds * 1000;
    deadlineRef.current = Date.now() + totalMs;
    setTimeRemainingMs(totalMs);
    setTimeLeft(timerSeconds);

    const tick = () => {
      const remaining = Math.max(0, deadlineRef.current - Date.now());
      setTimeRemainingMs(remaining);
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimeout(() => submitAnswer(true), 0);
      }
    };

    timerRef.current = setInterval(tick, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, index, timerSeconds, locked, current?.id]);

  async function start(customQuestions = null) {
    const source = (customQuestions || allQuestions).map((question) => {
      const translatedOptions = question?.options_translations?.[lang];
      return Array.isArray(translatedOptions) && translatedOptions.length
        ? { ...question, options: translatedOptions }
        : question;
    });
    const count = customQuestions ? source.length : Math.min(questionCount, source.length);
    const prepared = customQuestions ? source.map((q) => ({ ...q })) : buildSession(source, count, shuffleQuestions, c.choice);
    setPhase("preparing");
    await preloadQuestionImages(prepared);
    setSessionQuestions(prepared);
    setIndex(0);
    setSelected(null);
    setShortAnswer("");
    setLocked(false);
    setRecords([]);
    setRankingStats(null);
    const nextAttemptToken = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setAttemptToken(nextAttemptToken);
    sessionStorage.removeItem(`quiz-result:${id}`);
    setPreviousResult(null);
    setResultFilter("all");
    setResultVisibleCount(10);
    setPhase("playing");
    incrementQuizPlay(id);
  }

  useEffect(() => {
    if (phase !== "result" || !records.length || !attemptToken) return;
    sessionStorage.setItem(`quiz-result:${id}`, JSON.stringify({
      savedAt: Date.now(), records, sessionQuestions, questionCount,
      timerSeconds, playerRevealMode, attemptToken,
    }));
    let alive = true;
    setRankingLoading(true);
    saveQuizAttempt({ quizId: id, attemptToken, records })
      .then(() => getQuizRankingStats({ quizId: id, answeredCount: records.length, attemptToken }))
      .then((stats) => alive && setRankingStats(stats))
      .catch((e) => console.warn("quiz ranking update failed", e))
      .finally(() => alive && setRankingLoading(false));
    return () => { alive = false; };
  }, [phase, records, attemptToken, id]);

  function evaluate(q, forcedTimeout = false) {
    if (q.question_type === "short_answer") {
      const settings = q.answer_match_options || {};
      const normalized = normalizeAnswer(shortAnswer, settings);
      const answers = Array.isArray(q.answers) ? q.answers : [];
      const correct =
        !forcedTimeout &&
        normalized &&
        answers.some((answer) => normalizeAnswer(answer, settings) === normalized);
      return {
        correct: Boolean(correct),
        userAnswer: forcedTimeout ? `(${c.timeout})` : shortAnswer.trim(),
        correctAnswer: answers.join(" / "),
      };
    }

    const options = Array.isArray(q.options) ? q.options : [];
    const correct = !forcedTimeout && selected === q.correct_index;
    return {
      correct,
      userAnswer:
        forcedTimeout || selected === null ? `(${c.timeout})` : options[selected] || "",
      correctAnswer: options[q.correct_index] || "",
    };
  }

  function submitAnswer(forcedTimeout = false, skipped = false) {
    if (!current || locked) return;
    if (
      !forcedTimeout &&
      current.question_type === "multiple_choice" &&
      selected === null
    ) {
      return;
    }
    if (
      !forcedTimeout &&
      current.question_type === "short_answer" &&
      !shortAnswer.trim()
    ) {
      setShortAnswerWarning(c.answerRequired);
      return;
    }

    setShortAnswerWarning("");

    const judged = evaluate(current, forcedTimeout);
    if (skipped) judged.userAnswer = `(${c.skipped})`;
    const record = {
      question: current,
      ...judged,
    };
    setRecords((prev) => [...prev, record]);
    setLocked(true);

    if (!revealImmediately) {
      setTimeout(() => moveNext(), 120);
    }
  }

  function moveNext() {
    if (index + 1 >= sessionQuestions.length) {
      setPhase("result");
      setLocked(false);
      return;
    }
    setIndex((v) => v + 1);
    setSelected(null);
    setShortAnswer("");
    setShortAnswerWarning("");
    setLocked(false);
  }

  function retryWrong() {
    const wrong = records.filter((x) => !x.correct).map((x) => x.question);
    if (!wrong.length) return;
    start(wrong);
  }

  function showPreviousResult() {
    if (!previousResult?.records?.length) return;
    setRecords(previousResult.records);
    setSessionQuestions(previousResult.sessionQuestions || previousResult.records.map((item) => item.question));
    setQuestionCount(previousResult.questionCount || previousResult.records.length);
    setTimerSeconds(previousResult.timerSeconds || 0);
    setPlayerRevealMode(previousResult.playerRevealMode || quiz?.answer_reveal_mode || "both");
    setAttemptToken(previousResult.attemptToken || "");
    setResultFilter("all");
    setResultVisibleCount(10);
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartCurrentQuiz() {
    if (!window.confirm(c.restartConfirm)) return;
    start(sessionQuestions);
  }

  function finishEarly() {
    if (!window.confirm(c.finishConfirm)) return;
    const remaining = sessionQuestions.slice(index + (locked ? 1 : 0));
    const skipped = remaining.map((question) => ({
      question,
      correct: false,
      userAnswer: `(${c.skippedPlain})`,
      correctAnswer: question.question_type === "short_answer"
        ? (Array.isArray(question.answers) ? question.answers.join(" / ") : "")
        : String(question.options?.[question.correct_index] || ""),
    }));
    setRecords((prev) => [...prev, ...skipped]);
    setLocked(false);
    setPhase("result");
  }

  async function playRandomQuiz() {
    if (randomLoading) return;
    setRandomLoading(true);
    try {
      const rows = await getQuizzes({ sort: "popular", limit: 50 });
      const candidates = (rows || []).filter((item) => String(item.id) !== String(id));
      if (!candidates.length) {
        alert(c.noOtherQuiz);
        return;
      }
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      sessionStorage.removeItem(`quiz-result:${picked.id}`);
      navigate(`/${lang}/quiz/${picked.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e?.message || c.randomLoadFailed);
    } finally {
      setRandomLoading(false);
    }
  }

  function openQuestionReport(question) {
    setReportTarget(question);
    setReportType("wrong_answer");
    setReportDetail("");
    setReportStatus("");
  }

  async function submitQuestionReport() {
    if (!reportTarget || reportSending) return;
    setReportSending(true);
    setReportStatus("");
    try {
      await reportQuizQuestion({
        quizId: id,
        questionId: reportTarget.id,
        ownerId: quiz?.user_id,
        issueType: reportType,
        detail: reportDetail,
      });
      setReportStatus(c.reportSuccess);
    } catch (e) {
      setReportStatus(e?.message === "LOGIN_REQUIRED" ? c.reportLogin : (e?.message || c.reportFailed));
    } finally {
      setReportSending(false);
    }
  }

  async function shareResult() {
    const rate = records.length ? Math.round((score / records.length) * 100) : 0;
    const text = `${title} - ${formatCopy(c.shareSummary, { total: records.length, correct: score, rate })}`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        alert(c.copied);
      }
    } catch (e) {
      if (e?.name !== "AbortError") console.warn(e);
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  if (error || !quiz) {
    return <><Seo lang={lang} slug={`quiz/${id}`} title="Quiz unavailable | OnePickGame" indexable={false} /><div style={{ padding: 60, textAlign: "center", color: "#b42346" }}>{error || "Quiz not found"}</div></>;
  }

  const countOptions = [1, 5, 10, 20, 30, 50, allQuestions.length]
    .filter((v, i, arr) => v > 0 && v <= allQuestions.length && arr.indexOf(v) === i);

  const filteredRecords = records.filter((r) => {
    if (resultFilter === "correct") return r.correct;
    if (resultFilter === "wrong") return !r.correct;
    return true;
  });

  const changeResultFilter = (nextFilter) => {
    setResultFilter(nextFilter);
    setResultVisibleCount(10);
  };
  const seo = getQuizSeo(lang, quiz);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#202534", padding: "28px 16px 72px" }}>
      <Seo
        lang={lang}
        slug={`quiz/${id}`}
        title={seo.title}
        description={seo.description}
        image={seo.image}
        hreflangLangs={seo.languages}
        indexable={seo.languages.includes(lang)}
      />
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <button type="button" onClick={() => navigate(`/${lang}/quiz`)} style={{ ...secondaryButton, minHeight: 48, padding: "11px 18px", fontSize: 16 }}>← {c.quizList}</button>

        {phase === "setup" && (
          <>
            <div style={{ textAlign: "center", padding: "30px 10px 20px" }}>
              {quiz.thumbnail_url && (
                <MediaRenderer url={quiz.thumbnail_url} alt="" playable={false} style={{
  display: "block",
  width: "100%",
  maxWidth: 820,
  margin: "0 auto",
  aspectRatio: "16/9",
  objectFit: "cover",
  border: "1.5px solid #cfd8e6",
  borderRadius: 12,
}} />
              )}
              <h1 style={{ fontSize: 34, margin: "18px 0 8px" }}>{title}</h1>
              <p style={{ color: "#637086", lineHeight: 1.6 }}>{localize(quiz.description_translations, quiz.description, lang)}</p>
              <div style={{ color: "#E53935", fontWeight: 800, margin: "12px 0" }}>{formatCopy(c.totalQuestions, { count: allQuestions.length })} · ▶ {quiz.play_count || 0}</div>
              {ownerControls}
            </div>

            <div style={{ ...cardStyle, maxWidth: 820, margin: "0 auto 20px", padding: 26 }}>
              <div style={sectionTitle}>{c.questionCount}</div>
              <div style={buttonRow}>
                {countOptions.map((n) => (
                  <button key={n} type="button" onClick={() => setQuestionCount(n)} style={choiceButton(questionCount === n)}>
                    {n === allQuestions.length ? formatCopy(c.allCount, { count: n }) : formatCopy(c.totalQuestions, { count: n })}
                  </button>
                ))}
              </div>
              <div style={{ ...sectionTitle, marginTop: 18 }}>{c.timeLimit}</div>
              <div style={buttonRow}>
                {[0, 3, 5, 10, 30].map((n) => (
                  <button key={n} type="button" onClick={() => setTimerSeconds(n)} style={choiceButton(timerSeconds === n)}>
                    {n === 0 ? c.noLimit : formatCopy(c.seconds, { count: n })}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShuffleQuestions((value) => !value)}
                aria-pressed={shuffleQuestions}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "15px 16px",
                  border: shuffleQuestions ? "2px solid #E53935" : "1.5px solid #bccae0",
                  borderRadius: 11,
                  background: shuffleQuestions ? "#FFF1F1" : "#fff",
                  color: shuffleQuestions ? "#B71C1C" : "#465166",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: shuffleQuestions ? "0 4px 14px rgba(229,57,53,.14)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ fontSize: 18 }}>🔀 {c.shuffleQuestions}</strong>
                  <span style={{ minWidth: 52, padding: "5px 10px", borderRadius: 999, background: shuffleQuestions ? "#E53935" : "#e4e9f0", color: shuffleQuestions ? "#fff" : "#667085", textAlign: "center", fontWeight: 950 }}>{shuffleQuestions ? c.on : c.off}</span>
                </div>
                <div style={{ marginTop: 6, color: "#667085", fontSize: 14, fontWeight: 750 }}>{c.shuffleHelp}</div>
              </button>
              <div style={{ ...sectionTitle, marginTop: 20 }}>{c.revealMethod}</div>
              <div style={{ ...buttonRow, marginTop: 9 }}>
                {[
                  ["immediate", c.revealImmediate],
                  ["final", c.revealFinal],
                  ["both", c.revealBoth],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setPlayerRevealMode(value)} style={choiceButton(playerRevealMode === value)}>{label}</button>
                ))}
              </div>
              <button type="button" disabled={!allQuestions.length} onClick={() => start()} style={{ ...primaryButton, width: "100%", marginTop: 20, minHeight: 62, padding: 15, fontSize: 21 }}>{c.startQuiz}</button>
              {previousResult?.records?.length > 0 && (
                <button type="button" onClick={showPreviousResult} style={{ ...secondaryButton, width: "100%", marginTop: 10, minHeight: 54, fontSize: 17, borderColor: "#efb7bc", color: "#a3363f", background: "#fff8f8" }}>
                  🕘 {c.viewRecentResult} · {previousResult.records.filter((item) => item.correct).length}/{previousResult.records.length}
                </button>
              )}
            </div>
            <QuizCommentBox quizId={id} />
          </>
        )}

        {phase === "preparing" && (
          <div style={{ ...cardStyle, maxWidth: 680, margin: "70px auto", padding: 34, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 950, color: "#C62828" }}>{c.preparingTitle}</div>
            <div style={{ marginTop: 10, color: "#667085", fontSize: 16 }}>{c.preparingHelp}</div>
          </div>
        )}

        {phase === "playing" && current && (
          <div style={{ maxWidth: 1080, margin: "26px auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12, padding: 12, border: "1.5px solid #FFCDD2", borderRadius: 10, background: "#FFF8F8" }}>
              <button type="button" onClick={restartCurrentQuiz} style={{ ...secondaryButton, minHeight: 54, padding: "12px 20px", fontSize: 17 }}>↻ {c.restart}</button>
              <button type="button" onClick={finishEarly} style={{ ...secondaryButton, minHeight: 54, padding: "12px 20px", fontSize: 17, borderColor: "#EF5350", color: "#C62828" }}>{c.finishNow} →</button>
            </div>
            <div style={{ ...cardStyle, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "#68758a", fontWeight: 850, marginBottom: 10, flexWrap: "wrap" }}>
              <span>{index + 1} / {sessionQuestions.length}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 15, color: "#596579", fontWeight: 900 }}>
                  {c.currentAccuracy} {records.length ? Math.round((score / records.length) * 100) : 0}% ({score}/{records.length})
                </span>
                <span style={{ fontSize: timerSeconds > 0 ? 28 : 16, color: timerSeconds > 0 && timeLeft <= 3 ? "#b42346" : "#202534", fontWeight: 950 }}>
                  {timerSeconds > 0 ? `⏱ ${formatCopy(c.seconds, { count: timeLeft })}` : `${c.scoreLabel} ${score}`}
                </span>
              </div>
            </div>
            {timerSeconds > 0 && (
              <div style={{ height: 11, borderRadius: 999, background: "#FFEBEE", overflow: "hidden", marginBottom: 16, border: "1px solid #FFCDD2" }}>
                <div style={{ width: `${Math.max(0, Math.min(100, timeRemainingMs / (timerSeconds * 10)))}%`, height: "100%", background: "#E53935", transition: "width 0.1s linear" }} />
              </div>
            )}
            {current.image_url && (
              <MediaRenderer url={current.image_url} alt="" playable active style={{ display: "block", width: "100%", height: 540, maxHeight: "65vh", objectFit: "contain", background: "#f6f8fb", border: "1.5px solid #cfd8e6", borderRadius: 10, marginBottom: 22 }} />
            )}
            <h2 style={{ fontSize: 25, lineHeight: 1.45, margin: "8px 0 18px" }}>{localize(current.question_translations, current.question_text, lang)}</h2>

            {current.question_type === "short_answer" ? (
              <div>
                <input value={shortAnswer} disabled={locked} onChange={(e) => { setShortAnswer(e.target.value); if (e.target.value.trim()) setShortAnswerWarning(""); }} onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(false); }} placeholder={c.answerInput} style={{ width: "100%", height: 56, boxSizing: "border-box", border: shortAnswerWarning ? "2px solid #E53935" : "1.5px solid #bccae0", borderRadius: 8, padding: "0 14px", fontSize: 19 }} />
                {shortAnswerWarning && <div role="alert" style={{ marginTop: 8, color: "#C62828", fontSize: 15, fontWeight: 850 }}>{shortAnswerWarning}</div>}
                {!locked && <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => submitAnswer(false)} style={{ ...primaryButton, width: "100%", minHeight: 58, fontSize: 20 }}>{c.submitAnswer}</button>
                  <button type="button" onClick={() => submitAnswer(true, true)} style={{ ...secondaryButton, minHeight: 58, padding: "12px 18px", fontSize: 16, borderColor: "#EF5350", color: "#C62828" }}>{c.skipAnswer}</button>
                </div>}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(current.options || []).map((option, oi) => {
                  const isSelected = selected === oi;
                  const isCorrect = current.correct_index === oi;
                  let border = isSelected ? "2px solid #E53935" : "1.5px solid #cfd8e6";
                  let background = "#fff";
                  if (locked && revealImmediately && isCorrect) {
                    border = "2px solid #2f9e62";
                    background = "#effbf4";
                  } else if (locked && revealImmediately && isSelected && !isCorrect) {
                    border = "2px solid #c94b5b";
                    background = "#fff3f4";
                  }
                  return (
                    <button key={oi} type="button" disabled={locked} onClick={() => setSelected(oi)} style={{ border, background, borderRadius: 10, minHeight: 58, padding: "10px 12px", color: "#202534", fontSize: 17, fontWeight: 850, cursor: locked ? "default" : "pointer" }}>
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {current.question_type === "multiple_choice" && !locked && selected !== null && (
              <button type="button" onClick={() => submitAnswer(false)} style={{ ...primaryButton, width: "100%", marginTop: 14, minHeight: 54, padding: "14px 18px", fontSize: 19 }}>{c.submitChoice}</button>
            )}

            {locked && revealImmediately && records.length > 0 && (
              <div style={{ marginTop: 16, border: records[records.length - 1].correct ? "1.5px solid #78c99b" : "1.5px solid #e3a5ad", background: records[records.length - 1].correct ? "#f2fbf6" : "#fff6f7", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 19, fontWeight: 950 }}>{records[records.length - 1].correct ? `✅ ${c.correctBang}` : `❌ ${c.incorrect}`}</div>
                <div style={{ marginTop: 6 }}><strong>{c.answerLabel}:</strong> {records[records.length - 1].correctAnswer}</div>
                {current.explanation && <div style={{ marginTop: 6, color: "#596579" }}>{localize(current.explanation_translations, current.explanation, lang)}</div>}
                <button type="button" onClick={moveNext} style={{ ...primaryButton, width: "100%", minHeight: 58, marginTop: 14, padding: "15px 20px", fontSize: 20 }}>{index + 1 >= sessionQuestions.length ? c.resultView : c.nextQuestion}</button>
              </div>
            )}
            </div>
          </div>
        )}

        {phase === "result" && (
          <>
            <div style={{ ...cardStyle, maxWidth: 980, margin: "35px auto 22px", padding: 38, textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#596579", marginBottom: 6 }}>{title}</div>
              <h1 style={{ marginTop: 0 }}>{c.resultTitle}</h1>
              <div style={{ fontSize: 50, fontWeight: 950, color: "#E53935" }}>{score} / {records.length}</div>
              <div style={{ fontSize: 18, fontWeight: 850, marginTop: 4 }}>{c.accuracy} {records.length ? Math.round((score / records.length) * 100) : 0}%</div>
              <div style={{ margin: "18px auto 0", maxWidth: 720, padding: "18px 20px", borderRadius: 12, background: "#FFF6F6", border: "1.5px solid #FFCDD2" }}>
                {rankingLoading ? (
                  <div style={{ color: "#667085", fontWeight: 850 }}>{c.rankingLoading}</div>
                ) : rankingStats ? (
                  <>
                    <div style={{ fontSize: 24, fontWeight: 950, color: "#C62828" }}>
                      {formatCopy(c.rankLine, { rank: rankingStats.rank, count: rankingStats.comparable_count })}
                    </div>
                    <div style={{ marginTop: 5, color: "#596579", fontSize: 15, fontWeight: 800 }}>
                      {formatCopy(c.participantsLine, { count: rankingStats.participant_count, percent: rankingStats.top_percent })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
                      {(rankingStats.distribution || []).map((item) => (
                        <span key={item.score} style={{ padding: "6px 10px", borderRadius: 999, background: item.score === score ? "#E53935" : "#fff", color: item.score === score ? "#fff" : "#465166", border: "1px solid #FFCDD2", fontSize: 14, fontWeight: 850 }}>
                          {formatCopy(c.distributionLine, { score: item.score, count: item.count })}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, color: "#7a4650", fontSize: 13 }}>
                      {formatCopy(c.comparisonLine, { count: records.length })}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#667085", fontWeight: 800 }}>{c.noRanking}</div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, margin: "18px auto 0", maxWidth: 850 }}>
                <button type="button" onClick={() => start()} style={resultPrimaryButton}>{c.retry}</button>
                <button type="button" disabled={!records.some((x) => !x.correct)} onClick={retryWrong} style={resultSecondaryButton}>{c.retryWrong}</button>
                <button type="button" onClick={playRandomQuiz} disabled={randomLoading} style={resultPrimaryButton}>{randomLoading ? c.loading : `🎲 ${c.randomQuiz}`}</button>
                <button type="button" onClick={() => navigate(`/${lang}/quiz`)} style={resultSecondaryButton}>{c.otherQuizzes}</button>
                <button type="button" onClick={shareResult} style={resultSecondaryButton}>{c.share}</button>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                <button type="button" onClick={() => navigate(`/${lang}/quiz/create`)} style={{ ...resultSecondaryButton, minWidth: 230 }}>＋ {c.createMyQuiz}</button>
              </div>
              {ownerControls}
            </div>

            <div style={{ ...buttonRow, justifyContent: "center", marginBottom: 14 }}>
              <button type="button" onClick={() => changeResultFilter("all")} style={choiceButton(resultFilter === "all")}>{c.all} {records.length}</button>
              <button type="button" onClick={() => changeResultFilter("correct")} style={choiceButton(resultFilter === "correct")}>{c.correct} {score}</button>
              <button type="button" onClick={() => changeResultFilter("wrong")} style={choiceButton(resultFilter === "wrong")}>{c.wrong} {records.length - score}</button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredRecords.slice(0, resultVisibleCount).map((record, ri) => {
                const q = record.question;
                return (
                  <div key={`${q.id}-${ri}`} style={{ ...cardStyle, borderColor: record.correct ? "#bcdcca" : "#e2c0c5" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 18, fontWeight: 950 }}>{record.correct ? `✅ ${c.correct}` : `❌ ${c.wrong}`}</div>
                      <button type="button" onClick={() => openQuestionReport(q)} style={{ ...secondaryButton, minHeight: 36, padding: "6px 11px", color: "#a23b43", borderColor: "#efc6ca", background: "#fff8f8" }}>🚩 {c.reportError}</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: q.image_url ? "120px 1fr" : "1fr", gap: 14, alignItems: "start" }}>
                      {q.image_url && <MediaRenderer url={q.image_url} alt="" playable={false} style={{ width: 120, height: 120, objectFit: "cover", border: "1px solid #d5dde9", borderRadius: 8 }} />}
                      <div>
                        <div style={{ fontWeight: 850, lineHeight: 1.5 }}>{localize(q.question_translations, q.question_text, lang)}</div>
                        <div style={{ marginTop: 8 }}><strong>{c.myAnswer}:</strong> {record.userAnswer || `(${c.unanswered})`}</div>
                        {showAnswersInResult && (
                          <div style={{ marginTop: 5 }}><strong>{c.answerLabel}:</strong> {record.correctAnswer}</div>
                        )}
                        {showAnswersInResult && q.explanation && <div style={{ marginTop: 7, color: "#596579" }}>{localize(q.explanation_translations, q.explanation, lang)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {resultVisibleCount < filteredRecords.length && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <button type="button" onClick={() => setResultVisibleCount((count) => count + 10)} style={resultPrimaryButton}>
                  {c.moreResults}
                </button>
                <button type="button" onClick={() => setResultVisibleCount(filteredRecords.length)} style={resultSecondaryButton}>
                  {c.expandAll}
                </button>
              </div>
            )}

            {recommended.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ fontSize: 22, margin: "0 0 12px", textAlign: "center" }}>{c.featured}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,280px))", justifyContent: "center", gap: 12 }}>
                  {recommended.map((item) => (
                    <Link key={item.id} to={`/${lang}/quiz/${item.id}`} style={{ ...cardStyle, textDecoration: "none", padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer", color: "#202534" }}>
                      <div style={{ aspectRatio: "16/9", background: "#f3f6fb", overflow: "hidden" }}>
                        {item.thumbnail_url ? <MediaRenderer url={item.thumbnail_url} alt="" playable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 36 }}>?</div>}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{localize(item.title_translations, item.title, lang)}</div>
                        <div style={{ marginTop: 5, fontSize: 13, color: "#667085" }}>▶ {item.play_count || 0} · {c.questionWord} {item.question_count || 0}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 28 }}>
              <QuizCommentBox quizId={id} />
            </div>

            {reportTarget && (
              <div role="dialog" aria-modal="true" aria-label={c.reportError} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(18,24,38,.55)", display: "grid", placeItems: "center", padding: 16 }}>
                <div style={{ ...cardStyle, width: "min(540px,100%)", boxSizing: "border-box", padding: 24, boxShadow: "0 18px 60px rgba(16,24,40,.24)" }}>
                  <h2 style={{ margin: "0 0 8px" }}>🚩 {c.reportError}</h2>
                  <div style={{ color: "#667085", lineHeight: 1.5, marginBottom: 16 }}>{c.reportHelp}</div>
                  <label style={{ display: "block", fontWeight: 850 }}>
                    {c.reportReason}
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: "100%", height: 46, marginTop: 7, border: "1.5px solid #bccae0", borderRadius: 8, padding: "0 10px", fontSize: 16 }}>
                      <option value="wrong_answer">{c.reportWrongAnswer}</option>
                      <option value="question_error">{c.reportQuestionError}</option>
                      <option value="broken_media">{c.reportBrokenMedia}</option>
                      <option value="other">{c.reportOther}</option>
                    </select>
                  </label>
                  <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} maxLength={500} placeholder={c.reportPlaceholder} style={{ width: "100%", minHeight: 100, boxSizing: "border-box", marginTop: 12, border: "1.5px solid #bccae0", borderRadius: 8, padding: 11, font: "inherit", resize: "vertical" }} />
                  {reportStatus && <div role="status" style={{ marginTop: 10, color: reportStatus === c.reportSuccess ? "#248653" : "#b42346", fontWeight: 800 }}>{reportStatus}</div>}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                    <button type="button" onClick={() => setReportTarget(null)} style={secondaryButton}>{c.close}</button>
                    <button type="button" onClick={submitQuestionReport} disabled={reportSending || reportStatus === c.reportSuccess} style={{ ...primaryButton, opacity: reportSending || reportStatus === c.reportSuccess ? .6 : 1 }}>{reportSending ? c.reporting : c.submitReport}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1.5px solid #cfd8e6",
  borderRadius: 12,
  padding: 20,
  background: "#fff",
};
const sectionTitle = { fontWeight: 900, fontSize: 17 };
const buttonRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const primaryButton = {
  border: "1px solid #E53935",
  background: "#E53935",
  color: "#fff",
  borderRadius: 8,
  minHeight: 46,
  padding: "11px 17px",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};
const secondaryButton = {
  border: "1px solid #d5dde9",
  background: "#fff",
  color: "#3f4a5a",
  borderRadius: 8,
  minHeight: 42,
  padding: "9px 14px",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};
const resultPrimaryButton = {
  ...primaryButton,
  minHeight: 58,
  padding: "14px 22px",
  fontSize: 18,
};
const resultSecondaryButton = {
  ...secondaryButton,
  minHeight: 58,
  padding: "14px 22px",
  fontSize: 18,
};
const choiceButton = (active) => ({
  border: active ? "1.5px solid #E53935" : "1px solid #d5dde9",
  background: active ? "#E53935" : "#fff",
  color: active ? "#fff" : "#3f4a5a",
  borderRadius: 8,
  minHeight: 46,
  padding: "10px 15px",
  fontSize: 16,
  fontWeight: 850,
  cursor: "pointer",
});
