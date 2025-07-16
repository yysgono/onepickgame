import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import COLORS from "../styles/theme";
import { mainButtonStyle, grayButtonStyle } from "../styles/common";
import useBanCheck from "../hooks/useBanCheck";

const DEFAULT_THUMB_URL = "/default-thumb.png";

function isMobile() {
  if (typeof window !== "undefined") {
    return window.innerWidth <= 700;
  }
  return false;
}

// 미리보기: SVG 포함, data url/object 방식 모두
function MediaRenderer({ url, alt, size = 40 }) {
  if (!url) return (
    <div style={{
      width: size, height: size, background: "#f3f3f3",
      borderRadius: 8, display: "inline-block"
    }} />
  );

  // svg data url or 확장자 .svg인 경우 object/embed로
  if (
    typeof url === "string" &&
    (url.startsWith("data:image/svg") || url.endsWith(".svg"))
  ) {
    return (
      <object
        data={url}
        type="image/svg+xml"
        aria-label={alt}
        style={{
          width: size, height: size, borderRadius: 8,
          display: "inline-block", verticalAlign: "middle"
        }}
      >
        <img src={url} alt={alt} style={{ width: size, height: size }} />
      </object>
    );
  }

  // 기본 이미지 출력
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: size, height: size, objectFit: "cover",
        borderRadius: 8, background: "#f3f3f3", verticalAlign: "middle"
      }}
      onError={e => {
        // svg가 img에서 에러난 경우
        if (url.startsWith("data:image/svg")) {
          e.target.outerHTML = `<span style="font-size:22px;vertical-align:middle;">🖼️</span>`;
        }
      }}
    />
  );
}

function WorldcupMaker({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [candidates, setCandidates] = useState([
    { id: uuidv4(), name: "", image: "" },
    { id: uuidv4(), name: "", image: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const mobile = isMobile();
  const fileInputRef = useRef();

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

  // 정지 체크
  const { isBanned, banInfo } = useBanCheck(user);

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2>{t("loginRequired") || "로그인 후 이용 가능합니다."}</h2>
      </div>
    );
  }
  if (isBanned) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#d33", fontWeight: 700 }}>
        🚫 정지된 유저는 월드컵 생성이 불가합니다.
        <br />
        {banInfo && banInfo.expires_at && (
          <div>정지 해제일: {banInfo.expires_at.replace("T", " ").slice(0, 16)}</div>
        )}
        {banInfo && banInfo.reason && (
          <div>사유: {banInfo.reason}</div>
        )}
      </div>
    );
  }

  function addCandidate() {
    setCandidates((candidates) => [
      ...candidates,
      { id: uuidv4(), name: "", image: "" },
    ]);
  }
  function updateCandidate(idx, val) {
    setCandidates((cands) => cands.map((c, i) => (i === idx ? val : c)));
  }
  function removeCandidate(idx) {
    if (candidates.length <= 2) return;
    setCandidates((cands) => cands.filter((_, i) => i !== idx));
  }

  // SVG, gif, png, jpg 업로드 지원
  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(file =>
      /\.(jpe?g|png|gif|svg)$/i.test(file.name)
    );
    if (files.length === 0) return;

    const fileCandidates = await Promise.all(
      files.map(file => new Promise(res => {
        const reader = new FileReader();
        reader.onload = e => {
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
        reader.readAsDataURL(file); // svg 포함
      }))
    );
    setCandidates(cands => {
      const updated = [...cands];
      let idx = 0;
      for (let i = 0; i < updated.length && idx < fileCandidates.length; i++) {
        if (!updated[i].image && !updated[i].name) {
          updated[i] = fileCandidates[idx++];
        }
      }
      while (idx < fileCandidates.length) {
        updated.push(fileCandidates[idx++]);
      }
      return updated;
    });
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

    if (!title.trim()) return setError("제목을 입력하세요.");
    if (list.length < 2) return setError("후보를 2개 이상 입력하세요.");

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) throw new Error("로그인 정보 없음");

      const updatedList = await Promise.all(
        list.map(async (c) => {
          let imageUrl = c.image;
          if (imageUrl && imageUrl.startsWith("data:image")) {
            const file = await fetch(imageUrl).then(r => r.blob());
            // 확장자 판별
            let ext = "png";
            if (imageUrl.startsWith("data:image/gif")) ext = "gif";
            else if (imageUrl.startsWith("data:image/svg")) ext = "svg";
            else if (imageUrl.startsWith("data:image/jpeg")) ext = "jpg";
            else if (imageUrl.startsWith("data:image/jpg")) ext = "jpg";
            else if (imageUrl.startsWith("data:image/png")) ext = "png";
            imageUrl = await uploadCandidateImage(
              new File([file], `${c.name}.${ext}`, { type: file.type }),
              nickname || currentUser.id
            );
          }
          if (!imageUrl) imageUrl = DEFAULT_THUMB_URL;
          return { ...c, image: imageUrl };
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

      // supabase insert 함수 호출
      const { data, error: cupErr } = await supabase
        .from("worldcups")
        .insert([newCup])
        .select("id")
        .single();
      if (cupErr) throw cupErr;
      alert("월드컵이 저장되었습니다!\nID: " + data.id);

      if (onCreate) {
        onCreate({
          ...newCup,
          id: data.id,
        });
      }

      setTitle("");
      setDesc("");
      setCandidates([
        { id: uuidv4(), name: "", image: "" },
        { id: uuidv4(), name: "", image: "" },
      ]);
    } catch (e) {
      setError("저장 실패! 잠시 후 다시 시도해 주세요.");
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
        {/* ===== 이미지 드래그/클릭 업로드 구간 ===== */}
        <div
          onDrop={e => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={e => e.preventDefault()}
          style={{
            border: "2px dashed #7caeff",
            borderRadius: 12,
            padding: 22,
            marginBottom: 16,
            textAlign: "center",
            background: "#fafbff",
            cursor: "pointer"
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.svg,image/*"
            multiple
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)}
            disabled={loading}
          />
          <span style={{ color: "#3186e6", fontWeight: 700 }}>
            이 박스에 여러 이미지를 드래그하거나 클릭해서 업로드!<br />
            (jpg, png, gif, svg 전부 지원)
          </span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("worldcupTitle") || "월드컵 제목"}
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
          placeholder={t("descriptionOptional") || "설명(선택)"}
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
            {t("candidateList") || "후보 목록"}{" "}
            <span style={{ color: "#888", fontWeight: 400, fontSize: mobile ? 13 : 15 }}>
              ({candidates.length} / 1024)
            </span>
          </div>
          {candidates.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <input
                value={c.name}
                onChange={e => updateCandidate(i, { ...c, name: e.target.value })}
                placeholder="이름"
                maxLength={22}
                style={{
                  width: mobile ? 86 : 130, fontSize: 15, padding: 7, borderRadius: 7,
                  border: "1.1px solid #bbb"
                }}
                disabled={loading}
              />
              <MediaRenderer url={c.image} alt={c.name} size={36} />
              <button
                type="button"
                onClick={() => removeCandidate(i)}
                style={{
                  background: "#f5f5f5", color: "#d33", border: "none",
                  borderRadius: 7, padding: "5px 11px", fontWeight: 700, marginLeft: 2
                }}
                disabled={loading || candidates.length <= 2}
              >
                삭제
              </button>
            </div>
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
            + {t("addCandidate") || "후보 추가"}
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
            {loading ? t("saving") || "저장중..." : t("create") || "생성"}
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
            {t("cancel") || "취소"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;
