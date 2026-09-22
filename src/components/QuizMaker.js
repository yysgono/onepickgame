import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";
import { getCreatorSafetyCopy, creatorWarningStyle } from "./creatorSafetyCopy";
import { getQuizMakerCopy, fillCopy } from "./quizMakerCopy";
import { supabase } from "../utils/supabaseClient";
import { detectContentLanguage } from "../utils/detectContentLanguage";
import {
  createQuiz,
  uploadQuizImage,
  searchWorldcupsForQuiz,
  QUIZ_LANGUAGES,
  getQuiz,
  getQuizQuestions,
} from "../utils/supabaseQuizApi";

const CATEGORIES = ["game", "entertainment", "animation", "food", "sports", "knowledge", "other"];
const QUIZ_DRAFT_STORAGE_KEY = "onepick_quiz_draft_v1";
const QUIZ_DRAFT_DB_NAME = "onepick_quiz_draft_assets_v1";
const QUIZ_DRAFT_DB_STORE = "draftAssets";
const QUIZ_DRAFT_DB_KEY = "currentDraftImages";

function openQuizDraftDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) return reject(new Error("IndexedDB is unavailable"));
    const request = window.indexedDB.open(QUIZ_DRAFT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(QUIZ_DRAFT_DB_STORE)) request.result.createObjectStore(QUIZ_DRAFT_DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

async function writeQuizDraftFiles(entries) {
  const db = await openQuizDraftDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(QUIZ_DRAFT_DB_STORE, "readwrite");
      tx.objectStore(QUIZ_DRAFT_DB_STORE).put({ version: 1, entries }, QUIZ_DRAFT_DB_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("IndexedDB write failed"));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB write aborted"));
    });
  } finally { db.close(); }
}

async function readQuizDraftFiles() {
  const db = await openQuizDraftDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(QUIZ_DRAFT_DB_STORE, "readonly").objectStore(QUIZ_DRAFT_DB_STORE).get(QUIZ_DRAFT_DB_KEY);
      request.onsuccess = () => resolve(Array.isArray(request.result?.entries) ? request.result.entries : []);
      request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
    });
  } finally { db.close(); }
}

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const shuffle = (arr) => {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

function getYoutubeThumbnail(url = "") {
  const text = String(url || "");
  const match = text.match(
    /(?:youtu.be\/|youtube.com\/(?:embed\/|shorts\/|live\/|watch\?(?:.*&)?v=))([A-Za-z0-9_-]{11})/i
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : text;
}

function getQuestionAnswer(q) {
  if (q?.type === "short_answer") {
    return q.answers?.find((x) => String(x || "").trim()) || q.sourceAnswer || "";
  }
  return q?.options?.[q.correctIndex] || q?.sourceAnswer || "";
}

function emptyQuestion() {
  return {
    localId: makeId(),
    type: "multiple_choice",
    question: "",
    imageFile: null,
    imageUrl: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    answers: [""],
    ignoreCase: true,
    ignoreSpaces: true,
    explanation: "",
    sourceWorldcupId: null,
    sourceCandidateId: null,
    sourceAnswer: "",
    autoChoices: false,
  };
}

function displayWorldcupTitle(cup, lang) {
  return cup?.title_translations?.[lang] || cup?.title_translations?.en || cup?.title || "";
}

export default function QuizMaker() {
  const { lang: routeLang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editQuizId = searchParams.get("edit") || "";
  const lang = routeLang || (i18n.language || "en").split("-")[0];
  const safetyCopy = getCreatorSafetyCopy(lang);
  const m = getQuizMakerCopy(lang);

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const [originalLanguage, setOriginalLanguage] = useState(lang);
  const [title, setTitle] = useState("");
  const [titleTranslations, setTitleTranslations] = useState([]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("knowledge");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState("");
  const [contentLanguages, setContentLanguages] = useState([lang]);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [questionEditLanguages, setQuestionEditLanguages] = useState({});
  const [creationMode, setCreationMode] = useState("direct");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [topicPanelOpen, setTopicPanelOpen] = useState(false);
  const [candidatePool, setCandidatePool] = useState([]);
  const [sourceWorldcupIds, setSourceWorldcupIds] = useState([]);
  const [activeSourceWorldcupId, setActiveSourceWorldcupId] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [worldcupSearch, setWorldcupSearch] = useState("");
  const [worldcups, setWorldcups] = useState([]);
  const [allWorldcups, setAllWorldcups] = useState([]);
  const [worldcupsLoading, setWorldcupsLoading] = useState(false);
  const [selectedWorldcup, setSelectedWorldcup] = useState(null);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState([]);
  const [nextTopicCandidateId, setNextTopicCandidateId] = useState("");

  const [saving, setSaving] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  const importSectionRef = useRef(null);
  const dragSelectRef = useRef({ active: false, selecting: true });

  function validateImageFile(file) {
    if (!file) return true;
    if (!file.type?.startsWith("image/")) {
      setError(m.imageOnly);
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(m.imageTooLarge);
      return false;
    }
    setError("");
    return true;
  }

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (!editQuizId || !user?.id) return;
    let alive = true;
    Promise.all([getQuiz(editQuizId), getQuizQuestions(editQuizId)])
      .then(([existing, rows]) => {
        if (!alive) return;
        if (String(existing.user_id) !== String(user.id)) throw new Error(m.editForbidden || "You can only edit your own quiz.");
        const baseLang = existing.original_language || lang;
        const titleMap = existing.title_translations || {};
        const descriptionMap = existing.description_translations || {};
        const translationCodes = new Set([
          ...Object.keys(titleMap),
          ...Object.keys(descriptionMap),
        ]);

        setOriginalLanguage(baseLang);
        setTitle(titleMap[baseLang] || existing.title || "");
        setDescription(descriptionMap[baseLang] || existing.description || "");
        setTitleTranslations(
          [...translationCodes]
            .filter((code) => code !== baseLang)
            .map((code) => ({
              id: makeId(),
              lang: code,
              title: titleMap[code] || "",
              description: descriptionMap[code] || "",
            }))
        );
        setCategory(existing.category || "knowledge");
        setExistingThumbnailUrl(existing.thumbnail_url || "");
        setContentLanguages(existing.content_languages?.length ? existing.content_languages : [baseLang]);
        setSourceWorldcupIds(existing.source_worldcup_ids || []);
        setQuestions((rows || []).map((q) => {
          const translationCodes = new Set([...Object.keys(q.question_translations || {}), ...Object.keys(q.options_translations || {}), ...Object.keys(q.explanation_translations || {})]);
          const translations = Object.fromEntries([...translationCodes].filter((code) => code !== baseLang).map((code) => [code, { question: q.question_translations?.[code] || "", options: q.options_translations?.[code] || ["", "", "", ""], explanation: q.explanation_translations?.[code] || "", answers: [] }]));
          return { localId: makeId(), type: q.question_type === "short_answer" ? "short_answer" : "multiple_choice", question: q.question_translations?.[baseLang] || q.question_text || "", imageFile: null, imageUrl: q.image_url || "", options: q.options_translations?.[baseLang] || q.options || ["", "", "", ""], correctIndex: Number(q.correct_index || 0), answers: q.answers?.length ? q.answers : [""], ignoreCase: q.answer_match_options?.ignore_case !== false, ignoreSpaces: Boolean(q.answer_match_options?.ignore_spaces), explanation: q.explanation_translations?.[baseLang] || q.explanation || "", sourceWorldcupId: q.source_worldcup_id || null, sourceCandidateId: q.source_candidate_id || null, sourceAnswer: "", autoChoices: Boolean(q.auto_choices), translations };
        }));
      })
      .catch((e) => alive && setError(e.message || String(e)));
    return () => { alive = false; };
  }, [editQuizId, user?.id]);

  useEffect(() => {
    const stopDrag = () => { dragSelectRef.current.active = false; };
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", u.id)
          .single();
        setNickname(p?.nickname || "");
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!importOpen) return;
    let alive = true;
    setWorldcupsLoading(true);
    // 서버 검색이 원본 title만 보는 경우 한글 title_translations 검색이 빠질 수 있으므로
    // 가져오기 창에서는 목록을 받은 뒤 클라이언트에서 모든 번역 제목까지 검색한다.
    searchWorldcupsForQuiz({ search: "", limit: 1000 })
      .then((rows) => {
        if (!alive) return;
        const list = Array.isArray(rows) ? rows : [];
        setAllWorldcups(list);
        setWorldcups(list);
      })
      .catch((e) => alive && setError(e.message || String(e)))
      .finally(() => alive && setWorldcupsLoading(false));
    return () => { alive = false; };
  }, [importOpen]);

  useEffect(() => {
    const keyword = worldcupSearch.trim().toLocaleLowerCase();
    if (!keyword) {
      setWorldcups(allWorldcups);
      return;
    }
    setWorldcups(allWorldcups.filter((cup) => {
      const translatedTitles = cup?.title_translations && typeof cup.title_translations === "object"
        ? Object.values(cup.title_translations)
        : [];
      const haystack = [cup?.title || "", ...translatedTitles]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(keyword);
    }));
  }, [worldcupSearch, allWorldcups]);

  const selectedCandidates = useMemo(() => {
    const data = Array.isArray(selectedWorldcup?.data) ? selectedWorldcup.data : [];
    const set = new Set(selectedCandidateKeys);
    return data.filter((candidate, index) =>
      set.has(String(candidate?.id ?? index))
    );
  }, [selectedWorldcup, selectedCandidateKeys]);

  useEffect(() => {
    setCurrentQuestionIndex((index) => Math.min(index, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  function isQuestionComplete(q) {
    if (!String(q?.question || "").trim()) return false;
    if (q.type === "short_answer") return q.answers?.some((answer) => String(answer || "").trim());
    return q.options?.length === 4 && q.options.every((option) => String(option || "").trim());
  }

  function isQuestionUntouched(q) {
    const options = Array.isArray(q?.options) ? q.options.map((option) => String(option || "").trim()) : [];
    return (
      q?.type === "multiple_choice" &&
      !String(q.question || "").trim() &&
      !q.imageFile &&
      !String(q.imageUrl || "").trim() &&
      !String(q.explanation || "").trim() &&
      Number(q.correctIndex || 0) === 0 &&
      (options.length === 0 || options.every((option) => !option)) &&
      !q.sourceWorldcupId &&
      !q.sourceCandidateId
    );
  }

  function addBlankQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setCurrentQuestionIndex(questions.length);
  }

  function removeQuestion(index) {
    setQuestions((prev) => prev.length <= 1 ? [emptyQuestion()] : prev.filter((_, questionIndex) => questionIndex !== index));
    setCurrentQuestionIndex((current) => questions.length <= 1 ? 0 : Math.max(0, current > index ? current - 1 : Math.min(current, questions.length - 2)));
  }

  function openWorldcupImport() {
    setCreationMode("preset");
    setImportOpen(true);
    requestAnimationFrame(() => importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function patchQuestion(localId, patch) {
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q))
    );
  }

  function patchOption(localId, optionIndex, value) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === localId
          ? {
              ...q,
              options: q.options.map((o, i) => (i === optionIndex ? value : o)),
              autoChoices: false,
            }
          : q
      )
    );
  }

  function patchAnswer(localId, answerIndex, value) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === localId
          ? {
              ...q,
              answers: q.answers.map((a, i) => (i === answerIndex ? value : a)),
            }
          : q
      )
    );
  }

  function toggleLanguage(code) {
    setContentLanguages((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== code);
      }
      return [...prev, code];
    });
  }

  const orderedLanguages = useMemo(() => [
    ...QUIZ_LANGUAGES.filter((item) => item.code === originalLanguage),
    ...QUIZ_LANGUAGES.filter((item) => item.code !== originalLanguage),
  ], [originalLanguage]);

  function languageLabel(item) {
    const koNames = { en:"영어", ko:"한국어", ja:"일본어", zh:"중국어", es:"스페인어", fr:"프랑스어", vi:"베트남어", de:"독일어", ru:"러시아어", id:"인도네시아어", pt:"포르투갈어", hi:"힌디어", tr:"튀르키예어", th:"태국어", ar:"아랍어", bn:"벵골어" };
    const enNames = { en:"English", ko:"Korean", ja:"Japanese", zh:"Chinese", es:"Spanish", fr:"French", vi:"Vietnamese", de:"German", ru:"Russian", id:"Indonesian", pt:"Portuguese", hi:"Hindi", tr:"Turkish", th:"Thai", ar:"Arabic", bn:"Bengali" };
    return `${(lang === "ko" ? koNames : enNames)[item.code] || item.label} (${item.code})`;
  }

  function addTitleTranslation() {
    const used = new Set([originalLanguage, ...titleTranslations.map((item) => item.lang)]);
    const next = orderedLanguages.find((item) => !used.has(item.code));
    if (next) setTitleTranslations((prev) => [...prev, { id: makeId(), lang: next.code, title: "", description: "" }]);
  }

  function patchTitleTranslation(id, patch) {
    setTitleTranslations((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function ensureTitleTranslation(code, patch) {
    if (code === originalLanguage) {
      if (Object.prototype.hasOwnProperty.call(patch, "title")) setTitle(patch.title);
      if (Object.prototype.hasOwnProperty.call(patch, "description")) setDescription(patch.description);
      return;
    }

    setTitleTranslations((prev) => {
      const found = prev.find((item) => item.lang === code);
      if (found) {
        return prev.map((item) => item.lang === code ? { ...item, ...patch } : item);
      }
      return [...prev, { id: makeId(), lang: code, title: "", description: "", ...patch }];
    });
  }

  const activeTitleTranslation =
    lang === originalLanguage
      ? { title, description }
      : titleTranslations.find((item) => item.lang === lang) || { title: "", description: "" };

  function questionLocale(q, code) {
    if (code === originalLanguage) return { question: q.question || "", options: q.options || ["", "", "", ""], answers: q.answers || [""], explanation: q.explanation || "" };
    const value = q.translations?.[code] || {};
    return {
      question: value.question || "",
      options: Array.isArray(value.options) ? value.options : ["", "", "", ""],
      answers: Array.isArray(value.answers) && value.answers.length ? value.answers : [""],
      explanation: value.explanation || "",
    };
  }

  function patchQuestionLocale(q, code, patch) {
    if (code === originalLanguage) return patchQuestion(q.localId, patch);
    const current = questionLocale(q, code);
    patchQuestion(q.localId, { translations: { ...(q.translations || {}), [code]: { ...current, ...patch } } });
  }

  function applyDragCandidate(key, selecting) {
    setSelectedCandidateKeys((prev) => selecting
      ? (prev.includes(key) ? prev : [...prev, key])
      : prev.filter((item) => item !== key));
  }

  function beginCandidateDrag(event, key, checked) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragSelectRef.current = { active: true, selecting: !checked };
    applyDragCandidate(key, !checked);
  }

  function enterCandidateDuringDrag(key) {
    if (dragSelectRef.current.active) applyDragCandidate(key, dragSelectRef.current.selecting);
  }

  function makeMultipleChoiceQuestion(candidate, allCandidates, worldcupId, index) {
    const name = String(candidate?.name || "").trim();
    const distractors = shuffle(
      allCandidates
        .map((x) => String(x?.name || "").trim())
        .filter((x) => x && x !== name)
    ).slice(0, 3);
    const rawOptions = shuffle([name, ...distractors]);
    while (rawOptions.length < 4) rawOptions.push("");
    return {
      localId: makeId(),
      type: "multiple_choice",
      question: originalLanguage === "ko" ? "이 후보의 이름은?" : "Who is this?",
      imageFile: null,
      imageUrl: getYoutubeThumbnail(candidate?.image || ""),
      options: rawOptions.slice(0, 4),
      correctIndex: Math.max(0, rawOptions.indexOf(name)),
      answers: [name],
      ignoreCase: true,
      ignoreSpaces: true,
      explanation: "",
      sourceWorldcupId: worldcupId,
      sourceCandidateId: candidate?.id ?? String(index),
      sourceAnswer: name,
      autoChoices: true,
    };
  }

  function addCandidatesFromWorldcup() {
    if (!selectedWorldcup) return;
    const all = Array.isArray(selectedWorldcup.data) ? selectedWorldcup.data : [];
    const addList = selectedCandidates.filter((candidate) => candidate?.name || candidate?.image);
    if (!addList.length) return setError(m.selectCandidateRequired);

    const generated = addList.map((candidate, index) =>
      makeMultipleChoiceQuestion(candidate, all, selectedWorldcup.id, index)
    );

    const hasOnlyBlank =
      questions.length === 1 &&
      !questions[0].question &&
      !questions[0].imageUrl &&
      questions[0].type === "multiple_choice" &&
      questions[0].correctIndex === 0 &&
      (questions[0].options.every((x) => !x) ||
        (questions[0].options[0] === "A" && questions[0].options.slice(1).every((x) => !x)));

    setQuestions((prev) => {
      return hasOnlyBlank ? generated : [...prev, ...generated];
    });
    setCurrentQuestionIndex(hasOnlyBlank ? 0 : questions.length);

    setCandidatePool((prev) => {
      const map = new Map(prev.map((x) => [String(x.name), x]));
      all.forEach((candidate) => {
        const name = String(candidate?.name || "").trim();
        if (name && !map.has(name)) {
          map.set(name, {
            name,
            image: getYoutubeThumbnail(candidate?.image || ""),
            sourceWorldcupId: selectedWorldcup.id,
            sourceCandidateId: candidate?.id || null,
          });
        }
      });
      return [...map.values()];
    });

    setSourceWorldcupIds((prev) =>
      prev.includes(selectedWorldcup.id)
        ? prev
        : [...prev, selectedWorldcup.id]
    );
    setActiveSourceWorldcupId(selectedWorldcup.id);

    if (!thumbnailFile && !title && selectedWorldcup.title) {
      setTitle(`${displayWorldcupTitle(selectedWorldcup, originalLanguage)} 이름 맞히기`);
    }
    setImportOpen(false);
    setSelectedWorldcup(null);
    setSelectedCandidateKeys([]);
    setTopicPanelOpen(false);
  }

  function randomizeQuestionOptions(q, editLanguage = originalLanguage) {
    const localized = questionLocale(q, editLanguage);
    const baseAnswer = String(q.sourceAnswer || q.options?.[q.correctIndex] || q.answers?.[0] || "").trim();
    const localizedAnswer = String(localized.options?.[q.correctIndex] || "").trim();
    const answer = localizedAnswer || baseAnswer;
    const excluded = new Set([answer, baseAnswer].filter(Boolean).map((name) => name.toLocaleLowerCase()));
    const pool = Array.from(new Set(candidatePool
      .filter((item) => !q.sourceWorldcupId || String(item.sourceWorldcupId) === String(q.sourceWorldcupId))
      .map((item) => String(item.name || "").trim())
      .filter((name) => name && !excluded.has(name.toLocaleLowerCase()))));
    const wrong = shuffle(pool).slice(0, 3);
    let next;
    if (editLanguage === originalLanguage) {
      next = shuffle([answer, ...wrong]);
      while (next.length < 4) next.push("");
    } else {
      next = ["", "", "", ""];
      const answerIndex = Math.max(0, Math.min(3, Number(q.correctIndex || 0)));
      next[answerIndex] = answer;
      let wrongIndex = 0;
      for (let index = 0; index < next.length; index += 1) {
        if (index !== answerIndex) next[index] = wrong[wrongIndex++] || "";
      }
    }
    patchQuestionLocale(q, editLanguage, {
      options: next.slice(0, 4),
      ...(editLanguage === originalLanguage ? {
        correctIndex: Math.max(0, next.indexOf(answer)),
        sourceAnswer: answer,
        answers: [answer],
        autoChoices: true,
      } : {}),
    });
  }

  function changeQuestionType(q, nextType) {
    if (nextType === "short_answer") {
      const answer =
        q.answers?.find(Boolean) ||
        q.sourceAnswer ||
        q.options?.[q.correctIndex] ||
        "";
      patchQuestion(q.localId, {
        type: "short_answer",
        answers: answer ? [answer, "", ""] : ["", "", ""],
        ignoreCase: true,
        ignoreSpaces: true,
        autoChoices: false,
      });
    } else {
      const answer = q.answers?.find(Boolean) || q.sourceAnswer || "";
      const pool = candidatePool
        .map((x) => x.name)
        .filter((name) => name && name !== answer);
      const options = shuffle([answer, ...shuffle(pool).slice(0, 3)]);
      while (options.length < 4) options.push("");
      patchQuestion(q.localId, {
        type: "multiple_choice",
        options,
        correctIndex: Math.max(0, options.indexOf(answer)),
        autoChoices: false,
      });
    }
  }

  function setAllTypes(type) {
    setQuestions((prev) =>
      prev.map((q) => {
        const answer =
          q.answers?.find(Boolean) ||
          q.sourceAnswer ||
          q.options?.[q.correctIndex] ||
          "";
        if (type === "short_answer") {
          return {
            ...q,
            type,
            answers: answer ? [answer, "", ""] : ["", "", ""],
            ignoreCase: true,
            ignoreSpaces: true,
          };
        }
        const pool = candidatePool
          .map((x) => x.name)
          .filter((name) => name && name !== answer);
        const options = shuffle([answer, ...shuffle(pool).slice(0, 3)]);
        while (options.length < 4) options.push("");
        return {
          ...q,
          type,
          options,
          correctIndex: Math.max(0, options.indexOf(answer)),
        };
      })
    );
  }

  function addNextQuestionFromCurrentTopic({ random = false } = {}) {
    if (!activeSourceWorldcupId) {
      setQuestions((prev) => [...prev, emptyQuestion()]);
      return;
    }

    const pool = candidatePool.filter(
      (item) => String(item.sourceWorldcupId) === String(activeSourceWorldcupId)
    );
    const used = new Set(
      questions
        .filter((q) => String(q.sourceWorldcupId) === String(activeSourceWorldcupId))
        .map((q) => String(q.sourceCandidateId || q.sourceAnswer || ""))
    );
    const unused = pool.filter(
      (item) => !used.has(String(item.sourceCandidateId || item.name || ""))
    );

    if (!unused.length) {
      setError(m.noCandidates);
      return;
    }

    if (!random && !nextTopicCandidateId) {
      setError(m.chooseCandidateFirst);
      return;
    }

    const picked = random
      ? shuffle(unused)[0]
      : unused.find((item) => String(item.sourceCandidateId || item.name || "") === String(nextTopicCandidateId));
    if (!picked) {
      setError(m.candidateMissing);
      return;
    }
    const allCandidates = pool.map((item, index) => ({
      id: item.sourceCandidateId || `${item.name}-${index}`,
      name: item.name,
      image: item.image,
    }));
    const candidate = {
      id: picked.sourceCandidateId || picked.name,
      name: picked.name,
      image: picked.image,
    };
    const nextQuestion = makeMultipleChoiceQuestion(
      candidate,
      allCandidates,
      activeSourceWorldcupId,
      questions.length
    );
    setQuestions((prev) => [...prev, nextQuestion]);
    setCurrentQuestionIndex(questions.length);
    setNextTopicCandidateId("");
    setTopicPanelOpen(false);
    setError("");
  }

  async function saveDraft() {
    try {
      const files = [];
      if (thumbnailFile instanceof Blob) files.push({ key: "thumbnail", file: thumbnailFile });
      questions.forEach((question) => {
        if (question.imageFile instanceof Blob) files.push({ key: `question:${question.localId}`, file: question.imageFile });
      });
      await writeQuizDraftFiles(files);
      const safeQuestions = questions.map(({ imageFile, ...question }) => ({ ...question, imageFile: null }));
      localStorage.setItem(QUIZ_DRAFT_STORAGE_KEY, JSON.stringify({
        version: 1, savedAt: Date.now(), originalLanguage, title, titleTranslations, description, category, contentLanguages,
        questions: safeQuestions, creationMode, currentQuestionIndex, candidatePool,
        sourceWorldcupIds, activeSourceWorldcupId,
      }));
      setDraftMessage(m.draftSaved);
    } catch (e) {
      console.error("quiz draft save failed", e);
      setDraftMessage(m.draftSaveFailed);
    }
  }

  async function loadDraft() {
    try {
      const raw = localStorage.getItem(QUIZ_DRAFT_STORAGE_KEY);
      if (!raw) return setDraftMessage(m.draftMissing);
      const draft = JSON.parse(raw);
      const fileEntries = await readQuizDraftFiles();
      const fileMap = new Map(fileEntries.map((entry) => [entry.key, entry.file]));
      const restoredQuestions = (Array.isArray(draft.questions) && draft.questions.length ? draft.questions : [emptyQuestion()])
        .map((question) => ({ ...question, localId: question.localId || makeId(), imageFile: fileMap.get(`question:${question.localId}`) || null }));
      setOriginalLanguage(draft.originalLanguage || originalLanguage || lang);
      setTitle(draft.title || "");
      setTitleTranslations(Array.isArray(draft.titleTranslations) ? draft.titleTranslations : []);
      setDescription(draft.description || "");
      setCategory(draft.category || "knowledge");
      setContentLanguages(Array.isArray(draft.contentLanguages) && draft.contentLanguages.length ? draft.contentLanguages : [lang]);
      setQuestions(restoredQuestions);
      setThumbnailFile(fileMap.get("thumbnail") || null);
      setCreationMode(draft.creationMode || "direct");
      setCandidatePool(Array.isArray(draft.candidatePool) ? draft.candidatePool : []);
      setSourceWorldcupIds(Array.isArray(draft.sourceWorldcupIds) ? draft.sourceWorldcupIds : []);
      setActiveSourceWorldcupId(draft.activeSourceWorldcupId || null);
      setCurrentQuestionIndex(Math.min(Number(draft.currentQuestionIndex) || 0, restoredQuestions.length - 1));
      setDraftMessage(m.draftLoaded);
      setError("");
    } catch (e) {
      console.error("quiz draft load failed", e);
      setDraftMessage(m.draftLoadFailed);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!user) return setError(m.loginRequired);
    if (!title.trim()) return setError(m.titleRequired);
    if (!contentLanguages.length) return setError(m.languageRequired);
    const incompleteTouchedIndex = questions.findIndex(
      (question) => !isQuestionComplete(question) && !isQuestionUntouched(question)
    );
    if (incompleteTouchedIndex >= 0) {
      setCurrentQuestionIndex(incompleteTouchedIndex);
      return setError(fillCopy(m.touchedIncomplete, { number: incompleteTouchedIndex + 1 }));
    }

    const completedQuestions = questions.filter(isQuestionComplete);
    if (!completedQuestions.length) {
      return setError(m.completeRequired);
    }

    setSaving(true);
    try {
      let thumbnailUrl = existingThumbnailUrl;
      if (thumbnailFile) thumbnailUrl = await uploadQuizImage(thumbnailFile, user.id);
      if (!thumbnailUrl) {
        thumbnailUrl = getYoutubeThumbnail(completedQuestions.find((q) => q.imageUrl)?.imageUrl || "");
      }

      const uploadedQuestions = [];
      for (const q of completedQuestions) {
        let imageUrl = q.imageUrl || "";
        if (q.imageFile) imageUrl = await uploadQuizImage(q.imageFile, user.id);
        uploadedQuestions.push({ ...q, imageUrl });
      }

      const saveOriginalLanguage = editQuizId
        ? originalLanguage
        : detectContentLanguage(`${title} ${description}`, originalLanguage || lang);
      const saveContentLanguages = Array.from(new Set(
        contentLanguages.map((code) =>
          !editQuizId && code === originalLanguage ? saveOriginalLanguage : code
        ).concat(saveOriginalLanguage)
      ));

      const id = await createQuiz({
        quizId: editQuizId,
        title,
        titleTranslations: Object.fromEntries([
          [saveOriginalLanguage, title.trim()],
          ...titleTranslations
            .filter((item) => item.lang && item.lang !== saveOriginalLanguage && item.title.trim())
            .map((item) => [item.lang, item.title.trim()]),
        ]),
        descriptionTranslations: Object.fromEntries([
          [saveOriginalLanguage, description.trim()],
          ...titleTranslations
            .filter((item) => item.lang && item.lang !== saveOriginalLanguage && item.description?.trim())
            .map((item) => [item.lang, item.description.trim()]),
        ]),
        description,
        category,
        thumbnailUrl,
        questions: uploadedQuestions,
        user,
        nickname,
        lang: saveOriginalLanguage,
        contentLanguages: saveContentLanguages,
        answerRevealMode: "both",
        sourceWorldcupIds,
      });
      localStorage.removeItem(QUIZ_DRAFT_STORAGE_KEY);
      await writeQuizDraftFiles([]).catch(() => {});
      navigate(`/${lang}/quiz/${id}`);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2>{m.loginRequired}</h2>
        <button
          type="button"
          onClick={() => navigate(`/${lang}/login`)}
          style={primaryButton}
        >
          {m.login}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#202534", padding: "24px 12px 60px" }}>
      <form onSubmit={submit} style={{ maxWidth: 980, margin: "0 auto" }}>
        <button type="button" onClick={() => navigate(`/${lang}/quiz`)} style={secondaryButton}>
          ← {m.back}
        </button>
        <h1 style={{ textAlign: "center", fontSize: mobile ? 28 : 36, marginBottom: 22 }}>
          {m.title}
        </h1>
        <div style={{ ...creatorWarningStyle, marginBottom: 18 }}>⚠️ {safetyCopy.warning}</div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <button type="button" onClick={saveDraft} disabled={saving} style={{ ...secondaryButton, borderColor: "#93b4e8", color: "#2459a6", minHeight: 48, padding: "11px 20px" }}>💾 {m.draftSave}</button>
          <button type="button" onClick={loadDraft} disabled={saving} style={{ ...secondaryButton, borderColor: "#93b4e8", color: "#2459a6", minHeight: 48, padding: "11px 20px" }}>↻ {m.draftLoad}</button>
          {draftMessage && <span role="status" style={{ color: "#2459a6", fontWeight: 850 }}>{draftMessage}</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => { setCreationMode("direct"); setImportOpen(false); }}
            style={creationModeButton(creationMode === "direct")}
          >
            <span style={{ display: "block", fontSize: 20, fontWeight: 950 }}>✏️ {m.direct}</span>
            <span style={{ display: "block", marginTop: 7, color: "#667085", fontSize: 15 }}>{m.directHelp}</span>
          </button>
          <button
            type="button"
            onClick={() => { setCreationMode("preset"); setImportOpen(true); }}
            style={creationModeButton(creationMode === "preset")}
          >
            <span style={{ display: "block", fontSize: 20, fontWeight: 950 }}>🏆 {m.preset}</span>
            <span style={{ display: "block", marginTop: 7, color: "#667085", fontSize: 15 }}>{m.presetHelp}</span>
          </button>
        </div>

        <section style={sectionStyle}>
          <label style={labelStyle}>
            {m.quizTitle}
            <input
              value={activeTitleTranslation.title || ""}
              onChange={(e) => ensureTitleTranslation(lang, { title: e.target.value })}
              maxLength={100}
              style={inputStyle}
            />
          </label>
          <div style={{ margin: "-4px 0 16px" }}>
            <button type="button" onClick={addTitleTranslation} disabled={titleTranslations.length >= QUIZ_LANGUAGES.length - 1} style={{ ...secondaryButton, minHeight: 42, color: "#2459a6", borderColor: "#a9c1e8" }}>＋ {m.addTranslatedTitle}</button>
            {titleTranslations.map((row) => {
              const used = new Set(titleTranslations.filter((item) => item.id !== row.id).map((item) => item.lang));
              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "210px minmax(0,1fr) auto", gap: 8, alignItems: "start", marginTop: 9, padding: 10, border: "1px solid #d7e0ed", borderRadius: 9, background: "#f9fbfe" }}>
                  <select value={row.lang} onChange={(e) => patchTitleTranslation(row.id, { lang: e.target.value })} style={{ ...inputStyle, margin: 0 }} aria-label={m.languageSetting}>
                    {orderedLanguages.filter((item) => item.code !== originalLanguage && (item.code === row.lang || !used.has(item.code))).map((item) => <option key={item.code} value={item.code}>{languageLabel(item)}</option>)}
                  </select>
                  <div style={{ display: "grid", gap: 8 }}>
                    <input value={row.title} onChange={(e) => patchTitleTranslation(row.id, { title: e.target.value })} maxLength={100} placeholder={m.translatedTitlePlaceholder} style={{ ...inputStyle, margin: 0 }} aria-label={m.quizTitle} />
                    <textarea value={row.description || ""} onChange={(e) => patchTitleTranslation(row.id, { description: e.target.value })} maxLength={500} rows={3} placeholder={m.translatedDescriptionPlaceholder} style={{ ...inputStyle, minHeight: 88, height: "auto", margin: 0, padding: 10 }} aria-label={m.description} />
                  </div>
                  <button type="button" onClick={() => setTitleTranslations((prev) => prev.filter((item) => item.id !== row.id))} style={{ ...secondaryButton, minHeight: 50, color: "#a23b43" }}>{m.delete}</button>
                </div>
              );
            })}
          </div>
          <label style={labelStyle}>
            {m.description}
            <textarea
              value={activeTitleTranslation.description || ""}
              onChange={(e) => ensureTitleTranslation(lang, { description: e.target.value })}
              maxLength={500}
              rows={3}
              style={{ ...inputStyle, height: "auto", padding: 10 }}
            />
          </label>

          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{m.languages}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
              {orderedLanguages.map((item) => {
                const active = contentLanguages.includes(item.code);
                return (
                  <React.Fragment key={item.code}>
                  {item.code === "id" && <span aria-hidden="true" style={{ flexBasis: "100%", height: 0 }} />}
                  <button type="button" onClick={() => toggleLanguage(item.code)} style={pillButton(active)}>
                    {active ? "✓ " : ""}{item.label}
                  </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <label style={labelStyle}>
              {m.category}
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map((value) => <option key={value} value={value}>{m[value]}</option>)}
              </select>
            </label>
          </div>

          <div style={labelStyle}>
            {m.thumbnail}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <input id="quiz-thumbnail-file" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; if (validateImageFile(file)) setThumbnailFile(file); e.target.value = ""; }} style={{ display: "none" }} />
            <button type="button" onClick={() => document.getElementById("quiz-thumbnail-file")?.click()} style={fileButton}>{m.chooseImage}</button>
              <span style={{ color: "#667085", fontWeight: 600 }}>{thumbnailFile?.name || m.noFile}</span>
            </div>
            <div style={{ marginTop: 7, color: "#667085", fontSize: 14 }}>{safetyCopy.imageLimit}</div>
          </div>
        </section>

        {creationMode === "preset" && (
        <section ref={importSectionRef} style={{ ...sectionStyle, border: "2px solid #b9aaff", background: "#fbfaff", scrollMarginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{m.importTitle}</div>
              <div style={{ color: "#596579", marginTop: 4, lineHeight: 1.5 }}>
                {m.importHelp}
              </div>
            </div>
            <button type="button" onClick={() => setImportOpen((v) => !v)} style={primaryButton}>
              {importOpen ? m.close : `+ ${m.importCandidates}`}
            </button>
          </div>

          {importOpen && (
            <div style={{ marginTop: 16, borderTop: "1px solid #e3e8ef", paddingTop: 16 }}>
              <input value={worldcupSearch} onChange={(e) => setWorldcupSearch(e.target.value)} placeholder={m.searchBracket} style={inputStyle} />
              {worldcupsLoading ? <div style={{ padding: 16 }}>{m.loading}</div> : (
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {worldcups.map((cup) => (
                    <button key={cup.id} type="button" onClick={() => { setSelectedWorldcup(cup); setSelectedCandidateKeys([]); }} style={{ ...secondaryButton, textAlign: "left", border: selectedWorldcup?.id === cup.id ? "2px solid #E53935" : "1px solid #d5dde9" }}>
                      <strong>{displayWorldcupTitle(cup, lang)}</strong>
                      <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>{m.candidates} {Array.isArray(cup.data) ? cup.data.length : 0} · {m.plays} {Number(cup.play_count || 0).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedWorldcup && (
                <div style={{ marginTop: 14, border: "1.5px solid #cfd8e6", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>{m.chooseCandidates}</div>
                  <div style={{ color: "#596579", fontSize: 13, marginBottom: 10 }}>{m.chooseCandidatesHelp}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
                    <button type="button" onClick={() => setSelectedCandidateKeys((Array.isArray(selectedWorldcup.data) ? selectedWorldcup.data : []).map((candidate, index) => String(candidate?.id ?? index)))} style={secondaryButton}>{m.selectAll}</button>
                    <button type="button" onClick={() => setSelectedCandidateKeys([])} style={secondaryButton}>{m.clearSelection}</button>
                    <span style={{ alignSelf: "center", color: "#596579", fontWeight: 800 }}>{fillCopy(m.selectedCount, { count: selectedCandidateKeys.length })}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 8, maxHeight: 360, overflowY: "auto", userSelect: "none" }}>
                    {(Array.isArray(selectedWorldcup.data) ? selectedWorldcup.data : []).map((candidate, index) => {
                      const key = String(candidate?.id ?? index);
                      const checked = selectedCandidateKeys.includes(key);
                      return (
                        <button key={key} type="button" onPointerDown={(event) => beginCandidateDrag(event, key, checked)} onPointerEnter={() => enterCandidateDuringDrag(key)} style={{ border: checked ? "2px solid #E53935" : "1px solid #d5dde9", background: checked ? "#fff1f1" : "#fff", borderRadius: 8, padding: 6, cursor: "pointer", color: "#202534", touchAction: "pan-y" }}>
                          <div style={{ aspectRatio: "1 / 1", background: "#f3f5f8", overflow: "hidden", borderRadius: 6 }}>
                            {candidate?.image && <img src={getYoutubeThumbnail(candidate.image)} alt={candidate?.name || m.unnamed || "Candidate"} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{candidate?.name || m.unnamed}</div>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" disabled={selectedCandidateKeys.length === 0} onClick={addCandidatesFromWorldcup} style={{ ...primaryButton, width: "100%", marginTop: 12, opacity: selectedCandidateKeys.length === 0 ? .45 : 1, cursor: selectedCandidateKeys.length === 0 ? "not-allowed" : "pointer" }}>
                    {fillCopy(m.addSelected, { count: selectedCandidateKeys.length })}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
        )}

        <div style={{ margin: "18px 0 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 16, border: "1.5px solid #b8aaff", borderRadius: 10, background: "#f3f0ff" }}>
            <button type="button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))} style={{ ...secondaryButton, minHeight: 52, padding: "13px 22px", fontSize: 17, opacity: currentQuestionIndex === 0 ? 0.45 : 1 }}>← {m.previous}</button>
            <div style={{ fontSize: 21, fontWeight: 950 }}>{m.question} {currentQuestionIndex + 1} / {questions.length}</div>
            <div style={{ minHeight: 46, display: "grid", placeItems: "center", padding: "0 18px", border: "1.5px solid #e6a5a5", borderRadius: 8, background: "#fff", color: "#9c3b42", fontSize: 17, fontWeight: 950 }}>{m.questionList}</div>
            <button type="button" disabled={currentQuestionIndex >= questions.length - 1} onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))} style={{ ...secondaryButton, minHeight: 52, padding: "13px 22px", fontSize: 17, opacity: currentQuestionIndex >= questions.length - 1 ? 0.45 : 1 }}>{m.next} →</button>
          </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10, marginTop: 10, padding: 16, border: "1.5px solid #FFCDD2", borderRadius: 10, background: "#FFF8F8" }}>
              {questions.map((question, index) => (
                <button key={question.localId} type="button" onClick={() => setCurrentQuestionIndex(index)} style={{ ...secondaryButton, minHeight: 64, padding: "11px 14px", textAlign: "left", border: index === currentQuestionIndex ? "2px solid #d66a70" : "1px solid #d5dde9", background: index === currentQuestionIndex ? "#fff1f1" : "#fff", color: index === currentQuestionIndex ? "#8f3038" : "#253047" }}>
                  <strong style={{ fontSize: 16 }}>{index + 1}. {question.type === "short_answer" ? m.shortAnswer : m.multipleChoice}</strong>
                  <span style={{ display: "block", marginTop: 5, color: isQuestionComplete(question) ? "#248653" : isQuestionUntouched(question) ? "#667085" : "#b26a00", fontSize: 14 }}>
                    {isQuestionComplete(question) ? `✓ ${m.complete}` : isQuestionUntouched(question) ? m.emptyExcluded : `! ${m.needsReview}`}
                  </span>
                </button>
              ))}
            </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" onClick={() => setAllTypes("multiple_choice")} style={typeBatchButton(questions.length > 0 && questions.every((q) => q.type === "multiple_choice"))}>{m.allMultiple}</button>
            <button type="button" onClick={() => setAllTypes("short_answer")} style={typeBatchButton(questions.length > 0 && questions.every((q) => q.type === "short_answer"))}>{m.allShort}</button>
          </div>
        </div>

        {questions.map((q, qi) => {
          if (qi !== currentQuestionIndex) return null;
          const editLanguage = questionEditLanguages[q.localId] || originalLanguage;
          const localizedQuestion = questionLocale(q, editLanguage);
          return (
          <section key={q.localId} style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 23, fontWeight: 950 }}>{m.question} {qi + 1}</h3>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <select
                  value={q.type}
                  onChange={(e) => changeQuestionType(q, e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "auto",
                    margin: 0,
                    height: 50,
                    minWidth: 130,
                    padding: "0 38px 0 15px",
                    border: "2px solid #E53935",
                    color: "#4f3cc9",
                    background: "#FFF5F5",
                    fontWeight: 950,
                    fontSize: 18,
                  }}
                >
                  <option value="multiple_choice">● {m.multipleChoice}</option>
                  <option value="short_answer">✎ {m.shortAnswer}</option>
                </select>
                <button type="button" onClick={() => removeQuestion(qi)} style={{ ...secondaryButton, color: "#8f3740", borderColor: "#e2b8be" }}>{m.delete}</button>
              </div>
            </div>

            {q.imageUrl && (
              <div style={{ marginTop: 12, width: 150 }}>
                <MediaRenderer url={q.imageUrl} alt={q.question || `${m.question} ${qi + 1}`} playable={false} style={{ width: 150, height: 150, objectFit: "cover", border: "1.5px solid #cfd8e6", borderRadius: 10, display: "block" }} />
                <div style={{ marginTop: 7, fontSize: 14, fontWeight: 900, lineHeight: 1.4 }}>
                  {m.answer}: {getQuestionAnswer(q) || m.notEntered}
                </div>
              </div>
            )}
            <div style={labelStyle}>
              {m.questionMedia} {q.imageUrl && <span style={{ color: "#667085", fontWeight: 600 }}>({m.importedMedia})</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <input id={`quiz-question-file-${q.localId}`} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; if (validateImageFile(file)) patchQuestion(q.localId, { imageFile: file }); e.target.value = ""; }} style={{ display: "none" }} />
                <button type="button" onClick={() => document.getElementById(`quiz-question-file-${q.localId}`)?.click()} style={fileButton}>{m.chooseImage}</button>
                <span style={{ color: "#667085", fontWeight: 600 }}>{q.imageFile?.name || m.noFile}</span>
              </div>
              <div style={{ marginTop: 7, color: "#667085", fontSize: 14 }}>{safetyCopy.imageLimit}</div>
              {!q.sourceWorldcupId && <>
                <input value={q.imageUrl || ""} onChange={(e) => patchQuestion(q.localId, { imageUrl: e.target.value, imageFile: null })} placeholder={m.mediaUrl} maxLength={1000} style={{ ...inputStyle, marginTop: 10, marginBottom: 6 }} />
                <div style={{ color: "#667085", fontSize: 14, fontWeight: 650 }}>{m.mediaHelp}</div>
              </>}
            </div>

            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "18px 0 10px", padding: 10, borderRadius: 9, background: "#f5f7fb", border: "1px solid #d7e0ed" }}>
              {[originalLanguage, ...titleTranslations.map((item) => item.lang)].filter((code, index, list) => code && list.indexOf(code) === index).map((code) => {
                const item = QUIZ_LANGUAGES.find((language) => language.code === code) || { code, label: code };
                const active = editLanguage === code;
                return <button key={code} type="button" onClick={() => setQuestionEditLanguages((prev) => ({ ...prev, [q.localId]: code }))} style={pillButton(active)}>{languageLabel(item)}</button>;
              })}
            </div>

            <input value={localizedQuestion.question} onChange={(e) => patchQuestionLocale(q, editLanguage, { question: e.target.value })} placeholder={fillCopy(m.localizedQuestionPlaceholder, { language: editLanguage })} maxLength={200} style={inputStyle} />

            {q.type === "multiple_choice" ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 7, fontSize: 19, fontWeight: 950, color: "#4f3cc9" }}>
                    {m.answerDirect}
                  </label>
                  <input
                    value={localizedQuestion.options?.[q.correctIndex] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      patchQuestionLocale(q, editLanguage, {
                        ...(editLanguage === originalLanguage ? { sourceAnswer: value, answers: [value], autoChoices: false } : {}),
                        options: localizedQuestion.options.map((option, index) => index === q.correctIndex ? value : option),
                      });
                    }}
                    placeholder={m.answerPlaceholder}
                    maxLength={100}
                    style={{ ...inputStyle, margin: 0, border: "2px solid #E53935", background: "#FFF8F8", fontWeight: 850 }}
                  />
                  <div style={{ marginTop: 6, color: "#667085", fontSize: 14, fontWeight: 750 }}>
                    {m.answerSyncHelp}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{m.choices}</div>
                  {q.sourceWorldcupId && (
                    <button type="button" onClick={() => randomizeQuestionOptions(q, editLanguage)} disabled={!candidatePool.length} style={{ ...secondaryButton, borderColor: "#e3b0b0", color: "#9c3b42", background: "#fff8f8", fontWeight: 900 }}>{m.reroll}</button>
                  )}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {localizedQuestion.options.map((option, oi) => (
                    <div
                      key={oi}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        minHeight: 52,
                        padding: q.correctIndex === oi ? "8px 10px" : "2px 10px",
                        borderRadius: 9,
                        background: q.correctIndex === oi ? "#f3f0ff" : "transparent",
                        border: q.correctIndex === oi ? "1.5px solid #EF5350" : "1.5px solid transparent",
                      }}
                    >
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: q.correctIndex === oi ? "5px solid #E53935" : "1.5px solid #aeb8c8", boxSizing: "border-box", flex: "0 0 auto" }} />
                      <span style={{ width: 26, fontWeight: 950, fontSize: 18, color: "#E53935" }}>{"ABCD"[oi]}</span>
                      <input
                        value={option}
                        onChange={(e) => {
                          if (editLanguage === originalLanguage) patchOption(q.localId, oi, e.target.value);
                          else patchQuestionLocale(q, editLanguage, { options: localizedQuestion.options.map((value, index) => index === oi ? e.target.value : value) });
                        }}
                        placeholder={`${m.choice} ${oi + 1}`}
                        maxLength={100}
                        style={{
                          ...inputStyle,
                          margin: 0,
                          borderColor: q.correctIndex === oi ? "#E53935" : "#bccae0",
                          background: "#fff",
                        }}
                      />
                      {q.correctIndex === oi && <span style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 950, color: "#a23b42" }}>{m.correct}</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontWeight: 900, fontSize: 19, marginBottom: 10 }}>{m.multipleAnswers}</div>
                {localizedQuestion.answers.map((answer, ai) => (
                  <div key={ai} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input value={answer} onChange={(e) => editLanguage === originalLanguage ? patchAnswer(q.localId, ai, e.target.value) : patchQuestionLocale(q, editLanguage, { answers: localizedQuestion.answers.map((value, index) => index === ai ? e.target.value : value) })} placeholder={`${m.answer} ${ai + 1}`} maxLength={100} style={{ ...inputStyle, margin: 0 }} />
                    {localizedQuestion.answers.length > 1 && <button type="button" onClick={() => patchQuestionLocale(q, editLanguage, { answers: localizedQuestion.answers.filter((_, i) => i !== ai) })} style={secondaryButton}>{m.delete}</button>}
                  </div>
                ))}
                <button type="button" onClick={() => patchQuestionLocale(q, editLanguage, { answers: [...localizedQuestion.answers, ""] })} style={{ ...primaryButton, padding: "11px 20px", fontSize: 15 }}>+ {m.addAnswer}</button>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 15, fontSize: 17, fontWeight: 850 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={q.ignoreCase !== false} onChange={(e) => patchQuestion(q.localId, { ignoreCase: e.target.checked })} style={{ width: 18, height: 18 }} /> {m.ignoreCase}</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={Boolean(q.ignoreSpaces)} onChange={(e) => patchQuestion(q.localId, { ignoreSpaces: e.target.checked })} style={{ width: 18, height: 18 }} /> {m.ignoreSpaces}</label>
                </div>
              </div>
            )}

            <textarea value={localizedQuestion.explanation} onChange={(e) => patchQuestionLocale(q, editLanguage, { explanation: e.target.value })} placeholder={m.explanation} maxLength={300} rows={3} style={{ ...inputStyle, minHeight: 92, height: "auto", padding: 14, marginTop: 16 }} />
          </section>
          );
        })}

        {topicPanelOpen && activeSourceWorldcupId && (
          <div style={{ marginTop: 8, padding: 16, border: "1.5px solid #EF5350", borderRadius: 10, background: "#FFF8F8" }}>
            <div style={{ marginBottom: 10, fontSize: 17, fontWeight: 950, color: "#8f3740" }}>{m.sameTopic}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 100%", display: "grid", gridTemplateColumns: mobile ? "repeat(2,minmax(0,1fr))" : "repeat(auto-fill,minmax(130px,1fr))", gap: 9, maxHeight: 330, overflowY: "auto", padding: 4 }}>
                {candidatePool
                  .filter((item) => String(item.sourceWorldcupId) === String(activeSourceWorldcupId))
                  .filter((item) => !questions.some((q) => String(q.sourceWorldcupId) === String(activeSourceWorldcupId) && String(q.sourceCandidateId || q.sourceAnswer || "") === String(item.sourceCandidateId || item.name || "")))
                  .map((item) => {
                    const value = String(item.sourceCandidateId || item.name || "");
                    const selected = value === String(nextTopicCandidateId);
                    return <button key={value} type="button" onClick={() => setNextTopicCandidateId(value)} style={{ padding: 7, border: selected ? "2px solid #cf555c" : "1px solid #d5dde9", borderRadius: 9, background: selected ? "#fff1f1" : "#fff", color: "#253047", cursor: "pointer", textAlign: "left" }}>
                      <MediaRenderer url={item.image} alt={item.name || ""} playable={false} loading="lazy" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 7, background: "#f3f5f8" }} />
                      <span style={{ display: "block", marginTop: 6, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                    </button>;
                  })}
              </div>
              <button type="button" disabled={!nextTopicCandidateId} onClick={() => addNextQuestionFromCurrentTopic({ random: false })} style={{ ...primaryButton, minHeight: 50, opacity: nextTopicCandidateId ? 1 : 0.5 }}>{m.selectionDone}</button>
              <button type="button" onClick={() => addNextQuestionFromCurrentTopic({ random: true })} style={{ ...secondaryButton, minHeight: 50, borderColor: "#bd5a00", background: "#d86a00", color: "#fff", fontWeight: 950, boxShadow: "0 3px 9px rgba(180,82,0,.2)" }}>🎲 {m.randomAdd}</button>
            </div>
          </div>
        )}

        <div style={{ position: "sticky", bottom: 10, zIndex: 20, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, padding: 10, border: "1.5px solid #c9c0f7", borderRadius: 11, background: "rgba(255,255,255,0.97)" }}>
          <div style={{ flex: "1 1 100%", textAlign: "center", color: "#465166", fontSize: 16, fontWeight: 900, padding: "3px 0 5px" }}>{m.nextMethod}</div>
          {activeSourceWorldcupId ? (
            <>
              <button type="button" onClick={() => setTopicPanelOpen((open) => !open)} style={{ ...primaryButton, flex: "1 1 220px" }}>＋ {m.addSameTopic} ▾</button>
              <button type="button" onClick={openWorldcupImport} style={{ ...secondaryButton, flex: "1 1 220px" }}>＋ {m.addOtherTopic}</button>
              <button type="button" onClick={addBlankQuestion} style={{ ...secondaryButton, flex: "1 1 180px" }}>＋ {m.addDirect}</button>
            </>
          ) : (
            <>
              <button type="button" onClick={addBlankQuestion} style={{ ...primaryButton, flex: "1 1 200px" }}>＋ {m.addDirect}</button>
              <button type="button" onClick={openWorldcupImport} style={{ ...secondaryButton, flex: "1 1 300px" }}>🏆 {m.preset}</button>
            </>
          )}
        </div>

        {error && <div style={{ color: "#b42346", marginTop: 12, fontWeight: 800 }}>{error}</div>}
        <button type="submit" disabled={saving} style={{ ...primaryButton, width: "100%", marginTop: 14, padding: 14, fontSize: 18, opacity: saving ? 0.65 : 1 }}>
          {saving ? m.publishing : m.publish}
        </button>
      </form>
    </div>
  );
}

const sectionStyle = {
  border: "1.5px solid #cfd8e6",
  borderRadius: 12,
  padding: 24,
  marginBottom: 18,
  fontSize: 18,
  background: "#fff",
};
const creationModeButton = (active) => ({
  minHeight: 104,
  padding: "18px 20px",
  border: active ? "2px solid #d66a70" : "1.5px solid #cfd8e6",
  borderRadius: 11,
  background: active ? "#fff1f1" : "#fff",
  color: active ? "#8f3038" : "#202534",
  textAlign: "left",
  cursor: "pointer",
});
const labelStyle = { display: "block", fontWeight: 900, fontSize: 18, marginTop: 14 };
const inputStyle = {
  display: "block",
  width: "100%",
  height: 50,
  boxSizing: "border-box",
  margin: "7px 0 14px",
  border: "1.5px solid #bccae0",
  borderRadius: 8,
  padding: "0 14px",
  fontSize: 18,
  fontWeight: 650,
  background: "#fff",
  color: "#202534",
};
const primaryButton = {
  border: "1px solid #cf555c",
  background: "#cf555c",
  color: "#fff",
  borderRadius: 8,
  minHeight: 46,
  padding: "11px 17px",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
};
const secondaryButton = {
  border: "1px solid #d5dde9",
  background: "#fff",
  color: "#3f4a5a",
  borderRadius: 8,
  minHeight: 42,
  padding: "9px 14px",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};
const fileButton = {
  ...secondaryButton,
  border: "1.5px solid #d66a70",
  background: "#fff5f5",
  color: "#8f3038",
  fontWeight: 900,
};
const typeBatchButton = (active) => ({
  border: active ? "2px solid #d66a70" : "1.5px solid #b9c5d8",
  background: active ? "#fff1f1" : "#fff",
  color: active ? "#8f3038" : "#253047",
  borderRadius: 9,
  minHeight: 48,
  padding: "11px 18px",
  fontWeight: 950,
  fontSize: 17,
  cursor: "pointer",
});
const topicModeButton = (active) => ({
  border: active ? "1.5px solid #d66a70" : "1px solid #cfd8e6",
  background: active ? "#fff1f1" : "#fff",
  color: active ? "#8f3038" : "#3f4a5a",
  borderRadius: 8,
  minHeight: 44,
  padding: "9px 14px",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
});
const pillButton = (active) => ({
  border: active ? "1.5px solid #E53935" : "1px solid #d5dde9",
  background: active ? "#E53935" : "#fff",
  color: active ? "#fff" : "#3f4a5a",
  borderRadius: 8,
  padding: "6px 10px",
  fontWeight: 800,
  cursor: "pointer",
});
