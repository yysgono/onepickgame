import React, { useState } from "react";

// 유튜브 id 추출 함수
function getYoutubeId(url) {
  if (!url) return null;
  // youtu.be/xxxx, youtube.com/watch?v=xxxx, /embed/xxxx 등 지원
  const yt =
    url.match(/youtu\.be\/([^/?&]+)/) ||
    url.match(/youtube\.com.*[?&]v=([^&]+)/) ||
    url.match(/youtube\.com\/embed\/([^/?&]+)/);
  return yt ? yt[1] : null;
}

const DEFAULT_IMAGE = "/default-thumb.png"; // public 폴더에 넣으세요!

// 확장자 구하기
function getFileExtension(url) {
  if (!url) return "";
  const clean = url.split("?")[0];
  const parts = clean.split("/");
  const last = parts.pop();
  const ext = last?.split(".").pop()?.toLowerCase();
  return ext;
}

// 메인 컴포넌트
function MediaRenderer({
  url,
  alt = "",
  playable = false, // 홈/추천: false, 경기(실제재생): true
  style = {},
  onPlay // optional
}) {
  const [imgError, setImgError] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  // ===== 유튜브 영상 처리 =====
  const youtubeId = getYoutubeId(url);

  if (youtubeId) {
    // 재생 모드 (경기)일 때만 클릭시 실제 유튜브 영상 보여줌
    if (playable) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            background: "#111",
            cursor: youtubePlaying ? "default" : "pointer",
            ...style,
          }}
          onClick={e => {
            if (!youtubePlaying) {
              setYoutubePlaying(true);
              if (onPlay) onPlay();
            }
          }}
        >
          {!youtubePlaying ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                alt={alt || "YouTube thumbnail"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  border: 0,
                  display: "block"
                }}
                draggable={false}
                onError={() => setImgError(true)}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.21)",
                  pointerEvents: "none",
                }}
              >
                <svg width="46" height="46" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="#000" opacity="0.27"/>
                  <polygon points="19,15 36,24 19,33" fill="#fff" />
                </svg>
              </div>
            </>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0`}
              title="YouTube player"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none", width: "100%", height: "100%" }}
            />
          )}
        </div>
      );
    }
    // 썸네일 모드(추천/홈): 무조건 유튜브 썸네일 (엑박 대비 onError fallback)
    return (
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
        alt={alt || "YouTube thumbnail"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#222",
          display: "block",
          ...style
        }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    );
  }

  // ===== 동영상(mp4/webm/ogg/mov) 지원(경기/재생만, 나머지는 썸네일/기본) =====
  const ext = getFileExtension(url);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);

  if (isVideo) {
    if (playable) {
      // 경기에서는 영상 재생(썸네일 미리보기가 필요하면 추가)
      return (
        <video
          style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
          src={url}
          muted
          loop
          autoPlay
          playsInline
          controls={false}
          poster={DEFAULT_IMAGE}
          onError={e => { if (!imgError) setImgError(true); }}
        />
      );
    }
    // 홈/추천에서는 동영상 그냥 이미지 fallback (썸네일은 별도 로직 추가 가능)
    return (
      <img
        src={DEFAULT_IMAGE}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
        draggable={false}
      />
    );
  }

  // ===== 이미지(jpg/png/gif/webp/bmp) =====
  if (
    url &&
    !imgError &&
    url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)
  ) {
    return (
      <img
        src={url}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#222",
          display: "block",
          ...style
        }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    );
  }

  // ===== 엑박, 빈값, 모르는 타입 등 fallback =====
  if (imgError || !url) {
    return (
      <img
        src={DEFAULT_IMAGE}
        alt="기본 이미지"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#222",
          display: "block",
          ...style
        }}
        draggable={false}
      />
    );
  }

  // ===== 기타(그냥 시도, 실패하면 fallback) =====
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#222",
        display: "block",
        ...style
      }}
      draggable={false}
      onError={() => setImgError(true)}
    />
  );
}

export default MediaRenderer;
