import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

// winner_stats에서 최다 우승 후보 이미지 fetch
async function getMostWinnerThumbnail(cup_id) {
  const { data, error } = await supabase
    .from("winner_stats")
    .select("candidate_id, name, image, win_count")
    .eq("cup_id", cup_id)
    .order("win_count", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.image;
}

// 월드컵 전체 목록
async function getAllWorldcups() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// 댓글 총 갯수
async function getTotalComments() {
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true });
  return error ? 0 : count;
}

// 고정 월드컵(id만)
async function getFixedCupIds() {
  const { data, error } = await supabase
    .from("fixed_worldcups")
    .select("worldcup_id")
    .order("order", { ascending: true });
  if (error) return [];
  return data.map(row => row.worldcup_id);
}

// 고정 월드컵 추가
async function addFixedCupId(worldcup_id) {
  const { error } = await supabase
    .from("fixed_worldcups")
    .insert([{ worldcup_id }]);
  if (error) throw error;
  return true;
}

// 고정 월드컵 삭제
async function removeFixedCupId(worldcup_id) {
  const { error } = await supabase
    .from("fixed_worldcups")
    .delete()
    .eq("worldcup_id", worldcup_id);
  if (error) throw error;
  return true;
}

export default function AdminDashboard() {
  const [totalWorldcups, setTotalWorldcups] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [allWorldcups, setAllWorldcups] = useState([]);
  const [fixedList, setFixedList] = useState([]);
  const [addId, setAddId] = useState("");
  const [loading, setLoading] = useState(false);

  // 전체 월드컵/댓글 집계
  useEffect(() => {
    (async () => {
      const worldcups = await getAllWorldcups();
      setAllWorldcups(worldcups);
      setTotalWorldcups(worldcups.length);

      // 전체 댓글 실제 개수
      setTotalComments(await getTotalComments());
    })();
  }, []);

  // 고정 월드컵 목록 + 썸네일 fetch
  async function fetchFixedList() {
    setLoading(true);
    const fixedIds = await getFixedCupIds();
    const cups = [];
    for (const id of fixedIds) {
      const cup = allWorldcups.find(wc => String(wc.id) === String(id));
      if (cup) {
        const thumb = await getMostWinnerThumbnail(id) || (cup.data?.[0]?.image ?? "/default-thumb.png");
        cups.push({ id: cup.id, title: cup.title, thumb });
      }
    }
    setFixedList(cups);
    setLoading(false);
  }

  // 고정 월드컵 목록 동기화
  useEffect(() => {
    if (allWorldcups.length > 0) fetchFixedList();
    // eslint-disable-next-line
  }, [allWorldcups]);

  // 추가
  async function handleAddFixedWorldcup(worldcupId) {
    if (fixedList.some(wc => String(wc.id) === String(worldcupId))) {
      alert("이미 추가된 월드컵입니다.");
      return;
    }
    const found = allWorldcups.find(wc => String(wc.id) === String(worldcupId));
    if (!found) {
      alert("존재하지 않는 월드컵 ID");
      return;
    }
    try {
      await addFixedCupId(found.id);
      await fetchFixedList();
    } catch (e) {
      alert("추가 실패: " + e.message);
    }
  }

  // 삭제
  async function handleRemoveFixedWorldcup(worldcupId) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await removeFixedCupId(worldcupId);
      await fetchFixedList();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  }

  // 수동 입력 폼
  function handleAddClick(e) {
    e.preventDefault();
    if (!addId.trim()) return;
    handleAddFixedWorldcup(addId.trim());
    setAddId("");
  }

  return (
    <div style={{
      maxWidth: 1050,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 4px 24px #e6ecfa",
      padding: 40
    }}>
      <h2 style={{ fontWeight: 900, fontSize: 32, color: "#1976ed", marginBottom: 32, letterSpacing: -1 }}>
        🛡️ 관리자 대시보드
      </h2>
      {/* 통계 위젯 */}
      <div style={{
        display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center", marginBottom: 40
      }}>
        <div style={{
          background: "#f6f8fc", borderRadius: 18, boxShadow: "0 2px 14px #dde4ef",
          minWidth: 210, padding: "30px 36px", textAlign: "center"
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#666" }}>전체 월드컵 수</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#1976ed", marginTop: 10 }}>{totalWorldcups}</div>
        </div>
        <div style={{
          background: "#f6f8fc", borderRadius: 18, boxShadow: "0 2px 14px #dde4ef",
          minWidth: 210, padding: "30px 36px", textAlign: "center"
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#666" }}>전체 댓글 수</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#1976ed", marginTop: 10 }}>{totalComments}</div>
        </div>
      </div>

      {/* 고정 월드컵 관리 */}
      <div style={{
        background: "#f9fafe", borderRadius: 14, padding: 28, boxShadow: "0 1px 8px #dde5ef77", fontSize: 18, color: "#444", marginBottom: 32
      }}>
        <div style={{ fontWeight: 800, fontSize: 21, marginBottom: 18, color: "#174cd7" }}>👑 운영자 PICK 월드컵 관리</div>
        <form onSubmit={handleAddClick} style={{ marginBottom: 14, display: "flex", gap: 7 }}>
          <input
            value={addId}
            onChange={e => setAddId(e.target.value)}
            placeholder="월드컵 ID 입력"
            style={{
              fontSize: 16, padding: "8px 13px", borderRadius: 7, border: "1.2px solid #bbb",
              width: 200
            }}
            disabled={loading}
          />
          <button type="submit" style={{
            background: "#1976ed", color: "#fff", border: "none", borderRadius: 7,
            fontWeight: 700, fontSize: 15, padding: "8px 16px", cursor: "pointer"
          }} disabled={loading}>추가</button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 10 }}>
          {loading && <div>고정 월드컵 불러오는 중...</div>}
          {fixedList.length === 0 && !loading && (
            <div style={{ color: "#888", margin: "18px 0" }}>아직 추가된 고정 월드컵이 없습니다.</div>
          )}
          {fixedList.map(wc => (
            <div key={wc.id}
              style={{
                width: 120, minHeight: 130, background: "#f6f8fa", borderRadius: 9, boxShadow: "0 2px 8px #0001",
                display: "flex", flexDirection: "column", alignItems: "center", position: "relative", marginBottom: 5
              }}
            >
              <img
                src={wc.thumb}
                alt={wc.title}
                style={{ width: 82, height: 82, objectFit: "cover", borderRadius: 6, margin: "10px 0 5px 0", background: "#eceff4", cursor: "pointer" }}
                onClick={() => window.open(`/worldcup/${wc.id}`, "_blank")}
              />
              <div style={{
                fontWeight: 700, fontSize: 13, textAlign: "center", color: "#174cd7",
                maxWidth: 90, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>{wc.title}</div>
              <button onClick={() => handleRemoveFixedWorldcup(wc.id)}
                style={{
                  position: "absolute", right: 4, top: 4, background: "#e14444", color: "#fff",
                  border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer", fontWeight: 700
                }}
                disabled={loading}
              >삭제</button>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div style={{
        background: "#f5f7fb", borderRadius: 14, padding: 28, boxShadow: "0 1px 8px #dde5ef77", fontSize: 19, color: "#555"
      }}>
        월드컵/유저/댓글 관리 및 통계, 데이터 백업은<br />
        상단 메뉴 또는 사이드바에서 이동하세요.
      </div>
    </div>
  );
}
