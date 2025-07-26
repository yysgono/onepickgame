import React, { useState } from "react";

function getYoutubeId(url) {
  if (!url) return null;
  const yt =
    url.match(/youtu\.be\/([^/?&]+)/) ||
    url.match(/youtube\.com.*[?&]v=([^&]+)/) ||
    url.match(/youtube\.com\/embed\/([^/?&]+)/);
  return yt ? yt[1] : null;
}

const DEFAULT_IMAGE = "/default-thumb.png"; // public 폴더에 반드시 위치

function getFileExtension(url) {
  if (!url) return "";
  const clean = url.split("?")[0];
  const last = clean.split("/").pop();
  return last?.split(".").pop()?.toLowerCase() || "";
}

function isImageFile(url) {
  return /\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i.test(url);
}

function MediaRenderer({ url, alt = "", playable = false, style = {}, onPlay }) {
  const [imgError, setImgError] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  // 1. 유튜브 처리
  const youtubeId = getYoutubeId(url);
  if (youtubeId) {
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
          onClick={() => {
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
                  display: "block",
                }}
                draggable={false}
                onError={() => setImgError(true)}
                loading="lazy"
              />
              {imgError && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#000",
                    color: "#666",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 14,
                    userSelect: "none",
                  }}
                >
                  이미지 로딩 실패
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.21)",
                  pointerEvents: "none",
                }}
              >
                <svg width="46" height="46" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="#000" opacity="0.27" />
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
    // 썸네일 모드
    return imgError ? (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          color: "#666",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 14,
          userSelect: "none",
          ...style,
        }}
      >
        이미지 로딩 실패
      </div>
    ) : (
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
        alt={alt || "YouTube thumbnail"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#222",
          display: "block",
          ...style,
        }}
        draggable={false}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // 2. 비디오 처리
  const ext = getFileExtension(url);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);
  if (isVideo) {
    if (playable) {
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
          onError={() => setImgError(true)}
        />
      );
    }
    // 썸네일: 비디오 미리보기 미지원시 기본 이미지로 fallback
    return (
      <img
        src={DEFAULT_IMAGE}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
        draggable={false}
        loading="lazy"
      />
    );
  }

  // 3. 이미지 처리
  if (url && !imgError && isImageFile(url)) {
    return (
      <img
        src={url}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: style.objectFit || "cover",
          background: "#222",
          display: "block",
          ...style,
        }}
        draggable={false}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // 4. 에러 또는 빈 URL fallback
  if (imgError || !url) {
    return (
      <img
        src={DEFAULT_IMAGE}
        alt="Default thumbnail"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#222",
          display: "block",
          ...style,
        }}
        draggable={false}
        loading="lazy"
      />
    );
  }

  // 5. 기타 미디어 (성공하면 보여주고 실패 시 fallback)
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: style.objectFit || "cover",
        background: "#222",
        display: "block",
        ...style,
      }}
      draggable={false}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

export default MediaRenderer;
