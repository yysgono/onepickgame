import React, { useRef } from "react";
import { mainButtonStyle } from "../styles/common"; // 공통 스타일 import

function Upload({ onUpload }) {
  const fileInput = useRef();
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;

  function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
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
    </div>
  );
}

export default Upload;
