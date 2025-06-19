import React from "react";

// 유튜브 아이디 추출
function getYoutubeId(url) {
  if (!url) return null;
  // 1. youtu.be/xxxxxxxxxxx
  let m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // 2. youtube.com/embed/xxxxxxxxxxx
  m = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // 3. youtube.com/watch?v=xxxxxxxxxxx
  m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // 4. 기타 경로 맨 뒤
  m = url.match(/\/([A-Za-z0-9_-]{11})(?:\?|&|$)/);
  if (m) return m[1];
  return null;
}

function YoutubePreview({ url, width = 320, height = 180, style = {} }) {
  const id = getYoutubeId(url);
  if (!id) return null;

  return (
    <div style={{ width: width, maxWidth: "100%" }}>
      <iframe
        width="100%"
        height={height}
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube Preview"
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ borderRadius: 10, margin: "4px 0", ...style }}
      />
    </div>
  );
}

export default YoutubePreview;
