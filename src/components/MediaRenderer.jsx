// src/components/MediaRenderer.js
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
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

const VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "ogg",
  "mov",
  "m4v",
];

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

  return url
    .trim()
    .split("?")[0]
    .split("#")[0];
}

/**
 * 파일 확장자를 반환합니다.
 */
function getFileExtension(url) {
  const cleanUrl = getCleanUrl(url);

  if (!cleanUrl) {
    return "";
  }

  const filename =
    cleanUrl.split("/").pop();

  if (
    !filename ||
    !filename.includes(".")
  ) {
    return "";
  }

  return (
    filename
      .split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}

function isImageFile(url) {
  return IMAGE_EXTENSIONS.includes(
    getFileExtension(url)
  );
}

function isVideoFile(url) {
  return VIDEO_EXTENSIONS.includes(
    getFileExtension(url)
  );
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
    console.error(
      "MediaRenderer onPlay error:",
      error
    );
  }
}

/**
 * YouTube iframe에
 * playVideo / pauseVideo 명령을 보냅니다.
 */
function sendYoutubeCommand(
  iframe,
  command
) {
  if (!iframe?.contentWindow) {
    return;
  }

  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: [],
      }),
      "https://www.youtube.com"
    );
  } catch (error) {
    console.error(
      "YouTube command error:",
      error
    );
  }
}

function MediaFallback({
  alt,
  style = {},
}) {
  const { t } = useTranslation();

  return (
    <img
      src={DEFAULT_IMAGE}
      alt={
        alt ||
        t(
          "default_thumbnail",
          "Default thumbnail"
        )
      }
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
        background:
          "rgba(0, 0, 0, 0.21)",
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
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="#000"
          opacity="0.27"
        />

        <polygon
          points="19,15 36,24 19,33"
          fill="#fff"
        />
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
  active = true,
}) {
  const { t } = useTranslation();

  const youtubeRef = useRef(null);

  const [
    mediaError,
    setMediaError,
  ] = useState(false);

  const [
    youtubeStarted,
    setYoutubeStarted,
  ] = useState(false);

  const [
    videoPlaying,
    setVideoPlaying,
  ] = useState(false);

  const safeUrl =
    typeof url === "string"
      ? url.trim()
      : "";

  const youtubeId =
    getYoutubeId(safeUrl);

  const videoFile =
    isVideoFile(safeUrl);

  const imageFile =
    isImageFile(safeUrl);

  /**
   * 후보 URL이 바뀌면 상태 초기화
   */
  useEffect(() => {
    setMediaError(false);
    setYoutubeStarted(false);
    setVideoPlaying(false);
  }, [safeUrl]);

  /**
   * YouTube는 iframe을 없애지 않습니다.
   *
   * 다른 후보가 선택되면 pauseVideo,
   * 다시 이 후보가 활성화되면 playVideo.
   *
   * 따라서 기존 재생 위치가 유지됩니다.
   */
  useEffect(() => {
    if (
      !youtubeId ||
      !youtubeStarted
    ) {
      return;
    }

    if (active) {
      sendYoutubeCommand(
        youtubeRef.current,
        "playVideo"
      );
    } else {
      sendYoutubeCommand(
        youtubeRef.current,
        "pauseVideo"
      );
    }
  }, [
    active,
    youtubeId,
    youtubeStarted,
  ]);

  const handleMediaError = () => {
    setMediaError(true);
  };

  /**
   * 1. 빈 URL
   */
  if (!safeUrl) {
    return (
      <MediaFallback
        alt={alt}
        style={style}
      />
    );
  }

  /**
   * 2. YouTube
   */
  if (youtubeId) {
    const youtubeThumbnail =
      `https://img.youtube.com/vi/` +
      `${youtubeId}/mqdefault.jpg`;

    /**
     * playable=false에서는
     * 기존처럼 썸네일만 표시
     */
    if (!playable) {
      if (mediaError) {
        return (
          <MediaFallback
            alt={alt}
            style={style}
          />
        );
      }

      return (
        <img
          src={youtubeThumbnail}
          alt={
            alt ||
            t(
              "youtube_thumbnail",
              "YouTube thumbnail"
            )
          }
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
          onError={
            handleMediaError
          }
        />
      );
    }

    /**
     * 아직 한 번도 재생하지 않은 상태
     */
    if (!youtubeStarted) {
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
          aria-label={
            alt ||
            t(
              "play_youtube",
              "Play YouTube video"
            )
          }
          onClick={() => {
            callOnPlay(onPlay);
            setYoutubeStarted(true);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();

              callOnPlay(onPlay);
              setYoutubeStarted(true);
            }
          }}
        >
          {!mediaError ? (
            <img
              src={youtubeThumbnail}
              alt={
                alt ||
                t(
                  "youtube_thumbnail",
                  "YouTube thumbnail"
                )
              }
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
              onError={
                handleMediaError
              }
            />
          ) : (
            <MediaFallback
              alt={alt}
            />
          )}

          <PlayOverlay />
        </div>
      );
    }

    /**
     * 한 번 시작된 YouTube iframe은
     * 제거하지 않고 계속 유지합니다.
     */
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#111",
          ...style,
        }}
      >
        <iframe
          ref={youtubeRef}
          width="100%"
          height="100%"
          src={
            `https://www.youtube.com/embed/` +
            `${youtubeId}` +
            `?autoplay=1` +
            `&mute=0` +
            `&rel=0` +
            `&enablejsapi=1` +
            `&playsinline=1`
          }
          title={
            alt ||
            t(
              "youtube_player",
              "YouTube player"
            )
          }
          frameBorder="0"
          allow={
            "accelerometer; autoplay; " +
            "encrypted-media; gyroscope; " +
            "picture-in-picture"
          }
          allowFullScreen
          loading="lazy"
          referrerPolicy={
            "strict-origin-when-cross-origin"
          }
          style={{
            border: "none",
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents:
              active
                ? "auto"
                : "none",
          }}
        />

        {/*
          상대 영상이 재생 중인 경우.

          이 iframe은 일시정지 상태로 유지되고,
          이 영역을 클릭하면 다시 이 후보를
          activeMediaId로 변경합니다.
        */}
        {!active && (
          <button
            type="button"
            aria-label={
              alt ||
              t(
                "play_youtube",
                "Play YouTube video"
              )
            }
            onClick={() => {
              callOnPlay(onPlay);
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
              padding: 0,
              margin: 0,
              background:
                "rgba(0, 0, 0, 0.18)",
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            <PlayOverlay />
          </button>
        )}
      </div>
    );
  }

  /**
   * 3. 일반 동영상
   * 기존 로직 유지
   */
  if (videoFile) {
    if (mediaError) {
      return (
        <MediaFallback
          alt={alt}
          style={style}
        />
      );
    }

    if (!playable) {
      return (
        <MediaFallback
          alt={alt}
          style={style}
        />
      );
    }

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
          aria-label={
            alt ||
            t(
              "play_video",
              "Play video"
            )
          }
          onClick={() => {
            setVideoPlaying(true);
            callOnPlay(onPlay);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();

              setVideoPlaying(true);
              callOnPlay(onPlay);
            }
          }}
        >
          <MediaFallback
            alt={alt}
          />

          <PlayOverlay />
        </div>
      );
    }

    return (
      <video
        src={safeUrl}
        aria-label={
          alt ||
          t(
            "video_player",
            "Video player"
          )
        }
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
        onError={
          handleMediaError
        }
      >
        {t(
          "video_not_supported",
          "Your browser does not support video."
        )}
      </video>
    );
  }

  /**
   * 4. 이미지
   */
  if (imageFile) {
    if (mediaError) {
      return (
        <MediaFallback
          alt={alt}
          style={style}
        />
      );
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
        onError={
          handleMediaError
        }
      />
    );
  }

  /**
   * 5. 확장자를 확인할 수 없는 URL
   */
  if (mediaError) {
    return (
      <MediaFallback
        alt={alt}
        style={style}
      />
    );
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
      onError={
        handleMediaError
      }
    />
  );
}

export default MediaRenderer;