import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../utils/supabaseClient";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;
const MAX_PRESETS = 5;

function TierPresetAdmin() {
  const [worldcups, setWorldcups] = useState([]);
  const [originalMap, setOriginalMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_COUNT
  );

  const [message, setMessage] = useState("");

  /* =========================================
     월드컵 목록 불러오기
  ========================================= */

  const loadWorldcups = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("worldcups")
        .select(
          `
          id,
          title,
          title_translations,
          is_tier_preset,
          tier_preset_order,
          deleted_at
          `
        )
        .is("deleted_at", null)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const rows = Array.isArray(data)
        ? data
        : [];

      setWorldcups(rows);

      const nextOriginalMap = {};

      rows.forEach((cup) => {
        nextOriginalMap[String(cup.id)] = {
          is_tier_preset: Boolean(
            cup.is_tier_preset
          ),

          tier_preset_order:
            cup.tier_preset_order == null
              ? null
              : Number(
                  cup.tier_preset_order
                ),
        };
      });

      setOriginalMap(nextOriginalMap);
    } catch (error) {
      console.error(
        "티어 프리셋 월드컵 조회 실패:",
        error
      );

      setMessage(
        "월드컵 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorldcups();
  }, [loadWorldcups]);

  /* =========================================
     선택 개수
  ========================================= */

  const selectedCount = useMemo(() => {
    return worldcups.filter(
      (cup) =>
        cup.is_tier_preset === true
    ).length;
  }, [worldcups]);

  /* =========================================
     검색 + 정렬

     선택된 프리셋을 항상 위에
     선택된 것끼리는 순서값 기준
  ========================================= */

  const filteredWorldcups = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return [...worldcups]
      .filter((cup) => {
        if (!keyword) {
          return true;
        }

        const title =
          (
            cup?.title_translations?.ko ||
            cup?.title ||
            cup?.title_translations?.en ||
            ""
          )
            .toString()
            .toLowerCase();

        return title.includes(keyword);
      })
      .sort((a, b) => {
        if (
          Boolean(a.is_tier_preset) !==
          Boolean(b.is_tier_preset)
        ) {
          return a.is_tier_preset
            ? -1
            : 1;
        }

        if (
          a.is_tier_preset &&
          b.is_tier_preset
        ) {
          const aOrder =
            a.tier_preset_order ??
            999999;

          const bOrder =
            b.tier_preset_order ??
            999999;

          return aOrder - bOrder;
        }

        return 0;
      });
  }, [
    worldcups,
    search,
  ]);

  const visibleWorldcups = useMemo(() => {
    return filteredWorldcups.slice(
      0,
      visibleCount
    );
  }, [
    filteredWorldcups,
    visibleCount,
  ]);

  /* =========================================
     다음 추천 순서
  ========================================= */

  const getNextOrder = (list) => {
    const orders = list
      .filter(
        (cup) =>
          cup.is_tier_preset
      )
      .map((cup) =>
        Number(
          cup.tier_preset_order ||
            0
        )
      );

    return (
      Math.max(
        0,
        ...orders
      ) + 1
    );
  };

  /* =========================================
     추천 ON / OFF
  ========================================= */

  const togglePreset = (id) => {
    setMessage("");

    setWorldcups((prev) => {
      const target = prev.find(
        (cup) =>
          String(cup.id) ===
          String(id)
      );

      if (!target) {
        return prev;
      }

      const nextValue =
        !target.is_tier_preset;

      if (nextValue) {
        const count = prev.filter(
          (cup) =>
            cup.is_tier_preset
        ).length;

        if (count >= MAX_PRESETS) {
          setMessage(
            `추천 프리셋은 최대 ${MAX_PRESETS}개까지 선택할 수 있습니다.`
          );

          return prev;
        }
      }

      const nextOrder =
        nextValue
          ? target.tier_preset_order ??
            getNextOrder(prev)
          : null;

      return prev.map((cup) =>
        String(cup.id) ===
        String(id)
          ? {
              ...cup,

              is_tier_preset:
                nextValue,

              tier_preset_order:
                nextOrder,
            }
          : cup
      );
    });
  };

  /* =========================================
     추천 순서 변경
  ========================================= */

  const changeOrder = (
    id,
    value
  ) => {
    setMessage("");

    setWorldcups((prev) =>
      prev.map((cup) =>
        String(cup.id) ===
        String(id)
          ? {
              ...cup,

              tier_preset_order:
                value === ""
                  ? null
                  : Number(value),
            }
          : cup
      )
    );
  };

  /* =========================================
     저장

     전체 월드컵 UPDATE하지 않고
     변경된 행만 UPDATE
  ========================================= */

  const savePresets = async () => {
    if (saving) {
      return;
    }

    const selected = worldcups.filter(
      (cup) =>
        cup.is_tier_preset
    );

    if (
      selected.length >
      MAX_PRESETS
    ) {
      setMessage(
        `추천 프리셋은 최대 ${MAX_PRESETS}개입니다.`
      );

      return;
    }

    const usedOrders =
      selected
        .map((cup) =>
          Number(
            cup.tier_preset_order
          )
        )
        .filter(
          (value) =>
            Number.isFinite(value)
        );

    if (
      selected.some(
        (cup) =>
          !Number.isInteger(
            Number(
              cup.tier_preset_order
            )
          ) ||
          Number(
            cup.tier_preset_order
          ) < 1 ||
          Number(
            cup.tier_preset_order
          ) > 5
      )
    ) {
      setMessage(
        "추천 순서는 1~5 사이 숫자로 입력해주세요."
      );

      return;
    }

    if (
      new Set(usedOrders).size !==
      usedOrders.length
    ) {
      setMessage(
        "추천 순서는 중복될 수 없습니다."
      );

      return;
    }

    const changedRows =
      worldcups.filter((cup) => {
        const original =
          originalMap[
            String(cup.id)
          ];

        if (!original) {
          return true;
        }

        const currentEnabled =
          Boolean(
            cup.is_tier_preset
          );

        const originalEnabled =
          Boolean(
            original.is_tier_preset
          );

        const currentOrder =
          currentEnabled
            ? Number(
                cup.tier_preset_order
              )
            : null;

        const originalOrder =
          originalEnabled
            ? original.tier_preset_order
            : null;

        return (
          currentEnabled !==
            originalEnabled ||
          currentOrder !==
            originalOrder
        );
      });

    if (
      changedRows.length === 0
    ) {
      setMessage(
        "변경된 내용이 없습니다."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const results =
        await Promise.all(
          changedRows.map(
            async (cup) => {
              const {
                error,
              } =
                await supabase
                  .from(
                    "worldcups"
                  )
                  .update({
                    is_tier_preset:
                      Boolean(
                        cup.is_tier_preset
                      ),

                    tier_preset_order:
                      cup.is_tier_preset
                        ? Number(
                            cup.tier_preset_order
                          )
                        : null,
                  })
                  .eq(
                    "id",
                    cup.id
                  );

              if (error) {
                throw error;
              }
            }
          )
        );

      void results;

      setMessage(
        `추천 티어표 프리셋을 저장했습니다. (${changedRows.length}개 변경)`
      );

      await loadWorldcups();
    } catch (error) {
      console.error(
        "티어 프리셋 저장 실패:",
        error
      );

      setMessage(
        `저장 실패: ${
          error?.message ||
          "알 수 없는 오류"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     화면
  ========================================= */

  return (
    <div
      style={{
        marginTop: 30,
        marginBottom: 30,

        padding: 20,

        border:
          "1px solid #315a8f",

        borderRadius: 12,

        background: "#07111f",
        color: "#fff",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",

          fontSize: 22,
          fontWeight: 900,
        }}
      >
        📊 티어표 추천 프리셋
      </h2>

      <div
        style={{
          color: "#9fb0c7",

          fontSize: 14,

          marginBottom: 14,
        }}
      >
        티어표 홈에 표시할
        이상형 월드컵을 최대{" "}
        {MAX_PRESETS}개 선택하세요.
        {" "}
        현재{" "}
        <strong
          style={{
            color: "#64d8ff",
          }}
        >
          {selectedCount}/
          {MAX_PRESETS}
        </strong>
      </div>

      {/* 검색 */}

      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(
            e.target.value
          );

          setVisibleCount(
            INITIAL_VISIBLE_COUNT
          );
        }}
        placeholder="월드컵 제목 검색"
        style={{
          width: "100%",
          maxWidth: 520,

          height: 40,

          padding: "0 12px",

          boxSizing:
            "border-box",

          borderRadius: 8,

          border:
            "1px solid #315a8f",

          background: "#0b1628",

          color: "#fff",

          outline: "none",

          marginBottom: 15,
        }}
      />

      {/* 메시지 */}

      {message && (
        <div
          style={{
            marginBottom: 12,

            padding:
              "9px 11px",

            borderRadius: 8,

            background:
              "#0b2037",

            color: "#64d8ff",

            fontSize: 13,

            fontWeight: 800,
          }}
        >
          {message}
        </div>
      )}

      {/* 로딩 */}

      {loading ? (
        <div
          style={{
            padding: 20,

            textAlign:
              "center",

            color: "#9fb0c7",

            fontWeight: 800,
          }}
        >
          Loading...
        </div>
      ) : (
        <>
          {/* 목록 */}

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            {visibleWorldcups.map(
              (cup) => {
                const title =
                  cup
                    ?.title_translations
                    ?.ko ||
                  cup?.title ||
                  cup
                    ?.title_translations
                    ?.en ||
                  String(cup.id);

                return (
                  <div
                    key={cup.id}
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap: 10,

                      padding:
                        "9px 10px",

                      border:
                        cup.is_tier_preset
                          ? "1px solid #3e8dcc"
                          : "1px solid #24364e",

                      borderRadius:
                        8,

                      background:
                        cup.is_tier_preset
                          ? "#0c2940"
                          : "#0b1628",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        cup.is_tier_preset
                      )}
                      onChange={() =>
                        togglePreset(
                          cup.id
                        )
                      }
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,

                        color:
                          "#fff",

                        fontSize:
                          14,

                        fontWeight:
                          800,

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        whiteSpace:
                          "nowrap",
                      }}
                      title={title}
                    >
                      {title}
                    </div>

                    {cup.is_tier_preset && (
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={
                          cup.tier_preset_order ??
                          ""
                        }
                        onChange={(
                          e
                        ) =>
                          changeOrder(
                            cup.id,
                            e.target
                              .value
                          )
                        }
                        style={{
                          width: 60,

                          height: 34,

                          textAlign:
                            "center",

                          borderRadius:
                            6,

                          border:
                            "1px solid #315a8f",

                          background:
                            "#07111f",

                          color:
                            "#fff",

                          fontWeight:
                            800,
                        }}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* 더보기 */}

          {visibleCount <
            filteredWorldcups.length && (
            <div
              style={{
                textAlign:
                  "center",

                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setVisibleCount(
                    (prev) =>
                      prev +
                      LOAD_MORE_COUNT
                  )
                }
                style={{
                  minWidth: 130,

                  padding:
                    "9px 18px",

                  borderRadius:
                    8,

                  border:
                    "1px solid #315a8f",

                  background:
                    "#14243d",

                  color: "#fff",

                  fontWeight:
                    900,

                  cursor:
                    "pointer",
                }}
              >
                더보기 ↓
              </button>

              <div
                style={{
                  marginTop: 6,

                  color:
                    "#7187a3",

                  fontSize: 11,
                }}
              >
                {Math.min(
                  visibleCount,
                  filteredWorldcups.length
                )}
                /
                {
                  filteredWorldcups.length
                }
                개 표시 중
              </div>
            </div>
          )}
        </>
      )}

      {/* 저장 */}

      <button
        type="button"
        disabled={
          saving ||
          loading
        }
        onClick={
          savePresets
        }
        style={{
          marginTop: 16,

          padding:
            "10px 18px",

          borderRadius: 8,

          border:
            "1px solid #19bfff",

          background:
            "#087ba8",

          color: "#fff",

          fontWeight: 900,

          cursor:
            saving
              ? "default"
              : "pointer",

          opacity:
            saving ||
            loading
              ? 0.65
              : 1,
        }}
      >
        {saving
          ? "저장 중..."
          : "추천 프리셋 저장"}
      </button>
    </div>
  );
}

export default TierPresetAdmin;