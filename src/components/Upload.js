// src/components/Upload.jsx

import React, { useRef, useState } from "react";
import { mainButtonStyle } from "../styles/common"; // 공통 스타일 import

function Upload({ onUpload }) {
  const fileInput = useRef();
  const [preview, setPreview] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // 파일 용량 체크 (예: 3MB 이하)
    if (file.size > 3 * 1024 * 1024) {
      alert("3MB 이하 이미지만 업로드 가능합니다.");
      return;
    }
    // 확장자 검사 (jpg, jpeg, png만)
    if (!/\.(jpe?g|png)$/i.test(file.name)) {
      alert("JPG, PNG 파일만 업로드 가능합니다.");
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
    <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 8 }}>
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
        이미지 업로드
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {preview && (
        <img
          src={preview}
          alt="미리보기"
          style={{
            width: 48,
            height: 48,
            borderRadius: 7,
            marginLeft: 6,
            objectFit: "cover",
            border: "1px solid #eee",
            boxShadow: "0 1px 6px #1976ed11"
          }}
        />
      )}
    </div>
  );
}

export default Upload;
