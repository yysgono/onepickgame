// src/components/WorldcupMaker.js

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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

const DEFAULT_THUMB_URL =
  "/default-thumb.png";

const MAX_UPLOAD = 50;
const MAX_CANDIDATES = 1024;

const CATEGORY_OPTIONS = [
  { value: "person", label: "People" },
  { value: "music", label: "Music" },
  { value: "game", label: "Games" },
  { value: "sports", label: "Sports" },
  { value: "anime_manga", label: "Anime / Manga" },
  { value: "movie_drama", label: "Movies / TV" },
  { value: "food", label: "Food" },
  { value: "etc", label: "Other" },
];

// 업로드 전 원본 이미지 최대 크기
const IMAGE_MAX_INPUT_BYTES =
  6 * 1024 * 1024;

// 실제 Supabase에 저장될 이미지 최대 크기
const IMAGE_MAX_OUTPUT_BYTES =
  1 * 1024 * 1024;


/*
 * 지원 이미지
 *
 * 일반 이미지:
 * jpg / jpeg / png / webp / avif
 *
 * SVG:
 * 업로드할 때 그대로 저장하지 않고
 * WebP로 변환한 후 저장
 */
const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|webp|avif|svg)$/i;



const IMAGE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/svg+xml",
  ]);


function isMobile() {
  return (
    typeof window !==
      "undefined" &&
    window.innerWidth <= 700
  );
}

function isBlobUrl(value) {
  return (
    typeof value ===
      "string" &&
    value.startsWith("blob:")
  );
}

function revokeBlobUrl(value) {
  if (isBlobUrl(value)) {
    URL.revokeObjectURL(
      value
    );
  }
}

// 후보명은 파일명에서 확장자 제거
function cleanCandidateName(
  filename
) {
  return String(filename || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function isImageFile(file) {
  if (!file) {
    return false;
  }

  return (
    IMAGE_MIME_TYPES.has(
      file.type
    ) ||
    IMAGE_EXTENSIONS.test(
      file.name || ""
    )
  );
}

function isSvgFile(file) {
  if (!file) {
    return false;
  }

  return (
    file.type ===
      "image/svg+xml" ||
    /\.svg$/i.test(
      file.name || ""
    )
  );
}

/*
 * =====================================================
 * SVG → WebP 변환
 * =====================================================
 *
 * SVG 원본을 Supabase에 그대로 저장하지 않고
 * 브라우저에서 먼저 렌더링한 뒤 WebP 파일로 변환한다.
 *
 * 장점:
 * - SVG 스크립트/외부 동작 제거
 * - 기존 이미지 처리 방식과 통일
 * - Storage에는 WebP만 저장
 * - 최대 1200px
 * - 최대 1MB
 */
async function convertSvgToWebp(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(file);

      const img =
        new window.Image();

      img.onload = () => {
        try {
          let width =
            img.naturalWidth ||
            img.width ||
            1200;

          let height =
            img.naturalHeight ||
            img.height ||
            1200;

          /*
           * width / height가 없는 SVG도 있을 수 있으므로
           * 비정상 값 방어
           */
          if (
            !Number.isFinite(
              width
            ) ||
            width <= 0
          ) {
            width = 1200;
          }

          if (
            !Number.isFinite(
              height
            ) ||
            height <= 0
          ) {
            height = 1200;
          }

          const MAX_SIZE = 1200;

          if (
            width > MAX_SIZE ||
            height > MAX_SIZE
          ) {
            const ratio =
              Math.min(
                MAX_SIZE /
                  width,
                MAX_SIZE /
                  height
              );

            width =
              Math.max(
                1,
                Math.round(
                  width * ratio
                )
              );

            height =
              Math.max(
                1,
                Math.round(
                  height * ratio
                )
              );
          }

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          if (!ctx) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              new Error(
                "Canvas를 생성할 수 없습니다."
              )
            );

            return;
          }

          /*
           * 투명 배경 유지
           */
          ctx.clearRect(
            0,
            0,
            width,
            height
          );

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(
                objectUrl
              );

              if (!blob) {
                reject(
                  new Error(
                    "SVG → WebP 변환에 실패했습니다."
                  )
                );

                return;
              }

              const baseName =
                String(
                  file.name ||
                    "image"
                )
                  .replace(
                    /\.[^/.]+$/,
                    ""
                  )
                  .trim() ||
                "image";

              const webpFile =
                new File(
                  [blob],
                  `${baseName}.webp`,
                  {
                    type:
                      "image/webp",

                    lastModified:
                      Date.now(),
                  }
                );

              if (
                webpFile.size >
                IMAGE_MAX_OUTPUT_BYTES
              ) {
                const sizeMB =
                  (
                    webpFile.size /
                    1024 /
                    1024
                  ).toFixed(2);

                reject(
                  new Error(
                    `SVG 변환 후 이미지가 1MB를 초과합니다: ${sizeMB}MB`
                  )
                );

                return;
              }

              resolve(
                webpFile
              );
            },

            "image/webp",

            0.8
          );
        } catch (
          error
        ) {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "SVG 파일을 불러올 수 없습니다."
          )
        );
      };

      img.src =
        objectUrl;
    }
  );
}

/*
 * =====================================================
 * 일반 이미지 → WebP 압축
 * =====================================================
 *
 * 기존 방식 유지.
 *
 * 1차 Web Worker
 * 2차 일반 방식
 * 최종 WebP 1MB 이하
 */
async function compressImageToWebp(
  file
) {
  const compressionOptions =
    {
      maxSizeMB: 0.7,

      maxWidthOrHeight:
        1200,

      fileType:
        "image/webp",

      initialQuality:
        0.8,

      alwaysKeepResolution:
        false,
    };

  let compressedBlob;

  try {
    compressedBlob =
      await imageCompression(
        file,
        {
          ...compressionOptions,

          useWebWorker:
            true,
        }
      );
  } catch (
    workerError
  ) {
    console.warn(
      "Web Worker 압축 실패. 일반 방식으로 재시도합니다:",
      file.name,
      workerError
    );

    compressedBlob =
      await imageCompression(
        file,
        {
          ...compressionOptions,

          useWebWorker:
            false,
        }
      );
  }

  if (
    !compressedBlob ||
    compressedBlob.size <= 0
  ) {
    throw new Error(
      "압축된 이미지가 비어 있습니다."
    );
  }

  const baseName =
    String(
      file.name || "image"
    )
      .replace(
        /\.[^/.]+$/,
        ""
      )
      .trim() ||
    "image";

  const webpFile =
    new File(
      [compressedBlob],
      `${baseName}.webp`,
      {
        type:
          "image/webp",

        lastModified:
          Date.now(),
      }
    );

  if (
    webpFile.type !==
    "image/webp"
  ) {
    throw new Error(
      "WebP 변환에 실패했습니다."
    );
  }

  if (
    webpFile.size >
    IMAGE_MAX_OUTPUT_BYTES
  ) {
    const sizeMB =
      (
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

/*
 * =====================================================
 * 모든 이미지 최종 정규화
 * =====================================================
 *
 * SVG
 *   → SVG 전용 canvas 변환
 *   → WebP
 *
 * 기존 WebP
 *   → 이미 1MB 이하라면 그대로 사용
 *
 * JPG / PNG / AVIF 등
 *   → browser-image-compression
 *   → WebP
 */
async function normalizeImageFile(
  file
) {
  if (!file) {
    throw new Error(
      "이미지 파일이 없습니다."
    );
  }

  if (isSvgFile(file)) {
    return (
      await convertSvgToWebp(
        file
      )
    );
  }

  /*
   * 이미 WebP이고
   * 최종 제한인 1MB 이하면
   * 다시 압축하지 않는다.
   */
  if (
    file.type ===
      "image/webp" &&
    file.size <=
      IMAGE_MAX_OUTPUT_BYTES
  ) {
    return file;
  }

  return (
    await compressImageToWebp(
      file
    )
  );
}

function WorldcupMaker({
  onCreate,
  onCancel,
}) {
  const { t } =
    useTranslation();

const [
  title,
  setTitle,
] = useState("");

const [
  desc,
  setDesc,
] = useState("");

const [
  category,
  setCategory,
] = useState("etc");

const [
  candidates,
    setCandidates,
  ] = useState([
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

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    nickname,
    setNickname,
  ] = useState("");

  const [
    authChecked,
    setAuthChecked,
  ] = useState(false);

  const [
    dragActive,
    setDragActive,
  ] = useState(false);

  const mobile =
    isMobile();

  const fileInputRef =
    useRef(null);

  const candidatesRef =
    useRef(candidates);
      useEffect(() => {
    candidatesRef.current =
      candidates;
  }, [candidates]);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const {
          data: {
            user: currentUser,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!mounted) {
          return;
        }

        // 비회원
        if (!currentUser) {
          setUser(null);
          return;
        }

        // 회원이면 프로필까지 가져오기
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("nickname")
          .eq(
            "id",
            currentUser.id
          )
          .single();

        if (profileError) {
          console.error(
            "프로필 조회 실패:",
            profileError
          );
        }

        if (!mounted) {
          return;
        }

        setNickname(
          profile?.nickname ||
            ""
        );

        setUser(
          currentUser
        );
      } catch (
        fetchError
      ) {
        console.error(
          "사용자 정보 조회 실패:",
          fetchError
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthChecked(
            true
          );
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
          revokeBlobUrl(
            candidate.image
          );
        }
      );
    };
  }, []);

  const {
    isBanned,
    banInfo,
  } = useBanCheck(user);

function addCandidate() {
  setCandidates((current) => {
    // 앞으로 추가할 수 있는 남은 개수
    const remaining =
      MAX_CANDIDATES - current.length;

    if (remaining <= 0) {
      alert(
        t("max_candidates", {
          count: MAX_CANDIDATES,
        }) ||
          `You can add up to ${MAX_CANDIDATES} candidates.`
      );

      return current;
    }

    // 기본 10개 추가
    // 최대 개수에 가까우면 남은 개수만 추가
    const addCount = Math.min(10, remaining);

    const newCandidates = Array.from(
      { length: addCount },
      () => ({
        id: uuidv4(),
        name: "",
        image: "",
        file: null,
      })
    );

    return [
      ...current,
      ...newCandidates,
    ];
  });
}

  function updateCandidate(
    index,
    value
  ) {
    setCandidates(
      (current) =>
        current.map(
          (
            candidate,
            candidateIndex
          ) => {
            if (
              candidateIndex !==
              index
            ) {
              return candidate;
            }

            if (
              candidate.image !==
                value.image &&
              isBlobUrl(
                candidate.image
              )
            ) {
              revokeBlobUrl(
                candidate.image
              );
            }

            return value;
          }
        )
    );
  }

  function removeCandidate(
    index
  ) {
    if (
      candidates.length <= 2
    ) {
      return;
    }

    setCandidates(
      (current) => {
        const candidateToRemove =
          current[index];

        revokeBlobUrl(
          candidateToRemove?.image
        );

        return current.filter(
          (
            _,
            candidateIndex
          ) =>
            candidateIndex !==
            index
        );
      }
    );
  }

  /*
   * =====================================================
   * 다중 파일 업로드
   * =====================================================
   *
   * 이미지:
   *   JPG / PNG / AVIF / WebP / SVG
   *   → normalizeImageFile()
   *   → 최종 WebP
   *
   */
  async function handleFiles(
    fileList
  ) {
    const selectedFiles =
      Array.from(
        fileList || []
      );

    if (
      selectedFiles.length ===
      0
    ) {
      return;
    }

    if (
      selectedFiles.length >
      MAX_UPLOAD
    ) {
      alert(
        t(
          "max_upload_files",
          {
            count:
              MAX_UPLOAD,
          }
        ) ||
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
        t(
          "max_candidates",
          {
            count:
              MAX_CANDIDATES,
          }
        ) ||
          `You can add up to ${MAX_CANDIDATES} candidates.`
      );

      return;
    }

    const processedCandidates =
      [];

    const rejectedFiles =
      [];

    for (
      const file of
      selectedFiles
    ) {
const image = isImageFile(file);

if (!image) {
  rejectedFiles.push(
    `${file.name}: ${
      t("only_image_file") ||
      "Only image files can be uploaded. Local video uploads are not supported."
    }`
  );

  continue;
} 

      // 원본 이미지 최대 6MB
      if (
        image &&
        file.size >
          IMAGE_MAX_INPUT_BYTES
      ) {
        rejectedFiles.push(
          `${file.name}: ${
            t(
              "only_images_under_6mb"
            ) ||
            "Image exceeds 6MB"
          }`
        );

        continue;
      }

      let finalFile =
        file;

      // 이미지면 무조건 최종 WebP 정규화
      if (image) {
        try {
          finalFile =
            await normalizeImageFile(
              file
            );
        } catch (
          compressionError
        ) {
          console.error(
            "이미지 변환/압축 최종 실패:",
            file.name,
            compressionError
          );

          rejectedFiles.push(
            `${file.name}: ${
              compressionError?.message ||
              t(
                "image_compression_failed"
              ) ||
              "Image compression failed"
            }`
          );

          continue;
        }
      }

      processedCandidates.push(
        {
          id: uuidv4(),

          name:
            cleanCandidateName(
              file.name
            ),

          image:
            URL.createObjectURL(
              finalFile
            ),

          file:
            finalFile,
        }
      );
    }

    if (
      rejectedFiles.length >
      0
    ) {
      alert(
        `${
          t(
            "some_files_not_added"
          ) ||
          "Some files could not be added."
        }\n\n${rejectedFiles.join(
          "\n"
        )}`
      );
    }

    if (
      processedCandidates.length ===
      0
    ) {
      return;
    }

    setCandidates(
      (current) => {
        const updated = [
          ...current,
        ];

        let processedIndex =
          0;

        /*
         * 비어 있는 기존 후보 슬롯부터 채움
         */
        for (
          let index = 0;
          index <
            updated.length &&
          processedIndex <
            processedCandidates.length;
          index += 1
        ) {
          if (
            !updated[index]
              .image &&
            !updated[index]
              .name
          ) {
            revokeBlobUrl(
              updated[index]
                .image
            );

            updated[index] =
              processedCandidates[
                processedIndex
              ];

            processedIndex +=
              1;
          }
        }

        /*
         * 남은 파일은 후보 배열 뒤에 추가
         */
        while (
          processedIndex <
          processedCandidates.length
        ) {
          updated.push(
            processedCandidates[
              processedIndex
            ]
          );

          processedIndex +=
            1;
        }

        return updated;
      }
    );
  }

  function handleDrag(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.type ===
        "dragenter" ||
      event.type ===
        "dragover"
    ) {
      setDragActive(true);
    } else if (
      event.type ===
      "dragleave"
    ) {
      setDragActive(false);
    }
  }
    async function handleSubmit(
    event
  ) {
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

    id:
      candidate.id ||
      uuidv4(),
  }))

  // 이름 / 이미지 / 파일이 전부 없는 완전 빈칸은 자동 제외
  .filter((candidate) => {
    const hasName =
      Boolean(candidate.name);

    const hasImage =
      Boolean(candidate.image);

    const hasFile =
      candidate.file instanceof File;

    return (
      hasName ||
      hasImage ||
      hasFile
    );
  });


// 뭔가 입력한 후보인데 이름만 없는 경우만 차단
const candidateWithoutName =
  list.find(
    (candidate) =>
      !candidate.name
  );

if (candidateWithoutName) {
  setError(
    t("candidate_name_required") ||
      "Please enter a name for each candidate you use."
  );

  return;
}

// 제목 필수
if (!title.trim()) {
  setError(
    t("enter_title") ||
      "Please enter a title."
  );

  return;
}


// 후보 최소 2명
    if (
      list.length < 2
    ) {
      setError(
        t(
          "add_at_least_two_candidates"
        ) ||
          "Please add at least two candidates."
      );

      return;
    }

    // 후보 이름 중복 검사
    const nameMap = {};

    list.forEach(
      (candidate) => {
        const normalizedName =
          candidate.name.toLowerCase();

        if (
          !nameMap[
            normalizedName
          ]
        ) {
          nameMap[
            normalizedName
          ] = [];
        }

        nameMap[
          normalizedName
        ].push(
          candidate.name
        );
      }
    );

    const duplicates =
      Object.values(
        nameMap
      ).filter(
        (names) =>
          names.length > 1
      );

    if (
      duplicates.length > 0
    ) {
      const duplicateNames =
        duplicates
          .map(
            (names) =>
              names[0]
          )
          .join(", ");

      setError(
        t(
          "duplicate_candidate_names",
          {
            names:
              duplicateNames,
          }
        ) ||
          `Duplicate candidate names: ${duplicateNames}`
      );

      return;
    }

    setLoading(true);

    try {
      // 로그인 사용자 확인
      const {
        data: {
          user:
            currentUser,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (
        !currentUser?.id
      ) {
        throw new Error(
          "No login info."
        );
      }

      /*
       * =====================================================
             * =====================================================
       *
       * CandidateInput에서 개별 선택한 이미지도
       * 여기서 최종적으로 normalizeImageFile()을 거친다.
       *
       * 결과:
       * - SVG → WebP
       * - JPG → WebP
       * - PNG → WebP
       * - AVIF → WebP
       * - WebP ≤1MB → 그대로
          */
      const updatedList =
        await Promise.all(
          list.map(
            async (
              candidate
            ) => {
              let imageUrl =
                candidate.image;

              if (
                candidate.file
              ) {
                let uploadFile =
                  candidate.file;

               const fileIsImage =
  isImageFile(uploadFile);

if (!fileIsImage) {
  throw new Error(
    `${uploadFile.name}: 이미지 파일만 업로드할 수 있습니다.`
  );
}

                /*
                 * 이미지 원본 6MB 제한
                 *
                 * CandidateInput에서도 검사하지만
                 * 저장 직전에 한 번 더 검증
                 */
                if (
                  fileIsImage &&
                  uploadFile.size >
                    IMAGE_MAX_INPUT_BYTES
                ) {
                  const sizeMB =
                    (
                      uploadFile.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    );

                  throw new Error(
                    `${uploadFile.name}: 이미지가 6MB를 초과합니다. (${sizeMB}MB)`
                  );
                }

                /*
                 * 이미지면 최종 WebP 정규화
                 */
                if (
                  fileIsImage
                ) {
                  try {
                    uploadFile =
                      await normalizeImageFile(
                        uploadFile
                      );
                  } catch (
                    normalizeError
                  ) {
                    console.error(
                      "최종 이미지 변환 실패:",
                      candidate.file
                        ?.name,
                      normalizeError
                    );

                    throw new Error(
                      `${
                        candidate.file
                          ?.name ||
                        "image"
                      }: ${
                        normalizeError
                          ?.message ||
                        "이미지 변환에 실패했습니다."
                      }`
                    );
                  }
                }

                /*
                 * 이미지면 최종 파일은 반드시 WebP
                 */
                if (
                  fileIsImage &&
                  uploadFile.type !==
                    "image/webp"
                ) {
                  throw new Error(
                    `${uploadFile.name}: WebP 변환에 실패했습니다.`
                  );
                }

                /*
                 * 최종 이미지 1MB 제한
                 */
                if (
                  fileIsImage &&
                  uploadFile.size >
                    IMAGE_MAX_OUTPUT_BYTES
                ) {
                  const sizeMB =
                    (
                      uploadFile.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    );

                  throw new Error(
                    `${uploadFile.name}: 압축 후 이미지가 1MB를 초과합니다. (${sizeMB}MB)`
                  );
                }

                               /*
                 * Supabase Storage 업로드
                 */
                imageUrl =
                  await uploadCandidateImage(
                    uploadFile,

                    nickname ||
                      currentUser.id
                  );
              }

              // 이미지 URL도 파일도 없으면 기본 썸네일
              if (
                !imageUrl
              ) {
                imageUrl =
                  DEFAULT_THUMB_URL;
              }

              return {
                id:
                  candidate.id,

                name:
                  candidate.name,

                image:
                  imageUrl,
              };
            }
          )
        );

      /*
       * =====================================================
       * 새 월드컵 저장
       * =====================================================
       */
const newCup = {
  title:
    title.trim(),

  description:
    desc.trim(),

  category:
    category,

  data:
    updatedList,

  created_at:
    new Date().toISOString(),

  owner:
    currentUser.id,

  creator:
    currentUser.id,
};

      const id =
        await addWorldcupGame(
          newCup
        );

      alert(
        t(
          "worldcup_saved_id",
          {
            id,
          }
        ) ||
          `Worldcup saved!\nID: ${id}`
      );

      if (onCreate) {
        onCreate({
          ...newCup,
          id,
        });
      }

      /*
       * 기존 blob URL 정리
       */
      candidates.forEach(
        (
          candidate
        ) => {
          revokeBlobUrl(
            candidate.image
          );
        }
      );

      /*
       * 폼 초기화
       */
setTitle("");
setDesc("");
setCategory("etc");

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
    } catch (
      submitError
    ) {
      console.error(
        "월드컵 저장 실패:",
        submitError
      );

      setError(
        submitError
          ?.message ||
          t(
            "save_failed_try_again"
          ) ||
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
    const currentLang =
      (
        window.location.pathname.split(
          "/"
        )[1] || "en"
      ).toLowerCase();

    const guideUrl =
      currentLang === "ko"
        ? "/ko/blog/how-to-create-ideal-type-world-cup"
        : `/${currentLang}/blog/how-to-create-ideal-type-world-cup`;

    const loginUrl =
      `/${currentLang}/login`;

    return (
      <div
        style={{
          padding: mobile
            ? "40px 18px"
            : "60px 20px",

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

            padding: mobile
              ? "24px 18px"
              : "30px",

            marginBottom: 28,

            boxShadow:
              "0 4px 20px #0002",
          }}
        >
          <h2
            style={{
              color: "#111827",

              marginTop: 0,

              marginBottom: 12,

              fontSize: mobile
                ? 22
                : 27,
            }}
          >
            {currentLang ===
            "ko"
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
            {currentLang ===
            "ko"
              ? "처음 만드는 분들을 위한 이상형 월드컵 만들기 가이드를 확인해보세요."
              : "Check out our guide to learn how to create your own Worldcup."}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                guideUrl;
            }}
            style={{
              ...mainButtonStyle(
                mobile
              ),

              padding: mobile
                ? "11px 20px"
                : "12px 28px",

              fontSize: mobile
                ? 15
                : 17,

              borderRadius: 10,

              cursor: "pointer",
            }}
          >
            {currentLang ===
            "ko"
              ? "만드는 방법 보기"
              : "View Creation Guide"}
          </button>
        </div>

        {/* 로그인 안내 */}
        <h2
          style={{
            color: "#fff",

            fontSize: mobile
              ? 20
              : 24,

            marginBottom: 20,
          }}
        >
          {t(
            "login_required_create_worldcup"
          ) ||
            "Please log in to create a Worldcup."}
        </h2>

        {/* 로그인 버튼 */}
        <button
          type="button"
          onClick={() => {
            window.location.href =
              loginUrl;
          }}
          style={{
            ...mainButtonStyle(
              mobile
            ),

            padding: mobile
              ? "11px 30px"
              : "13px 38px",

            fontSize: mobile
              ? 16
              : 18,

            borderRadius: 10,

            cursor: "pointer",
          }}
        >
          {t("login") ||
            "Login"}
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
            {t(
              "ban_expires_at"
            ) ||
              "Ban expires at"}
            :{" "}
            {banInfo.expires_at
              .replace(
                "T",
                " "
              )
              .slice(
                0,
                16
              )}
          </div>
        )}

        {banInfo?.reason && (
          <div>
            {t(
              "ban_reason"
            ) ||
              "Reason"}
            :{" "}
            {banInfo.reason}
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

  color: "#000",

  borderRadius: 18,

  boxShadow:
    "0 4px 20px #0002",

  padding: mobile
    ? 18
    : 30,

  position: "relative",
}}
    >
      <h2
        style={{
          textAlign: "center",

          fontWeight: 800,

          marginBottom: 20,

          fontSize: mobile
            ? 22
            : 27,

          letterSpacing: "-1px",

          color: COLORS.main,
        }}
      >
        {t(
          "create_worldcup"
        ) ||
          "Create Worldcup"}
      </h2>

      {/* 월드컵 만들기 가이드 */}
      <div
        style={{
          background: "#f3f9ff",

          border:
            "1.5px solid #d3eafd",

          borderRadius: 12,

          padding: mobile
            ? "14px 14px"
            : "16px 18px",

          marginBottom: 20,

          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: mobile
              ? 15
              : 16,

            fontWeight: 800,

            color: "#222",

            marginBottom: 6,
          }}
        >
          📘{" "}
          {t(
            "worldcup_guide_title"
          ) ||
            "How to Create an Ideal Type World Cup"}
        </div>

        <div
          style={{
            fontSize: mobile
              ? 13
              : 14,

            color: "#666",

            lineHeight: 1.5,

            marginBottom: 11,
          }}
        >
          {t(
            "worldcup_guide_description"
          ) ||
            "Check out our guide to learn how to create your own World Cup."}
        </div>

        <button
          type="button"
          onClick={() => {
            const lang =
              window.location.pathname.split(
                "/"
              )[1] || "en";

            window.location.href =
              `/${lang}/blog/how-to-create-ideal-type-world-cup`;
          }}
          style={{
            background: "#fff",

            color: "#1976ed",

            border:
              "1.5px solid #1976ed",

            borderRadius: 8,

            padding: mobile
              ? "8px 15px"
              : "9px 18px",

            fontSize: mobile
              ? 13
              : 14,

            fontWeight: 800,

            cursor: "pointer",
          }}
        >
          {t(
            "view_creation_guide"
          ) ||
            "View Guide"}{" "}
          →
        </button>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
      >
        {/* 드래그 앤 드롭 업로드 */}
        <div
          onDrop={(
            event
          ) => {
            event.preventDefault();

            setDragActive(
              false
            );

            handleFiles(
              event
                .dataTransfer
                .files
            );
          }}
          onDragOver={
            handleDrag
          }
          onDragEnter={
            handleDrag
          }
          onDragLeave={
            handleDrag
          }
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

            background:
              dragActive
                ? "#d3eafdcc"
                : "#f3f9ff",

            cursor: "pointer",

            fontSize: mobile
              ? 18
              : 22,

            fontWeight: 700,

            color: "#1677ed",

            letterSpacing:
              "-0.5px",

            minHeight: mobile
              ? 90
              : 120,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            transition:
              "background 0.18s, border-color 0.18s",
          }}
        >
          <input
            ref={
              fileInputRef
            }
            type="file"

           accept=".jpg,.jpeg,.png,.webp,.avif,.svg,image/jpeg,image/png,image/webp,image/avif,image/svg+xml"

            multiple

            style={{
              display: "none",
            }}

            onChange={async (
              event
            ) => {
              await handleFiles(
                event.target
                  .files
              );

              // 같은 파일 재선택 가능
              event.target.value =
                "";
            }}

            disabled={
              loading
            }
          />

         <span>
  <span
    style={{
      fontSize: mobile ? 20 : 26,
    }}
  >
    📁
  </span>

  <br />

  <span
    style={{
      display: "block",
      marginTop: 8,
      fontSize: mobile ? 16 : 19,
      fontWeight: 800,
    }}
  >
    {t("drag_upload_images") ||
      "Drag and drop images here, or click to upload."}
  </span>

  <span
    style={{
      display: "block",
      marginTop: 6,
      fontSize: mobile ? 12 : 14,
      fontWeight: 600,
      opacity: 0.72,
    }}
  >
    JPG · PNG · WebP · AVIF · SVG · Max 6MB
  </span>

  <span
    style={{
      display: "block",
      marginTop: 3,
      fontSize: mobile ? 11 : 13,
      fontWeight: 500,
      opacity: 0.58,
    }}
  >
    {t("local_video_not_supported") ||
      "Local video uploads are not supported. You can use YouTube links instead."}
  </span>
</span>
        </div>

        {/* 제목 */}
        <input
          value={title}
          onChange={(
            event
          ) =>
            setTitle(
              event.target
                .value
            )
          }
          placeholder={
            t(
              "worldcup_title"
            ) ||
            "Worldcup Title"
          }
          maxLength={70}
          style={{
            width: "100%",

            padding: 10,

            borderRadius: 8,

            border:
              "1.5px solid #bbb",

            fontSize: mobile
              ? 15
              : 18,

            marginBottom: 16,

            boxSizing:
              "border-box",
          }}
          disabled={
            loading
          }
        />

        {/* 설명 */}
        <textarea
          value={desc}
          onChange={(
            event
          ) =>
            setDesc(
              event.target
                .value
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

            fontSize: mobile
              ? 13
              : 15,

            marginBottom: 18,

            boxSizing:
              "border-box",
          }}
          disabled={
            loading
            
          }
        />

        {/* 카테고리 */}
        <div
          style={{
            marginBottom: 18,
          }}
        >
<div
  style={{
    fontWeight: 700,
    fontSize: mobile ? 14 : 16,
    marginBottom: 7,
    color: "#000",
  }}
>
  {t("category") || "Category"}{" "}
  <span style={{ color: "#e14444" }}>*</span>
</div>

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

{CATEGORY_OPTIONS.map((item) => (
  <option
    key={item.value}
    value={item.value}
    style={{
      background: "#fff",
      color: "#000",
    }}
  >
    {t(`category_${item.value}`, {
      defaultValue: item.label,
    })}
  </option>
))}
          </select>
        </div>

        {/* 후보 */}
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
            {t(
              "candidates"
            ) ||
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
              (
              {
                candidates.length
              }{" "}
              /{" "}
              {
                MAX_CANDIDATES
              }
              )
            </span>
          </div>

          {candidates.map(
            (
              candidate,
              index
            ) => (
              <CandidateInput
                key={
                  candidate.id
                }

                value={
                  candidate
                }

                onChange={(
                  value
                ) =>
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

                disabled={
                  loading
                }

                minCandidates={
                  candidates.length <=
                  2
                }
              />
            )
          )}

          {/* 후보 추가 */}
          <button
            type="button"
            onClick={
              addCandidate
            }
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
            {t(
              "add_candidate"
            ) ||
              "Add Candidate"}
          </button>
        </div>

        {/* 오류 */}
        {error && (
          <div
            style={{
              color:
                COLORS.danger ||
                "#d33",

              marginBottom: 10,

              textAlign:
                "center",
            }}
          >
            {error}
          </div>
        )}

        {/* 저장 / 취소 */}
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
            disabled={
              loading
            }
          >
            {loading
              ? t(
                  "saving"
                ) ||
                "Saving..."
              : t(
                  "save"
                ) ||
                "Save"}
          </button>

          <button
            type="button"
            onClick={
              onCancel
            }
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
            disabled={
              loading
            }
          >
            {t(
              "cancel"
            ) ||
              "Cancel"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;