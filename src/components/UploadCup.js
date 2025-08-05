import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { mainButtonStyle } from "../styles/common";

function UploadCup({ onChange }) {
  const { t } = useTranslation();
  const fileInput = useRef();
  const [preview, setPreview] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Image 6MB limit
    if (file.size > 6 * 1024 * 1024) {
      alert(t("only_images_under_6mb") || "Only images under 6MB can be uploaded.");
      return;
    }

    // Extension check (jpg, jpeg, png only)
    if (
      !/\.(jpe?g|png)$/i.test(file.name) ||
      !["image/jpeg", "image/png"].includes(file.type)
    ) {
      alert(t("only_jpg_png") || "Only JPG, PNG files can be uploaded.");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      onChange(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "inline-block", margin: isMobile ? "8px 0" : "18px 0" }}>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileInput.current.click()}
        style={{
          ...mainButtonStyle(isMobile),
          fontSize: isMobile ? 15 : 16,
          borderRadius: 10,
          padding: isMobile ? "8px 17px" : "9px 25px"
        }}
      >
        {t("image_upload") || "Upload Image"}
      </button>
      <span style={{ color: "#1976ed", fontSize: 14, marginLeft: 10 }}>
        ({t("image_size_limit_6mb") || "Max 6MB"})
      </span>
      {preview && (
        <img
          src={preview}
          alt={t("preview") || "Preview"}
          style={{
            width: 50,
            height: 50,
            objectFit: "cover",
            borderRadius: 7,
            marginLeft: 10,
            border: "1px solid #eee",
            boxShadow: "0 1px 6px #1976ed11",
            verticalAlign: "middle"
          }}
        />
      )}
    </div>
  );
}

export default UploadCup;
