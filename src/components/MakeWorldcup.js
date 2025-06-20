import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

function getNextId(list) {
  return Math.max(0, ...list.map(x => parseInt(x.id, 10) || 0)) + 1;
}

// 유튜브 썸네일 추출 (필요시 사용)
function getYoutubeThumb(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

// 확장자 추출 함수
function getFileExtension(url) {
  if (!url) return "";
  const parts = url.split("?")[0].split("/").pop().split(".");
  if (parts.length === 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

export default function MakeWorldcup({ worldcupList, setWorldcupList, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [candidates, setCandidates] = useState([
    { name: "", image: "" },
    { name: "", image: "" },
  ]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // 파일 input refs 배열
  const fileInputRefs = useRef([]);

  // 후보 추가/삭제/변경
  function addCandidate() {
    setCandidates(arr => [...arr, { name: "", image: "" }]);
  }
  function removeCandidate(idx) {
    setCandidates(arr => arr.filter((_, i) => i !== idx));
    // ref 배열 정리도 필요하지만 생략 가능
  }
  function updateCandidate(idx, key, value) {
    setCandidates(arr =>
      arr.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );
  }

  // 월드컵 생성
  function handleSubmit(e) {
    e.preventDefault();
    setError(""); setOk("");
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (candidates.length < 2) return setError("후보가 2개 이상이어야 합니다.");
    if (candidates.some(c => !c.name.trim())) return setError("모든 후보에 이름을 입력하세요.");

    const owner = localStorage.getItem("onepickgame_user") || "";
    const newCup = {
      id: getNextId(worldcupList),
      title: title.trim(),
      desc: desc.trim(),
      data: candidates.map(c => ({
        id: Date.now() + Math.random(),
        name: c.name.trim(),
        image: c.image.trim(),
      })),
      createdAt: Date.now(),
      owner,
    };
    const newList = [...worldcupList, newCup];
    setWorldcupList(newList);
    localStorage.setItem("onepickgame_worldcupList", JSON.stringify(newList));
    setOk("월드컵이 생성되었습니다!");
    setTitle(""); setDesc(""); setCandidates([{ name: "", image: "" }, { name: "", image: "" }]);
    if (onClose) onClose();
  }

  return (
    <div style={{
      maxWidth: 520, margin: "40px auto", background: "#fff",
      borderRadius: 16, padding: 24, boxShadow: "0 4px 18px #1976ed18"
    }}>
      <h2 style={{ textAlign: "center", fontWeight: 900, fontSize: 25, marginBottom: 22 }}>
        {t("makeWorldcup") || "월드컵 만들기"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="월드컵 제목"
            maxLength={36}
            style={{ width: "100%", fontSize: 18, padding: 9, borderRadius: 8, border: "1.5px solid #bbb" }}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="설명(선택)"
            maxLength={60}
            style={{ width: "100%", fontSize: 16, padding: 8, borderRadius: 8, border: "1.2px solid #bbb" }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, margin: "8px 0 9px 0" }}>
            후보 목록 ({candidates.length}개)
          </div>
          {candidates.map((c, idx) => {
            const youtubeThumb = getYoutubeThumb(c.image);
            const ext = getFileExtension(c.image);
            const isVideoFile = ext === "mp4" || ext === "mov" || ext === "webm" || ext === "ogg";

            // 썸네일 참고용 (URL 또는 유튜브 썸네일, 영상파일은 null)
            const thumb = youtubeThumb
              ? youtubeThumb
              : !isVideoFile && c.image?.startsWith("data:image")
              ? c.image
              : !isVideoFile
              ? c.image
              : null;

            return (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "center" }}>
                <input
                  value={c.name}
                  onChange={e => updateCandidate(idx, "name", e.target.value)}
                  placeholder="이름"
                  maxLength={22}
                  style={{ width: 120, fontSize: 15, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                />
                <input
                  value={c.image}
                  onChange={e => updateCandidate(idx, "image", e.target.value)}
                  placeholder="이미지 URL (선택)"
                  style={{ flex: 1, fontSize: 14, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[idx].click()}
                  style={{
                    background: "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "6px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  파일
                </button>
                <input
                  ref={el => (fileInputRefs.current[idx] = el)}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const allowed = /\.(jpe?g|png)$/i;
                    if (!allowed.test(file.name)) {
                      alert("jpg, jpeg, png 파일만 업로드 가능합니다.");
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = ev => updateCandidate(idx, "image", ev.target.result);
                    reader.readAsDataURL(file);
                  }}
                />
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(idx)}
                    style={{ background: "#f5f5f5", color: "#d33", border: "none", borderRadius: 7, padding: "5px 13px", fontWeight: 700 }}
                  >
                    삭제
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addCandidate}
            style={{ marginTop: 6, background: "#1976ed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700 }}
          >
            + 후보 추가
          </button>
        </div>
        {error && <div style={{ color: "red", marginTop: 15, textAlign: "center" }}>{error}</div>}
        {ok && <div style={{ color: "#1976ed", marginTop: 15, textAlign: "center" }}>{ok}</div>}
        <div style={{ marginTop: 26, textAlign: "center" }}>
          <button
            type="submit"
            style={{ background: "#1976ed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 19, padding: "11px 40px", marginRight: 9 }}
          >
            생성
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "#ddd", color: "#333", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 16, padding: "10px 32px" }}
            >
              닫기
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
