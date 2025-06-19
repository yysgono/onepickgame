import React, { useRef } from "react";
import { mainButtonStyle } from "../styles/common"; // 공통 버튼 스타일 import

function UploadCup({ onChange }) {
  const fileInput = useRef();
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "inline-block", margin: isMobile ? "8px 0" : "18px 0" }}>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
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
        이미지 업로드
      </button>
    </div>
  );
}

export default UploadCup;
