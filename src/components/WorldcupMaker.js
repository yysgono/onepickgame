import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import CandidateInput from "./CandidateInput";
import COLORS from "../styles/theme";
import { mainButtonStyle, grayButtonStyle } from "../styles/common";
import { addWorldcupGame } from "../utils/supabaseWorldcupApi";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { supabase } from "../utils/supabaseClient";
import useBanCheck from "../hooks/useBanCheck";

const DEFAULT_THUMB_URL = "/default-thumb.png";
const MAX_UPLOAD = 50; // 최대 업로드 개수

function isMobile() {
  if (typeof window !== "undefined") {
    return window.innerWidth <= 700;
  }
  return false;
}

function WorldcupMaker({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [candidates, setCandidates] = useState([
    { id: uuidv4(), name: "", image: "", file: null }, // 👈 file 속성 추가
    { id: uuidv4(), name: "", image: "", file: null }, // 👈 file 속성 추가
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const mobile = isMobile();

  const fileInputRef = useRef();

  const [dragActive, setDragActive] = useState(false);

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

  // 👈 [추가] 메모리 누수 방지를 위한 useEffect
  // 컴포넌트가 언마운트되거나 후보 목록이 바뀔 때, 기존에 생성된 blob URL을 메모리에서 해제합니다.
  useEffect(() => {
    return () => {
      candidates.forEach(candidate => {
        if (candidate.image && candidate.image.startsWith('blob:')) {
          URL.revokeObjectURL(candidate.image);
        }
      });
    };
  }, [candidates]);


  // === 정지 체크 (user 변경시 자동) ===
  const { isBanned, banInfo } = useBanCheck(user);

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2>{t("loginRequired")}</h2>
      </div>
    );
  }
  if (isBanned) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#d33", fontWeight: 700 }}>
        🚫 {t("bannedNoCreate")}
        <br />
        {banInfo && banInfo.expires_at && (
          <div>
            {t("banExpiresAt")}: {banInfo.expires_at.replace("T", " ").slice(0, 16)}
          </div>
        )}
        {banInfo && banInfo.reason && (
          <div>
            {t("banReason")}: {banInfo.reason}
          </div>
        )}
      </div>
    );
  }

  function addCandidate() {
    setCandidates((candidates) => [
      ...candidates,
      { id: uuidv4(), name: "", image: "", file: null }, // 👈 file 속성 추가
    ]);
  }
  function updateCandidate(idx, val) {
    setCandidates((cands) => cands.map((c, i) => (i === idx ? val : c)));
  }
  function removeCandidate(idx) {
    if (candidates.length <= 2) return;
    
    // 👈 [수정] 삭제 시에도 blob URL 해제
    const candidateToRemove = candidates[idx];
    if (candidateToRemove.image && candidateToRemove.image.startsWith('blob:')) {
        URL.revokeObjectURL(candidateToRemove.image);
    }

    setCandidates((cands) => cands.filter((_, i) => i !== idx));
  }

  // 👈 [수정] 이미지 여러개 드래그&드롭/클릭 업로드 (Base64 대신 URL.createObjectURL 사용)
  async function handleFiles(fileList) {
    if (fileList.length > MAX_UPLOAD) {
      alert(t("maxUploadLimit", { count: MAX_UPLOAD }));
      return;
    }
    const files = Array.from(fileList).filter(file =>
      /\.(jpe?g|png|gif|svg)$/i.test(file.name)
    );
    if (files.length === 0) return;

    const fileCandidates = files.map(file => {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_\-]+/g, " ")
        .trim();
      return {
        id: uuidv4(),
        name: cleanName,
        image: URL.createObjectURL(file), // 미리보기용 URL
        file: file, // 업로드할 실제 File 객체
      };
    });

    setCandidates(cands => {
      // 기존 blob URL들을 해제하기 위해 복사본을 만듭니다.
      const oldCandidates = [...cands];
      const updated = [...cands];
      let idx = 0;
      for (let i = 0; i < updated.length && idx < fileCandidates.length; i++) {
        if (!updated[i].image && !updated[i].name) {
          // 기존에 blob URL이 있었다면 해제
          if (oldCandidates[i]?.image.startsWith('blob:')) {
            URL.revokeObjectURL(oldCandidates[i].image);
          }
          updated[i] = fileCandidates[idx++];
        }
      }
      while (idx < fileCandidates.length) {
        updated.push(fileCandidates[idx++]);
      }
      return updated;
    });
  }


  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (loading) return;

    const list = candidates
      .map((c) => ({
        ...c,
        name: c.name.trim(),
        image: c.image.trim(),
        id: c.id || uuidv4(),
      }))
      .filter((c) => c.name);

    if (!title.trim()) return setError(t("requireTitle"));
    if (list.length < 2) return setError(t("requireCandidates"));

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) throw new Error("로그인 정보 없음");

      // 👈 [수정] 업로드 로직: File 객체를 직접 업로드
      const updatedList = await Promise.all(
        list.map(async (c) => {
          let imageUrl = c.image;
          // c.file 객체가 있으면 새로운 로컬 파일이므로 업로드합니다.
          if (c.file) { 
            imageUrl = await uploadCandidateImage(
              c.file, // 저장해둔 File 객체를 바로 업로드
              nickname || currentUser.id
            );
          }
          if (!imageUrl) imageUrl = DEFAULT_THUMB_URL;
          // DB에 저장할 최종 데이터에는 file 객체를 제외합니다.
          return { id: c.id, name: c.name, image: imageUrl }; 
        })
      );

      const newCup = {
        title: title.trim(),
        description: desc.trim(),
        data: updatedList,
        created_at: new Date().toISOString(),
        owner: currentUser.id,
        creator: currentUser.id,
      };

      const id = await addWorldcupGame(newCup);
      alert(t("worldcupSaved") + `\nID: ${id}`);

      if (onCreate) {
        onCreate({
          ...newCup,
          id,
        });
      }

      setTitle("");
      setDesc("");
      setCandidates([
        { id: uuidv4(), name: "", image: "", file: null },
        { id: uuidv4(), name: "", image: "", file: null },
      ]);
    } catch (e) {
      setError(t("saveFail"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 20px #0002",
        padding: mobile ? 18 : 30,
        position: "relative",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          marginBottom: 20,
          fontSize: mobile ? 22 : 27,
          letterSpacing: "-1px",
          color: COLORS.main,
        }}
      >
        {t("createWorldcup")}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* ===== 업로드 박스 ===== */}
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
            padding: mobile ? "38px 12px" : "46px 32px",
            marginBottom: 24,
            textAlign: "center",
            background: dragActive ? "#d3eafdcc" : "#f3f9ff",
            cursor: "pointer",
            fontSize: mobile ? 18 : 22,
            fontWeight: 700,
            color: "#1677ed",
            letterSpacing: "-0.5px",
            minHeight: mobile ? 90 : 120,
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
            <span style={{ fontSize: mobile ? 20 : 26 }}>📁</span>
            <br />
            {t("uploadZone")}
            <br />
            <span style={{
              fontSize: mobile ? 14 : 16,
              color: "#888",
              fontWeight: 400,
              display: "block",
              marginTop: 8
            }}>
              {t("dragDropUpTo50")}
            </span>
          </span>
        </div>
        {/* ======================================== */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("worldcupTitle")}
          maxLength={36}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 15 : 18,
            marginBottom: 16,
          }}
          disabled={loading}
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("descriptionOptional")}
          maxLength={100}
          rows={2}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 13 : 15,
            marginBottom: 18,
          }}
          disabled={loading}
        />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>
            {t("candidateList")}{" "}
            <span style={{ color: "#888", fontWeight: 400, fontSize: mobile ? 13 : 15 }}>
              ({candidates.length} / 1024)
            </span>
          </div>
          {candidates.map((c, i) => (
            <CandidateInput
              key={c.id}
              value={c}
              onChange={(val) => updateCandidate(i, val)}
              onRemove={() => removeCandidate(i)}
              disabled={loading}
              minCandidates={candidates.length <= 2}
            />
          ))}
          <button
            type="button"
            onClick={addCandidate}
            style={{
              ...mainButtonStyle(mobile),
              fontSize: 15,
              padding: mobile ? "8px 16px" : "10px 22px",
              borderRadius: 8,
              marginTop: 6,
              width: mobile ? "100%" : undefined,
            }}
            disabled={loading}
          >
            + {t("addCandidate")}
          </button>
        </div>
        {error && (
          <div
            style={{
              color: COLORS.danger || "#d33",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            style={{
              ...mainButtonStyle(mobile),
              fontSize: mobile ? 15 : 17,
              borderRadius: 10,
              padding: mobile ? "11px 0" : "13px 0",
            }}
            disabled={loading}
          >
            {loading ? t("saving") : t("create")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...grayButtonStyle(mobile),
              fontSize: mobile ? 15 : 17,
              borderRadius: 10,
              padding: mobile ? "11px 0" : "13px 0",
            }}
            disabled={loading}
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;