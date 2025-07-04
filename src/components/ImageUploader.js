import React, { useRef, useState } from "react";

function ImageUploader({ onUpload }) {
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
      setError("jpg, jpeg, png 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError("2MB 이하 이미지만 업로드 가능합니다.");
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
      >
        이미지 업로드
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
            alt="미리보기"
            style={{ maxWidth: 160, maxHeight: 100, borderRadius: 9, border: "1px solid #eee" }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
