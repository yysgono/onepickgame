import { supabase } from "./supabaseClient";
import imageCompression from "browser-image-compression";

export const QUIZ_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "简体中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "th", label: "ภาษาไทย" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা" },
];

export async function getQuizzes({
  search = "",
  category = "all",
  sort = "popular",
  contentLanguage = "",
  limit = 60,
} = {}) {
  let query = supabase
    .from("quizzes")
    .select(
      "id,user_id,guest_nickname,title,title_translations,description,description_translations,original_language,content_languages,category,thumbnail_url,question_count,play_count,like_count,comment_count,answer_reveal_mode,is_featured,featured_order,created_at,is_published"
    )
    .eq("is_published", true)
    .order(sort === "latest" ? "created_at" : "play_count", {
      ascending: false,
    })
    .limit(limit);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (contentLanguage) {
    query = query.contains("content_languages", [contentLanguage]);
  }

  if (search.trim()) {
    const safe = search.trim().replace(/[%_,()]/g, " ").trim();
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%`
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}


export async function getFeaturedQuizzes({
  contentLanguage = "",
  limit = 8,
} = {}) {
  let query = supabase
    .from("quizzes")
    .select(
      "id,user_id,guest_nickname,title,title_translations,description,description_translations,original_language,content_languages,category,thumbnail_url,question_count,play_count,like_count,comment_count,answer_reveal_mode,is_featured,featured_order,created_at,is_published"
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("play_count", { ascending: false })
    .limit(limit);

  if (contentLanguage) {
    query = query.contains("content_languages", [contentLanguage]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getQuiz(id) {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();
  if (error) throw error;
  return data;
}

export async function getQuizQuestions(quizId) {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(
      "id,quiz_id,question_type,question_text,question_translations,image_url,options,options_translations,correct_index,answers,answer_match_options,explanation,explanation_translations,source_worldcup_id,source_candidate_id,auto_choices,sort_order"
    )
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function deleteQuiz(quizId) {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) throw new Error("LOGIN_REQUIRED");
  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function searchWorldcupsForQuiz({ search = "", limit = 1000 } = {}) {
  let query = supabase
    .from("worldcups")
    .select("id,title,title_translations,category,original_language,data,created_at")
    .is("deleted_at", null)
    .limit(Math.max(limit, 1000));

  if (search.trim()) {
    const safe = search.trim().replace(/[%_,()]/g, " ").trim();
    if (safe) query = query.ilike("title", `%${safe}%`);
  }

  const [{ data, error }, playResult] = await Promise.all([
    query,
    supabase.rpc("get_worldcup_play_counts"),
  ]);
  if (error) throw error;

  const playMap = new Map();
  if (!playResult?.error) {
    (playResult?.data || []).forEach((row) => {
      playMap.set(String(row.cup_id), Number(row.play_count || 0));
    });
  }

  return (data || [])
    .map((cup) => ({
      ...cup,
      play_count: playMap.get(String(cup.id)) || 0,
    }))
    .sort((a, b) => {
      const diff = Number(b.play_count || 0) - Number(a.play_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .slice(0, limit);
}

export async function createQuiz({
  quizId = "",
  title,
  titleTranslations = {},
  description,
  descriptionTranslations = {},
  category,
  thumbnailUrl,
  questions,
  user,
  nickname,
  lang,
  contentLanguages,
  answerRevealMode,
  sourceWorldcupIds = [],
}) {
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  const uniqueLanguages = Array.from(
    new Set([lang, ...(contentLanguages || [])].filter(Boolean))
  );

  const quizPayload = {
      user_id: user.id,
      guest_nickname: nickname || null,
      title: title.trim(),
      title_translations: {
        ...Object.fromEntries(Object.entries(titleTranslations || {}).filter(([, value]) => String(value || "").trim()).map(([code, value]) => [code, String(value).trim()])),
        [lang]: title.trim(),
      },
      description: description.trim(),
      description_translations: {
        ...Object.fromEntries(Object.entries(descriptionTranslations || {}).filter(([, value]) => String(value || "").trim()).map(([code, value]) => [code, String(value).trim()])),
        ...(description.trim() ? { [lang]: description.trim() } : {}),
      },
      category,
      thumbnail_url: thumbnailUrl || null,
      question_count: questions.length,
      original_language: lang,
      content_languages:
        uniqueLanguages.length > 0 ? uniqueLanguages : [lang],
      answer_reveal_mode: ["both", "immediate", "final", "none"].includes(answerRevealMode)
        ? answerRevealMode
        : "both",
      source_worldcup_ids: sourceWorldcupIds,
      is_published: true,
    };

  const quizQuery = quizId
    ? supabase.from("quizzes").update(quizPayload).eq("id", quizId).eq("user_id", user.id)
    : supabase.from("quizzes").insert(quizPayload);
  const { data: quiz, error: quizError } = await quizQuery
    .select("id")
    .single();

  if (quizError) throw quizError;

  const rows = questions.map((q, index) => {
    const questionType =
      q.type === "short_answer" ? "short_answer" : "multiple_choice";

    const options = Array.isArray(q.options)
      ? q.options.map((x) => String(x || "").trim())
      : [];
    const answers = Array.isArray(q.answers)
      ? q.answers.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    const translatedEntries = Object.entries(q.translations || {}).filter(([code]) => code && code !== lang);
    const questionTranslations = Object.fromEntries(translatedEntries.filter(([, value]) => String(value?.question || "").trim()).map(([code, value]) => [code, String(value.question).trim()]));
    const optionsTranslations = Object.fromEntries(translatedEntries.filter(([, value]) => Array.isArray(value?.options) && value.options.some((item) => String(item || "").trim())).map(([code, value]) => [code, value.options.map((item) => String(item || "").trim())]));
    const explanationTranslations = Object.fromEntries(translatedEntries.filter(([, value]) => String(value?.explanation || "").trim()).map(([code, value]) => [code, String(value.explanation).trim()]));
    const translatedAnswers = translatedEntries.flatMap(([, value]) => Array.isArray(value?.answers) ? value.answers : []).map((value) => String(value || "").trim()).filter(Boolean);

    return {
      quiz_id: quiz.id,
      question_type: questionType,
      question_text: String(q.question || "").trim(),
      question_translations: {
        ...questionTranslations,
        [lang]: String(q.question || "").trim(),
      },
      image_url: q.imageUrl || null,
      options: questionType === "multiple_choice" ? options : [],
      options_translations:
        questionType === "multiple_choice" ? { ...optionsTranslations, [lang]: options } : {},
      correct_index:
        questionType === "multiple_choice" ? Number(q.correctIndex || 0) : null,
      answers: questionType === "short_answer" ? Array.from(new Set([...answers, ...translatedAnswers])) : [],
      answer_match_options: {
        ignore_case: q.ignoreCase !== false,
        ignore_spaces: Boolean(q.ignoreSpaces),
      },
      explanation: String(q.explanation || "").trim(),
      explanation_translations: q.explanation?.trim()
        ? { ...explanationTranslations, [lang]: q.explanation.trim() }
        : explanationTranslations,
      source_worldcup_id: q.sourceWorldcupId || null,
      source_candidate_id: q.sourceCandidateId
        ? String(q.sourceCandidateId)
        : null,
      auto_choices: Boolean(q.autoChoices),
      sort_order: index,
    };
  });

  if (quizId) {
    const { error: deleteQuestionError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quiz.id);
    if (deleteQuestionError) throw deleteQuestionError;
  }

  const { error: questionError } = await supabase
    .from("quiz_questions")
    .insert(rows);

  if (questionError && !quizId) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
  }
  if (questionError) throw questionError;

  return quiz.id;
}

export async function uploadQuizImage(file, userId) {
  if (!file) return "";
  if (!file.type?.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("원본 이미지는 2MB 이하만 가능합니다.");
  }

  const optimizedFile = await imageCompression(file, {
    maxSizeMB: 0.9,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  });

  const ext = "webp";
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const path = `${userId}/${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from("quiz-images")
    .upload(path, optimizedFile, {
      upsert: false,
      cacheControl: "31536000",
      contentType: "image/webp",
    });
  if (error) throw error;

  return supabase.storage.from("quiz-images").getPublicUrl(path).data
    .publicUrl;
}

export async function incrementQuizPlay(quizId) {
  try {
    await supabase.rpc("increment_quiz_play", { p_quiz_id: quizId });
  } catch (e) {
    console.warn("quiz play count update failed", e);
  }
}

function getQuizParticipantId() {
  const key = "onepickgame_quiz_participant";
  let value = localStorage.getItem(key);
  if (!value) {
    value = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

export async function saveQuizAttempt({ quizId, attemptToken, records }) {
  const answers = (records || []).map((record, index) => ({
    index,
    question_id: record.question?.id || null,
    correct: Boolean(record.correct),
  }));
  const { error } = await supabase.from("quiz_attempts").upsert({
    quiz_id: quizId,
    participant_id: getQuizParticipantId(),
    attempt_token: attemptToken,
    answered_count: answers.length,
    correct_count: answers.filter((answer) => answer.correct).length,
    answers,
  }, { onConflict: "attempt_token", ignoreDuplicates: true });
  if (error) throw error;
}

export async function getQuizRankingStats({ quizId, answeredCount, attemptToken }) {
  const { data, error } = await supabase.rpc("get_quiz_ranking_stats", {
    p_quiz_id: quizId,
    p_answered_count: answeredCount,
    p_attempt_token: attemptToken,
  });
  if (error) throw error;
  return data || null;
}

export async function reportQuizQuestion({ quizId, questionId, ownerId, issueType, detail = "" }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData?.user?.id) throw new Error("LOGIN_REQUIRED");

  const reason = JSON.stringify({
    quiz_id: quizId,
    question_id: questionId,
    owner_id: ownerId || null,
    issue_type: issueType,
    detail: String(detail || "").trim().slice(0, 500),
  });
  const { error } = await supabase.from("reports").insert({
    type: "quiz_question",
    target_id: questionId,
    reporter_id: authData.user.id,
    reason,
  });
  if (error) throw error;
}
