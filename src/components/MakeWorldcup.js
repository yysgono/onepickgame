import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { addWorldcupGame } from "../utils/supabaseGameApi";
import { supabase } from "../utils/supabaseClient";

function getYoutubeThumb(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}
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
    { id: uuidv4(), name: "", image: "" },
    { id: uuidv4(), name: "", image: "" },
  ]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef([]);

  // candidates 길이가 바뀔 때 ref도 맞춰줌
  useEffect(() => {
    fileInputRefs.current = fileInputRefs.current.slice(0, candidates.length);
  }, [candidates.length]);

  function addCandidate() {
    setCandidates(arr => [...arr, { id: uuidv4(), name: "", image: "" }]);
  }
  function removeCandidate(idx) {
    setCandidates(arr => arr.filter((_, i) => i !== idx));
  }
  function updateCandidate(idx, key, value) {
    setCandidates(arr =>
      arr.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setOk("");
    if (loading) return;

    if (!title.trim()) return setError("제목을 입력하세요.");
    if (candidates.length < 2) return setError("후보가 2개 이상이어야 합니다.");
    if (candidates.some(c => !c.name.trim())) return setError("모든 후보에 이름을 입력하세요.");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("로그인 정보 없음");

      // base64 이미지 → url 변환(업로드)
      const updatedCandidates = await Promise.all(
        candidates.map(async c => {
          let imageUrl = c.image?.trim();
          if (imageUrl && imageUrl.startsWith("data:image")) {
            const file = await fetch(imageUrl).then(r => r.blob());
            const url = await uploadCandidateImage(
              new File([file], `${c.name}.png`, { type: file.type }),
              user.id
            );
            imageUrl = url;
          }
          return { ...c, id: c.id || uuidv4(), image: imageUrl, name: c.name.trim() };
        })
      );

      const newCup = {
        title: title.trim(),
        description: desc.trim(),
        data: updatedCandidates,
        created_at: new Date().toISOString(),
        owner: user.id,
        creator: user.id,
      };

      await addWorldcupGame(newCup);
      setOk("월드컵이 생성되었습니다!");
      setTitle(""); setDesc("");
      setCandidates([
        { id: uuidv4(), name: "", image: "" },
        { id: uuidv4(), name: "", image: "" },
      ]);
      if (setWorldcupList) setWorldcupList([...(worldcupList || []), newCup]);
      if (onClose) setTimeout(onClose, 600); // 0.6초 후 닫기 (성공 메시지 보이기)
    } catch (e) {
      setError("저장 실패! 잠시 후 다시 시도해 주세요.");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="설명(선택)"
            maxLength={400}
            style={{ width: "100%", fontSize: 16, padding: 8, borderRadius: 8, border: "1.2px solid #bbb" }}
            disabled={loading}
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
            const thumb = youtubeThumb
              ? youtubeThumb
              : !isVideoFile && c.image?.startsWith("data:image")
                ? c.image
                : !isVideoFile
                  ? c.image
                  : null;

            return (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "center" }}>
                <input
                  value={c.name}
                  onChange={e => updateCandidate(idx, "name", e.target.value)}
                  placeholder="이름"
                  maxLength={22}
                  style={{ width: 120, fontSize: 15, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                  disabled={loading}
                />
                <input
                  value={c.image}
                  onChange={e => updateCandidate(idx, "image", e.target.value)}
                  placeholder="이미지 URL (선택)"
                  style={{ flex: 1, fontSize: 14, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  style={{
                    background: "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)",
                    color: "#fff", border: "none", borderRadius: 7,
                    padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                  disabled={loading}
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
                  disabled={loading}
                />
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(idx)}
                    style={{ background: "#f5f5f5", color: "#d33", border: "none", borderRadius: 7, padding: "5px 13px", fontWeight: 700 }}
                    disabled={loading}
                  >
                    삭제
                  </button>
                )}
                {thumb && (
                  <img
                    src={thumb}
                    alt=""
                    style={{
                      width: 32, height: 32, objectFit: "cover", borderRadius: 8, background: "#f2f2f2",
                      boxShadow: "0 2px 8px #0001", border: "1.2px solid #eee", marginLeft: 8,
                    }}
                  />
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addCandidate}
            style={{ marginTop: 6, background: "#1976ed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700 }}
            disabled={loading}
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
            disabled={loading}
          >
            {loading ? "저장중..." : "생성"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "#ddd", color: "#333", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 16, padding: "10px 32px" }}
              disabled={loading}
            >
              닫기
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
