import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function ImageUploader({ onUpload }) {
  const { t } = useTranslation();
  const ref = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");

    // 파일 확장자 및 크기 체크
    const ext = file.name.split('.').pop().toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      setError(t("only_jpg_png") || "Only jpg, jpeg, png files can be uploaded.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError(t("image_file_size_limit_2mb") || "Only images under 2MB can be uploaded.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      onUpload(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
        ref={ref}
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        onClick={() => ref.current.click()}
        style={{
          padding: "8px 22px",
          borderRadius: 10,
          border: 0,
          background: "#eee",
          fontWeight: 700,
          cursor: "pointer",
        }}
        type="button"
      >
        {t("upload_image") || "Upload Image"}
      </button>
      {error && (
        <div style={{ color: "red", marginTop: 10, fontSize: 15 }}>
          {error}
        </div>
      )}
      {preview && (
        <div style={{ marginTop: 12 }}>
          <img
            src={preview}
            alt={t("preview") || "Preview"}
            style={{ maxWidth: 160, maxHeight: 100, borderRadius: 9, border: "1px solid #eee" }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
