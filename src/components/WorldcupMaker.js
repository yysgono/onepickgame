import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

import CandidateInput from "./CandidateInput";
import COLORS from "../styles/theme";
import {
  mainButtonStyle,
  grayButtonStyle,
} from "../styles/common";
import { addWorldcupGame } from "../utils/supabaseWorldcupApi";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { supabase } from "../utils/supabaseClient";
import useBanCheck from "../hooks/useBanCheck";
import { useTranslation } from "react-i18next";

const DEFAULT_THUMB_URL = "/default-thumb.png";

const MAX_UPLOAD = 50;
const MAX_CANDIDATES = 1024;

const IMAGE_MAX_INPUT_BYTES = 6 * 1024 * 1024;
const IMAGE_MAX_OUTPUT_BYTES = 1 * 1024 * 1024;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov)$/i;

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

function isMobile() {
  return (
    typeof window !== "undefined" &&
    window.innerWidth <= 700
  );
}

function isBlobUrl(value) {
  return (
    typeof value === "string" &&
    value.startsWith("blob:")
  );
}

function revokeBlobUrl(value) {
  if (isBlobUrl(value)) {
    URL.revokeObjectURL(value);
  }
}

function cleanCandidateName(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function isImageFile(file) {
  return (
    IMAGE_MIME_TYPES.has(file.type) ||
    IMAGE_EXTENSIONS.test(file.name)
  );
}

function isVideoFile(file) {
  return (
    VIDEO_MIME_TYPES.has(file.type) ||
    VIDEO_EXTENSIONS.test(file.name)
  );
}

/**
 * 이미지를 WebP로 압축합니다.
 *
 * 1차: Web Worker 사용
 * 2차: Web Worker 없이 재시도
 *
 * 두 번 모두 실패하면 에러를 발생시키며
 * 원본 파일은 업로드하지 않습니다.
 */
async function compressImageToWebp(file) {
  const compressionOptions = {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 1200,
    fileType: "image/webp",
    initialQuality: 0.8,
    alwaysKeepResolution: false,
  };

  let compressedBlob;

  try {
    compressedBlob = await imageCompression(file, {
      ...compressionOptions,
      useWebWorker: true,
    });
  } catch (workerError) {
    console.warn(
      "Web Worker 압축 실패. 일반 방식으로 재시도합니다:",
      file.name,
      workerError
    );

    compressedBlob = await imageCompression(file, {
      ...compressionOptions,
      useWebWorker: false,
    });
  }

  if (!compressedBlob || compressedBlob.size <= 0) {
    throw new Error("압축된 이미지가 비어 있습니다.");
  }

  const baseName =
    file.name.replace(/\.[^/.]+$/, "").trim() ||
    "image";

  const webpFile = new File(
    [compressedBlob],
    `${baseName}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );

  if (webpFile.type !== "image/webp") {
    throw new Error("WebP 변환에 실패했습니다.");
  }

  if (webpFile.size > IMAGE_MAX_OUTPUT_BYTES) {
    const sizeMB = (
      webpFile.size /
      1024 /
      1024
    ).toFixed(2);

    throw new Error(
      `압축 후 이미지가 1MB를 초과합니다: ${sizeMB}MB`
    );
  }

  return webpFile;
}

function WorldcupMaker({ onCreate, onCancel }) {
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [candidates, setCandidates] = useState([
    {
      id: uuidv4(),
      name: "",
      image: "",
      file: null,
    },
    {
      id: uuidv4(),
      name: "",
      image: "",
      file: null,
    },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const [dragActive, setDragActive] =
    useState(false);

  const mobile = isMobile();

  const fileInputRef = useRef(null);
  const candidatesRef = useRef(candidates);

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

 useEffect(() => {
  let mounted = true;

  async function fetchUser() {
    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!mounted) return;

      // 비회원
      if (!currentUser) {
        setUser(null);
        return;
      }

      // 회원이면 프로필까지 먼저 가져온 후 한 번에 표시
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        console.error(
          "프로필 조회 실패:",
          profileError
        );
      }

      if (!mounted) return;

      setNickname(profile?.nickname || "");
      setUser(currentUser);
    } catch (fetchError) {
      console.error(
        "사용자 정보 조회 실패:",
        fetchError
      );

      if (mounted) {
        setUser(null);
      }
    } finally {
      if (mounted) {
        setAuthChecked(true);
      }
    }
  }

  fetchUser();

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    return () => {
      candidatesRef.current.forEach(
        (candidate) => {
          revokeBlobUrl(candidate.image);
        }
      );
    };
  }, []);

  const { isBanned, banInfo } =
    useBanCheck(user);

  function addCandidate() {
    setCandidates((current) => {
      if (
        current.length >= MAX_CANDIDATES
      ) {
        alert(
          t("max_candidates", {
            count: MAX_CANDIDATES,
          }) ||
            `You can add up to ${MAX_CANDIDATES} candidates.`
        );

        return current;
      }

      return [
        ...current,
        {
          id: uuidv4(),
          name: "",
          image: "",
          file: null,
        },
      ];
    });
  }

  function updateCandidate(index, value) {
    setCandidates((current) =>
      current.map(
        (candidate, candidateIndex) => {
          if (candidateIndex !== index) {
            return candidate;
          }

          if (
            candidate.image !== value.image &&
            isBlobUrl(candidate.image)
          ) {
            revokeBlobUrl(candidate.image);
          }

          return value;
        }
      )
    );
  }

  function removeCandidate(index) {
    if (candidates.length <= 2) {
      return;
    }

    setCandidates((current) => {
      const candidateToRemove =
        current[index];

      revokeBlobUrl(
        candidateToRemove?.image
      );

      return current.filter(
        (_, candidateIndex) =>
          candidateIndex !== index
      );
    });
  }

  async function handleFiles(fileList) {
    const selectedFiles = Array.from(
      fileList || []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    if (
      selectedFiles.length > MAX_UPLOAD
    ) {
      alert(
        t("max_upload_files", {
          count: MAX_UPLOAD,
        }) ||
          `You can upload up to ${MAX_UPLOAD} files at once.`
      );

      return;
    }

    if (
      candidates.length +
        selectedFiles.length >
      MAX_CANDIDATES
    ) {
      alert(
        t("max_candidates", {
          count: MAX_CANDIDATES,
        }) ||
          `You can add up to ${MAX_CANDIDATES} candidates.`
      );

      return;
    }

    const processedCandidates = [];
    const rejectedFiles = [];

    for (const file of selectedFiles) {
      const image = isImageFile(file);
      const video = isVideoFile(file);

      if (!image && !video) {
        rejectedFiles.push(
          `${file.name}: ${
            t("unsupported_file_type") ||
            "Unsupported file type"
          }`
        );
        continue;
      }

      if (
        image &&
        file.size > IMAGE_MAX_INPUT_BYTES
      ) {
        rejectedFiles.push(
          `${file.name}: ${
            t("only_images_under_6mb") ||
            "Image exceeds 6MB"
          }`
        );
        continue;
      }

      if (
        video &&
        file.size > VIDEO_MAX_BYTES
      ) {
        rejectedFiles.push(
          `${file.name}: ${
            t("only_videos_under_20mb") ||
            "Video exceeds 20MB"
          }`
        );
        continue;
      }

      let finalFile = file;

      if (image) {
        try {
          finalFile =
            await compressImageToWebp(file);
        } catch (compressionError) {
          console.error(
            "이미지 압축 최종 실패:",
            file.name,
            compressionError
          );

          rejectedFiles.push(
            `${file.name}: ${
              t("image_compression_failed") ||
              "Image compression failed"
            }`
          );

          // 압축 실패 시 원본은 올리지 않습니다.
          continue;
        }
      }

      processedCandidates.push({
        id: uuidv4(),
        name: cleanCandidateName(
          file.name
        ),
        image:
          URL.createObjectURL(finalFile),
        file: finalFile,
      });
    }

    if (rejectedFiles.length > 0) {
      alert(
        `${
          t("some_files_not_added") ||
          "Some files could not be added."
        }\n\n${rejectedFiles.join("\n")}`
      );
    }

    if (
      processedCandidates.length === 0
    ) {
      return;
    }

    setCandidates((current) => {
      const updated = [...current];
      let processedIndex = 0;

      for (
        let index = 0;
        index < updated.length &&
        processedIndex <
          processedCandidates.length;
        index += 1
      ) {
        if (
          !updated[index].image &&
          !updated[index].name
        ) {
          revokeBlobUrl(
            updated[index].image
          );

          updated[index] =
            processedCandidates[
              processedIndex
            ];

          processedIndex += 1;
        }
      }

      while (
        processedIndex <
        processedCandidates.length
      ) {
        updated.push(
          processedCandidates[
            processedIndex
          ]
        );

        processedIndex += 1;
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
    } else if (
      event.type === "dragleave"
    ) {
      setDragActive(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (loading) {
      return;
    }

    const list = candidates
      .map((candidate) => ({
        ...candidate,
        name: String(
          candidate.name || ""
        ).trim(),
        image: String(
          candidate.image || ""
        ).trim(),
        id: candidate.id || uuidv4(),
      }))
      .filter(
        (candidate) => candidate.name
      );

    if (!title.trim()) {
      setError(
        t("enter_title") ||
          "Please enter a title."
      );
      return;
    }

    if (list.length < 2) {
      setError(
        t(
          "add_at_least_two_candidates"
        ) ||
          "Please add at least two candidates."
      );
      return;
    }

    const nameMap = {};

    list.forEach((candidate) => {
      const normalizedName =
        candidate.name.toLowerCase();

      if (!nameMap[normalizedName]) {
        nameMap[normalizedName] = [];
      }

      nameMap[normalizedName].push(
        candidate.name
      );
    });

    const duplicates = Object.values(
      nameMap
    ).filter(
      (names) => names.length > 1
    );

    if (duplicates.length > 0) {
      const duplicateNames = duplicates
        .map((names) => names[0])
        .join(", ");

      setError(
        t(
          "duplicate_candidate_names",
          {
            names: duplicateNames,
          }
        ) ||
          `Duplicate candidate names: ${duplicateNames}`
      );

      return;
    }

    setLoading(true);

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser?.id) {
        throw new Error(
          "No login info."
        );
      }

      const updatedList =
        await Promise.all(
          list.map(
            async (candidate) => {
              let imageUrl =
                candidate.image;

              if (candidate.file) {
                const fileIsImage =
                  candidate.file.type.startsWith(
                    "image/"
                  );

                const fileIsVideo =
                  candidate.file.type.startsWith(
                    "video/"
                  );

                if (
                  fileIsImage &&
                  candidate.file.type !==
                    "image/webp"
                ) {
                  throw new Error(
                    `${candidate.file.name}: WebP로 압축되지 않은 이미지입니다.`
                  );
                }

                if (
                  fileIsImage &&
                  candidate.file.size >
                    IMAGE_MAX_OUTPUT_BYTES
                ) {
                  throw new Error(
                    `${candidate.file.name}: 압축 후 이미지가 1MB를 초과합니다.`
                  );
                }

                if (
                  fileIsVideo &&
                  candidate.file.size >
                    VIDEO_MAX_BYTES
                ) {
                  throw new Error(
                    `${candidate.file.name}: 동영상이 20MB를 초과합니다.`
                  );
                }

                imageUrl =
                  await uploadCandidateImage(
                    candidate.file,
                    nickname ||
                      currentUser.id
                  );
              }

              if (!imageUrl) {
                imageUrl =
                  DEFAULT_THUMB_URL;
              }

              return {
                id: candidate.id,
                name: candidate.name,
                image: imageUrl,
              };
            }
          )
        );

      const newCup = {
        title: title.trim(),
        description: desc.trim(),
        data: updatedList,
        created_at:
          new Date().toISOString(),
        owner: currentUser.id,
        creator: currentUser.id,
      };

      const id =
        await addWorldcupGame(newCup);

      alert(
        t("worldcup_saved_id", {
          id,
        }) ||
          `Worldcup saved!\nID: ${id}`
      );

      if (onCreate) {
        onCreate({
          ...newCup,
          id,
        });
      }

      candidates.forEach(
        (candidate) => {
          revokeBlobUrl(
            candidate.image
          );
        }
      );

      setTitle("");
      setDesc("");

      setCandidates([
        {
          id: uuidv4(),
          name: "",
          image: "",
          file: null,
        },
        {
          id: uuidv4(),
          name: "",
          image: "",
          file: null,
        },
      ]);
    } catch (submitError) {
      console.error(
        "월드컵 저장 실패:",
        submitError
      );

      setError(
        submitError?.message ||
          t("save_failed_try_again") ||
          "Failed to save. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

if (!authChecked) {
  return (
    <div
      style={{
        minHeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      Loading...
    </div>
  );
}

if (!user) {
  const currentLang = (
    window.location.pathname.split("/")[1] || "en"
  ).toLowerCase();

  const guideUrl =
    currentLang === "ko"
      ? "/ko/blog/how-to-create-ideal-type-world-cup"
      : `/${currentLang}/blog/how-to-create-ideal-type-world-cup`;

  const loginUrl = `/${currentLang}/login`;

  return (
    <div
      style={{
        padding: mobile ? "40px 18px" : "60px 20px",
        textAlign: "center",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      {/* 만드는 방법 글 보기 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: mobile ? "24px 18px" : "30px",
          marginBottom: 28,
          boxShadow: "0 4px 20px #0002",
        }}
      >
        <h2
          style={{
            color: "#111827",
            marginTop: 0,
            marginBottom: 12,
            fontSize: mobile ? 22 : 27,
          }}
        >
          {currentLang === "ko"
            ? "이상형 월드컵 만드는 방법"
            : "How to Create a Worldcup"}
        </h2>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.7,
            marginBottom: 22,
          }}
        >
          {currentLang === "ko"
            ? "처음 만드는 분들을 위한 이상형 월드컵 만들기 가이드를 확인해보세요."
            : "Check out our guide to learn how to create your own Worldcup."}
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = guideUrl;
          }}
          style={{
            ...mainButtonStyle(mobile),
            padding: mobile ? "11px 20px" : "12px 28px",
            fontSize: mobile ? 15 : 17,
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {currentLang === "ko"
            ? "만드는 방법 보기"
            : "View Creation Guide"}
        </button>
      </div>

      {/* 로그인 안내 */}
      <h2
        style={{
          color: "#fff",
          fontSize: mobile ? 20 : 24,
          marginBottom: 20,
        }}
      >
        {t("login_required_create_worldcup") ||
          "Please log in to create a Worldcup."}
      </h2>

      {/* 로그인 버튼 */}
      <button
        type="button"
        onClick={() => {
          window.location.href = loginUrl;
        }}
        style={{
          ...mainButtonStyle(mobile),
          padding: mobile ? "11px 30px" : "13px 38px",
          fontSize: mobile ? 16 : 18,
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        {t("login") || "Login"}
      </button>
    </div>
  );
}

  if (isBanned) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: "#d33",
          fontWeight: 700,
        }}
      >
        🚫{" "}
        {t(
          "banned_from_creating_worldcups"
        ) ||
          "You are banned from creating Worldcups."}
        <br />

        {banInfo?.expires_at && (
          <div>
            {t("ban_expires_at") ||
              "Ban expires at"}
            :{" "}
            {banInfo.expires_at
              .replace("T", " ")
              .slice(0, 16)}
          </div>
        )}

        {banInfo?.reason && (
          <div>
            {t("ban_reason") ||
              "Reason"}
            : {banInfo.reason}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow:
          "0 4px 20px #0002",
        padding: mobile ? 18 : 30,
        position: "relative",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          marginBottom: 20,
          fontSize: mobile ? 22 : 27,
          letterSpacing: "-1px",
          color: COLORS.main,
        }}
      >
        {t("create_worldcup") ||
          "Create Worldcup"}
      </h2>

      {/* 월드컵 만들기 가이드 */}
      <div
        style={{
          background: "#f3f9ff",
          border: "1.5px solid #d3eafd",
          borderRadius: 12,
          padding: mobile ? "14px 14px" : "16px 18px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: mobile ? 15 : 16,
            fontWeight: 800,
            color: "#222",
            marginBottom: 6,
          }}
        >
          📘{" "}
          {t("worldcup_guide_title") ||
            "How to Create an Ideal Type World Cup"}
        </div>

        <div
          style={{
            fontSize: mobile ? 13 : 14,
            color: "#666",
            lineHeight: 1.5,
            marginBottom: 11,
          }}
        >
          {t("worldcup_guide_description") ||
            "Check out our guide to learn how to create your own World Cup."}
        </div>

        <button
          type="button"
          onClick={() => {
            const lang =
              window.location.pathname.split("/")[1] || "en";

            window.location.href =
              `/${lang}/blog/how-to-create-ideal-type-world-cup`;
          }}
          style={{
            background: "#fff",
            color: "#1976ed",
            border: "1.5px solid #1976ed",
            borderRadius: 8,
            padding: mobile ? "8px 15px" : "9px 18px",
            fontSize: mobile ? 13 : 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t("view_creation_guide") || "View Guide"} →
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);

            handleFiles(
              event.dataTransfer.files
            );
          }}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onClick={() =>
            fileInputRef.current?.click()
          }
          style={{
            border:
              "2.5px dashed #3caeff",
            borderRadius: 18,
            padding: mobile
              ? "38px 12px"
              : "46px 32px",
            marginBottom: 24,
            textAlign: "center",
            background: dragActive
              ? "#d3eafdcc"
              : "#f3f9ff",
            cursor: "pointer",
            fontSize: mobile ? 18 : 22,
            fontWeight: 700,
            color: "#1677ed",
            letterSpacing: "-0.5px",
            minHeight: mobile
              ? 90
              : 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition:
              "background 0.18s, border-color 0.18s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            multiple
            style={{
              display: "none",
            }}
            onChange={async (
              event
            ) => {
              await handleFiles(
                event.target.files
              );

              // 같은 파일을 다시 선택할 수 있도록 초기화
              event.target.value = "";
            }}
            disabled={loading}
          />

          <span>
            <span
              style={{
                fontSize: mobile
                  ? 20
                  : 26,
              }}
            >
              📁
            </span>

            <br />

            {t("drag_upload_detail") ||
              "Images up to 6MB are compressed to WebP. Videos up to 20MB. Max 50 files at once."}
          </span>
        </div>

        <input
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          placeholder={
            t("worldcup_title") ||
            "Worldcup Title"
          }
          maxLength={70}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border:
              "1.5px solid #bbb",
            fontSize: mobile ? 15 : 18,
            marginBottom: 16,
          }}
          disabled={loading}
        />

        <textarea
          value={desc}
          onChange={(event) =>
            setDesc(
              event.target.value
            )
          }
          placeholder={
            t(
              "description_optional"
            ) ||
            "Description (optional)"
          }
          maxLength={400}
          rows={2}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border:
              "1.5px solid #bbb",
            fontSize: mobile ? 13 : 15,
            marginBottom: 18,
          }}
          disabled={loading}
        />

        <div
          style={{
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            {t("candidates") ||
              "Candidates"}{" "}
            <span
              style={{
                color: "#888",
                fontWeight: 400,
                fontSize: mobile
                  ? 13
                  : 15,
              }}
            >
              ({candidates.length} /{" "}
              {MAX_CANDIDATES})
            </span>
          </div>

          {candidates.map(
            (candidate, index) => (
              <CandidateInput
                key={candidate.id}
                value={candidate}
                onChange={(value) =>
                  updateCandidate(
                    index,
                    value
                  )
                }
                onRemove={() =>
                  removeCandidate(
                    index
                  )
                }
                disabled={loading}
                minCandidates={
                  candidates.length <= 2
                }
              />
            )
          )}

          <button
            type="button"
            onClick={addCandidate}
            style={{
              ...mainButtonStyle(
                mobile
              ),
              fontSize: 15,
              padding: mobile
                ? "8px 16px"
                : "10px 22px",
              borderRadius: 8,
              marginTop: 6,
              width: mobile
                ? "100%"
                : undefined,
            }}
            disabled={
              loading ||
              candidates.length >=
                MAX_CANDIDATES
            }
          >
            +{" "}
            {t("add_candidate") ||
              "Add Candidate"}
          </button>
        </div>

        {error && (
          <div
            style={{
              color:
                COLORS.danger ||
                "#d33",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
          }}
        >
          <button
            type="submit"
            style={{
              ...mainButtonStyle(
                mobile
              ),
              fontSize: mobile
                ? 15
                : 17,
              borderRadius: 10,
              padding: mobile
                ? "11px 0"
                : "13px 0",
            }}
            disabled={loading}
          >
            {loading
              ? t("saving") ||
                "Saving..."
              : t("save") ||
                "Save"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              ...grayButtonStyle(
                mobile
              ),
              fontSize: mobile
                ? 15
                : 17,
              borderRadius: 10,
              padding: mobile
                ? "11px 0"
                : "13px 0",
            }}
            disabled={loading}
          >
            {t("cancel") ||
              "Cancel"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;