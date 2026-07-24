import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_IMAGE = "/default-thumb.png";

const IMAGE_EXTENSIONS = [
  "jpeg",
  "jpg",
  "gif",
  "png",
  "webp",
  "bmp",
  "avif",
  "svg",
];

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"];

/**
 * YouTube URL에서 영상 ID를 추출합니다.
 */
function getYoutubeId(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();

  const patterns = [
    /youtu\.be\/([^/?&#]+)/i,
/youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i,
    /youtube\.com\/embed\/([^/?&#]+)/i,
    /youtube\.com\/shorts\/([^/?&#]+)/i,
    /youtube\.com\/live\/([^/?&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * URL에서 쿼리스트링과 해시를 제거합니다.
 */
function getCleanUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  return url.trim().split("?")[0].split("#")[0];
}

/**
 * 파일 확장자를 반환합니다.
 */
function getFileExtension(url) {
  const cleanUrl = getCleanUrl(url);

  if (!cleanUrl) {
    return "";
  }

  const filename = cleanUrl.split("/").pop();

  if (!filename || !filename.includes(".")) {
    return "";
  }

  return filename.split(".").pop()?.toLowerCase() || "";
}

function isImageFile(url) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(url));
}

function isVideoFile(url) {
  return VIDEO_EXTENSIONS.includes(getFileExtension(url));
}

/**
 * onPlay 콜백을 안전하게 실행합니다.
 */
function callOnPlay(onPlay) {
  if (typeof onPlay !== "function") {
    return;
  }

  try {
    onPlay();
  } catch (error) {
    console.error("MediaRenderer onPlay error:", error);
  }
}

function MediaFallback({ alt, style = {} }) {
  const { t } = useTranslation();

  return (
    <img
      src={DEFAULT_IMAGE}
      alt={alt || t("default_thumbnail", "Default thumbnail")}
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
      decoding="async"
    />
  );
}

function PlayOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.21)",
        pointerEvents: "none",
      }}
    >
      <svg
        width="46"
        height="46"
        viewBox="0 0 48 48"
        focusable="false"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" fill="#000" opacity="0.27" />
        <polygon points="19,15 36,24 19,33" fill="#fff" />
      </svg>
    </div>
  );
}

function MediaRenderer({
  url,
  alt = "",
  playable = false,
  style = {},
  onPlay,
}) {
  const { t } = useTranslation();

  const [mediaError, setMediaError] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const safeUrl = typeof url === "string" ? url.trim() : "";
  const youtubeId = getYoutubeId(safeUrl);
  const videoFile = isVideoFile(safeUrl);
  const imageFile = isImageFile(safeUrl);

  /*
   * 새로운 URL이 들어오면 이전 미디어의 오류 및 재생 상태를 초기화합니다.
   */
  useEffect(() => {
    setMediaError(false);
    setYoutubePlaying(false);
    setVideoPlaying(false);
  }, [safeUrl]);

  const handleMediaError = () => {
    setMediaError(true);
  };

  /*
   * 1. 빈 URL
   */
  if (!safeUrl) {
    return <MediaFallback alt={alt} style={style} />;
  }

  /*
   * 2. YouTube
   */
  if (youtubeId) {
    const youtubeThumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

    if (!playable) {
      if (mediaError) {
        return <MediaFallback alt={alt} style={style} />;
      }

      return (
        <img
          src={youtubeThumbnail}
          alt={alt || t("youtube_thumbnail", "YouTube thumbnail")}
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
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleMediaError}
        />
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#111",
          cursor: youtubePlaying ? "default" : "pointer",
          ...style,
        }}
        role={!youtubePlaying ? "button" : undefined}
        tabIndex={!youtubePlaying ? 0 : undefined}
        aria-label={
          !youtubePlaying
            ? alt || t("play_youtube", "Play YouTube video")
            : undefined
        }
        onClick={() => {
          if (youtubePlaying) {
            return;
          }

          setYoutubePlaying(true);
          callOnPlay(onPlay);
        }}
        onKeyDown={(event) => {
          if (youtubePlaying) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setYoutubePlaying(true);
            callOnPlay(onPlay);
          }
        }}
      >
        {!youtubePlaying ? (
          <>
            {!mediaError ? (
              <img
                src={youtubeThumbnail}
                alt={alt || t("youtube_thumbnail", "YouTube thumbnail")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  border: 0,
                  display: "block",
                }}
                draggable={false}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={handleMediaError}
              />
            ) : (
              <MediaFallback alt={alt} />
            )}

            <PlayOverlay />
          </>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0`}
            title={alt || t("youtube_player", "YouTube player")}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              border: "none",
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        )}
      </div>
    );
  }

  /*
   * 3. 동영상
   */
  if (videoFile) {
    if (mediaError) {
      return <MediaFallback alt={alt} style={style} />;
    }

    /*
     * 목록 썸네일에서는 동영상 파일을 내려받지 않고 기본 이미지만 표시합니다.
     */
    if (!playable) {
      return <MediaFallback alt={alt} style={style} />;
    }

    /*
     * 클릭하기 전에는 video 태그 자체를 렌더링하지 않습니다.
     * 따라서 Storage 동영상 다운로드가 즉시 시작되지 않습니다.
     */
    if (!videoPlaying) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            background: "#111",
            cursor: "pointer",
            ...style,
          }}
          role="button"
          tabIndex={0}
          aria-label={alt || t("play_video", "Play video")}
          onClick={() => {
            setVideoPlaying(true);
            callOnPlay(onPlay);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setVideoPlaying(true);
              callOnPlay(onPlay);
            }
          }}
        >
          <MediaFallback alt={alt} />
          <PlayOverlay />
        </div>
      );
    }

    return (
      <video
        src={safeUrl}
        aria-label={alt || t("video_player", "Video player")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          background: "#111",
          ...style,
        }}
        muted
        loop
        autoPlay
        playsInline
        controls={false}
        preload="metadata"
        poster={DEFAULT_IMAGE}
        onError={handleMediaError}
      >
        {t("video_not_supported", "Your browser does not support video.")}
      </video>
    );
  }

  /*
   * 4. 확장자가 확인되는 이미지
   */
  if (imageFile) {
    if (mediaError) {
      return <MediaFallback alt={alt} style={style} />;
    }

    return (
      <img
        src={safeUrl}
        alt={alt}
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
        decoding="async"
        onError={handleMediaError}
      />
    );
  }

  /*
   * 5. 확장자를 확인할 수 없는 URL
   *
   * 서명 URL이나 확장자가 없는 이미지 URL일 수 있으므로
   * 우선 img 태그로 표시하고, 실패하면 기본 이미지로 교체합니다.
   */
  if (mediaError) {
    return <MediaFallback alt={alt} style={style} />;
  }

  return (
    <img
      src={safeUrl}
      alt={alt}
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
      decoding="async"
      onError={handleMediaError}
    />
  );
}

export default MediaRenderer;