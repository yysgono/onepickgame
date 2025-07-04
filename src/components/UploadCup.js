// src/components/UploadCup.jsx
import React, { useRef, useState } from "react";
import { mainButtonStyle } from "../styles/common"; // 공통 버튼 스타일 import

function UploadCup({ onChange }) {
  const fileInput = useRef();
  const [preview, setPreview] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 700;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 용량 체크 (3MB 제한)
    if (file.size > 3 * 1024 * 1024) {
      alert("3MB 이하 이미지만 업로드 가능합니다.");
      return;
    }

    // 확장자 체크 (jpg, jpeg, png만)
    if (!/\.(jpe?g|png)$/i.test(file.name)) {
      alert("JPG, PNG 파일만 업로드 가능합니다.");
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
      {preview && (
        <img
          src={preview}
          alt="미리보기"
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
