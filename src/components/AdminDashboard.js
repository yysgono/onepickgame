import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";

// ========================================
// 카테고리
// ========================================

const CATEGORY_OPTIONS = [
  { value: "person", label: "인물" },
  { value: "music", label: "음악" },
  { value: "game", label: "게임" },
  { value: "sports", label: "스포츠" },
  { value: "anime_manga", label: "애니 / 만화" },
  { value: "movie_drama", label: "영화 / 드라마" },
  { value: "food", label: "음식" },
  { value: "etc", label: "기타" },
];

// ========================================
// 데이터
// ========================================

// 월드컵 전체 목록
async function getAllWorldcups() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("월드컵 목록 불러오기 실패:", error);
    return [];
  }

  return data || [];
}

// 댓글 총 개수
async function getTotalComments() {
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("댓글 개수 불러오기 실패:", error);
    return 0;
  }

  return count || 0;
}

// 월드컵 관리 정보 저장
async function updateWorldcupManagement(
  worldcupId,
  category,
  isFeatured,
  featuredOrder
) {
  const updateData = {
    category: category || null,
    is_featured: isFeatured,
    featured_order:
      isFeatured && featuredOrder !== ""
        ? Number(featuredOrder)
        : null,
  };

  const { error } = await supabase
    .from("worldcups")
    .update(updateData)
    .eq("id", worldcupId);

  if (error) throw error;
}

// ========================================
// AdminDashboard
// ========================================

export default function AdminDashboard() {
  const [totalWorldcups, setTotalWorldcups] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  const [allWorldcups, setAllWorldcups] = useState([]);

  // 각 월드컵의 관리자 편집값
  const [editValues, setEditValues] = useState({});

  // 검색
  const [searchTerm, setSearchTerm] = useState("");

  // 카테고리 필터
  const [categoryFilter, setCategoryFilter] = useState("all");

  // 추천만 보기
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // 저장 중인 월드컵 ID
  const [savingId, setSavingId] = useState(null);

  // 처음 로딩
  const [loading, setLoading] = useState(true);

  // ========================================
  // 최초 데이터 로드
  // ========================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [worldcups, comments] = await Promise.all([
        getAllWorldcups(),
        getTotalComments(),
      ]);

      setAllWorldcups(worldcups);
      setTotalWorldcups(worldcups.length);
      setTotalComments(comments);

      const initialEditValues = {};

      worldcups.forEach((wc) => {
        initialEditValues[wc.id] = {
          category: wc.category || "",
          is_featured: Boolean(wc.is_featured),
          featured_order:
            wc.featured_order === null ||
            wc.featured_order === undefined
              ? ""
              : String(wc.featured_order),
        };
      });

      setEditValues(initialEditValues);
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // 편집값 변경
  // ========================================

  function handleEditChange(worldcupId, field, value) {
    setEditValues((prev) => ({
      ...prev,
      [worldcupId]: {
        ...prev[worldcupId],
        [field]: value,
      },
    }));
  }

  // ========================================
  // 추천 ON / OFF
  // ========================================

  function handleFeaturedToggle(worldcupId) {
    setEditValues((prev) => {
      const current = prev[worldcupId];

      if (!current) return prev;

      const nextFeatured = !current.is_featured;

      return {
        ...prev,
        [worldcupId]: {
          ...current,
          is_featured: nextFeatured,

          // 추천 해제하면 순서도 비움
          featured_order: nextFeatured
            ? current.featured_order
            : "",
        },
      };
    });
  }

  // ========================================
  // 저장
  // ========================================

  async function handleSave(worldcupId) {
    const values = editValues[worldcupId];

    if (!values) return;

    if (!values.category) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    if (
      values.is_featured &&
      values.featured_order !== "" &&
      Number(values.featured_order) < 1
    ) {
      alert("추천 순서는 1 이상의 숫자로 입력해주세요.");
      return;
    }

    setSavingId(worldcupId);

    try {
      await updateWorldcupManagement(
        worldcupId,
        values.category,
        values.is_featured,
        values.featured_order
      );

      // 로컬 데이터도 즉시 갱신
      setAllWorldcups((prev) =>
        prev.map((wc) =>
          String(wc.id) === String(worldcupId)
            ? {
                ...wc,
                category: values.category,
                is_featured: values.is_featured,
                featured_order:
                  values.is_featured &&
                  values.featured_order !== ""
                    ? Number(values.featured_order)
                    : null,
              }
            : wc
        )
      );

      alert("저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert("저장 실패: " + error.message);
    } finally {
      setSavingId(null);
    }
  }

  // ========================================
  // 필터링
  // ========================================

  const filteredWorldcups = useMemo(() => {
    let list = [...allWorldcups];

    const keyword = searchTerm.trim().toLowerCase();

    if (keyword) {
      list = list.filter((wc) => {
        const title = String(wc.title || "").toLowerCase();
        const id = String(wc.id || "").toLowerCase();

        return title.includes(keyword) || id.includes(keyword);
      });
    }

    if (categoryFilter === "unassigned") {
      list = list.filter((wc) => !wc.category);
    } else if (categoryFilter !== "all") {
      list = list.filter(
        (wc) => wc.category === categoryFilter
      );
    }

    if (featuredOnly) {
      list = list.filter((wc) => wc.is_featured);
    }

    return list;
  }, [
    allWorldcups,
    searchTerm,
    categoryFilter,
    featuredOnly,
  ]);

  // ========================================
  // 카테고리 미지정 개수
  // ========================================

  const unassignedCount = useMemo(() => {
    return allWorldcups.filter((wc) => !wc.category).length;
  }, [allWorldcups]);

  // ========================================
  // 추천 개수
  // ========================================

  const featuredCount = useMemo(() => {
    return allWorldcups.filter(
      (wc) => wc.is_featured
    ).length;
  }, [allWorldcups]);

  // ========================================
  // 렌더
  // ========================================

  return (
    <div
      style={{
        maxWidth: 1150,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 4px 24px #e6ecfa",
        padding: 40,
      }}
    >
      {/* 제목 */}
      <h2
        style={{
          fontWeight: 900,
          fontSize: 32,
          color: "#1976ed",
          marginBottom: 32,
          letterSpacing: -1,
        }}
      >
        🛡️ 관리자 대시보드
      </h2>

      {/* ========================================
          통계
      ======================================== */}

      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        <StatBox
          title="전체 월드컵 수"
          value={totalWorldcups}
        />

        <StatBox
          title="전체 댓글 수"
          value={totalComments}
        />

        <StatBox
          title="카테고리 미지정"
          value={unassignedCount}
          valueColor={
            unassignedCount > 0
              ? "#e14444"
              : "#1976ed"
          }
        />

        <StatBox
          title="추천 월드컵"
          value={featuredCount}
          valueColor="#f39c12"
        />
      </div>

      {/* ========================================
          월드컵 카테고리 / 추천 관리
      ======================================== */}

      <div
        style={{
          background: "#f9fafe",
          borderRadius: 14,
          padding: 28,
          boxShadow: "0 1px 8px #dde5ef77",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 22,
            marginBottom: 8,
            color: "#174cd7",
          }}
        >
          🗂️ 월드컵 카테고리 / 추천 관리
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#777",
            marginBottom: 22,
          }}
        >
          기존 월드컵의 카테고리를 지정하고 홈 추천
          노출 여부를 관리할 수 있습니다.
        </div>

        {/* 검색 / 필터 */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 22,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="월드컵 제목 또는 ID 검색"
            style={{
              flex: "1 1 260px",
              minWidth: 200,
              padding: "10px 13px",
              borderRadius: 8,
              border: "1px solid #cfd6e4",
              fontSize: 15,
              outline: "none",
              background: "#fff",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #cfd6e4",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">
              전체 카테고리
            </option>

            <option value="unassigned">
              미지정
            </option>

            {CATEGORY_OPTIONS.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              color: "#555",
              cursor: "pointer",
              padding: "9px 11px",
              background: "#fff",
              border: "1px solid #cfd6e4",
              borderRadius: 8,
            }}
          >
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) =>
                setFeaturedOnly(e.target.checked)
              }
            />

            ⭐ 추천만 보기
          </label>
        </div>

        {/* 결과 개수 */}

        <div
          style={{
            marginBottom: 12,
            fontSize: 14,
            color: "#777",
            fontWeight: 700,
          }}
        >
          표시 중: {filteredWorldcups.length}개
        </div>

        {/* 로딩 */}

        {loading && (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "#777",
            }}
          >
            월드컵 목록을 불러오는 중...
          </div>
        )}

        {/* 월드컵 목록 */}

        {!loading &&
          filteredWorldcups.map((wc) => {
            const values = editValues[wc.id] || {
              category: "",
              is_featured: false,
              featured_order: "",
            };

            const firstImage =
              wc.data?.[0]?.image ||
              "/default-thumb.png";

            return (
              <div
                key={wc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  marginBottom: 10,
                  background: "#fff",
                  borderRadius: 12,
                  border: values.is_featured
                    ? "1.5px solid #f4c45e"
                    : "1px solid #e1e6ef",
                  boxShadow: values.is_featured
                    ? "0 2px 10px #f4c45e22"
                    : "0 1px 5px #0000000a",
                  flexWrap: "wrap",
                }}
              >
                {/* 썸네일 */}

                <img
                  src={firstImage}
                  alt={wc.title}
                  onError={(e) => {
                    e.currentTarget.src =
                      "/default-thumb.png";
                  }}
                  style={{
                    width: 66,
                    height: 66,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#eceff4",
                    flexShrink: 0,
                  }}
                />

                {/* 제목 */}

                <div
                  style={{
                    flex: "1 1 240px",
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#222",
                      marginBottom: 5,
                    }}
                  >
                    {values.is_featured && (
                      <span
                        style={{
                          marginRight: 5,
                          color: "#f39c12",
                        }}
                      >
                        ⭐
                      </span>
                    )}

                    {wc.title}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#999",
                      wordBreak: "break-all",
                    }}
                  >
                    {wc.id}
                  </div>
                </div>

                {/* 카테고리 */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#777",
                    }}
                  >
                    카테고리
                  </span>

                  <select
                    value={values.category}
                    onChange={(e) =>
                      handleEditChange(
                        wc.id,
                        "category",
                        e.target.value
                      )
                    }
                    style={{
                      width: 135,
                      padding: "8px 9px",
                      borderRadius: 7,
                      border: values.category
                        ? "1px solid #ccd4e0"
                        : "1px solid #e14444",
                      background: "#fff",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <option value="">
                      미지정
                    </option>

                    {CATEGORY_OPTIONS.map(
                      (category) => (
                        <option
                          key={category.value}
                          value={category.value}
                        >
                          {category.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* 추천 */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#777",
                    }}
                  >
                    홈 추천
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleFeaturedToggle(wc.id)
                    }
                    style={{
                      minWidth: 105,
                      padding: "8px 12px",
                      borderRadius: 7,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 13,
                      background:
                        values.is_featured
                          ? "#f39c12"
                          : "#e9edf3",
                      color:
                        values.is_featured
                          ? "#fff"
                          : "#555",
                    }}
                  >
                    {values.is_featured
                      ? "⭐ 추천 중"
                      : "추천 고정"}
                  </button>
                </div>

                {/* 추천 순서 */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#777",
                    }}
                  >
                    추천 순서
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={values.featured_order}
                    disabled={!values.is_featured}
                    onChange={(e) =>
                      handleEditChange(
                        wc.id,
                        "featured_order",
                        e.target.value
                      )
                    }
                    placeholder="-"
                    style={{
                      width: 70,
                      padding: "8px 8px",
                      borderRadius: 7,
                      border: "1px solid #ccd4e0",
                      background:
                        values.is_featured
                          ? "#fff"
                          : "#f1f3f6",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  />
                </div>

                {/* 저장 */}

                <button
                  type="button"
                  onClick={() =>
                    handleSave(wc.id)
                  }
                  disabled={savingId === wc.id}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 7,
                    border: "none",
                    background: "#1976ed",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor:
                      savingId === wc.id
                        ? "default"
                        : "pointer",
                    opacity:
                      savingId === wc.id
                        ? 0.6
                        : 1,
                  }}
                >
                  {savingId === wc.id
                    ? "저장 중..."
                    : "저장"}
                </button>
              </div>
            );
          })}

        {!loading &&
          filteredWorldcups.length === 0 && (
            <div
              style={{
                padding: 35,
                textAlign: "center",
                color: "#888",
              }}
            >
              조건에 맞는 월드컵이 없습니다.
            </div>
          )}
      </div>

      {/* ========================================
          안내
      ======================================== */}

      <div
        style={{
          background: "#f5f7fb",
          borderRadius: 14,
          padding: 28,
          boxShadow: "0 1px 8px #dde5ef77",
          fontSize: 19,
          color: "#555",
        }}
      >
        월드컵/유저/댓글 관리 및 통계, 데이터
        백업은
        <br />
        상단 메뉴 또는 사이드바에서
        이동하세요.
      </div>
    </div>
  );
}

// ========================================
// 통계 박스
// ========================================

function StatBox({
  title,
  value,
  valueColor = "#1976ed",
}) {
  return (
    <div
      style={{
        background: "#f6f8fc",
        borderRadius: 18,
        boxShadow: "0 2px 14px #dde4ef",
        minWidth: 190,
        padding: "25px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: "#666",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: valueColor,
          marginTop: 10,
        }}
      >
        {value}
      </div>
    </div>
  );
}