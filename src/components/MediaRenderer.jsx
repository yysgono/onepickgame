import React, { useState } from "react";
import { getYoutubeId } from "../utils";

const DEFAULT_IMAGE = "/default-thumb.png";

function getFileExtension(url) {
  if (!url) return "";
  const clean = url.split("?")[0]; // 쿼리스트링 제거
  const parts = clean.split("/");
  const last = parts.pop();
  const ext = last?.split(".").pop()?.toLowerCase();
  return ext;
}

function MediaRenderer({ url, alt = "" }) {
  const [imgError, setImgError] = useState(false);

  if (!url || imgError) {
    // url이 없거나, 이미지 에러났을 때 fallback
    return (
      <img
        src={DEFAULT_IMAGE}
        alt={alt || "기본 이미지"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        draggable={false}
      />
    );
  }

  const youtubeId = getYoutubeId(url);
  const ext = getFileExtension(url);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext);

  if (youtubeId) {
    return (
      <iframe
        width="100%"
        height="100%"
        style={{ border: "none" }}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isVideo) {
    return (
      <video
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        src={url}
        muted
        loop
        autoPlay
        playsInline
        controls={false}
        poster={DEFAULT_IMAGE}
        onError={e => {
          if (!imgError) setImgError(true);
        }}
      />
    );
  }

  // 이미지(jpg/png/gif/webp 등)
  return (
    <img
      src={url}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => {
        if (!imgError) setImgError(true);
      }}
      draggable={false}
    />
  );
}

export default MediaRenderer;
