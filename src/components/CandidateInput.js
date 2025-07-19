import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";

function getYoutubeThumb(url) {
  const match = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

function getFileExtension(url = "", file = null) {
  if (file && file.name) {
    return file.name.split('.').pop().toLowerCase();
  }
  if (!url) return "";
  const parts = url.split("?")[0].split("/").pop().split(".");
  if (parts.length === 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

const DEFAULT_IMAGE = "/default-thumb.png";

// gif의 첫 프레임만 추출 (정지 썸네일)
function GifThumbnail({ fileOrUrl, style }) {
  const canvasRef = useRef();

  useEffect(() => {
    let url;
    if (fileOrUrl instanceof File) {
      url = URL.createObjectURL(fileOrUrl);
    } else if (typeof fileOrUrl === "string") {
      url = fileOrUrl;
    } else {
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext("2d");
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;

    return () => {
      if (fileOrUrl instanceof File) URL.revokeObjectURL(url);
    };
  }, [fileOrUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#e3f0fb",
        objectFit: "cover",
        ...style
      }}
    />
  );
}

function CandidateInput({ value, onChange, onRemove, disabled }) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef();
  const [previewUrl, setPreviewUrl] = useState("");

  // 미리보기: file이면 objectURL, 아니면 value.image(string)
  useEffect(() => {
    if (value.file instanceof File) {
      const url = URL.createObjectURL(value.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value.image === "string") {
      setPreviewUrl(value.image);
    } else {
      setPreviewUrl("");
    }
  }, [value.file, value.image]);

  // 썸네일 결정
  let thumb = "";
  const youtubeThumb = getYoutubeThumb(value.image);
  const ext = getFileExtension(
    value.image || (value.file && value.file.name),
    value.file
  );
  const isVideoFile =
    ext === "mp4" || ext === "webm" || ext === "ogg" || ext === "mov";
  const isGif =
    ext === "gif" ||
    (value.file && value.file.type === "image/gif") ||
    (value.image && value.image.startsWith("data:image/gif"));

  if (youtubeThumb) {
    thumb = youtubeThumb;
  } else if (value.file instanceof File) {
    thumb = previewUrl;
  } else if (value.image?.startsWith("http")) {
    thumb = value.image;
  } else if (value.image?.startsWith("data:image")) {
    thumb = value.image;
  }

  function handleNameChange(e) {
    const name = e.target.value;
    if (hasBadword(name, i18n.language)) {
      alert(t("badword_warning") || "비속어/금지어가 포함되어 있습니다.");
      return;
    }
    onChange({ ...value, name });
  }

  function handleImageUrlChange(e) {
    // url입력 시 file정보 리셋
    onChange({ ...value, image: e.target.value, file: undefined });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // 확장자 필터: jpg, png, gif, svg만
    const allowed = /\.(jpe?g|png|gif|svg)$/i;
    if (!allowed.test(file.name)) {
      alert(t("only_image_file") || "jpg, png, gif, svg 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t("image_file_size_limit") || "5MB 이하의 이미지만 업로드 가능합니다.");
      return;
    }
    onChange({ ...value, file, image: "", fileName: file.name });
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
        {youtubeThumb ? (
          <img
            src={youtubeThumb}
            alt="yt"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : isGif && (value.file || value.image) ? (
          <GifThumbnail fileOrUrl={value.file || value.image} />
        ) : thumb ? (
          ext === "svg" || (value.file && value.file.type === "image/svg+xml") ? (
            <object data={thumb} type="image/svg+xml" style={{ width: "100%", height: "100%" }} />
          ) : (
            <img
              src={thumb}
              alt="thumb"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.src = DEFAULT_IMAGE; }}
            />
          )
        ) : isVideoFile ? (
          <span role="img" aria-label="video">🎥</span>
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
      {/* 이미지 URL/유튜브 */}
      <input
        type="text"
        value={value.image}
        onChange={handleImageUrlChange}
        placeholder={t("imageUrlOrYoutube")}
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
        onMouseOver={e => (e.currentTarget.style.background = "#45b7fa")}
        onMouseOut={e =>
          (e.currentTarget.style.background =
            "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)")
        }
        disabled={disabled}
      >
        {t("chooseFile")}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.svg"
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
        {t("delete")}
      </button>
    </div>
  );
}

export default CandidateInput;
