import ThumbnailSetting from './topNine/ThumbnailSetting';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PresetTitleTranslations from "./PresetTitleTranslations";

import { supabase } from "../utils/supabaseClient";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;

function displayTitle(cup) {
  let translations = cup?.title_translations || {};
  if (typeof translations === "string") { try { translations = JSON.parse(translations); } catch { translations = {}; } }
  return translations.ko || (typeof cup?.title === "string" ? cup.title : cup?.title?.ko || cup?.title?.en) || translations.en || String(cup.id);
}
function orderedPresets(rows) {
  return rows.filter(row => row.is_tier_preset).sort((a, b) =>
    Number(a.tier_preset_order ?? 2147483647) - Number(b.tier_preset_order ?? 2147483647) || String(a.id).localeCompare(String(b.id)));
}
function movePresetRows(rows, id, delta) {
  const selected = orderedPresets(rows);
  const index = selected.findIndex(row => String(row.id) === String(id));
  const target = index + delta;
  if (index < 0 || target < 0 || target >= selected.length) return rows;
  [selected[index], selected[target]] = [selected[target], selected[index]];
  const orders = new Map(selected.map((row, i) => [String(row.id), i + 1]));
  return rows.map(row => orders.has(String(row.id)) ? { ...row, tier_preset_order: orders.get(String(row.id)) } : row);
}
function reorderPresetRows(rows, sourceId, targetId, after) {
  const selected = orderedPresets(rows);
  const sourceIndex = selected.findIndex(row => String(row.id) === String(sourceId));
  const targetIndex = selected.findIndex(row => String(row.id) === String(targetId));
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;
  const [source] = selected.splice(sourceIndex, 1);
  const insertionIndex = selected.findIndex(row => String(row.id) === String(targetId)) + (after ? 1 : 0);
  selected.splice(insertionIndex, 0, source);
  const orders = new Map(selected.map((row, i) => [String(row.id), i + 1]));
  return rows.map(row => orders.has(String(row.id)) ? { ...row, tier_preset_order: orders.get(String(row.id)) } : row);
}

function TierPresetAdmin() {
  const [worldcups, setWorldcups] = useState([]);
  const draggedPreset = useRef(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const clearDrag = () => {
    draggedPreset.current = null;
    setDraggedId(null);
    setDropTarget(null);
  };
  const [originalMap, setOriginalMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_COUNT
  );

  const [message, setMessage] = useState("");
  const [thumbnails,setThumbnails]=useState({});
  useEffect(()=>{let live=true;supabase.from('tier_preset_thumbnails').select('source_worldcup_id,image_url').then(({data})=>{if(live)setThumbnails(Object.fromEntries((data||[]).map(row=>[row.source_worldcup_id,row.image_url])));}).catch(()=>{});return()=>{live=false;};},[]);

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
          tier_preset_title_translations,
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
          tier_preset_title_translations: cup.tier_preset_title_translations || {},
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

  const movePreset = (id, delta) => {
    setMessage("");
    setWorldcups(previous => movePresetRows(previous, id, delta));
  };
  const selectedOrder = orderedPresets(worldcups);

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
          ) < 1
      )
    ) {
      setMessage(
        "추천 순서는 1 이상의 정수로 입력해주세요."
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
          currentOrder !== originalOrder ||
          JSON.stringify(cup.tier_preset_title_translations || {}) !== JSON.stringify(original.tier_preset_title_translations || {})
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
                    tier_preset_title_translations: cup.tier_preset_title_translations || {},
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
          "1px solid #dde2ea",

        borderRadius: 12,

        background: "#ffffff",
        color: "#202534",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",

          fontSize: 24,
          fontWeight: 900,
        }}
      >
        📊 티어표 추천 프리셋
      </h2>

      <div
        style={{
          color: "#5542b8",

          fontSize: 16,

          marginBottom: 14,
        }}
      >
        티어표 홈에 표시할
        이상형 월드컵을 개수 제한 없이 선택하세요. 왼쪽 ⋮⋮ 손잡이를 드래그하거나 위·아래 버튼으로 추천 순서를 바꾼 뒤 저장하세요.
        {" "}
        현재{" "}
        <strong
          style={{
            color: "#5542b8",
          }}
        >
          {selectedCount}개 선택됨
        </strong>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.7 }}>각 항목의 ‘다른 언어 제목 펼치기’를 열어 번역을 입력하세요. 아래 저장 버튼으로 추천 순서와 모든 언어 제목을 함께 저장합니다. 원본 월드컵 제목은 바뀌지 않으며, 비워둔 언어는 영어 전용 제목, 그다음 원본 제목을 표시합니다.</p>

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
            "1px solid #dde2ea",

          background: "#ffffff",

          color: "#202534",

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
              "#ffffff",

            color: "#5542b8",

            fontSize: 15,

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

            color: "#5542b8",

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
                const title = displayTitle(cup);
                const position = selectedOrder.findIndex(row => String(row.id) === String(cup.id));

                return (
                  <div
                    key={cup.id}
                    data-preset-id={cup.id}
                    onDragOver={event => {
                      if (saving || !cup.is_tier_preset || draggedPreset.current == null || String(draggedPreset.current) === String(cup.id)) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY > rect.top + rect.height / 2;
                      setDropTarget(previous => previous?.id === cup.id && previous.after === after ? previous : { id: cup.id, after });
                    }}
                    onDragLeave={event => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(previous => previous?.id === cup.id ? null : previous);
                    }}
                    onDrop={event => {
                      const sourceId = draggedPreset.current;
                      if (saving || !cup.is_tier_preset || sourceId == null) return;
                      event.preventDefault();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY > rect.top + rect.height / 2;
                      setWorldcups(previous => reorderPresetRows(previous, sourceId, cup.id, after));
                      setMessage("");
                      clearDrag();
                    }}
                    style={{
                      opacity: draggedId === cup.id ? 0.5 : 1,
                      boxShadow: dropTarget?.id === cup.id ? `inset 0 ${dropTarget.after ? '-3px' : '3px'} 0 #2563eb` : 'none', 
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap: 10,

                      padding:
                        "9px 10px",

                      border:
                        cup.is_tier_preset
                          ? "1px solid #dde2ea"
                          : "1px solid #dde2ea",

                      borderRadius:
                        8,

                      background:
                        cup.is_tier_preset
                          ? "#ffffff"
                          : "#ffffff",
                    }}
                  >
                    {cup.is_tier_preset && <button
                      type="button"
                      draggable={!saving}
                      disabled={saving}
                      aria-label={`${title} 순서 드래그`}
                      title="드래그해서 추천 순서 변경 (키보드는 위·아래 버튼 사용)"
                      onDragStart={event => {
                        if (saving) { event.preventDefault(); return; }
                        draggedPreset.current = cup.id;
                        setDraggedId(cup.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(cup.id));
                        event.dataTransfer.setDragImage?.(event.currentTarget.parentElement, 20, 20);
                      }}
                      onDragEnd={clearDrag}
                      style={{ flexShrink: 0, minWidth: 34, minHeight: 42, border: "1px solid #bfdbfe", borderRadius: 7, background: "#eff6ff", color: "#1d4ed8", cursor: saving ? "default" : "grab", fontSize: 24, fontWeight: 800 }}
                    >⋮⋮</button>}
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
                          "#202534",

                        fontSize:
                          16,

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
                      {cup.is_tier_preset && <PresetTitleTranslations title={title} value={cup.tier_preset_title_translations || {}} disabled={saving} placeholder="추천 카드 제목 (예: 여자 아이돌 티어표)" onChange={titles => {
                        setWorldcups(previous => previous.map(item => item.id === cup.id ? { ...item, tier_preset_title_translations: titles } : item));
                      }} />}
                      {cup.is_tier_preset&&<ThumbnailSetting kind="tier" id={cup.id} url={thumbnails[cup.id]||''} disabled={saving} onSaved={url=>setThumbnails(old=>({...old,[cup.id]:url}))}/>}

                    </div>

                    {cup.is_tier_preset && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ minWidth: 28, textAlign: "center", fontWeight: 800 }}>{position + 1}</span>
                        {[-1, 1].map(delta => <button key={delta} type="button" disabled={saving || (delta < 0 ? position === 0 : position === selectedOrder.length - 1)} aria-label={`${title} ${delta < 0 ? "위로" : "아래로"}`} onClick={() => movePreset(cup.id, delta)} style={{ minWidth: 42, minHeight: 42, border: "2px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: 22, fontWeight: 800 }}> {delta < 0 ? "↑" : "↓"} </button>)}
                      </div>
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
                    "1px solid #dde2ea",

                  background:
                    "#ffffff",

                  color: "#202534",

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
                    "#5542b8",

                  fontSize: 13,
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
            "#6650d8",

          color: "#ffffff",

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