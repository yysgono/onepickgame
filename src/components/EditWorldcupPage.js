import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { updateWorldcupGame } from "../utils/supabaseWorldcupApi";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { supabase } from "../utils/supabaseClient";

const COLORS = {
  main: "#1976ed",
  sub: "#45b7fa",
  danger: "#d33",
  gray: "#888",
};

function getFileExtension(url = "", file = null) {
  if (file && file.name) {
    return file.name.split('.').pop().toLowerCase();
  }
  if (!url) return "";
  const parts = url.split("?")[0].split("/").pop().split(".");
  if (parts.length === 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

function getYoutubeThumb(url) {
  const match = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

function EditWorldcupPage({ worldcupList, fetchWorldcups, cupId, isAdmin }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [originalCup, setOriginalCup] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  // 유저 정보 & 닉네임 로드
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();
        setNickname(profile?.nickname || "");
      }
    }
    fetchUser();
  }, []);

  // 월드컵 불러오기
  useEffect(() => {
    const cup = worldcupList.find(cup => String(cup.id) === String(cupId));
    setOriginalCup(cup || null);
    setTitle(cup?.title || "");
    setDescription(cup?.description || "");
    setData(
      (cup?.data ? cup.data.map(c =>
        ({ ...c, id: c.id || uuidv4() })
      ) : [])
    );
  }, [worldcupList, cupId]);

  // 권한 체크
  if (!user) return <div style={{ padding: 80 }}>로그인이 필요합니다.</div>;
  if (!originalCup) return <div style={{ padding: 80 }}>월드컵을 찾을 수 없습니다.</div>;
  if (
    !isAdmin &&
    !(
      (originalCup.creator && originalCup.creator === user.id) ||
      (originalCup.owner && originalCup.owner === user.id)
    )
  ) return <div style={{ padding: 80 }}>수정 권한이 없습니다.</div>;

  // 후보 추가/삭제/변경
  function handleAddCandidate() {
    setData(d => [...d, { id: uuidv4(), name: "", image: "" }]);
  }
  function handleDeleteCandidate(idx) {
    setData(d => d.filter((_, i) => i !== idx));
  }
  function handleCandidateChange(idx, key, value) {
    setData(d => d.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
    ));
  }

  // 1개 파일 업로드 (svg/gif 지원)
  function handleFileChange(idx, e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 파일은 최대 5MB까지 업로드 가능합니다.");
      return;
    }
    const allowed = /\.(jpe?g|png|gif|svg)$/i;
    if (!allowed.test(file.name)) {
      alert("jpg, png, gif, svg 파일만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      handleCandidateChange(idx, "image", ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  // 여러 파일 드래그 & 드롭 업로드 (svg/gif 지원)
  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(file =>
      /\.(jpe?g|png|gif|svg)$/i.test(file.name)
    );
    if (files.length === 0) return;

    const fileCandidates = await Promise.all(
      files.map(file => new Promise(res => {
        const reader = new FileReader();
        reader.onload = e => {
          // 파일명에서 확장자 제거, _나 -는 공백으로 변환
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[_\-]+/g, " ")
            .trim();
          res({
            id: uuidv4(),
            name: cleanName,
            image: e.target.result,
          });
        };
        reader.readAsDataURL(file);
      }))
    );
    setData(d => {
      const updated = [...d];
      let idx = 0;
      // 빈 칸부터 채우기
      for (let i = 0; i < updated.length && idx < fileCandidates.length; i++) {
        if (!updated[i].image && !updated[i].name) {
          updated[i] = fileCandidates[idx++];
        }
      }
      // 남는 파일은 추가
      while (idx < fileCandidates.length) {
        updated.push(fileCandidates[idx++]);
      }
      return updated;
    });
  }

  // 드래그 상태
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (data.length < 2) return setError("후보가 2개 이상이어야 합니다.");
    if (data.some(item => !item.name.trim())) return setError("모든 후보에 이름을 입력하세요.");
    const names = data.map(item => item.name.trim());
    if (new Set(names).size !== names.length)
      return setError("후보 이름이 중복됩니다.");
    setLoading(true);

    try {
      // base64 이미지 → 업로드 후 url
      const updatedData = await Promise.all(
        data.map(async item => {
          let imageUrl = item.image;
          if (imageUrl && imageUrl.startsWith("data:image")) {
            const file = await fetch(imageUrl).then(r => r.blob());
            // 확장자 결정
            let ext = "png";
            if (imageUrl.startsWith("data:image/gif")) ext = "gif";
            else if (imageUrl.startsWith("data:image/svg")) ext = "svg";
            else if (imageUrl.startsWith("data:image/jpeg")) ext = "jpg";
            else if (imageUrl.startsWith("data:image/jpg")) ext = "jpg";
            else if (imageUrl.startsWith("data:image/png")) ext = "png";
            imageUrl = await uploadCandidateImage(
              new File([file], `${item.name}.${ext}`, { type: file.type }),
              nickname || user.id
            );
          }
          return {
            ...item,
            id: item.id || uuidv4(),
            name: item.name.trim(),
            image: imageUrl?.trim() || "",
          };
        })
      );
      const updatedCup = {
        ...originalCup,
        title: title.trim(),
        description: description.trim(),
        data: updatedData,
      };
      await updateWorldcupGame(originalCup.id, updatedCup);
      if (fetchWorldcups) await fetchWorldcups();
      alert("수정 완료!");
      navigate("/");
    } catch (e) {
      setError("수정 실패! 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;

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
            disabled={loading}
          />
        </label>
      </div>
      <div style={{ marginBottom: 26 }}>
        <label style={{ fontWeight: 700, fontSize: 17, color: "#223" }}>
          설명
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              width: "100%", padding: 12, borderRadius: 9,
              border: `1.7px solid ${COLORS.main}22`, fontSize: 16,
              marginTop: 6, resize: "vertical", minHeight: 36, background: "#fafdff"
            }}
            rows={2}
            maxLength={80}
            placeholder="간단 설명 (선택)"
            disabled={loading}
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
        {/* ===== 더 큰 업로드 박스 ===== */}
        <div
          onDrop={e => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          style={{
            border: "2.5px dashed #3caeff",
            borderRadius: 18,
            padding: isMobile ? "24px 6px" : "30px 14px",
            marginBottom: 20,
            textAlign: "center",
            background: dragActive ? "#d3eafdcc" : "#f3f9ff",
            cursor: "pointer",
            fontSize: isMobile ? 16 : 20,
            fontWeight: 700,
            color: "#1677ed",
            letterSpacing: "-0.5px",
            minHeight: isMobile ? 40 : 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.18s, border-color 0.18s"
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.svg"
            multiple
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)}
            disabled={loading}
          />
          <span>
            <span style={{ fontSize: isMobile ? 18 : 23 }}>📁</span>
            <br />
            이 칸에 드래그하면 여러 이미지 추가 가능 (jpg, png, gif, svg 지원)
          </span>
        </div>
        {/* ======================================== */}
        {data.map((item, i) => {
          const ext = getFileExtension(item.image);
          const youtubeThumb = getYoutubeThumb(item.image);
          const thumb = youtubeThumb
            ? youtubeThumb
            : item.image?.startsWith("data:image")
              ? item.image
              : item.image;

          return (
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
                disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => document.getElementById(`file-${i}`).click()}
                style={{
                  background: COLORS.main,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  marginLeft: 6,
                }}
                disabled={loading}
              >
                파일
              </button>
              <input
                id={`file-${i}`}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.svg"
                style={{ display: "none" }}
                onChange={e => handleFileChange(i, e)}
                disabled={loading}
              />
              {thumb ? (
                ext === "svg" ? (
                  <object
                    data={thumb}
                    type="image/svg+xml"
                    style={{
                      width: isMobile ? 32 : 44,
                      height: isMobile ? 32 : 44,
                      background: "#f2f2f2",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px #0001",
                      border: "1.2px solid #eee",
                      marginLeft: 8,
                    }}
                  />
                ) : (
                  <img
                    src={thumb}
                    alt=""
                    style={{
                      width: isMobile ? 32 : 44,
                      height: isMobile ? 32 : 44,
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#f2f2f2",
                      boxShadow: "0 2px 8px #0001",
                      border: "1.2px solid #eee",
                      marginLeft: 8,
                    }}
                  />
                )
              ) : null}
              <button
                onClick={() => handleDeleteCandidate(i)}
                style={{
                  background: COLORS.danger, border: "none", borderRadius: 7,
                  color: "#fff", fontWeight: 700, padding: "9px 12px",
                  cursor: "pointer", fontSize: 14, marginLeft: 8,
                  transition: "background 0.18s"
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#b92a2a")}
                onMouseOut={e => (e.currentTarget.style.background = COLORS.danger)}
                disabled={loading}
              >
                삭제
              </button>
            </div>
          );
        })}
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
          disabled={loading}
        >
          + 후보 추가
        </button>
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
          disabled={loading}
        >
          {loading ? "저장중..." : "저장"}
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#e7f3fd", color: "#1976ed", fontWeight: 800, border: "none", borderRadius: 11,
            fontSize: 18, padding: "13px 34px", cursor: "pointer",
            boxShadow: "0 1.5px 9px #1976ed09", marginLeft: 2
          }}
          disabled={loading}
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default EditWorldcupPage;
