import React, { useState } from "react";
import { getYoutubeId } from "../utils";

// 유튜브 썸네일 fallback
const DEFAULT_IMAGE = "/default-thumb.png";

// 파일 확장자
function getFileExtension(url) {
  if (!url) return "";
  const clean = url.split("?")[0];
  const parts = clean.split("/");
  const last = parts.pop();
  const ext = last?.split(".").pop()?.toLowerCase();
  return ext;
}

// 플레이 가능 여부: 게임에서는 playable, 홈/고정월드컵은 playable false로 전달해야 함
function MediaRenderer({
  url,
  alt = "",
  playable = false, // key! (Match에서만 true, 나머지 false)
  style = {},
  onPlay, // 유튜브 클릭시 재생 콜백(선택)
}) {
  const [imgError, setImgError] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  if (!url || imgError) {
    return (
      <img
        src={DEFAULT_IMAGE}
        alt={alt || "기본 이미지"}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
        draggable={false}
      />
    );
  }

  const youtubeId = getYoutubeId(url);
  const ext = getFileExtension(url);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);

  // 게임중(=playable=true) && 유튜브면: 클릭시 재생(iframe), 아니면 정지(썸네일)
  if (youtubeId) {
    if (playable) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            background: "#111",
            cursor: "pointer",
            ...style,
          }}
          onClick={e => {
            e.stopPropagation();
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
                style={{ width: "100%", height: "100%", objectFit: "cover", border: 0 }}
                draggable={false}
                onError={() => setImgError(true)}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                  pointerEvents: "none",
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="23" fill="#000" opacity="0.25"/>
                  <polygon points="18,15 36,24 18,33" fill="#fff" />
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
    // 홈/고정월드컵 등: 썸네일만
    return (
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
        alt={alt || "YouTube thumbnail"}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    );
  }

  if (isVideo) {
    // 게임 화면만 지원. (썸네일 따로 필요시 분리)
    return playable ? (
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
    ) : (
      <img
        src={DEFAULT_IMAGE}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    );
  }

  // 이미지(jpg/png/gif/webp 등)
  return (
    <img
      src={url}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
      onError={() => { if (!imgError) setImgError(true); }}
      draggable={false}
    />
  );
}

export default MediaRenderer;
