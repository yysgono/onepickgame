// src/components/MediaRenderer.js
import React, { useState } from "react";
import { getYoutubeId } from "../utils";

// fallback 기본 이미지 경로
const DEFAULT_IMAGE = "/default-thumb.png";

function MediaRenderer({ url, alt = "" }) {
  const [imgError, setImgError] = useState(false);

  if (!url && !imgError) {
    // url 없을 때 fallback
    return (
      <img
        src={DEFAULT_IMAGE}
        alt={alt || "기본 이미지"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  const youtubeId = getYoutubeId(url);
  const ext = url ? url.split(".").pop().toLowerCase() : "";
  const isVideo = ext === "mp4" || ext === "webm" || ext === "ogg";
  const isGif = ext === "gif";

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
  } else if (isVideo) {
    return (
      <video
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        src={url}
        muted
        loop
        autoPlay
        playsInline
        controls={false}
        onError={e => {
          e.target.onerror = null;
          e.target.poster = DEFAULT_IMAGE;
        }}
      />
    );
  } else {
    // 이미지(jpg/png/gif 등) + fallback
    return (
      <img
        src={imgError || !url ? DEFAULT_IMAGE : url}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={e => {
          if (!imgError) setImgError(true);
        }}
      />
    );
  }
}

export default MediaRenderer;
