import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getThumbnail } from "../utils";

// 기본 색상
const COLORS = {
  main: "#1976ed",
  sub: "#45b7fa",
  danger: "#d33",
  gray: "#888"
};

function EditWorldcupPage({ worldcupList, setWorldcupList, cupId }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("onepickgame_user") || "";

  // 편집할 월드컵
  const originalCup = worldcupList.find(cup => String(cup.id) === String(cupId));
  const [title, setTitle] = useState(originalCup?.title || "");
  const [desc, setDesc] = useState(originalCup?.desc || "");
  const [data, setData] = useState(originalCup?.data ? [...originalCup.data] : []);
  const [error, setError] = useState("");

  if (!originalCup) {
    return <div style={{ padding: 80 }}>월드컵을 찾을 수 없습니다.</div>;
  }
  if (originalCup.owner !== currentUser) {
    return <div style={{ padding: 80 }}>수정 권한이 없습니다.</div>;
  }

  // 후보 추가
  function handleAddCandidate() {
    setData(d => [...d, { id: Date.now() + Math.random(), name: "", image: "" }]);
  }
  // 후보 삭제
  function handleDeleteCandidate(idx) {
    setData(d => d.filter((_, i) => i !== idx));
  }
  // 후보 수정
  function handleCandidateChange(idx, key, value) {
    setData(d => d.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
    ));
  }
  // 저장
  function handleSave() {
    setError("");
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (data.length < 2) return setError("후보가 2개 이상이어야 합니다.");
    if (data.some(item => !item.name.trim())) return setError("모든 후보에 이름을 입력하세요.");

    const updatedCup = {
      ...originalCup,
      title: title.trim(),
      desc: desc.trim(),
      data: data.map(item => ({
        ...item,
        name: item.name.trim(),
        image: item.image.trim()
      }))
    };
    const newList = worldcupList.map(cup =>
      String(cup.id) === String(cupId) ? updatedCup : cup
    );
    setWorldcupList(newList);
    localStorage.setItem("onepickgame_worldcupList", JSON.stringify(newList));
    alert("수정 완료!");
    navigate("/");
  }

  // 반응형
  const isMobile = window.innerWidth < 700;

  return (
    <div
      style={{
        maxWidth: 700,
        margin: isMobile ? "16px 2vw" : "44px auto",
        padding: isMobile ? 12 : 36,
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 4px 32px #1976ed13, 0 1.5px 10px #0001",
      }}
    >
      <h2 style={{
        textAlign: "center",
        fontWeight: 900,
        fontSize: isMobile ? 23 : 32,
        letterSpacing: -1,
        marginBottom: 32,
        color: COLORS.main,
      }}>
        월드컵 수정
      </h2>
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontWeight: 700, fontSize: 17, color: "#223" }}>
          제목
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: "100%", padding: 12, borderRadius: 9,
              border: `1.7px solid ${COLORS.main}33`, fontSize: 19, marginTop: 6,
              marginBottom: 4, boxSizing: "border-box", background: "#fafdff",
              outlineColor: COLORS.main, transition: "border 0.15s"
            }}
            maxLength={38}
            placeholder="예시: BTS 이상형 월드컵"
          />
        </label>
      </div>
      <div style={{ marginBottom: 26 }}>
        <label style={{ fontWeight: 700, fontSize: 17, color: "#223" }}>
          설명
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{
              width: "100%", padding: 12, borderRadius: 9,
              border: `1.7px solid ${COLORS.main}22`, fontSize: 16,
              marginTop: 6, resize: "vertical", minHeight: 36, background: "#fafdff"
            }}
            rows={2}
            maxLength={80}
            placeholder="간단 설명 (선택)"
          />
        </label>
      </div>
      <hr style={{ border: "none", borderTop: "2px solid #e7f3fd", margin: "22px 0 20px" }} />
      <div>
        <div style={{
          fontWeight: 800, fontSize: 19, margin: "12px 0 18px 0", color: COLORS.main,
        }}>
          후보 목록 <span style={{ color: COLORS.gray, fontSize: 14 }}>({data.length}개)</span>
        </div>
        {data.map((item, i) => (
          <div key={item.id} style={{
            display: "flex", gap: 11, alignItems: "center", marginBottom: 13,
            padding: "10px 9px", borderRadius: 12, background: "#fafdff",
            boxShadow: "0 1.5px 8px #1976ed11",
          }}>
            <input
              value={item.name}
              onChange={e => handleCandidateChange(i, "name", e.target.value)}
              placeholder="이름"
              style={{
                width: isMobile ? 78 : 120, minWidth: 50, padding: 9,
                borderRadius: 8, border: `1.3px solid #bbb`, fontSize: 16
              }}
              maxLength={30}
            />
            <input
              value={item.image}
              onChange={e => handleCandidateChange(i, "image", e.target.value)}
              placeholder="이미지 URL"
              style={{
                flex: 1, minWidth: 0, padding: 9,
                borderRadius: 8, border: `1.3px solid #bbb`, fontSize: 15,
                background: "#fafdff"
              }}
            />
            {item.image && (
              <img
                src={getThumbnail(item.image)}
                alt=""
                style={{
                  width: isMobile ? 32 : 44, height: isMobile ? 32 : 44,
                  objectFit: "cover", borderRadius: 8, background: "#f2f2f2",
                  boxShadow: "0 2px 8px #0001", border: "1.2px solid #eee"
                }}
              />
            )}
            <button
              onClick={() => handleDeleteCandidate(i)}
              style={{
                background: COLORS.danger, border: "none", borderRadius: 7,
                color: "#fff", fontWeight: 700, padding: "9px 12px",
                cursor: "pointer", fontSize: 14, marginLeft: 3,
                transition: "background 0.18s"
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#b92a2a")}
              onMouseOut={e => (e.currentTarget.style.background = COLORS.danger)}
            >삭제</button>
          </div>
        ))}
        <button
          onClick={handleAddCandidate}
          style={{
            marginTop: 12,
            background: COLORS.main, color: "#fff", border: "none", borderRadius: 9,
            padding: "11px 24px", fontWeight: 800, fontSize: 16, cursor: "pointer",
            boxShadow: "0 2px 9px #1976ed18", transition: "background 0.18s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = COLORS.sub)}
          onMouseOut={e => (e.currentTarget.style.background = COLORS.main)}
        >+ 후보 추가</button>
      </div>
      {error && <div style={{ color: COLORS.danger, marginTop: 17, fontWeight: 700, textAlign: "center" }}>{error}</div>}
      <div style={{ marginTop: 38, textAlign: "center" }}>
        <button
          onClick={handleSave}
          style={{
            background: COLORS.main, color: "#fff", fontWeight: 900, border: "none", borderRadius: 13,
            fontSize: 22, padding: "14px 54px", marginRight: 12, cursor: "pointer",
            boxShadow: "0 2px 12px #1976ed26", transition: "background 0.18s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = COLORS.sub)}
          onMouseOut={e => (e.currentTarget.style.background = COLORS.main)}
        >저장</button>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#e7f3fd", color: "#1976ed", fontWeight: 800, border: "none", borderRadius: 11,
            fontSize: 18, padding: "13px 34px", cursor: "pointer",
            boxShadow: "0 1.5px 9px #1976ed09", marginLeft: 2
          }}
        >취소</button>
      </div>
    </div>
  );
}

export default EditWorldcupPage;
