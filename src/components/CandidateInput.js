import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";

const DEFAULT_IMAGE = "/default-thumb.png";

// ======================================================
// YouTube video id
// ======================================================
function getYoutubeVideoId(url = "") {
  const value = String(url || "").trim();

  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/watch\?.*v=([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

// ======================================================
// YouTube thumbnail
// ======================================================
function getYoutubeThumb(url) {
  const videoId =
    getYoutubeVideoId(url);

  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ======================================================
// 확장자
// ======================================================
function getFileExtension(
  url = "",
  file = null
) {
  if (file?.name) {
    return String(file.name)
      .split(".")
      .pop()
      .toLowerCase();
  }

  if (!url) {
    return "";
  }

  const cleanUrl =
    String(url)
      .split("?")[0];

  const fileName =
    cleanUrl
      .split("/")
      .pop();

  const parts =
    String(fileName)
      .split(".");

  if (parts.length <= 1) {
    return "";
  }

  return parts[
    parts.length - 1
  ].toLowerCase();
}

// ======================================================
// GIF 첫 프레임 썸네일
// ======================================================
function GifThumbnail({
  fileOrUrl,
  style,
}) {
  const canvasRef =
    useRef(null);

  useEffect(() => {
    let objectUrl = null;

    if (
      fileOrUrl instanceof File
    ) {
      objectUrl =
        URL.createObjectURL(
          fileOrUrl
        );
    } else if (
      typeof fileOrUrl ===
      "string"
    ) {
      objectUrl =
        fileOrUrl;
    } else {
      return undefined;
    }

    const img =
      new window.Image();

    img.onload = () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      canvas.width =
        img.naturalWidth ||
        img.width ||
        1;

      canvas.height =
        img.naturalHeight ||
        img.height ||
        1;

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        return;
      }

      ctx.drawImage(
        img,
        0,
        0
      );
    };

    img.src =
      objectUrl;

    return () => {
      if (
        fileOrUrl instanceof File &&
        objectUrl
      ) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [fileOrUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#e3f0fb",
        objectFit: "cover",
        ...style,
      }}
    />
  );
}

// ======================================================
// CandidateInput
// ======================================================
function CandidateInput({
  value,
  onChange,
  onRemove,
  disabled,
}) {
  const { t, i18n } =
    useTranslation();

  const fileInputRef =
    useRef(null);

  const latestUrlRef =
    useRef("");

  const requestIdRef =
    useRef(0);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    youtubeLoading,
    setYoutubeLoading,
  ] = useState(false);

  // ====================================================
  // 파일 미리보기 URL
  // ====================================================
  useEffect(() => {
    if (
      value.file instanceof File
    ) {
      const objectUrl =
        URL.createObjectURL(
          value.file
        );

      setPreviewUrl(
        objectUrl
      );

      return () => {
        URL.revokeObjectURL(
          objectUrl
        );
      };
    }

    if (
      typeof value.image ===
      "string"
    ) {
      setPreviewUrl(
        value.image
      );
    } else {
      setPreviewUrl("");
    }

    return undefined;
  }, [
    value.file,
    value.image,
  ]);

  const youtubeThumb =
    getYoutubeThumb(
      value.image
    );

  const ext =
    getFileExtension(
      value.image ||
        value.file?.name ||
        "",
      value.file
    );

  const isGif =
    ext === "gif" ||
    value.file?.type ===
      "image/gif" ||
    String(
      value.image || ""
    ).startsWith(
      "data:image/gif"
    );

  let thumb = "";

  if (youtubeThumb) {
    thumb =
      youtubeThumb;
  } else if (
    value.file instanceof File
  ) {
    thumb =
      previewUrl;
  } else if (
    String(
      value.image || ""
    ).startsWith(
      "http"
    )
  ) {
    thumb =
      value.image;
  } else if (
    String(
      value.image || ""
    ).startsWith(
      "data:image"
    )
  ) {
    thumb =
      value.image;
  }

  // ====================================================
  // 이름 변경
  // ====================================================
  function handleNameChange(
    event
  ) {
    const name =
      event.target.value;

    if (
      hasBadword(
        name,
        i18n.language
      )
    ) {
      alert(
        t(
          "badword_warning"
        ) ||
          "Contains profanity or banned words."
      );

      return;
    }

    onChange({
      ...value,
      name,
    });
  }

  // ====================================================
  // YouTube 제목 가져오기
  // ====================================================
  async function fetchYoutubeTitle(
    url
  ) {
    const videoId =
      getYoutubeVideoId(url);

    if (!videoId) {
      return;
    }

    // 이미 이름이 있으면 자동 제목 입력 안 함
    if (
      String(
        value.name || ""
      ).trim()
    ) {
      return;
    }

    const myRequestId =
      ++requestIdRef.current;

    try {
      setYoutubeLoading(
        true
      );

      const response =
        await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(
            url
          )}&format=json`
        );

      if (
        !response.ok
      ) {
        console.error(
          "YouTube oEmbed 실패:",
          response.status
        );

        return;
      }

      const data =
        await response.json();

      if (
        myRequestId !==
        requestIdRef.current
      ) {
        return;
      }

      if (
        latestUrlRef.current !==
        url
      ) {
        return;
      }

      const youtubeTitle =
        String(
          data?.title || ""
        ).trim();

      if (!youtubeTitle) {
        return;
      }

      /*
       * 사용자 이름이 비어 있을 때만
       * YouTube 제목 자동 입력
       */
      onChange({
        ...value,
        name:
          youtubeTitle.slice(
            0,
            24
          ),
        image:
          url,
        file:
          undefined,
        fileName:
          undefined,
      });
    } catch (error) {
      console.error(
        "YouTube 제목 가져오기 실패:",
        error
      );
    } finally {
      if (
        myRequestId ===
        requestIdRef.current
      ) {
        setYoutubeLoading(
          false
        );
      }
    }
  }

  // ====================================================
  // 이미지 URL / YouTube URL
  // ====================================================
  function handleImageUrlChange(
    event
  ) {
    const url =
      event.target.value;

    latestUrlRef.current =
      url;

    /*
     * URL은 즉시 화면에 반영
     */
    onChange({
      ...value,
      image:
        url,
      file:
        undefined,
      fileName:
        undefined,
    });

    const videoId =
      getYoutubeVideoId(url);

    if (!videoId) {
      setYoutubeLoading(
        false
      );

      return;
    }

    /*
     * 이미 이름이 있으면
     * 자동 제목 가져오지 않음
     */
    if (
      String(
        value.name || ""
      ).trim()
    ) {
      return;
    }

    /*
     * 붙여넣기 직후 바로 제목 가져오기
     */
    fetchYoutubeTitle(
      url
    );
  }

  // ====================================================
  // 로컬 이미지 파일
  // ====================================================
  function handleFileChange(
    event
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    const allowedExtensions =
      /\.(jpe?g|png|gif|svg|webp|avif)$/i;

    const allowedMimeTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/svg+xml",
        "image/webp",
        "image/avif",
      ]);

    const extensionAllowed =
      allowedExtensions.test(
        file.name
      );

    const mimeAllowed =
      Boolean(
        file.type
      ) &&
      allowedMimeTypes.has(
        file.type
      );

    // 동영상 / 기타 파일 차단
    if (
      !extensionAllowed ||
      !mimeAllowed
    ) {
      alert(
        t(
          "only_image_file"
        ) ||
          "Only JPG, PNG, GIF, SVG, WebP, AVIF image files can be uploaded."
      );

      event.target.value =
        "";

      return;
    }

    // 원본 최대 6MB
    if (
      file.size >
      6 * 1024 * 1024
    ) {
      alert(
        t(
          "image_file_size_limit"
        ) ||
          "Only images under 6MB can be uploaded."
      );

      event.target.value =
        "";

      return;
    }

    onChange({
      ...value,
      file,
      image: "",
      fileName:
        file.name,
    });

    // 같은 파일 재선택 가능
    event.target.value =
      "";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems:
          "center",
        gap: 10,
        marginBottom: 14,
        padding:
          "14px 10px",
        borderRadius: 13,
        background:
          "#fafdff",
        boxShadow:
          "0 1px 8px #b9d8ff28",
        flexWrap: "wrap",
      }}
    >
      {/* 썸네일 */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 10,
          background:
            "#e3f0fb",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          overflow: "hidden",
          boxShadow:
            "0 2px 10px #1976ed18",
          fontSize: 28,
          color: "#1976ed",
          userSelect:
            "none",
          flexShrink: 0,
        }}
      >
        {youtubeThumb ? (
          <img
            src={
              youtubeThumb
            }
            alt={
              t("yt") ||
              "YouTube"
            }
            style={{
              width:
                "100%",
              height:
                "100%",
              objectFit:
                "cover",
            }}
          />
        ) : isGif &&
          (value.file ||
            value.image) ? (
          <GifThumbnail
            fileOrUrl={
              value.file ||
              value.image
            }
          />
        ) : thumb ? (
          <img
            src={thumb}
            alt={
              t("thumb") ||
              "Thumbnail"
            }
            style={{
              width:
                "100%",
              height:
                "100%",
              objectFit:
                "cover",
            }}
            onError={(
              event
            ) => {
              event.currentTarget.src =
                DEFAULT_IMAGE;
            }}
          />
        ) : (
          <span
            style={{
              color:
                "#b3d3fc",
              fontSize: 26,
            }}
          >
            ?
          </span>
        )}
      </div>

      {/* 후보 이름 */}
      <div
        style={{
          width: 120,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={
            value.name || ""
          }
          onChange={
            handleNameChange
          }
          placeholder={
            youtubeLoading
              ? "Loading..."
              : t("name") ||
                "Name"
          }
          maxLength={24}
          style={{
            width: "100%",
            padding:
              "9px 8px",
            borderRadius: 7,
            border:
              "1.2px solid #b4c4e4",
            fontSize: 15,
            fontWeight: 600,
            background:
              "#fff",
            boxSizing:
              "border-box",
          }}
          disabled={
            disabled
          }
        />
      </div>

      {/* URL / YouTube */}
      <input
        type="text"
        value={
          value.image || ""
        }
        onChange={
          handleImageUrlChange
        }
        placeholder={
          t(
            "imageUrlOrYoutube"
          ) ||
          "Image URL or YouTube"
        }
        style={{
          flex: 1,
          minWidth: 180,
          padding:
            "9px 10px",
          borderRadius: 7,
          border:
            "1.2px solid #b4c4e4",
          fontSize: 15,
          background:
            "#fff",
          marginRight: 8,
          boxSizing:
            "border-box",
        }}
        disabled={
          disabled
        }
      />

      {/* 파일 선택 */}
      <button
        type="button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        style={{
          background:
            "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding:
            "8px 17px",
          fontWeight: 700,
          cursor:
            disabled
              ? "not-allowed"
              : "pointer",
          fontSize: 14.2,
          boxShadow:
            "0 2px 7px #1976ed15",
          whiteSpace:
            "nowrap",
          marginRight: 6,
          opacity:
            disabled
              ? 0.6
              : 1,
        }}
        disabled={
          disabled
        }
      >
        {t(
          "chooseFile"
        ) ||
          "Choose File"}
      </button>

      <input
        ref={
          fileInputRef
        }
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.svg,.webp,.avif,image/jpeg,image/png,image/gif,image/svg+xml,image/webp,image/avif"
        onChange={
          handleFileChange
        }
        style={{
          display:
            "none",
        }}
        disabled={
          disabled
        }
      />

      {/* 삭제 */}
      <button
        type="button"
        onClick={
          onRemove
        }
        style={{
          background:
            "#f8d3d3",
          color: "#d33",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          padding:
            "7px 14px",
          cursor:
            disabled
              ? "not-allowed"
              : "pointer",
          boxShadow:
            "0 1px 5px #d33a",
          whiteSpace:
            "nowrap",
          opacity:
            disabled
              ? 0.6
              : 1,
        }}
        disabled={
          disabled
        }
      >
        {t("delete") ||
          "Delete"}
      </button>
    </div>
  );
}

export default CandidateInput;