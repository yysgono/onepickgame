import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

import { updateWorldcupGame } from "../utils/supabaseWorldcupApi";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { supabase } from "../utils/supabaseClient";
import { useTranslation } from "react-i18next";

const COLORS = {
  main: "#1976ed",
  sub: "#45b7fa",
  danger: "#d33",
  gray: "#888",
};

const CATEGORY_OPTIONS = [
  { value: "person", labelKey: "category_person" },
  { value: "music", labelKey: "category_music" },
  { value: "game", labelKey: "category_game" },
  { value: "sports", labelKey: "category_sports" },
  { value: "anime_manga", labelKey: "category_anime_manga" },
  { value: "movie_drama", labelKey: "category_movie_drama" },
  { value: "food", labelKey: "category_food" },
  { value: "etc", labelKey: "category_etc" },
];

const CANDIDATE_BUCKET = "candidates";
const MAX_IMAGE_INPUT_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_OUTPUT_BYTES = 1 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|avif)$/i;
const VIDEO_EXTENSION_RE = /\.(mp4|webm|mov)$/i;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function getFileExtension(url = "", file = null) {
  if (file?.name) {
    return file.name.split(".").pop()?.toLowerCase() || "";
  }

  if (!url) return "";

  const cleanUrl = url.split("?")[0];
  const filename = cleanUrl.split("/").pop() || "";
  const parts = filename.split(".");

  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getYoutubeThumb(url = "") {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?(?:.*&)?v=))([\w-]{11})/
  );

  return match
    ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
    : null;
}

function isImageFile(file) {
  return (
    IMAGE_MIME_TYPES.has(file.type) ||
    IMAGE_EXTENSION_RE.test(file.name)
  );
}

function isVideoFile(file) {
  return (
    VIDEO_MIME_TYPES.has(file.type) ||
    VIDEO_EXTENSION_RE.test(file.name)
  );
}

function cleanCandidateName(filename = "") {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function sanitizeFileBaseName(value = "") {
  const cleaned = value
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "candidate";
}

/**
 * candidates 버킷의 공개 URL 또는 signed URL에서
 * 버킷 내부 경로만 추출합니다.
 */
function extractCandidateStoragePath(imageValue) {
  if (typeof imageValue !== "string") return null;

  const value = imageValue.trim();
  if (!value) return null;

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("/default-thumb")
  ) {
    return null;
  }

  const publicMatch = value.match(
    /\/storage\/v1\/object\/public\/candidates\/(.+?)(?:\?.*)?$/
  );

  const signedMatch = value.match(
    /\/storage\/v1\/object\/sign\/candidates\/(.+?)(?:\?.*)?$/
  );

  const encodedPath = publicMatch?.[1] || signedMatch?.[1];

  if (encodedPath) {
    try {
      // 실제 구조:
      // bucket = candidates
      // object name = candidates/admin/파일명
      return decodeURIComponent(encodedPath).replace(/^\/+/, "");
    } catch {
      return encodedPath.replace(/^\/+/, "");
    }
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value.replace(/^\/+/, "");
}

async function removeStoragePaths(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    console.log("[Storage 삭제] 삭제할 경로 없음");
    return [];
  }

  console.log("[Storage 삭제] 요청 경로:", uniquePaths);

  const { data, error } = await supabase.storage
    .from(CANDIDATE_BUCKET)
    .remove(uniquePaths);

  console.log("[Storage 삭제] 결과:", data);
  console.log("[Storage 삭제] 에러:", error);

  if (error) {
    throw new Error(
      `기존 Storage 파일 삭제 실패: ${error.message}`
    );
  }

  const removedPaths = new Set(
    (data || [])
      .map((item) => item?.name)
      .filter(Boolean)
  );

  const notConfirmed = uniquePaths.filter(
    (path) => !removedPaths.has(path)
  );

  if (notConfirmed.length > 0) {
    console.warn(
      "[Storage 삭제] 삭제 응답에서 확인되지 않은 경로:",
      notConfirmed
    );

    throw new Error(
      "기존 파일 삭제가 확인되지 않았습니다. Storage DELETE/SELECT 정책과 경로를 확인해 주세요."
    );
  }

  return data || [];
}

/**
 * 이미지 압축:
 * 1차 Web Worker 사용
 * 2차 Web Worker 없이 재시도
 * 두 번 모두 실패하면 원본을 업로드하지 않습니다.
 */
async function compressImageToWebp(file) {
  const options = {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 1200,
    fileType: "image/webp",
    initialQuality: 0.8,
    alwaysKeepResolution: false,
  };

  let compressedBlob;

  try {
    compressedBlob = await imageCompression(file, {
      ...options,
      useWebWorker: true,
    });
  } catch (workerError) {
    console.warn(
      "Web Worker 압축 실패. 일반 방식으로 재시도:",
      file.name,
      workerError
    );

    compressedBlob = await imageCompression(file, {
      ...options,
      useWebWorker: false,
    });
  }

  if (!compressedBlob || compressedBlob.size <= 0) {
    throw new Error("압축된 이미지가 비어 있습니다.");
  }

  const baseName =
    file.name.replace(/\.[^/.]+$/, "").trim() || "image";

  const webpFile = new File(
    [compressedBlob],
    `${baseName}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );

  if (webpFile.size > MAX_IMAGE_OUTPUT_BYTES) {
    throw new Error(
      `압축 후 이미지가 1MB를 초과합니다: ${(
        webpFile.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
  }

  return webpFile;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));

    reader.readAsDataURL(file);
  });
}

function EditWorldcupPage({
  worldcupList,
  fetchWorldcups,
  cupId,
  isAdmin,
}) {
const { t, i18n } = useTranslation();
 
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [originalCup, setOriginalCup] = useState(null);

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("");
const [data, setData] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        setUser(currentUser);

        if (!currentUser) return;

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", currentUser.id)
            .single();

        if (profileError) {
          console.error("프로필 조회 실패:", profileError);
        }

        setNickname(profile?.nickname || "");
      } catch (fetchError) {
        console.error("사용자 조회 실패:", fetchError);
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    const cup = (worldcupList || []).find(
      (item) => String(item.id) === String(cupId)
    );

setOriginalCup(cup || null);
setTitle(cup?.title || "");
setDescription(cup?.description || "");
setCategory(cup?.category || "etc")
setData(
      Array.isArray(cup?.data)
        ? cup.data.map((candidate) => ({
            ...candidate,
            id: candidate.id || uuidv4(),
          }))
        : []
    );
  }, [worldcupList, cupId]);

  function handleAddCandidate() {
    setData((current) => [
      ...current,
      {
        id: uuidv4(),
        name: "",
        image: "",
      },
    ]);
  }

  function handleDeleteCandidate(index) {
    setData((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function handleCandidateChange(index, key, value) {
    setData((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  async function processSelectedFile(file) {
    const image = isImageFile(file);
    const video = isVideoFile(file);

    if (!image && !video) {
      throw new Error(
        t("unsupported_file_type_detail") ||
          "지원하지 않는 파일 형식입니다. 이미지: JPG, PNG, WebP, AVIF / 동영상: MP4, WebM, MOV"
      );
    }

    if (image && file.size > MAX_IMAGE_INPUT_BYTES) {
      throw new Error(
        t("only_images_under_6mb") ||
          "이미지는 6MB 이하만 업로드할 수 있습니다."
      );
    }

    if (video && file.size > MAX_VIDEO_BYTES) {
      throw new Error(
        t("only_videos_under_20mb") ||
          "동영상은 20MB 이하만 업로드할 수 있습니다."
      );
    }

    if (image) {
      return compressImageToWebp(file);
    }

    return file;
  }

  async function handleFileChange(index, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const finalFile = await processSelectedFile(file);
      const dataUrl = await fileToDataUrl(finalFile);

      setData((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                image: dataUrl,
                pendingFileName: finalFile.name,
                pendingFileType: finalFile.type,
              }
            : item
        )
      );
    } catch (fileError) {
      console.error("파일 처리 실패:", fileError);
      alert(fileError.message || "파일 처리에 실패했습니다.");
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);

    if (files.length === 0) return;

    const candidatesToAdd = [];
    const rejected = [];

    for (const file of files) {
      try {
        const finalFile = await processSelectedFile(file);
        const dataUrl = await fileToDataUrl(finalFile);

        candidatesToAdd.push({
          id: uuidv4(),
          name: cleanCandidateName(file.name),
          image: dataUrl,
          pendingFileName: finalFile.name,
          pendingFileType: finalFile.type,
        });
      } catch (fileError) {
        console.error("파일 처리 실패:", file.name, fileError);
        rejected.push(`${file.name}: ${fileError.message}`);
      }
    }

    if (rejected.length > 0) {
      alert(
        `${
          t("some_files_not_added") ||
          "일부 파일을 추가하지 못했습니다."
        }\n\n${rejected.join("\n")}`
      );
    }

    if (candidatesToAdd.length === 0) return;

    setData((current) => {
      const updated = [...current];
      let addIndex = 0;

      for (
        let index = 0;
        index < updated.length &&
        addIndex < candidatesToAdd.length;
        index += 1
      ) {
        if (!updated[index].name && !updated[index].image) {
          updated[index] = candidatesToAdd[addIndex];
          addIndex += 1;
        }
      }

      while (addIndex < candidatesToAdd.length) {
        updated.push(candidatesToAdd[addIndex]);
        addIndex += 1;
      }

      return updated;
    });
  }

  function handleDrag(event) {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.type === "dragenter" ||
      event.type === "dragover"
    ) {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  }

  async function uploadPendingCandidateImage(item) {
    if (
      typeof item.image !== "string" ||
      !item.image.startsWith("data:")
    ) {
      return item.image?.trim() || "";
    }

    const response = await fetch(item.image);
    const blob = await response.blob();

    if (!blob || blob.size <= 0) {
      throw new Error(`${item.name}: 업로드할 파일이 비어 있습니다.`);
    }

    const isImage = blob.type.startsWith("image/");
    const isVideo = blob.type.startsWith("video/");

    if (isImage && blob.type !== "image/webp") {
      throw new Error(
        `${item.name}: WebP로 압축되지 않은 이미지입니다.`
      );
    }

    if (isImage && blob.size > MAX_IMAGE_OUTPUT_BYTES) {
      throw new Error(
        `${item.name}: 압축 이미지가 1MB를 초과합니다.`
      );
    }

    if (isVideo && blob.size > MAX_VIDEO_BYTES) {
      throw new Error(
        `${item.name}: 동영상이 20MB를 초과합니다.`
      );
    }

    const extension = isImage
      ? "webp"
      : getFileExtension(item.pendingFileName || "") ||
        (blob.type === "video/webm"
          ? "webm"
          : blob.type === "video/quicktime"
            ? "mov"
            : "mp4");

    const filename = `${sanitizeFileBaseName(
      item.name
    )}.${extension}`;

    return uploadCandidateImage(
      new File([blob], filename, {
        type: blob.type,
        lastModified: Date.now(),
      }),
      nickname || user.id
    );
  }

  function collectOldPathsToDelete(updatedData) {
    const originalCandidates = Array.isArray(originalCup?.data)
      ? originalCup.data
      : [];

    const updatedById = new Map(
      updatedData.map((item) => [String(item.id), item])
    );

    const paths = [];

    for (const originalItem of originalCandidates) {
      const oldPath = extractCandidateStoragePath(
        originalItem.image
      );

      if (!oldPath) continue;

      const updatedItem = updatedById.get(
        String(originalItem.id)
      );

      // 후보가 삭제된 경우
      if (!updatedItem) {
        paths.push(oldPath);
        continue;
      }

      // 같은 후보의 이미지가 교체된 경우
      if (
        String(updatedItem.image || "") !==
        String(originalItem.image || "")
      ) {
        paths.push(oldPath);
      }
    }

    return [...new Set(paths)];
  }

  async function handleSave() {
    setError("");

if (!title.trim()) {
  setError(
    t("edit_need_title") || "제목을 입력해 주세요."
  );
  return;
}

if (!category) {
  setError(
    t("select_category") ||
      "Please select a category."
  );
  return;
}

if (data.length < 2) {
      setError(
        t("edit_need_min_candidates") ||
          "후보를 최소 2개 이상 남겨 주세요."
      );
      return;
    }

    if (data.some((item) => !String(item.name || "").trim())) {
      setError(
        t("edit_need_all_names") ||
          "모든 후보의 이름을 입력해 주세요."
      );
      return;
    }

    const normalizedNames = new Map();

    for (const item of data) {
      const normalized = item.name.trim().toLowerCase();

      if (normalizedNames.has(normalized)) {
        setError(
          t("duplicate_candidate_names", {
            names: item.name.trim(),
          }) ||
            `중복된 후보 이름이 있습니다: ${item.name.trim()}`
        );
        return;
      }

      normalizedNames.set(normalized, true);
    }

    setLoading(true);

    const newlyUploadedPaths = [];
    let databaseUpdated = false;

    try {
      const updatedData = [];

      // 새 파일은 순서대로 업로드합니다.
      // Promise.all보다 느릴 수 있지만 모바일 메모리 폭증을 줄입니다.
      for (const item of data) {
        const oldImageValue = item.image;
        const imageUrl =
          await uploadPendingCandidateImage(item);

        if (
          typeof oldImageValue === "string" &&
          oldImageValue.startsWith("data:") &&
          imageUrl
        ) {
          const newPath =
            extractCandidateStoragePath(imageUrl);

          if (newPath) {
            newlyUploadedPaths.push(newPath);
          }
        }

        updatedData.push({
          id: item.id || uuidv4(),
          name: item.name.trim(),
          image: imageUrl,
        });
      }

const currentLang =
  (i18n.language || "en").split("-")[0];

const updatedCup = {
  ...originalCup,
  title: title.trim(),

  title_translations: {
    ...(originalCup?.title_translations || {}),
    [currentLang]: title.trim(),
  },

  description: description.trim(),
  category,
  data: updatedData,
};

      // 먼저 DB를 새 URL로 안전하게 갱신합니다.
      await updateWorldcupGame(
        originalCup.id,
        updatedCup
      );

      databaseUpdated = true;

      // DB 갱신 후에 삭제되거나 교체된 기존 파일을 정리합니다.
      const oldPathsToDelete =
        collectOldPathsToDelete(updatedData);

      console.log(
        "[월드컵 편집] 삭제 예정 기존 파일:",
        oldPathsToDelete
      );

      if (oldPathsToDelete.length > 0) {
        await removeStoragePaths(oldPathsToDelete);
      }

      if (fetchWorldcups) {
        await fetchWorldcups();
      }

      alert(
        t("edit_success") ||
          "월드컵 수정이 완료되었습니다."
      );

      navigate("/");
    } catch (saveError) {
      console.error("월드컵 수정 실패:", saveError);

      /*
       * DB 저장 전에 새 파일 업로드만 일부 성공했을 수 있으므로
       * 그 파일들을 정리해 고아 파일을 줄입니다.
       *
       * 단, DB 업데이트 뒤 기존 파일 삭제만 실패한 경우에는
       * 새 파일이 현재 DB에서 사용 중이므로 삭제하면 안 됩니다.
       * 이를 완벽히 구분하려면 별도의 서버 함수/트랜잭션이 필요합니다.
       * 현재는 DB 업데이트 성공 여부를 별도 플래그로 관리합니다.
       */
      if (!databaseUpdated && newlyUploadedPaths.length > 0) {
        try {
          await removeStoragePaths(newlyUploadedPaths);
        } catch (cleanupError) {
          console.error(
            "업로드 실패 파일 정리 실패:",
            cleanupError
          );
        }
      }

      setError(
        saveError?.message ||
          t("edit_fail") ||
          "월드컵 수정에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={{ padding: 80 }}>
        {t("need_login") || "로그인이 필요합니다."}
      </div>
    );
  }

  if (!originalCup) {
    return (
      <div style={{ padding: 80 }}>
        {t("not_found") || "월드컵을 찾을 수 없습니다."}
      </div>
    );
  }

  const hasPermission =
    isAdmin ||
    originalCup.creator === user.id ||
    originalCup.owner === user.id;

  if (!hasPermission) {
    return (
      <div style={{ padding: 80 }}>
        {t("edit_no_permission") ||
          "수정 권한이 없습니다."}
      </div>
    );
  }

  const mobile =
    typeof window !== "undefined" &&
    window.innerWidth < 700;

  return (
    <div
      style={{
        maxWidth: 700,
        margin: mobile ? "16px 2vw" : "44px auto",
        padding: mobile ? 12 : 36,
        background: "#fff",
        borderRadius: 20,
        boxShadow:
          "0 4px 32px #1976ed13, 0 1.5px 10px #0001",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: mobile ? 23 : 32,
          letterSpacing: -1,
          marginBottom: 32,
          color: COLORS.main,
        }}
      >
        {t("edit_worldcup") || "월드컵 수정"}
      </h2>

      <div style={{ marginBottom: 22 }}>
        <label
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: "#223",
          }}
        >
          {t("title") || "제목"}

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 9,
              border: `1.7px solid ${COLORS.main}33`,
              fontSize: 19,
              marginTop: 6,
              marginBottom: 4,
              boxSizing: "border-box",
              background: "#fafdff",
              outlineColor: COLORS.main,
            }}
            maxLength={80}
            placeholder={
              t("edit_title_placeholder") ||
              "제목을 입력하세요"
            }
            disabled={loading}
          />
        </label>
      </div>

      <div style={{ marginBottom: 26 }}>
        <label
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: "#223",
          }}
        >
          {t("description") || "설명"}

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 9,
              border: `1.7px solid ${COLORS.main}22`,
              fontSize: 16,
              marginTop: 6,
              resize: "vertical",
              minHeight: 36,
              background: "#fafdff",
              boxSizing: "border-box",
            }}
            rows={2}
            maxLength={400}
            placeholder={
              t("edit_description_placeholder") ||
              "설명을 입력하세요"
            }
            disabled={loading}
          />
        </label>
      </div>


      {/* 카테고리 */}
      <div style={{ marginBottom: 26 }}>
        <label
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: "#223",
            display: "block",
          }}
        >
         {t("category") || "Category"}{" "}
          <span style={{ color: COLORS.danger }}>*</span>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            disabled={loading}
style={{
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1.5px solid #bbb",
  fontSize: mobile ? 14 : 16,
  boxSizing: "border-box",
  background: "#fff",
  color: "#000",
  cursor: loading ? "default" : "pointer",
}}
          >
            <option value="">
              {t("select_category") ||
                "Please select a category"}
            </option>

{CATEGORY_OPTIONS.map((item) => (
  <option
    key={item.value}
    value={item.value}
  >
    {t(item.labelKey)}
  </option>
))}
          </select>
        </label>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "2px solid #e7f3fd",
          margin: "22px 0 20px",
        }}
      />

      <div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 19,
            margin: "12px 0 18px",
            color: COLORS.main,
          }}
        >
          {t("candidate_list") || "후보 목록"}{" "}
          <span
            style={{
              color: COLORS.gray,
              fontSize: 14,
            }}
          >
            ({data.length}
            {t("count_unit") || "개"})
          </span>
        </div>

        <div
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleFiles(event.dataTransfer.files);
          }}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onClick={() =>
            fileInputRef.current?.click()
          }
          style={{
            border: "2.5px dashed #3caeff",
            borderRadius: 18,
            padding: mobile
              ? "24px 6px"
              : "30px 14px",
            marginBottom: 20,
            textAlign: "center",
            background: dragActive
              ? "#d3eafdcc"
              : "#f3f9ff",
            cursor: "pointer",
            fontSize: mobile ? 16 : 20,
            fontWeight: 700,
            color: "#1676ed",
            minHeight: mobile ? 40 : 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            multiple
            style={{ display: "none" }}
            onChange={async (event) => {
              await handleFiles(event.target.files);
              event.target.value = "";
            }}
            disabled={loading}
          />

          <span>
            <span
              style={{
                fontSize: mobile ? 18 : 23,
              }}
            >
              📁
            </span>
            <br />
            {t("drag_upload_detail") ||
              "이미지는 WebP로 압축됩니다. 이미지 6MB 이하, 동영상 20MB 이하."}
          </span>
        </div>

        {data.map((item, index) => {
          const extension = getFileExtension(item.image);
          const youtubeThumb = getYoutubeThumb(item.image);
          const thumb = youtubeThumb || item.image;

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: 11,
                alignItems: "center",
                marginBottom: 13,
                padding: "10px 9px",
                borderRadius: 12,
                background: "#fafdff",
                boxShadow: "0 1.5px 8px #1976ed11",
                flexWrap: mobile ? "wrap" : "nowrap",
              }}
            >
              <input
                value={item.name}
                onChange={(event) =>
                  handleCandidateChange(
                    index,
                    "name",
                    event.target.value
                  )
                }
                placeholder={t("name") || "이름"}
                style={{
                  width: mobile ? 78 : 120,
                  minWidth: 50,
                  padding: 9,
                  borderRadius: 8,
                  border: "1.3px solid #bbb",
                  fontSize: 16,
                }}
                maxLength={30}
                disabled={loading}
              />

              <input
                value={item.image}
                onChange={(event) =>
                  handleCandidateChange(
                    index,
                    "image",
                    event.target.value
                  )
                }
                placeholder={
                  t("imageUrlOrYoutube") ||
                  "이미지·동영상 URL 또는 YouTube"
                }
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: 9,
                  borderRadius: 8,
                  border: "1.3px solid #bbb",
                  fontSize: 15,
                  background: "#fafdff",
                }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById(`file-${index}`)
                    ?.click()
                }
                style={{
                  background: COLORS.main,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
                disabled={loading}
              >
                {t("choose_file") || "파일"}
              </button>

              <input
                id={`file-${index}`}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                style={{ display: "none" }}
                onChange={(event) =>
                  handleFileChange(index, event)
                }
                disabled={loading}
              />

              {thumb &&
              !["mp4", "webm", "mov"].includes(extension) ? (
                <img
                  src={thumb}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                  style={{
                    width: mobile ? 32 : 44,
                    height: mobile ? 32 : 44,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#f2f2f2",
                    boxShadow: "0 2px 8px #0001",
                    border: "1.2px solid #eee",
                  }}
                />
              ) : null}

              <button
                type="button"
                onClick={() =>
                  handleDeleteCandidate(index)
                }
                style={{
                  background: COLORS.danger,
                  border: "none",
                  borderRadius: 7,
                  color: "#fff",
                  fontWeight: 700,
                  padding: "9px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
                disabled={loading || data.length <= 2}
              >
                {t("delete") || "삭제"}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddCandidate}
          style={{
            marginTop: 12,
            background: COLORS.main,
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "11px 24px",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {t("add_candidate") || "후보 추가"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: COLORS.danger,
            marginTop: 17,
            fontWeight: 700,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 38,
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          style={{
            background: COLORS.main,
            color: "#fff",
            fontWeight: 900,
            border: "none",
            borderRadius: 13,
            fontSize: 22,
            padding: "14px 54px",
            marginRight: 12,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading
            ? t("saving") || "저장 중..."
            : t("save") || "저장"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "#e7f3fd",
            color: "#1976ed",
            fontWeight: 800,
            border: "none",
            borderRadius: 11,
            fontSize: 18,
            padding: "13px 34px",
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {t("cancel") || "취소"}
        </button>
      </div>
    </div>
  );
}

export default EditWorldcupPage;