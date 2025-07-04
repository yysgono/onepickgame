import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";
import { uploadCandidateImage } from "../utils/supabaseImageUpload"; // supabase 전용

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

function CandidateInput({ value, onChange, onRemove, disabled }) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef();

  // 썸네일 미리보기
  const youtubeThumb = getYoutubeThumb(value.image);
  const ext = getFileExtension(value.image);
  const isVideoFile = ext === "mp4" || ext === "webm" || ext === "ogg";

  const thumb = youtubeThumb
    ? youtubeThumb
    : !isVideoFile && value.image?.startsWith("http")
    ? value.image
    : null;

  // supabase storage에 업로드
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = /\.(jpe?g|png)$/i;
    const disallowed = /\.(gif|webp)$/i;
    const fileName = file.name || "";

    if (!allowed.test(fileName)) {
      alert("jpg, jpeg, png 파일만 업로드 가능합니다.");
      return;
    }
    if (disallowed.test(fileName)) {
      alert("gif, webp 파일은 업로드할 수 없습니다.");
      return;
    }

    try {
      const user = localStorage.getItem("onepickgame_user") || "guest";
      const url = await uploadCandidateImage(file, user);
      onChange({ ...value, image: url });
    } catch (err) {
      alert("이미지 업로드 실패: " + err.message);
    }
  }

  function handleNameChange(e) {
    const name = e.target.value;
    if (hasBadword(name, i18n.language)) {
      alert(t("badword_warning") || "비속어/금지어가 포함되어 있습니다.");
      return;
    }
    onChange({ ...value, name });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        padding: "14px 10px",
        borderRadius: 13,
        background: "#fafdff",
        boxShadow: "0 1px 8px #b9d8ff28",
        flexWrap: "wrap",
      }}
    >
      {/* 썸네일 미리보기 */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 10,
          background: "#e3f0fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 2px 10px #1976ed18",
          fontSize: 28,
          color: "#1976ed",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt="thumb"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : isVideoFile ? (
          <span role="img" aria-label="video">
            🎥
          </span>
        ) : (
          <span style={{ color: "#b3d3fc", fontSize: 26 }}>?</span>
        )}
      </div>
      {/* 이름 입력 */}
      <input
        type="text"
        value={value.name}
        onChange={handleNameChange}
        placeholder={t("name")}
        maxLength={24}
        style={{
          width: 100,
          padding: "9px 8px",
          borderRadius: 7,
          border: "1.2px solid #b4c4e4",
          fontSize: 15,
          fontWeight: 600,
          background: "#fff",
          flexShrink: 0,
        }}
        disabled={disabled}
      />
      {/* 이미지 URL */}
      <input
        type="text"
        value={value.image}
        onChange={(e) => onChange({ ...value, image: e.target.value })}
        placeholder={t("imageUrlOrYoutube") || "이미지 URL / 유튜브"}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "9px 10px",
          borderRadius: 7,
          border: "1.2px solid #b4c4e4",
          fontSize: 15,
          background: "#fff",
          marginRight: 8,
          minWidth: 120,
        }}
        disabled={disabled}
      />
      {/* 파일 업로드 버튼 */}
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        style={{
          background: "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 17px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14.2,
          boxShadow: "0 2px 7px #1976ed15",
          whiteSpace: "nowrap",
          marginRight: 6,
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#45b7fa")}
        onMouseOut={(e) =>
          (e.currentTarget.style.background =
            "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)")
        }
        disabled={disabled}
      >
        {t("chooseFile") || "파일선택"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "#f8d3d3",
          color: "#d33",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          padding: "7px 14px",
          cursor: "pointer",
          boxShadow: "0 1px 5px #d33a",
          whiteSpace: "nowrap",
        }}
        disabled={disabled}
      >
        {t("delete") || "삭제"}
      </button>
    </div>
  );
}

export default CandidateInput;
