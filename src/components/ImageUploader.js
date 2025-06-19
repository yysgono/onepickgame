import React, { useRef, useState } from "react";

function ImageUploader({ onUpload }) {
  const ref = useRef();
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
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
        accept="image/*"
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
