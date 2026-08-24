import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ✨ props: onUpload(base64), preview(image url)
function CandidateUploader({ onUpload, preview }) {
  const { t } = useTranslation();
  const ref = useRef();
  const [img, setImg] = useState(preview || "");

  // 파일 확장자 체크 함수
function isAllowedImage(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "svg"];
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
  ];

  return (
    allowedExtensions.includes(ext) &&
    allowedMimeTypes.includes(file.type)
  );
}

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 2MB 용량 제한
    if (file.size > 2 * 1024 * 1024) {
      alert(t("image_file_size_limit_2mb") || t("Only images under 2MB can be uploaded."));
      e.target.value = "";
      return;
    }

    if (!isAllowedImage(file)) {
      alert(t("only_jpg_png") || t("Only jpg, jpeg, png files can be uploaded."));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setImg(ev.target.result);
      onUpload && onUpload(ev.target.result);
      // 파일 input 초기화(같은 파일 재업로드 가능하게)
      if (ref.current) ref.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ margin: "18px 0", display: "flex", alignItems: "center", gap: 16 }}>
      <input
        type="file"
   accept=".jpg,.jpeg,.png,.gif,.svg,image/jpeg,image/png,image/gif,image/svg+xml"
        ref={ref}
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        onClick={() => ref.current.click()}
        style={{
          padding: "9px 20px",
          borderRadius: 9,
          border: 0,
          background: "linear-gradient(90deg, #1976ed 65%, #45b7fa 100%)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 15.5,
          cursor: "pointer",
          transition: "all 0.17s",
          boxShadow: "0 2px 10px #1976ed15",
        }}
        onMouseOver={e => (e.currentTarget.style.background = "#45b7fa")}
        onMouseOut={e =>
          (e.currentTarget.style.background =
            "linear-gradient(90deg, #1976ed 65%, #45b7fa 100%)")
        }
        type="button"
      >
        📷 {t("upload_image")}
      </button>
      {img && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 2px 8px #1976ed18",
            background: "#f3f6fa",
            border: "1.5px solid #e3f0fb",
          }}
        >
          <img
            src={img}
            alt={t("preview")}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
    </div>
  );
}

export default CandidateUploader;
