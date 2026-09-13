import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

/* =========================================================
   한글 단독 자음 보정

   NFKC 때문에
   ㅁ -> ᄆ
   ㅋ -> ᄏ
   처럼 바뀐 과거 데이터까지 다시 호환 자음으로 복구
   ========================================================= */

const HANGUL_CHOSEONG_TO_COMPAT = {
  "ᄀ": "ㄱ",
  "ᄁ": "ㄲ",
  "ᄂ": "ㄴ",
  "ᄃ": "ㄷ",
  "ᄄ": "ㄸ",
  "ᄅ": "ㄹ",
  "ᄆ": "ㅁ",
  "ᄇ": "ㅂ",
  "ᄈ": "ㅃ",
  "ᄉ": "ㅅ",
  "ᄊ": "ㅆ",
  "ᄋ": "ㅇ",
  "ᄌ": "ㅈ",
  "ᄍ": "ㅉ",
  "ᄎ": "ㅊ",
  "ᄏ": "ㅋ",
  "ᄐ": "ㅌ",
  "ᄑ": "ㅍ",
  "ᄒ": "ㅎ",
};

/* =========================================================
   태그 문자열 정규화
   ========================================================= */

export function normalizeTagText(value) {
  return String(value || "")
    // 완성형 한글은 정상적으로 합치되
    // 단독 자음은 NFKC처럼 초성 코드로 바꾸지 않음
    .normalize("NFC")

    // 예전에 NFKC 때문에 저장된 초성형 자음 복구
    .replace(
      /[ᄀ-ᄒ]/g,
      (char) =>
        HANGUL_CHOSEONG_TO_COMPAT[char] || char
    )

    .trim()

    // #태그 / ##태그 모두 앞의 # 제거
    .replace(/^#+/, "")

    .toLowerCase()

    // 태그 20자 제한
    .slice(0, 20);
}

/* =========================================================
   태그 배열 정규화
   - 최대 5개
   - 중복 제거
   - 빈 태그 제거
   - 각 20자
   ========================================================= */

export function normalizeTags(values) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(normalizeTagText)
        .filter(Boolean)
    ),
  ].slice(0, 5);
}

/* =========================================================
   티어표 만들기 태그 입력 UI
   ========================================================= */

export function TierTagEditor({
  value,
  onChange,
}) {
  const { t } = useTranslation();

  const tags =
    Array.isArray(value)
      ? value
      : [];

  return (
    <fieldset
      style={{
        width: "100%",
        boxSizing: "border-box",
        margin: 0,

        border:
          "1px solid #d7dce4",

        borderRadius: 12,

        padding:
          "12px 14px 14px",

        background:
          "#f8fafc",

        color:
          "#1f2937",
      }}
    >
      <legend
        style={{
          padding:
            "0 8px",

          fontSize:
            16,

          fontWeight:
            800,

          color:
            "#111827",
        }}
      >
        {t(
          "tierTags.label",
          "태그"
        )}
      </legend>

      <p
        style={{
          fontSize:
            12,

          margin:
            "0 0 10px",

          color:
            "#6b7280",

          fontWeight:
            600,
        }}
      >
        {t(
          "tierTags.hint",
          "최대 5개 · 각 20자 · 같은 태그는 1번만 저장됩니다."
        )}
      </p>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",

          gap:
            8,
        }}
      >
        {Array.from(
          { length: 5 },
          (_, i) => (
            <input
              key={i}

              aria-label={`${t(
                "tierTags.label",
                "태그"
              )} ${i + 1}`}

              placeholder={`#Tag ${i + 1}`}

              maxLength={20}

              value={
                tags[i] || ""
              }

              onChange={(e) => {
                const next =
                  Array.from(
                    { length: 5 },
                    (_, j) =>
                      tags[j] || ""
                  );

                next[i] =
                  e.target.value.slice(
                    0,
                    20
                  );

                onChange(next);
              }}

              style={{
                minWidth:
                  0,

                width:
                  "100%",

                height:
                  40,

                padding:
                  "0 12px",

                boxSizing:
                  "border-box",

                background:
                  "#ffffff",

                border:
                  "1px solid #cbd5e1",

                borderRadius:
                  8,

                color:
                  "#111827",

                fontSize:
                  14,

                fontWeight:
                  600,

                outline:
                  "none",
              }}
            />
          )
        )}
      </div>
    </fieldset>
  );
}

/* =========================================================
   결과 페이지 / 카드에서 보여주는 태그
   ========================================================= */

export function TierTags({
  value,
  lang,
}) {
  const navigate =
    useNavigate();

  const tags =
    normalizeTags(value);

  if (
    tags.length === 0
  ) {
    return null;
  }

  return (
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "center",

        flexWrap:
          "wrap",

        gap:
          8,

        marginTop:
          12,
      }}
    >
      {tags.map(
        (tag) => (
          <button
            type="button"
            key={tag}

            onClick={() =>
              navigate(
                `/${lang}/tier-list?${new URLSearchParams(
                  {
                    tag,
                  }
                )}`
              )
            }

            style={{
              border:
                "1px solid #93c5fd",

              borderRadius:
                999,

              background:
                "#eff6ff",

              color:
                "#2563eb",

              padding:
                "6px 12px",

              cursor:
                "pointer",

              overflowWrap:
                "anywhere",

              fontWeight:
                700,

              fontSize:
                13,
            }}
          >
            #{tag}
          </button>
        )
      )}
    </div>
  );
}

/* =========================================================
   사용한 원본 프리셋 제목
   ========================================================= */

export function PresetTitle({
  id,
  snapshot,
  lang,
}) {
  const { t } =
    useTranslation();

  const [
    cup,
    setCup,
  ] = useState(null);

  useEffect(() => {
    let cancelled =
      false;

    setCup(null);

    if (!id) {
      return () => {
        cancelled =
          true;
      };
    }

    supabase
      .from(
        "worldcups"
      )
      .select(
        "id,title,title_translations"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle()
      .then(
        ({
          data,
          error,
        }) => {
          if (
            !cancelled &&
            !error
          ) {
            setCup(
              data
            );
          }
        }
      )
      .catch(
        () => {}
      );

    return () => {
      cancelled =
        true;
    };
  }, [id]);

  let translations =
    cup?.title_translations;

  try {
    if (
      typeof translations ===
      "string"
    ) {
      translations =
        JSON.parse(
          translations
        );
    }
  } catch {
    translations = {};
  }

  const title =
    String(
      cup?.id
    ) ===
    String(id)
      ? translations?.[
          lang
        ] ||
        translations?.en ||
        cup?.title ||
        ""
      : "";

  return (
    <>
      {title ||
        snapshot ||
        t(
          "tierList.result.sourcePresetFallback",
          "프리셋"
        )}
    </>
  );
}