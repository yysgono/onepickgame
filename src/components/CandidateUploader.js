import React, { useRef, useState } from "react";

// ✨ props: onUpload(base64), preview(이미지 url)
function CandidateUploader({ onUpload, preview }) {
  const ref = useRef();
  const [img, setImg] = useState(preview || "");

  // 파일 확장자 체크 함수
  function isAllowedImage(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    // 파일 타입 체크(jpg, jpeg, png만 허용)
    return ["jpg", "jpeg", "png"].includes(ext);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 2MB 용량 제한
    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 파일은 최대 2MB까지 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (!isAllowedImage(file)) {
      alert("jpg, jpeg, png 파일만 업로드할 수 있습니다.\n(webp, gif, 기타 확장자는 불가)");
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
        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
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
        📷 이미지 업로드
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
            alt="미리보기"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
    </div>
  );
}

export default CandidateUploader;
