// MediaRenderer.js
import React from "react";
import { getYoutubeId } from "../utils";

function MediaRenderer({ url, alt = "" }) {
  if (!url) return null;
  const youtubeId = getYoutubeId(url);
  const ext = url.split(".").pop().toLowerCase();
  const isVideo = ext === "mp4" || ext === "webm" || ext === "ogg";
  const isGif = ext === "gif";

  if (youtubeId) {
    return (
      <iframe
        width="100%"
        height="100%"
        style={{ border: "none", pointerEvents: "none" }}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  } else if (isVideo) {
    return (
      <video
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
        src={url}
        muted
        loop
        autoPlay
        playsInline
      />
    );
  } else if (isGif) {
    return (
      <img
        src={url}
        alt={alt || "gif"}
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      />
    );
  } else {
    return (
      <img
        src={url}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      />
    );
  }
}

export default MediaRenderer;
