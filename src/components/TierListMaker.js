import { TierTagEditor, normalizeTags } from "./TierTagTools";
import "../registerTierListMakerTranslations";
// TierListMaker.js — 전체코드 1/2

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useTranslation } from "react-i18next";
import imageCompression from "browser-image-compression";

import MediaRenderer from "./MediaRenderer";
import Seo from "../seo/Seo";

import {
  fetchWinnerStatsFromDB,
  getUserOrGuestId,
} from "../utils";

import { supabase } from "../utils/supabaseClient";


const MAX_UPLOAD = 50;
const MAX_CANDIDATES = 1024;
const IMAGE_MAX_INPUT_BYTES =
  6 * 1024 * 1024;

const IMAGE_MAX_OUTPUT_BYTES =
  1 * 1024 * 1024;

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

function isSupportedImageFile(file) {
  if (!file) {
    return false;
  }

  return (
    IMAGE_MIME_TYPES.has(file.type) ||
    IMAGE_EXTENSIONS.test(file.name || "")
  );
}

function isSvgFile(file) {
  return (
    file?.type === "image/svg+xml" ||
    /\.svg$/i.test(file?.name || "")
  );
}

async function convertSvgToWebp(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 1200;
        let height = img.naturalHeight || img.height || 1200;
        const scale = Math.min(1, 1200 / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context unavailable");
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size <= 0) {
              reject(new Error("SVG conversion failed"));
              return;
            }
            const baseName = String(file.name || "image")
              .replace(/\.[^/.]+$/, "")
              .trim() || "image";
            const result = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            if (result.size > IMAGE_MAX_OUTPUT_BYTES) {
              reject(new Error("Normalized image exceeds 1MB"));
              return;
            }
            resolve(result);
          },
          "image/webp",
          0.82
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("SVG conversion failed"));
    };

    img.src = objectUrl;
  });
}

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
    console.warn("Web Worker image compression failed; retrying without worker", workerError);
    compressedBlob = await imageCompression(file, {
      ...options,
      useWebWorker: false,
    });
  }

  if (!compressedBlob || compressedBlob.size <= 0) {
    throw new Error("Normalized image is empty");
  }

  const baseName = String(file.name || "image")
    .replace(/\.[^/.]+$/, "")
    .trim() || "image";

  const webpFile = new File([compressedBlob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  if (webpFile.size > IMAGE_MAX_OUTPUT_BYTES) {
    throw new Error("Normalized image exceeds 1MB");
  }

  return webpFile;
}

async function normalizeImageFile(file) {
  if (!file) {
    throw new Error("Image file is missing");
  }
  if (isSvgFile(file)) {
    return convertSvgToWebp(file);
  }
  if (file.type === "image/webp" && file.size <= IMAGE_MAX_OUTPUT_BYTES) {
    return file;
  }
  return compressImageToWebp(file);
}


const TIERS = [
  "S",
  "A",
  "B",
  "C",
  "D",
];


const TIER_COLORS = {
  S: "#ff6b6b",
  A: "#ff9f43",
  B: "#ffd93d",
  C: "#6bcb77",
  D: "#4d96ff",
};


const DEFAULT_TIER_LABELS = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};


const CATEGORY_OPTIONS = [
  "game",
  "entertainment",
  "animation",
  "food",
  "sports",
  "other",
].map((value) => ({ value }));

// 월드컵 관리자 카테고리 -> 티어표 카테고리 변환
// worldcups: person/korea/music/game/sports/anime_manga/movie_drama/food/etc
// tier_lists: game/entertainment/animation/food/sports/other
const normalizeTierCategory = (category) => {
  const value = String(category || "").trim();

  if ([
    "game",
    "entertainment",
    "animation",
    "food",
    "sports",
    "other",
  ].includes(value)) {
    return value;
  }

  const categoryMap = {
    person: "entertainment",
    korea: "entertainment",
    music: "entertainment",
    movie_drama: "entertainment",
    anime_manga: "animation",
    etc: "other",
  };

  return categoryMap[value] || "other";
};

const readTranslationMap = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (_error) {
      return {};
    }
  }

  return {};
};


const WINNER_CACHE_KEY =
  "onepick_tier_winner_cache_v1";

const CLONE_STORAGE_KEY =
  "onepick_tier_clone_v1";

const EDIT_STORAGE_KEY =
  "onepick_tier_edit_v1";

const TIER_DRAFT_STORAGE_KEY =
  "onepick_tier_draft_v1";


const createEmptyTiers = () => ({
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
});


function readWinnerCache() {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }


  try {
    return JSON.parse(
      sessionStorage.getItem(
        WINNER_CACHE_KEY
      ) || "{}"
    );
  } catch {
    return {};
  }
}


function writeWinnerCache(cache) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  try {
    sessionStorage.setItem(
      WINNER_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch {}
}


const CandidateCard = memo(
  function CandidateCard({
    item,
    compact = false,
    isMobile,
    text,
    onDragStartItem,
    onDragEndItem,
    onRemoveLocal,
    onSelectItem,
  }) {
    const width =
      compact
        ? isMobile
          ? 72
          : 94
        : "100%";


    return (
      <div
        draggable={!isMobile}
  onDragStart={(e) => {
  e.dataTransfer.effectAllowed =
    "copyMove";

  e.dataTransfer.setData(
    "text/plain",
    String(
      item?._tierKey ||
      item?.id ||
      ""
    )
  );

  onDragStartItem(item);
}}
        onDragEnd={
          onDragEndItem
        }
        onClick={() => {
          if (isMobile) {
            onSelectItem?.(item);
          }
        }}
        title={
          item?.name ||
          ""
        }
        style={{
          width,

          minWidth:
            compact
              ? width
              : 0,

          background:
            "#101d32",

          border:
            "1px solid #315a8f",

          borderRadius:
            8,

          overflow:
            "hidden",

          cursor:
            isMobile
              ? "pointer"
              : "grab",

          position:
            "relative",

          userSelect:
            "none",

          WebkitUserDrag:
            "element",

             }}
      >
        <div
     style={{
  position: "relative",
  width: "100%",
  aspectRatio: "1 / 1",
  overflow: "hidden",
  background: "#07111f",
  pointerEvents: "none",
}}
        >
          {item?.image ? (
            item._source ===
            "local" ? (
              <img
                src={
                  item.image
                }
                alt={
                  item.name ||
                  ""
                }
                draggable={
                  false
                }
                loading="lazy"
                decoding="async"
style={{
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
  pointerEvents: "none",
}}
              />
            ) : (
              <MediaRenderer
                url={
                  item.image
                }
                loading="eager"
                alt={
                  item.name ||
                  ""
                }
                playable={
                  false
                }
                style={{
                  width:
                    "100%",

                  height:
                    "100%",

                  objectFit: "contain",
                  objectPosition: "center",

                  display:
                    "block",

                  pointerEvents:
                    "none",
                }}
              />
            )
          ) : (
            <div
              style={{
                width:
                  "100%",

                height:
                  "100%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  "#607086",

                fontSize:
                  11,

                fontWeight:
                  800,
              }}
            >
              {text.noImage}
            </div>
          )}
        </div>


        <div
          style={{
            padding:
              compact
                ? "5px 4px"
                : "7px 6px",

            textAlign:
              "center",

            fontSize:
              compact
                ? 11
                : 12,

            fontWeight:
              800,

            overflow:
              "hidden",

            textOverflow:
              "ellipsis",

            whiteSpace:
              "nowrap",

            pointerEvents:
              "none",
          }}
        >
          {item?.name ||
            text.untitledCandidate}
        </div>


        {["local", "imported"].includes(
          item?._source
        ) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              onRemoveLocal(
                item
              );
            }}
            style={{
              position:
                "absolute",

              top:
                4,

              right:
                4,

              width:
                24,

              height:
                24,

              padding:
                0,

              borderRadius:
                "50%",

              border:
                "1px solid rgba(255,255,255,0.28)",

              background:
                "rgba(0,0,0,0.75)",

              color:
                "#fff",

              cursor:
                "pointer",

              fontSize:
                14,

              fontWeight:
                900,

              zIndex:
                5,
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);


function TierListMaker({
  worldcupList = [],
}) {
  const navigate =
    useNavigate();


  const location =
    useLocation();


  const { id } =
    useParams();


  const { t, i18n } =
    useTranslation();


  const lang =
    (
      i18n.language ||
      "en"
    ).split("-")[0];


  const text =
    useMemo(
      () => ({
        pageTitle: t("tierList.maker.pageTitle"),
        builderDesc: t("tierList.maker.builderDesc"),
        sourceDesc: t("tierList.maker.sourceDesc"),
        uploadTitle: t("tierList.maker.uploadTitle"),
        uploadDesc: t("tierList.maker.uploadDesc"),
        chooseImages: t("tierList.maker.chooseImages"),
        or: t("tierList.maker.or"),
        importWorldcupTitle: t("tierList.maker.importWorldcupTitle"),
        importWorldcupDesc: t("tierList.maker.importWorldcupDesc"),
        importGuide: t("tierList.maker.importGuide"),
        presetSearchPlaceholder: t("tierList.maker.presetSearchPlaceholder"),
        loadMore: t("tierList.maker.loadMore"),
        noImage: t("tierList.maker.noImage"),
        registerMiddle: t("tierList.maker.registerMiddle"),
        sourcePresetLabel: t("tierList.maker.sourcePresetLabel"),
        directTierList: t("tierList.maker.directTierList"),
        customPresetPlaceholder: t("tierList.maker.customPresetPlaceholder"),
        loadingWinners: t("tierList.maker.loadingWinners"),
        candidates: t("tierList.common.candidates"),
        ranked: t("tierList.maker.ranked"),
        categoryLabel: t("tierList.common.category"),
        tierNameLabel: t("tierList.maker.tierNameLabel"),
        tierNameGuide: t("tierList.maker.tierNameGuide"),
        onePickTitle: t("tierList.common.onePick"),
        onePickDesc: t("tierList.maker.onePickDesc"),
        onePickEmpty: t("tierList.maker.onePickEmpty"),
        clearOnePick: t("tierList.maker.clearOnePick"),
        loadingWorldcup: t("tierList.maker.loadingWorldcup"),
        backToList: t("tierList.common.backToList"),
        tierHome: t("tierList.result.tierHome"),
        titlePlaceholder: t("tierList.maker.titlePlaceholder"),
        changeSource: t("tierList.maker.changeSource"),
        reset: t("tierList.common.reset"),
        saving: t("tierList.common.saving"),
        publish: t("tierList.maker.publish"),
        updateSaving: t("tierList.maker.updateSaving"),
        saveChanges: t("tierList.maker.saveChanges"),
        dropHere: t("tierList.maker.dropHere"),
        unrankedCandidates: t("tierList.maker.unrankedCandidates"),
        addImages: t("tierList.maker.addImages"),
        searchPlaceholder: t("tierList.maker.searchPlaceholder"),
        searchResult: (count) => t("tierList.maker.searchResult", { count }),
        noSearchResult: t("tierList.maker.noSearchResult"),
        imageReuseNotice: t("tierList.maker.imageReuseNotice"),
        untitledCandidate: t("tierList.common.untitledCandidate"),
        newTierList: t("tierList.maker.newTierList"),
        enterTitle: t("tierList.maker.enterTitle"),
        addCandidateFirst: t("tierList.maker.addCandidateFirst"),
        placeCandidateFirst: t("tierList.maker.placeCandidateFirst"),
        saveFailed: t("tierList.maker.saveFailed"),
        unknownError: t("tierList.common.unknownError"),
        uploadMaxCount: (count) => t("tierList.maker.uploadMaxCount", { count }),
        candidateMaxCount: (count) => t("tierList.maker.candidateMaxCount", { count }),
        imageMaxSize: t("tierList.maker.imageMaxSize"),
        imageOnly: t("tierList.maker.imageOnly"),
        someFilesRejected: t("tierList.maker.someFilesRejected"),
        uploadLoginRequired: t("tierList.maker.uploadLoginRequired"),
        guestEditPasswordRequired: t("tierList.maker.guestEditPasswordRequired"),
        guestNicknameInvalid: t("tierList.maker.guestNicknameInvalid"),
        guestPasswordInvalid: t("tierList.maker.guestPasswordInvalid"),
        guestLocalImageBlocked: t("tierList.maker.guestLocalImageBlocked"),
        guestPublishTitle: t("tierList.maker.guestPublishTitle"),
        guestEditTitle: t("tierList.maker.guestEditTitle"),
        guestNicknamePlaceholder: t("tierList.maker.guestNicknamePlaceholder"),
        guestPasswordPlaceholder: t("tierList.maker.guestPasswordPlaceholder"),
        guestPasswordGuide: t("tierList.maker.guestPasswordGuide"),
        mobileSelectGuide: t("tierList.maker.mobileSelectGuide"),
        moveUnranked: t("tierList.maker.moveUnranked"),
        resetConfirm: t("tierList.maker.resetConfirm"),
        normalizedTooLarge: t("tierList.maker.normalizedTooLarge"),
        loadEditFailed: t("tierList.maker.loadEditFailed"),
      }),
      [t]
    );


  const [
    isMobile,
    setIsMobile,
  ] =
    useState(
      typeof window !==
        "undefined"
        ? window.innerWidth <
          600
        : false
    );


  useEffect(() => {
    const handleResize =
      () => {
        setIsMobile(
          window.innerWidth <
            600
        );
      };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  const [
    winnerMap,
    setWinnerMap,
  ] =
    useState(() =>
      readWinnerCache()
    );

    const [
  sourcePlayCountMap,
  setSourcePlayCountMap,
] =
  useState({});

  useEffect(() => {
  let cancelled = false;

  async function loadSourcePlayCounts() {
    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "get_worldcup_play_counts"
      );

      if (error) {
        throw error;
      }

      if (cancelled) {
        return;
      }

      const nextMap = {};

      (data || []).forEach(
        (row) => {
          nextMap[
            String(row.cup_id)
          ] =
            Number(
              row.play_count || 0
            );
        }
      );

      setSourcePlayCountMap(
        nextMap
      );
    } catch (error) {
      console.warn(
        "월드컵 참여 수 조회 실패:",
        error
      );
    }
  }

  loadSourcePlayCounts();

  return () => {
    cancelled = true;
  };
}, []);

  const [
    winnerLoading,
    setWinnerLoading,
  ] =
    useState(false);

    const [
  presetSearch,
  setPresetSearch,
] = useState("");

const [
  presetVisibleCount,
  setPresetVisibleCount,
] = useState(8);

  const [
    tierItems,
    setTierItems,
  ] =
    useState(
      createEmptyTiers
    );


  const [
    onePick,
    setOnePick,
  ] =
    useState(null);


  const [
    localCandidates,
    setLocalCandidates,
  ] =
    useState([]);


  const [
    localOnlyMode,
    setLocalOnlyMode,
  ] =
    useState(false);


  const [
    sourceWorldcupId,
    setSourceWorldcupId,
  ] = useState(null);


  const [
    customPresetName,
    setCustomPresetName,
  ] = useState("");


  const [
    draggedItem,
    setDraggedItem,
  ] =
    useState(null);


  const [
    fileDragOver,
    setFileDragOver,
  ] =
    useState(false);


  const [
    tierListTitle,
    setTierListTitle,
  ] =
    useState("");


  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState("other");


  const [
    tierLabels,
    setTierLabels,
  ] =
    useState(() => ({
      ...DEFAULT_TIER_LABELS,
    }));


  const [
    searchKeyword,
    setSearchKeyword,
  ] =
    useState("");

    const [
  visibleCandidateCount,
  setVisibleCandidateCount,
] = useState(80);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    saveError,
    setSaveError,
  ] =
    useState("");

  const [
    draftMessage,
    setDraftMessage,
  ] = useState("");
const [
  currentUser,
  setCurrentUser,
] = useState(null);

const [
  authReady,
  setAuthReady,
] = useState(false);

const [
  guestNickname,
  setGuestNickname,
] = useState("");

const [
  guestPassword,
  setGuestPassword,
] = useState("");

const [
  selectedMobileItem,
  setSelectedMobileItem,
] = useState(null);

const [
  guestEditPassword,
  setGuestEditPassword,
] = useState(
  () =>
    location.state
      ?.guestEditPassword ||
    ""
);


useEffect(() => {
  let mounted = true;

  async function loadAuth() {
    const {
      data,
    } =
      await supabase.auth.getSession();

    if (!mounted) {
      return;
    }

    setCurrentUser(
      data?.session?.user ||
        null
    );

    setAuthReady(true);
  }

  loadAuth();


  const {
    data: authListener,
  } =
    supabase.auth.onAuthStateChange(
      (
        _event,
        session
      ) => {
        if (!mounted) {
          return;
        }

        setCurrentUser(
          session?.user ||
            null
        );

        setAuthReady(true);
      }
    );


  return () => {
    mounted = false;

    authListener
      ?.subscription
      ?.unsubscribe();
  };
}, []);

  const [
    editingTierListId,
    setEditingTierListId,
  ] =
    useState(null);


  const fileInputRef =
    useRef(null);


  const localUrlsRef =
    useRef(
      new Set()
    );

    const draggedItemRef =
  useRef(null);

  const getTitle =
    useCallback(
      (cup) => {
        const translations = readTranslationMap(
          cup?.title_translations
        );

        const legacyTranslations = readTranslationMap(
          cup?.translations?.title
        );

        return (
          translations?.[lang] ||
          translations?.en ||
          legacyTranslations?.[lang] ||
          legacyTranslations?.en ||
          cup?.[`title_${lang}`] ||
          cup?.title_en ||
          cup?.title ||
          ""
        );
      },
      [lang]
    );

    const sortedSourceWorldcups =
  useMemo(() => {
    return [...worldcupList].sort(
      (a, b) => {
        const aCount =
          sourcePlayCountMap[
            String(a.id)
          ] || 0;

        const bCount =
          sourcePlayCountMap[
            String(b.id)
          ] || 0;

        return bCount - aCount;
      }
    );
  }, [
    worldcupList,
    sourcePlayCountMap,
  ]);

    const filteredPresetWorldcups =
  useMemo(() => {
    const keyword =
      presetSearch
        .trim()
        .toLowerCase();

const list =
  [...sortedSourceWorldcups];

    if (!keyword) {
      return list;
    }

    return list.filter(
      (cup) => {
        const title =
          String(
            getTitle(cup) || ""
          ).toLowerCase();

        return title.includes(
          keyword
        );
      }
    );
}, [
  sortedSourceWorldcups,
  presetSearch,
  getTitle,
]);

  const getCandidateName =
    useCallback(
      (candidate) => {
        return (
          candidate
            ?.name_translations
            ?.[lang] ||
          candidate
            ?.name_translations
            ?.en ||
          candidate
            ?.name ||
          candidate
            ?.title ||
          ""
        )
          .toString()
          .trim();
      },
      [lang]
    );


  const [
    selectedCupFromDb,
    setSelectedCupFromDb,
  ] = useState(null);

  const [
    selectedCupLoading,
    setSelectedCupLoading,
  ] = useState(Boolean(id));

  const [
    selectedCupResolved,
    setSelectedCupResolved,
  ] = useState(!id);

  const [
    selectedCupError,
    setSelectedCupError,
  ] = useState("");

  const selectedCupFromList =
    useMemo(() => {
      if (!id) {
        return null;
      }

      return (
        worldcupList.find(
          (cup) =>
            String(cup?.id) ===
            String(id)
        ) || null
      );
    }, [
      id,
      worldcupList,
    ]);

  useEffect(() => {
    if (!id) {
      setSelectedCupFromDb(null);
      setSelectedCupLoading(false);
      setSelectedCupResolved(true);
      setSelectedCupError("");
      return;
    }

    let cancelled = false;
    setSelectedCupFromDb(null);
    setSelectedCupLoading(true);
    setSelectedCupResolved(false);
    setSelectedCupError("");

    supabase
      .from("worldcups")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.warn(
            "티어표 프리셋 원본 조회 실패:",
            error
          );
          setSelectedCupError(
            error?.message || t("error_no_data")
          );
          return;
        }

        if (data) {
          setSelectedCupFromDb(data);
        } else if (!selectedCupFromList) {
          setSelectedCupError(t("not_found"));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn(
          "티어표 프리셋 원본 조회 실패:",
          error
        );
        setSelectedCupError(
          error?.message || t("error_no_data")
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSelectedCupLoading(false);
          setSelectedCupResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, selectedCupFromList, t]);

  const selectedCup =
    selectedCupFromDb ||
    selectedCupFromList;

  const [
    sourcePresetCupFromDb,
    setSourcePresetCupFromDb,
  ] = useState(null);

  useEffect(() => {
    if (!sourceWorldcupId) {
      setSourcePresetCupFromDb(null);
      return;
    }

    if (
      selectedCup &&
      String(selectedCup.id) ===
        String(sourceWorldcupId)
    ) {
      setSourcePresetCupFromDb(selectedCup);
      return;
    }

    let cancelled = false;
    setSourcePresetCupFromDb(null);

    supabase
      .from("worldcups")
      .select("*")
      .eq("id", sourceWorldcupId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.warn(
            "티어표 원본 프리셋 메타데이터 조회 실패:",
            error
          );
          return;
        }

        if (data) {
          setSourcePresetCupFromDb(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    sourceWorldcupId,
    selectedCup,
  ]);


  const sourcePresetCup =
    useMemo(() => {
      if (!sourceWorldcupId) {
        return null;
      }

      if (
        sourcePresetCupFromDb &&
        String(sourcePresetCupFromDb?.id) ===
          String(sourceWorldcupId)
      ) {
        return sourcePresetCupFromDb;
      }

      if (
        selectedCup &&
        String(selectedCup?.id) ===
          String(sourceWorldcupId)
      ) {
        return selectedCup;
      }

      return (
        worldcupList.find(
          (cup) =>
            String(cup?.id) ===
            String(sourceWorldcupId)
        ) || null
      );
    }, [
      sourceWorldcupId,
      sourcePresetCupFromDb,
      selectedCup,
      worldcupList,
    ]);


  const sourcePresetName =
    sourcePresetCup
      ? getTitle(sourcePresetCup)
      : customPresetName.trim() || text.directTierList;


const sourceCandidates =
  useMemo(() => {
    const activeSourceCup =
      sourcePresetCup || selectedCup;

    if (
      !activeSourceCup ||
      !Array.isArray(
        activeSourceCup.data
      )
    ) {
      return [];
    }

    return activeSourceCup.data.map(
        (
          candidate,
          index
        ) => ({
          ...candidate,

          name:
            getCandidateName(
              candidate
            ),

          _source:
            "worldcup",

          _tierKey:
            candidate?.id !=
            null
              ? `worldcup-${String(
                  candidate.id
                )}`
              : `worldcup-index-${index}`,
        })
      );
}, [
  sourcePresetCup,
  selectedCup,
  getCandidateName,
]);


  const allCandidates =
    useMemo(() => {
      return [
        ...sourceCandidates,
        ...localCandidates,
      ];
    }, [
      sourceCandidates,
      localCandidates,
    ]);


  const sortedCandidates =
    useMemo(() => {
      return [
        ...allCandidates,
      ].sort((a, b) => {
        const nameA =
          (
            a?.name ||
            ""
          )
            .toString()
            .trim();


        const nameB =
          (
            b?.name ||
            ""
          )
            .toString()
            .trim();


        return nameA.localeCompare(
          nameB,
          lang === "ko"
            ? "ko"
            : undefined,
          {
            numeric: true,
            sensitivity:
              "base",
          }
        );
      });
    }, [
      allCandidates,
      lang,
    ]);


  const placedKeys =
    useMemo(() => {
      const result =
        new Set();


      TIERS.forEach(
        (tier) => {
          tierItems[
            tier
          ].forEach(
            (item) => {
              result.add(
                item._tierKey
              );
            }
          );
        }
      );


      return result;
    }, [
      tierItems,
    ]);


  const unrankedCandidates =
    useMemo(() => {
      return sortedCandidates.filter(
        (item) =>
          !placedKeys.has(
            item._tierKey
          )
      );
    }, [
      sortedCandidates,
      placedKeys,
    ]);


  const visibleCandidates =
    useMemo(() => {
      const keyword =
        searchKeyword
          .trim()
          .toLocaleLowerCase();


      if (!keyword) {
        return unrankedCandidates;
      }


      return unrankedCandidates.filter(
        (item) => {
          const name =
            (
              item?.name ||
              ""
            )
              .toString()
              .toLocaleLowerCase();


          return name.includes(
            keyword
          );
        }
      );
    }, [
      unrankedCandidates,
      searchKeyword,
    ]);

    useEffect(() => {
  setVisibleCandidateCount(80);
}, [
  searchKeyword,
  selectedCup?.id,
]);


  const queryParams =
    new URLSearchParams(
      typeof window !==
        "undefined"
        ? window.location.search
        : ""
    );


  const cloneTierListId =
    queryParams.get(
      "clone"
    );


  const editTierListId =
    queryParams.get(
      "edit"
    );


  const isBuilderMode =
    Boolean(id) ||
    localOnlyMode ||
    Boolean(
      cloneTierListId
    ) ||
    Boolean(
      editTierListId
    );


  const placedCount =
    useMemo(() => {
      return TIERS.reduce(
        (
          sum,
          tier
        ) =>
          sum +
          tierItems[tier]
            .length,
        0
      );
    }, [
      tierItems,
    ]);


  useEffect(() => {
    setTierItems(
      createEmptyTiers()
    );

    setOnePick(null);

    setTierLabels({
      ...DEFAULT_TIER_LABELS,
    });

    setSearchKeyword("");

    setSaveError("");


   if (selectedCup) {
  setTierListTitle("");
  setSourceWorldcupId(selectedCup.id);
  setCustomPresetName("");
} else if (!cloneTierListId && !editTierListId) {
  setSourceWorldcupId(null);
  setCustomPresetName("");
}
  // 실제 소스가 바뀔 때만 초기화합니다.
  // 언어 변경(getTitle 변경)만으로 작업 중인 티어가 리셋되지 않습니다.
  }, [
    id,
    selectedCup?.id,
  ]);

  useEffect(() => {
    if (
      !selectedCup ||
      cloneTierListId ||
      editTierListId
    ) {
      return;
    }

    setSelectedCategory(
      normalizeTierCategory(
        selectedCup?.category
      )
    );
  }, [
    selectedCup?.id,
    selectedCup?.category,
    cloneTierListId,
    editTierListId,
  ]);


  const hydratedPayloadKeyRef = useRef("");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      (!cloneTierListId && !editTierListId)
    ) {
      hydratedPayloadKeyRef.current = "";
      return;
    }

    const targetId = cloneTierListId || editTierListId;
    const mode = cloneTierListId ? "clone" : "edit";
    const hydrationKey = `${mode}:${String(targetId)}`;

    if (hydratedPayloadKeyRef.current === hydrationKey) {
      return;
    }

    let cancelled = false;

    const makeImportedCandidates = (candidates = []) =>
      candidates.map((candidate, index) => ({
        ...candidate,
        _source: "imported",
        _tierKey: `imported-${String(candidate?.id ?? index)}-${index}`,
      }));

      const mergeWithLatestPresetCandidates = async (payload) => {
  if (
    mode !== "edit" ||
    !payload?.source_worldcup_id
  ) {
    return payload;
  }

  try {
    const { data: sourceCup, error } = await supabase
      .from("worldcups")
      .select("id, data")
      .eq("id", payload.source_worldcup_id)
      .maybeSingle();

    if (
      error ||
      !sourceCup ||
      !Array.isArray(sourceCup.data)
    ) {
      return payload;
    }

    const savedCandidates = Array.isArray(payload.candidates)
      ? payload.candidates
      : [];

    const candidateMap = new Map();

    // 기존 티어표 후보는 무조건 보존
    savedCandidates.forEach((candidate) => {
      if (candidate?.id == null) return;

      candidateMap.set(
        String(candidate.id),
        {
          ...candidate,
        }
      );
    });

    // 현재 프리셋 후보를 병합
    sourceCup.data.forEach((candidate) => {
      if (candidate?.id == null) return;

      const key = String(candidate.id);
      const oldCandidate = candidateMap.get(key);

      if (oldCandidate) {
        // 기존 후보면 최신 이미지/이름 등 반영
        candidateMap.set(key, {
          ...oldCandidate,
          ...candidate,
          id: oldCandidate.id,
        });
      } else {
        // 새로 생긴 후보
        candidateMap.set(key, {
          ...candidate,
        });
      }
    });

    return {
      ...payload,
      candidates: Array.from(candidateMap.values()),
    };
  } catch (error) {
    console.warn(
      "티어표 수정용 최신 프리셋 후보 병합 실패:",
      error
    );

    return payload;
  }
};

    const hydratePayload = (payload, mode) => {
      if (!payload || cancelled) {
        return false;
      }

      const imported = makeImportedCandidates(
        Array.isArray(payload.candidates) ? payload.candidates : []
      );
      const importedMap = new Map(
        imported.map((candidate) => [String(candidate.id), candidate])
      );

      setLocalCandidates(imported);
      setSourceWorldcupId(payload.source_worldcup_id || null);
      setCustomPresetName(
        payload?.tier_labels?._sourcePresetName || ""
      );
      setSelectedCategory(
        normalizeTierCategory(
          payload.category
        )
      );
      setGuestNickname(payload.guest_nickname || "");
      setTierLabels({
        ...DEFAULT_TIER_LABELS,
        ...(payload.tier_labels || {}),
      });
      setTierListTitle(
        mode === "clone"
          ? `${payload.title || text.newTierList}`
          : payload.title || text.newTierList
      );
      setLocalOnlyMode(true);
      setSearchKeyword("");
      setSaveError("");
      setSelectedMobileItem(null);

      if (mode === "clone") {
        setTierItems(createEmptyTiers());
        setOnePick(null);
        setEditingTierListId(null);
        return true;
      }

      const nextTiers = createEmptyTiers();
      TIERS.forEach((tier) => {
        const ids = Array.isArray(payload?.tiers?.[tier])
          ? payload.tiers[tier]
          : [];
        nextTiers[tier] = ids
          .map((candidateId) => importedMap.get(String(candidateId)))
          .filter(Boolean);
      });
      setTierItems(nextTiers);

      const onePickId = payload?.tiers?.ONE_PICK;
      setOnePick(
        onePickId
          ? importedMap.get(String(onePickId)) || null
          : null
      );
      setEditingTierListId(payload.id);
      return true;
    };

    async function loadPayload() {
      const storageKey = cloneTierListId
        ? CLONE_STORAGE_KEY
        : EDIT_STORAGE_KEY;

      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const stored = JSON.parse(raw);
          const storedId = mode === "clone"
            ? stored?.sourceTierListId
            : stored?.id;
          if (String(storedId || "") === String(targetId)) {
            const hasSourceMeta =
              Object.prototype.hasOwnProperty.call(
                stored,
                "source_worldcup_id"
              ) &&
              Object.prototype.hasOwnProperty.call(
                stored,
                "tier_labels"
              );

      if (hasSourceMeta) {
  const mergedStored =
    await mergeWithLatestPresetCandidates(stored);

  if (
    !cancelled &&
    hydratePayload(mergedStored, mode)
  ) {
    hydratedPayloadKeyRef.current =
      hydrationKey;
  }

  return;
}
          }
        }
      } catch (storageError) {
        console.warn("Tier list session payload read failed", storageError);
      }

      try {
        const { data, error } = await supabase
          .from("tier_lists")
          .select(
            "id, user_id, guest_nickname, title, source_worldcup_id, category, tier_labels, tiers, candidates"
          )
          .eq("id", targetId)
          .single();

        if (error) {
          throw error;
        }

        if (
          mode === "edit" &&
          data?.user_id &&
          (!currentUser || String(currentUser.id) !== String(data.user_id))
        ) {
          throw new Error(text.loadEditFailed);
        }

      const mergedData =
  await mergeWithLatestPresetCandidates(data);

if (
  !cancelled &&
  hydratePayload(mergedData, mode)
) {
  hydratedPayloadKeyRef.current =
    hydrationKey;
}
      } catch (loadError) {
        console.error("Tier list edit/clone DB fallback failed", loadError);
        if (!cancelled) {
          setSaveError(
            `${text.loadEditFailed}: ${loadError?.message || text.unknownError}`
          );
        }
      }
    }

    if (authReady) {
      loadPayload();
    }

return () => {
  cancelled = true;
};
  }, [
    cloneTierListId,
    editTierListId,
    authReady,
    currentUser?.id,
  ]);

  useEffect(() => {
    return () => {
      localUrlsRef
        .current
        .forEach(
          (url) => {
            try {
              URL.revokeObjectURL(
                url
              );
            } catch {}
          }
        );


      localUrlsRef
        .current
        .clear();
    };
  }, []);


  useEffect(() => {
    if (
      id ||
      !Array.isArray(
        worldcupList
      ) ||
      worldcupList.length ===
        0
    ) {
      return;
    }


    let cancelled =
      false;


    async function loadWinners() {
      const cached =
        readWinnerCache();


      const cupsToLoad =
        worldcupList.filter(
          (cup) =>
            !Object.prototype
              .hasOwnProperty
              .call(
                cached,
                String(
                  cup.id
                )
              )
        );


      if (
        cupsToLoad.length ===
        0
      ) {
        setWinnerMap(
          cached
        );

        return;
      }


      setWinnerLoading(
        true
      );


      const nextCache = {
        ...cached,
      };


      let currentIndex =
        0;


      const worker =
        async () => {
          while (
            currentIndex <
            cupsToLoad.length
          ) {
            const index =
              currentIndex++;


            const cup =
              cupsToLoad[
                index
              ];


            try {
              const stats =
                await fetchWinnerStatsFromDB(
                  cup.id
                );


              if (
                !Array.isArray(
                  stats
                ) ||
                stats.length ===
                  0
              ) {
                nextCache[
                  String(
                    cup.id
                  )
                ] = null;

                continue;
              }


              const sorted =
                [...stats]
                  .map(
                    (
                      row,
                      originIndex
                    ) => ({
                      ...row,
                      _originIndex:
                        originIndex,
                    })
                  )
                  .sort(
                    (a, b) => {
                      const winDiff =
                        Number(
                          b
                            ?.win_count ||
                            0
                        ) -
                        Number(
                          a
                            ?.win_count ||
                            0
                        );


                      if (
                        winDiff !==
                        0
                      ) {
                        return winDiff;
                      }


                      const matchDiff =
                        Number(
                          b
                            ?.match_wins ||
                            0
                        ) -
                        Number(
                          a
                            ?.match_wins ||
                            0
                        );


                      if (
                        matchDiff !==
                        0
                      ) {
                        return matchDiff;
                      }


                      return (
                        a._originIndex -
                        b._originIndex
                      );
                    }
                  );


              const winnerId =
                sorted[0]
                  ?.candidate_id;


              const winner =
                Array.isArray(
                  cup.data
                )
                  ? cup.data.find(
                      (
                        candidate
                      ) =>
                        String(
                          candidate
                            ?.id
                        ) ===
                        String(
                          winnerId
                        )
                    ) ||
                    null
                  : null;


              nextCache[
                String(
                  cup.id
                )
              ] = winner;
            } catch (
              error
            ) {
              console.error(
                "티어표 우승자 썸네일 조회 실패:",
                cup.id,
                error
              );


              nextCache[
                String(
                  cup.id
                )
              ] = null;
            }
          }
        };


      try {
        const workerCount =
          Math.min(
            6,
            cupsToLoad.length
          );


        await Promise.all(
          Array.from(
            {
              length:
                workerCount,
            },
            () => worker()
          )
        );


        if (!cancelled) {
          writeWinnerCache(
            nextCache
          );


          setWinnerMap(
            nextCache
          );
        }
      } finally {
        if (!cancelled) {
          setWinnerLoading(
            false
          );
        }
      }
    }


    loadWinners();


    return () => {
      cancelled =
        true;
    };
  }, [
    id,
    worldcupList,
  ]);


const addLocalFiles =
  useCallback(
    (files) => {
      if (!authReady) {
        return;
      }

      if (!currentUser) {
        alert(text.uploadLoginRequired);

        return;
      }


      const selectedFiles =

          Array.from(
            files ||
              []
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
            text.uploadMaxCount(
              MAX_UPLOAD
            )
          );

          return;
        }


        if (
          allCandidates.length +
            selectedFiles.length >
          MAX_CANDIDATES
        ) {
          alert(
            text.candidateMaxCount(
              MAX_CANDIDATES
            )
          );

          return;
        }


        const validFiles = [];
        const rejectedFiles = [];


        selectedFiles.forEach(
          (file) => {
            if (
              !isSupportedImageFile(
                file
              )
            ) {
              rejectedFiles.push(
                `${file.name}: ${text.imageOnly}`
              );

              return;
            }


            if (
              file.size >
              IMAGE_MAX_INPUT_BYTES
            ) {
              rejectedFiles.push(
                `${file.name}: ${text.imageMaxSize}`
              );

              return;
            }


            validFiles.push(
              file
            );
          }
        );


        if (
          rejectedFiles.length >
          0
        ) {
          alert(
            `${text.someFilesRejected}\n\n${rejectedFiles.join(
              "\n"
            )}`
          );
        }


        if (
          validFiles.length ===
          0
        ) {
          return;
        }


        const stamp =
          Date.now();


        const created =
          validFiles.map(
            (
              file,
              index
            ) => {
              const random =
                Math.random()
                  .toString(36)
                  .slice(2);


              const url =
                URL.createObjectURL(
                  file
                );


              localUrlsRef
                .current
                .add(url);


              const key =
                `local-${stamp}-${index}-${random}`;


              return {
                id: key,

                name:
                  file.name.replace(
                    /\.[^/.]+$/,
                    ""
                  ),

                image:
                  url,

                file,

                _source:
                  "local",

                _tierKey:
                  key,
              };
            }
          );


        setLocalCandidates(
          (prev) => [
            ...prev,
            ...created,
          ]
        );


        if (!id) {
          setLocalOnlyMode(
            true
          );


          setTierListTitle(
            (prev) =>
              prev ||
              text.newTierList
          );
        }
      },
[
  id,
  text,
  allCandidates.length,
  currentUser,
  authReady,
  lang,
]
    );


  const removeFromTier =
    useCallback(
      (
        items,
        key
      ) => {
        return items.filter(
          (item) =>
            item._tierKey !==
            key
        );
      },
      []
    );


  const moveItemToTier =
    useCallback(
      (
        item,
        targetTier
      ) => {
        if (
          !item ||
          !targetTier
        ) {
          return;
        }


        setTierItems(
          (prev) => {
            const next = {
              S:
                removeFromTier(
                  prev.S,
                  item._tierKey
                ),

              A:
                removeFromTier(
                  prev.A,
                  item._tierKey
                ),

              B:
                removeFromTier(
                  prev.B,
                  item._tierKey
                ),

              C:
                removeFromTier(
                  prev.C,
                  item._tierKey
                ),

              D:
                removeFromTier(
                  prev.D,
                  item._tierKey
                ),
            };


            next[
              targetTier
            ] = [
              ...next[
                targetTier
              ],
              item,
            ];


            return next;
          }
        );
      },
      [
        removeFromTier,
      ]
    );


  const returnToUnranked =
    useCallback(
      (item) => {
        if (!item) {
          return;
        }

        setTierItems((prev) => ({
          S: removeFromTier(prev.S, item._tierKey),
          A: removeFromTier(prev.A, item._tierKey),
          B: removeFromTier(prev.B, item._tierKey),
          C: removeFromTier(prev.C, item._tierKey),
          D: removeFromTier(prev.D, item._tierKey),
        }));

        setOnePick((current) =>
          current?._tierKey === item._tierKey
            ? null
            : current
        );
      },
      [removeFromTier]
    );

  const removeLocalCandidate =
    useCallback(
      (item) => {
        if (
          !item ||
          !["local", "imported"].includes(
            item._source
          )
        ) {
          return;
        }


        setTierItems(
          (prev) => ({
            S:
              removeFromTier(
                prev.S,
                item._tierKey
              ),

            A:
              removeFromTier(
                prev.A,
                item._tierKey
              ),

            B:
              removeFromTier(
                prev.B,
                item._tierKey
              ),

            C:
              removeFromTier(
                prev.C,
                item._tierKey
              ),

            D:
              removeFromTier(
                prev.D,
                item._tierKey
              ),
          })
        );


        setOnePick(
          (current) =>
            current
              ?._tierKey ===
            item._tierKey
              ? null
              : current
        );


        if (
          item.image
            ?.startsWith(
              "blob:"
            )
        ) {
          try {
            URL.revokeObjectURL(
              item.image
            );
          } catch {}


          localUrlsRef
            .current
            .delete(
              item.image
            );
        }


        setLocalCandidates(
          (prev) =>
            prev.filter(
              (candidate) =>
                candidate
                  ._tierKey !==
                item._tierKey
            )
        );
      },
      [
        removeFromTier,
      ]
    );


const handleDragStartItem =
  useCallback(
    (item) => {
      draggedItemRef.current =
        item;

      setDraggedItem(
        item
      );
    },
    []
  );


const handleDragEndItem =
  useCallback(
    () => {
      draggedItemRef.current =
        null;

      setDraggedItem(
        null
      );
    },
    []
  );


  // PC 드래그 중 화면 가장자리에 가까워지면 자동 스크롤
  // dragover 이벤트 1회당 조금씩 움직이는 방식이 아니라,
  // 마지막 마우스 위치를 기억하고 requestAnimationFrame으로 계속 스크롤합니다.
  useEffect(() => {
    if (
      isMobile ||
      !draggedItem ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const edgeSize = 170;
    const maxSpeed = 34;
    const minSpeed = 8;

    let lastClientY = null;
    let frameId = null;

    const updatePointer = (event) => {
      // HTML5 drag 이벤트 중 일부 브라우저는 clientY=0을 순간적으로 내보낼 수 있어 무시합니다.
      if (
        Number.isFinite(event.clientY) &&
        event.clientY > 0
      ) {
        lastClientY = event.clientY;
      }

      // drop 가능 상태를 유지해야 dragover가 안정적으로 계속 발생합니다.
      if (event.type === "dragover") {
        event.preventDefault();
      }
    };

    const scrollLoop = () => {
      const viewportHeight =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        0;

      const scroller =
        document.scrollingElement ||
        document.documentElement ||
        document.body;

      if (
        viewportHeight > 0 &&
        scroller &&
        lastClientY !== null
      ) {
        let scrollAmount = 0;

        if (lastClientY < edgeSize) {
          const strength =
            Math.min(
              1,
              Math.max(0, edgeSize - lastClientY) /
                edgeSize
            );

          scrollAmount =
            -Math.max(
              minSpeed,
              Math.round(maxSpeed * strength)
            );
        } else if (
          lastClientY >
          viewportHeight - edgeSize
        ) {
          const strength =
            Math.min(
              1,
              Math.max(
                0,
                lastClientY -
                  (viewportHeight - edgeSize)
              ) / edgeSize
            );

          scrollAmount =
            Math.max(
              minSpeed,
              Math.round(maxSpeed * strength)
            );
        }

        if (scrollAmount !== 0) {
          // 브라우저별 scrollingElement 차이를 피하기 위해 window 자체를 스크롤합니다.
          window.scrollBy(0, scrollAmount);
        }
      }

      frameId =
        window.requestAnimationFrame(
          scrollLoop
        );
    };

    // capture=true: 후보 카드/티어 영역에서 dragover를 처리해도 먼저 좌표를 받습니다.
    window.addEventListener(
      "dragover",
      updatePointer,
      { capture: true, passive: false }
    );

    window.addEventListener(
      "drag",
      updatePointer,
      true
    );

    frameId =
      window.requestAnimationFrame(
        scrollLoop
      );

    return () => {
      window.removeEventListener(
        "dragover",
        updatePointer,
        true
      );

      window.removeEventListener(
        "drag",
        updatePointer,
        true
      );

      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId
        );
      }
    };
  }, [draggedItem, isMobile]);


  const handleTierDrop =
    useCallback(
      (
        e,
        tier
      ) => {
        e.preventDefault();


        if (
          draggedItem
        ) {
          moveItemToTier(
            draggedItem,
            tier
          );


          setDraggedItem(
            null
          );
        }
      },
      [
        draggedItem,
        moveItemToTier,
      ]
    );


 const handleOnePickDrop =
  useCallback(
    (e) => {
      e.preventDefault();

      const item =
        draggedItemRef.current ||
        draggedItem;


      if (!item) {
        return;
      }


      // S/A/B/C/D에 배치된 후보만 원픽 가능
      if (
        !placedKeys.has(
          item._tierKey
        )
      ) {
        return;
      }


      // 기존 티어에는 그대로 두고
      // 원픽에만 복사
      setOnePick(
        item
      );


      draggedItemRef.current =
        null;

      setDraggedItem(
        null
      );
    },
    [
      draggedItem,
      placedKeys,
    ]
  );

  const handleUnrankedDrop =
    useCallback(
      (e) => {
        e.preventDefault();


        if (
          draggedItem
        ) {
          returnToUnranked(
            draggedItem
          );


          setDraggedItem(
            null
          );
        }
      },
      [
        draggedItem,
        returnToUnranked,
      ]
    );


  const handleMobilePlacement =
    useCallback(
      (action) => {
        const item = selectedMobileItem;
        if (!item) {
          return;
        }

        if (TIERS.includes(action)) {
          moveItemToTier(item, action);
          setSelectedMobileItem(null);
          return;
        }

        if (action === "ONE_PICK") {
          if (placedKeys.has(item._tierKey)) {
            setOnePick(item);
          }
          setSelectedMobileItem(null);
          return;
        }

        if (action === "UNRANKED") {
          returnToUnranked(item);
          setSelectedMobileItem(null);
        }
      },
      [
        selectedMobileItem,
        moveItemToTier,
        placedKeys,
        returnToUnranked,
      ]
    );


  const saveDraft =
    useCallback(() => {
      if (typeof window === "undefined") return;

      try {
        const serializeItem = (item) => {
          if (!item) return null;
          if (item?._source === "local" || String(item?.image || "").startsWith("blob:")) {
            return null;
          }

          const { file, ...safeItem } = item;
          void file;
          return safeItem;
        };

        const draft = {
          version: 1,
          savedAt: Date.now(),
          title: tierListTitle,
          category: selectedCategory,
          tierLabels: {
            ...tierLabels,
            _tags: normalizeTags(tierLabels?._tags),
          },
          sourceWorldcupId: sourceWorldcupId || null,
          customPresetName: customPresetName || "",
          localOnlyMode: Boolean(localOnlyMode),
          tierItems: Object.fromEntries(
            TIERS.map((tier) => [
              tier,
              (tierItems[tier] || []).map(serializeItem).filter(Boolean),
            ])
          ),
          onePick: serializeItem(onePick),
          localCandidates: (localCandidates || [])
            .map(serializeItem)
            .filter(Boolean),
        };

        localStorage.setItem(
          TIER_DRAFT_STORAGE_KEY,
          JSON.stringify(draft)
        );

        setDraftMessage(t("tierListMakerUi.draftSaved"));
        window.setTimeout(() => setDraftMessage(""), 2200);
      } catch (error) {
        console.error("티어표 임시저장 실패:", error);
        setDraftMessage(t("tierListMakerUi.draftSaveFailed"));
      }
    }, [
      tierListTitle,
      selectedCategory,
      tierLabels,
      sourceWorldcupId,
      customPresetName,
      localOnlyMode,
      tierItems,
      onePick,
      localCandidates,
      t,
    ]);


  const loadDraft =
    useCallback(() => {
      if (typeof window === "undefined") return;

      try {
        const raw = localStorage.getItem(TIER_DRAFT_STORAGE_KEY);

        if (!raw) {
          setDraftMessage(t("tierListMakerUi.draftMissing"));
          window.setTimeout(() => setDraftMessage(""), 2200);
          return;
        }

        const draft = JSON.parse(raw);

        setTierListTitle(draft?.title || "");
        setSelectedCategory(
          normalizeTierCategory(draft?.category)
        );
        setTierLabels({
          ...DEFAULT_TIER_LABELS,
          ...(draft?.tierLabels || {}),
          _tags: normalizeTags(draft?.tierLabels?._tags),
        });
        setSourceWorldcupId(draft?.sourceWorldcupId || null);
        setCustomPresetName(draft?.customPresetName || "");
        setLocalOnlyMode(Boolean(draft?.localOnlyMode));

        const nextTiers = createEmptyTiers();
        TIERS.forEach((tier) => {
          nextTiers[tier] = Array.isArray(draft?.tierItems?.[tier])
            ? draft.tierItems[tier]
            : [];
        });
        setTierItems(nextTiers);
        setOnePick(draft?.onePick || null);
        setLocalCandidates(
          Array.isArray(draft?.localCandidates)
            ? draft.localCandidates
            : []
        );
        setSelectedMobileItem(null);
        setSearchKeyword("");
        setSaveError("");

        setDraftMessage(t("tierListMakerUi.draftLoaded"));
        window.setTimeout(() => setDraftMessage(""), 2200);
      } catch (error) {
        console.error("티어표 임시저장 불러오기 실패:", error);
        setDraftMessage(t("tierListMakerUi.draftLoadFailed"));
      }
    }, [t]);


  const resetRanking =
    useCallback(
      () => {
        if (
          typeof window !== "undefined" &&
          !window.confirm(
            text.resetConfirm
          )
        ) {
          return;
        }

        setTierItems(
          createEmptyTiers()
        );

        setOnePick(null);
        setSelectedMobileItem(null);
      },
      [text.resetConfirm]
    );


  const backToSourceSelection =
    useCallback(
      () => {
        setTierItems(
          createEmptyTiers()
        );


        setSearchKeyword("");

        setLocalOnlyMode(
          false
        );

        setOnePick(null);


        setSelectedCategory(
          "other"
        );


        setTierLabels({
          ...DEFAULT_TIER_LABELS,
        });


        navigate(
          `/${lang}/tier-list/create`
        );
      },
      [
        navigate,
        lang,
      ]
    );


  const uploadLocalCandidate =
    useCallback(
      async (item, tierListId) => {
        if (
          item._source !== "local" ||
          !item.file
        ) {
          return item;
        }

        const normalizedFile =
          await normalizeImageFile(
            item.file
          );

        const random =
          crypto.randomUUID?.() ||
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

        const filePath =
          `${tierListId}/${random}.webp`;

        const { error: uploadError } =
          await supabase.storage
            .from("tier-list-images")
            .upload(
              filePath,
              normalizedFile,
              {
                cacheControl: "31536000",
                upsert: false,
                contentType: "image/webp",
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("tier-list-images")
            .getPublicUrl(filePath);

        const publicUrl =
          publicUrlData?.publicUrl;

        if (!publicUrl) {
          throw new Error(
            "Uploaded image URL is unavailable"
          );
        }

        return {
          ...item,
          image: publicUrl,
          file: normalizedFile,
          _uploadedPath: filePath,
        };
      },
      []
    );

  const saveTierList =
    useCallback(
      async () => {
        if (saving) {
          return;
        }


        setSaveError("");


        const cleanTitle =
          tierListTitle
            .trim();


        if (!cleanTitle) {
          setSaveError(
            text.enterTitle
          );

          return;
        }


        if (
          allCandidates.length ===
          0
        ) {
          setSaveError(
            text.addCandidateFirst
          );

          return;
        }


        if (
          placedCount ===
          0
        ) {
          setSaveError(
            text.placeCandidateFirst
          );

          return;
        }


        setSaving(true);

        try {
          const tierListId =
            editingTierListId ||
            crypto
              .randomUUID
              ?.();


          if (!tierListId) {
            throw new Error(
              t("tierList.maker.idCreateFailed")
            );
          }


          const {
            user_id,
            guest_id,
          } =
            await getUserOrGuestId();


          const uploadedCandidateMap =
            new Map();


          for (
            const item of
            allCandidates
          ) {
            if (
              item._source ===
              "local"
            ) {
              const uploaded =
                await uploadLocalCandidate(
                  item,
                  tierListId
                );


              uploadedCandidateMap.set(
                item._tierKey,
                uploaded
              );
            } else {
              uploadedCandidateMap.set(
                item._tierKey,
                item
              );
            }
          }
const candidatesForSaveMap = new Map();

allCandidates.forEach((item) => {
  if (!item?._tierKey) return;

  candidatesForSaveMap.set(
    item._tierKey,
    item
  );
});

TIERS.forEach((tier) => {
  (tierItems[tier] || []).forEach((item) => {
    if (!item?._tierKey) return;

    candidatesForSaveMap.set(
      item._tierKey,
      item
    );
  });
});

if (onePick?._tierKey) {
  candidatesForSaveMap.set(
    onePick._tierKey,
    onePick
  );
}

const candidatesForSave =
  Array.from(
    candidatesForSaveMap.values()
  );
  
const finalCandidates =
  candidatesForSave.map(
              (item) => {
                const finalItem =
                  uploadedCandidateMap.get(
                    item._tierKey
                  ) ||
                  item;


                return {
                  id:
                    String(
                      finalItem.id
                    ),

                  name:
                    finalItem.name ||
                    "",

                  image:
                    finalItem.image ||
                    "",

                  source:
                    finalItem
                      ._source ||
                    "worldcup",
                };
              }
            );


          const finalTiers =
            Object.fromEntries(
              TIERS.map(
                (tier) => [
                  tier,

                  tierItems[
                    tier
                  ].map(
                    (item) => {
                      const finalItem =
                        uploadedCandidateMap.get(
                          item._tierKey
                        ) ||
                        item;


                      return String(
                        finalItem.id
                      );
                    }
                  ),
                ]
              )
            );


          const finalOnePick =
            onePick
              ? uploadedCandidateMap.get(
                  onePick._tierKey
                ) ||
                onePick
              : null;


          finalTiers.ONE_PICK =
            finalOnePick
              ? String(
                  finalOnePick.id
                )
              : null;


          const savedTierLabels = {
            ...tierLabels,
            _tags: normalizeTags(tierLabels._tags),
            _sourcePresetName: sourceWorldcupId
              ? String(sourcePresetName || "").trim()
              : customPresetName.trim(),
          };


          let data;
          let error;


if (editingTierListId) {
  if (currentUser) {
    const result =
      await supabase
        .from("tier_lists")
        .update({
          title: cleanTitle,
          category: selectedCategory,
          tier_labels: savedTierLabels,
          tiers: finalTiers,
          candidates: finalCandidates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTierListId)
        .eq("user_id", currentUser.id)
        .select("id")
        .single();

    data = result.data;
    error = result.error;
  } else {
    const editPassword =
      guestEditPassword ||
      guestPassword;

    if (
      editPassword.length < 4 ||
      editPassword.length > 50
    ) {
      throw new Error(
        text.guestPasswordInvalid
      );
    }

    if (
      allCandidates.some(
        (item) => item._source === "local"
      )
    ) {
      throw new Error(
        text.guestLocalImageBlocked
      );
    }

    const result =
      await supabase.rpc(
        "update_guest_tier_list",
        {
          p_tier_list_id:
            editingTierListId,
          p_password:
            editPassword,
          p_title:
            cleanTitle,
          p_category:
            selectedCategory,
          p_tier_labels:
            savedTierLabels,
          p_tiers:
            finalTiers,
          p_candidates:
            finalCandidates,
        }
      );

    data = {
      id: editingTierListId,
    };
    error = result.error;
  }
} else if (currentUser) {
  const result =
    await supabase
      .from("tier_lists")
      .insert([
        {
          id: tierListId,
          user_id: currentUser.id,
          guest_id: null,
          guest_nickname: null,
          title: cleanTitle,
          source_worldcup_id:
            sourceWorldcupId || null,
          category: selectedCategory,
          tier_labels: savedTierLabels,
          tiers: finalTiers,
          candidates: finalCandidates,
        },
      ])
      .select("id")
      .single();

  data = result.data;
  error = result.error;
} else {
  const cleanNickname =
    guestNickname.trim();

  if (
    cleanNickname.length < 1 ||
    cleanNickname.length > 20
  ) {
    throw new Error(
      text.guestNicknameInvalid
    );
  }

  if (
    guestPassword.length < 4 ||
    guestPassword.length > 50
  ) {
    throw new Error(
      text.guestPasswordInvalid
    );
  }

  if (
    allCandidates.some(
      (item) => item._source === "local"
    )
  ) {
    throw new Error(
      text.guestLocalImageBlocked
    );
  }

  const {
    data: guestCreatedId,
    error: guestCreateError,
  } = await supabase.rpc(
    "create_guest_tier_list",
    {
      p_guest_id: guest_id || null,
      p_guest_nickname:
        cleanNickname,
      p_password: guestPassword,
      p_title: cleanTitle,
      p_source_worldcup_id:
        sourceWorldcupId || null,
      p_category:
        selectedCategory,
      p_tier_labels: savedTierLabels,
      p_tiers: finalTiers,
      p_candidates:
        finalCandidates,
    }
  );

  if (guestCreateError) {
    throw guestCreateError;
  }

  data = { id: guestCreatedId };
  error = null;
}
          if (error) {
            throw error;
          }


          try {
            sessionStorage.removeItem(
              CLONE_STORAGE_KEY
            );

            sessionStorage.removeItem(
              EDIT_STORAGE_KEY
            );
          } catch {}


          const savedId =
            data?.id ||
            tierListId;


          navigate(
            `/${lang}/tier-list/${savedId}`
          );
        } catch (error) {
          console.error(
            "티어표 등록 실패:",
            error
          );


          setSaveError(
            `${text.saveFailed}: ${
              error?.message ||
              text.unknownError
            }`
          );
        } finally {
          setSaving(false);
        }
      },
[
  saving,
  tierListTitle,
  lang,
  text,
  allCandidates,
  placedCount,
  uploadLocalCandidate,
  tierItems,
  selectedCup,
  sourceWorldcupId,
  customPresetName,
  editingTierListId,
  onePick,
  selectedCategory,
  tierLabels,
  navigate,
  currentUser,
  guestNickname,
  guestPassword,
  guestEditPassword,
  t,
]
    );

  const renderTierHomeButton = () => (
    <div
      style={{
        width: "100%",
        marginTop: isMobile ? 4 : 8,
        marginBottom: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={() => navigate(`/${lang}/tier-list`)}
        onMouseEnter={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow =
            "0 10px 28px rgba(25,191,255,0.30)";
        }}
        onMouseLeave={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow =
            "0 0 22px rgba(25,191,255,0.16)";
        }}
        style={{
          width: isMobile ? 110 : 140,
          height: isMobile ? 110 : 140,
          padding: 12,
          borderRadius: 16,
          border: "1px solid #19bfff",
          background:
            "linear-gradient(145deg, #073653 0%, #071a2b 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          fontSize: isMobile ? 13 : 15,
          fontWeight: 900,
          lineHeight: 1.25,
          textAlign: "center",
          cursor: "pointer",
          boxSizing: "border-box",
          boxShadow: "0 0 22px rgba(25,191,255,0.16)",
          transition:
            "transform 0.16s ease, box-shadow 0.16s ease",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 28 : 36,
            lineHeight: 1,
          }}
        >
          ←
        </span>
        <span>{text.tierHome}</span>
      </button>
    </div>
  );

  const seoTitle = t("tierList.seo.makerTitle");
  const seoDescription = t("tierList.seo.makerDescription");

      /* =========================
     id 로딩
     ========================= */

 if (
  id &&
  !selectedCup &&
  (!selectedCupResolved || selectedCupLoading) &&
  !selectedCupError
) {
  return (
    <>
      <Seo
        lang={lang}
        slug="tier-list/create"
        title={seoTitle}
        description={seoDescription}
        indexable={!id && !cloneTierListId && !editTierListId}
      />
      <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isMobile
            ? 430
            : 1480,

          margin: "0 auto",

          padding: isMobile
            ? "20px 10px"
            : "22px",

          boxSizing: "border-box",
        }}
      >

        {renderTierHomeButton()}

        <div
          style={{
            width: "fit-content",
            maxWidth: "calc(100% - 20px)",
            margin: isMobile
              ? "20px auto 0"
              : "24px auto 0",
            padding: isMobile
              ? "14px 18px"
              : "16px 22px",
            border:
              "1px solid rgba(49,90,143,0.9)",
            borderRadius: 12,
            background: "rgba(7,17,31,0.92)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: isMobile
                ? 17
                : 20,

              fontWeight: 900,

              color: "#dbeafe",
            }}
          >
            {text.loadingWorldcup}
          </div>

          <div
            style={{
              width: 34,
              height: 34,

              borderRadius: "50%",

              border:
                "3px solid #16385c",

              borderTopColor:
                "#19bfff",

              animation:
                "tierLoadingSpin 0.8s linear infinite",
            }}
          />

          <style>
            {`
              @keyframes tierLoadingSpin {
                from {
                  transform: rotate(0deg);
                }

                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </div>
    </div>
    </>
  );
}




  if (
    id &&
    !selectedCup &&
    selectedCupResolved &&
    !selectedCupLoading
  ) {
    return (
      <>
        <Seo
          lang={lang}
          slug="tier-list/create"
          title={seoTitle}
          description={seoDescription}
          indexable={false}
        />
        <div
          style={{
            minHeight: "65vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
            color: "#fff",
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              padding: isMobile ? 22 : 30,
              borderRadius: 16,
              border: "1px solid #315a8f",
              background: "#081525",
              textAlign: "center",
              boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
            }}
          >
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900 }}>
              {selectedCupError || t("not_found")}
            </div>
            <div
              style={{
                marginTop: 10,
                color: "#9fb0c7",
                fontSize: isMobile ? 13 : 15,
                lineHeight: 1.6,
              }}
            >
              {t("error_no_data")}
            </div>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 9,
                  border: "1px solid #315a8f",
                  background: "#101d32",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {t("retry")}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${lang}/tier-list/create`)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 9,
                  border: "1px solid #19bfff",
                  background: "#087aa5",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {text.changeSource}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <Seo
        lang={lang}
        slug="tier-list/create"
        title={seoTitle}
        description={seoDescription}
        indexable={!id && !cloneTierListId && !editTierListId}
      />
    <div
      style={{
        width:
          "100%",

        minHeight:
          "100vh",

        background:
          "transparent",

        color:
          "#fff",
      }}
    >
      <div
        style={{
          width:
            "100%",

          maxWidth:
            isMobile
              ? 430
              : 1480,

          margin:
            "0 auto",

          padding:
            isMobile
              ? "20px 10px"
              : "22px",

          boxSizing:
            "border-box",
        }}
      >

        {renderTierHomeButton()}

        <div
          style={{
            width: "fit-content",
            maxWidth: isMobile ? "100%" : 820,
            margin: isMobile
              ? "16px auto 0"
              : "20px auto 0",
            padding: isMobile
              ? "14px 16px"
              : "16px 24px",
            boxSizing: "border-box",
            border: "1px solid rgba(49,90,143,0.72)",
            borderRadius: 14,
            background: "rgba(7,17,31,0.72)",
            backdropFilter: "blur(3px)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin:
                0,

              fontSize:
                isMobile
                  ? 27
                  : 38,

              fontWeight:
                900,
            }}
          >
            📊{" "}
            {text.pageTitle}
          </h1>


          <div
            style={{
              marginTop:
                10,

              color:
                "#9fb0c7",

              fontSize:
                isMobile
                  ? 14
                  : 17,

              fontWeight:
                700,
            }}
          >
            {isBuilderMode
              ? text.builderDesc
              : text.sourceDesc}
          </div>
        </div>


        {/* =================================================
            소스 선택 화면
            ================================================= */}

        {!isBuilderMode ? (
          <>
            {/* 직접 이미지 업로드 */}

            <div
              onDragOver={(
                e
              ) => {
                e.preventDefault();

                setFileDragOver(
                  true
                );
              }}
              onDragLeave={() => {
                setFileDragOver(
                  false
                );
              }}
              onDrop={(
                e
              ) => {
                e.preventDefault();

                setFileDragOver(
                  false
                );


                addLocalFiles(
                  e.dataTransfer
                    .files
                );
              }}
              style={{
                marginTop:
                  28,

                padding:
                  isMobile
                    ? "26px 16px"
                    : "34px 24px",

                borderRadius:
                  14,

                border:
                  fileDragOver
                    ? "2px solid #19bfff"
                    : "1px dashed #315a8f",

                background:
                  fileDragOver
                    ? "rgba(25,191,255,0.08)"
                    : "#07111f",

                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    isMobile
                      ? 36
                      : 48,
                }}
              >
                📁
              </div>


              <div
                style={{
                  marginTop:
                    8,

                  fontSize:
                    isMobile
                      ? 18
                      : 22,

                  fontWeight:
                    900,
                }}
              >
                {text.uploadTitle}
              </div>


              <div
                style={{
                  marginTop:
                    6,

                  color:
                    "#8fa6c3",

                  fontSize:
                    isMobile
                      ? 13
                      : 15,

                  fontWeight:
                    700,
                }}
              >
                {text.uploadDesc}
              </div>


              <button
                type="button"
                onClick={() =>
                  fileInputRef
                    .current
                    ?.click()
                }
                style={{
                  marginTop:
                    16,

                  padding:
                    "11px 22px",

                  borderRadius:
                    9,

                  border:
                    "1px solid #19bfff",

                  background:
                    "#087ba8",

                  color:
                    "#fff",

                  cursor:
                    "pointer",

                  fontWeight:
                    900,
                }}
              >
                ＋{" "}
                {text.chooseImages}
              </button>


              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                multiple
                onChange={(
                  e
                ) => {
                  addLocalFiles(
                    e.target.files
                  );

                  e.target.value =
                    "";
                }}
                style={{
                  display:
                    "none",
                }}
              />
            </div>


            {/* OR */}

            <div
              style={{
                margin:
                  "32px 0 15px",

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  12,

                color:
                  "#74859b",
              }}
            >
              <div
                style={{
                  flex:
                    1,

                  height:
                    1,

                  background:
                    "#24364e",
                }}
              />


              <span
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    900,
                }}
              >
                {text.or}
              </span>


              <div
                style={{
                  flex:
                    1,

                  height:
                    1,

                  background:
                    "#24364e",
                }}
              />
            </div>


            {/* 기존 이상형 월드컵 */}

            <div
              style={{
                padding:
                  isMobile
                    ? 14
                    : 18,

                border:
                  "1px solid rgba(25,191,255,0.32)",

                borderRadius:
                  14,

                background:
                  "rgba(7,26,43,0.78)",
              }}
            >
              <div
                style={{
                  fontSize:
                    isMobile
                      ? 17
                      : 20,

                  fontWeight:
                    900,

                  color:
                    "#64d8ff",

                  textAlign:
                    "center",
                }}
              >
                ⭐{" "}
                {text.importWorldcupTitle}
              </div>


      <div
  style={{
    marginTop: 6,
    color: "#9fb0c7",
    fontSize: isMobile ? 13 : 15,
    fontWeight: 700,
    lineHeight: 1.5,
    textAlign: "center",
  }}
>
  {text.importWorldcupDesc}
</div>

<div
  style={{
    marginTop: 10,
    color: "#64d8ff",
    fontSize: isMobile ? 14 : 16,
    fontWeight: 900,
    lineHeight: 1.5,
    textAlign: "center",
  }}
>
  {text.importGuide}
</div>

<div
  style={{
    marginTop: 2,
    textAlign: "center",
    color: "#64d8ff",
    fontSize: isMobile
      ? 22
      : 28,
    lineHeight: 1,
    fontWeight: 900,
  }}
>
  ↓
</div>
            </div>

<div
  style={{
    marginTop: 16,
    display: "flex",
    justifyContent: "center",
  }}
>
  <input
    type="text"
    value={presetSearch}
    onChange={(e) => {
      setPresetSearch(
        e.target.value
      );

      setPresetVisibleCount(8);
    }}
    placeholder={
      text.presetSearchPlaceholder
    }
    style={{
      width: isMobile
        ? "100%"
        : 720,

      height: 42,

      padding: "0 13px",

      boxSizing:
        "border-box",

      borderRadius: 8,

      border:
        "1px solid #315a8f",

      background:
        "#0b1628",

      color: "#fff",

      outline: "none",

      fontSize: 14,

      fontWeight: 700,
    }}
  />
</div>

            {winnerLoading && (
              <div
                style={{
                  marginTop:
                    15,

                  textAlign:
                    "center",

                  color:
                    "#8fb8e8",

                  fontWeight:
                    800,
                }}
              >
                {text.loadingWinners}
              </div>
            )}


            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(4, minmax(0, 1fr))",
                gap: isMobile ? 12 : 16,
                width: isMobile
                  ? "100%"
                  : "min(1320px, calc(100vw - 80px))",
                position: isMobile ? "static" : "relative",
                left: isMobile ? "auto" : "50%",
                transform: isMobile ? "none" : "translateX(-50%)",
              }}
            >
           {filteredPresetWorldcups
  .slice(
    0,
    presetVisibleCount
  )
  .map(
                (
                  cup
                ) => {
                  const winner =
                    winnerMap[
                      String(
                        cup.id
                      )
                    ] ||
                    null;


                  const fallback =
                    Array.isArray(
                      cup.data
                    )
                      ? (
                        cup.data.find(
                          (
                            candidate
                          ) =>
                            candidate
                              ?.image
                        ) ||
                        null
                      )
                      : null;


                  const thumbnail =
                    winner ||
                    fallback;


                  return (
                    <button
                      key={
                        cup.id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          `/${lang}/tier-list/create/${cup.id}`
                        )
                      }
                      style={{
                        padding:
                          0,

                        borderRadius:
                          14,

                        overflow:
                          "hidden",

                        border:
                          "1px solid #27466f",

                        background:
                          "#0b1628",

                        color:
                          "#fff",

                        cursor:
                          "pointer",

                        textAlign:
                          "left",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "100%",

                          height:
                            isMobile ? 145 : 180,

                          background:
                            "#07111f",

                          overflow:
                            "hidden",
                        }}
                      >
                        {thumbnail?.image ? (
                          <MediaRenderer
                            url={
                              thumbnail.image
                            }
                            alt={
                              getTitle(
                                cup
                              )
                            }
                            playable={
                              false
                            }
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              objectFit:
                                "cover",

                              display:
                                "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              color:
                                "#607086",

                              fontWeight:
                                800,
                            }}
                          >
                            {text.noImage}
                          </div>
                        )}
                      </div>


                      <div
                        style={{
                          padding:
                            "12px 14px 5px",

                          fontSize:
                            isMobile
                              ? 16
                              : 19,

                          fontWeight:
                            900,
                          lineHeight: 1.35,
                          minHeight: isMobile ? 44 : 52,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {getTitle(
                          cup
                        )}
                      </div>


                      <div
                        style={{
                          padding:
                            "0 14px 13px",

                          color:
                            "#8fb8e8",

                          fontSize:
                            13,

                          fontWeight:
                            700,
                        }}
                      >
                        {Array.isArray(
                          cup.data
                        )
                          ? cup
                              .data
                              .length
                          : 0}{" "}

                        {text.candidates}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {presetVisibleCount <
  filteredPresetWorldcups.length && (
  <div
    style={{
      marginTop: 18,
      textAlign: "center",
    }}
  >
    <button
      type="button"
      onClick={() =>
        setPresetVisibleCount(
          (prev) => prev + 8
        )
      }
      style={{
        padding: "12px 28px",
        borderRadius: 8,
        border:
          "1px solid #315a8f",
        background: "#14243d",
        color: "#fff",
        fontSize: 15,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {text.loadMore}
    </button>

    <div
      style={{
        marginTop: 7,
        color: "#7187a3",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {Math.min(
        presetVisibleCount,
        filteredPresetWorldcups.length
      )}
      /
      {
        filteredPresetWorldcups.length
      }
    </div>
  </div>
)}
          </>
        ) : (
  /* =================================================
             티어 편집
             ================================================= */

          <div
            style={{
              marginTop:
                30,
            }}
          >
            {/* 상단 */}

            <div
              style={{
                width: "100%",
                maxWidth: 980,
                margin: "0 auto 18px",
                padding: isMobile ? "16px 14px" : "22px",
                boxSizing: "border-box",
                borderRadius: 18,
                background: "#f3f4f6",
                border: "1px solid #d7dce4",
                boxShadow: "0 14px 34px rgba(0,0,0,0.16)",
                color: "#111827",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.25fr 0.85fr",
                  gap: isMobile ? 12 : 14,
                  alignItems: "stretch",
                }}
              >
                <TierTagEditor
                  value={tierLabels._tags}
                  onChange={(tags) =>
                    setTierLabels((prev) => ({
                      ...prev,
                      _tags: tags,
                    }))
                  }
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "12px 14px 14px",
                    boxSizing: "border-box",
                    border: "1px solid #d7dce4",
                    borderRadius: 12,
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#374151",
                        fontSize: 14,
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      {text.sourcePresetLabel}
                    </div>

                    {sourceWorldcupId ? (
                      <div
                        style={{
                          minHeight: 42,
                          padding: "10px 12px",
                          boxSizing: "border-box",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          background: "#fff",
                          color: "#111827",
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.35,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                        }}
                      >
                        {sourcePresetName}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={customPresetName}
                        onChange={(e) => setCustomPresetName(e.target.value)}
                        placeholder={text.customPresetPlaceholder}
                        maxLength={60}
                        style={{
                          width: "100%",
                          height: 42,
                          padding: "0 12px",
                          boxSizing: "border-box",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          background: "#fff",
                          color: "#111827",
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#374151",
                        fontSize: 14,
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      {text.categoryLabel}
                    </div>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={saving}
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#111827",
                        fontSize: 14,
                        fontWeight: 700,
                        outline: "none",
                      }}
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`tierList.categories.${option.value}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <input
                value={tierListTitle}
                onChange={(e) => setTierListTitle(e.target.value)}
                placeholder={text.titlePlaceholder}
                maxLength={80}
                style={{
                  width: "100%",
                  height: 48,
                  marginTop: 12,
                  boxSizing: "border-box",
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#111827",
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 700,
                  outline: "none",
                }}
              />

              <div
                style={{
                  marginTop: 8,
                  color: "#4b5563",
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {allCandidates.length} {text.candidates} · {placedCount} {text.ranked}
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "#374151",
                  fontSize: isMobile ? 14 : 17,
                  fontWeight: 800,
                  lineHeight: 1.45,
                  textAlign: "center",
                }}
              >
                {text.tierNameGuide}
              </div>

              {authReady && !currentUser && (
                <div
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: 14,
                    boxSizing: "border-box",
                    border: "1px solid #d7dce4",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#2563eb",
                      marginBottom: 10,
                    }}
                  >
                    {editingTierListId ? text.guestEditTitle : text.guestPublishTitle}
                  </div>

                  <input
                    type="text"
                    value={guestNickname}
                    onChange={(e) => setGuestNickname(e.target.value.slice(0, 20))}
                    placeholder={text.guestNicknamePlaceholder}
                    autoComplete="nickname"
                    style={{
                      width: "100%",
                      height: 42,
                      boxSizing: "border-box",
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#f9fafb",
                      color: "#111827",
                      outline: "none",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />

                  <input
                    type="password"
                    value={editingTierListId ? guestEditPassword : guestPassword}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 50);
                      setGuestPassword(value);
                      if (editingTierListId) {
                        setGuestEditPassword(value);
                      }
                    }}
                    placeholder={text.guestPasswordPlaceholder}
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      height: 42,
                      marginTop: 8,
                      boxSizing: "border-box",
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#f9fafb",
                      color: "#111827",
                      outline: "none",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />

                  <div
                    style={{
                      marginTop: 9,
                      color: "#6b7280",
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    {text.guestPasswordGuide}
                  </div>
                </div>
              )}

              {draftMessage && (
                <div
                  style={{
                    marginTop: 10,
                    color: "#2563eb",
                    fontSize: 14,
                    fontWeight: 900,
                    textAlign: "center",
                  }}
                >
                  {draftMessage}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: isMobile ? 8 : 10,
                  flexWrap: "wrap",
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={backToSourceSelection}
                  disabled={saving}
                  style={{
                    padding: isMobile ? "11px 14px" : "12px 18px",
                    borderRadius: 9,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#1f2937",
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 800,
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.5 : 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {text.changeSource}
                </button>

                <button
                  type="button"
                  onClick={resetRanking}
                  disabled={saving}
                  style={{
                    padding: isMobile ? "11px 14px" : "12px 18px",
                    borderRadius: 9,
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 800,
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {text.reset}
                </button>

                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  style={{
                    padding: isMobile ? "11px 14px" : "12px 18px",
                    borderRadius: 9,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 800,
                    cursor: saving ? "default" : "pointer",
                  }}
                >
                  {t("tierListMakerUi.draftSave")}
                </button>

                <button
                  type="button"
                  onClick={loadDraft}
                  disabled={saving}
                  style={{
                    padding: isMobile ? "11px 14px" : "12px 18px",
                    borderRadius: 9,
                    border: "1px solid #bfdbfe",
                    background: "#fff",
                    color: "#2563eb",
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: 800,
                    cursor: saving ? "default" : "pointer",
                  }}
                >
                  {t("tierListMakerUi.draftLoad")}
                </button>

                <button
                  type="button"
                  onClick={saveTierList}
                  disabled={saving}
                  style={{
                    padding: isMobile ? "11px 20px" : "12px 26px",
                    borderRadius: 9,
                    border: "none",
                    background: "linear-gradient(90deg,#2f80ed,#3b82f6 100%)",
                    color: "#fff",
                    fontSize: isMobile ? 14 : 17,
                    fontWeight: 900,
                    cursor: saving ? "default" : "pointer",
                    minWidth: 140,
                    boxShadow: "0 8px 18px rgba(59,130,246,0.25)",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? editingTierListId
                      ? text.updateSaving
                      : text.saving
                    : editingTierListId
                      ? text.saveChanges
                      : text.publish}
                </button>
              </div>
            </div>


            {/* 저장 오류 */}

            {saveError && (
              <div
                style={{
                  marginBottom:
                    16,

                  padding:
                    "11px 13px",

                  borderRadius:
                    8,

                  border:
                    "1px solid #b34258",

                  background:
                    "#35121b",

                  color:
                    "#ff9aae",

                  fontWeight:
                    800,

                  fontSize:
                    14,
                }}
              >
                {saveError}
              </div>
            )}



            {isMobile &&
              selectedMobileItem && (
              <div
                style={{
                  marginBottom: 18,
                  padding: 12,
                  border: "1px solid #315a8f",
                  borderRadius: 12,
                  background: "#0b1628",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    marginBottom: 9,
                    color: "#dce9f8",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {text.mobileSelectGuide}: {selectedMobileItem.name || text.untitledCandidate}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() =>
                        handleMobilePlacement(tier)
                      }
                      style={{
                        minWidth: 44,
                        height: 38,
                        borderRadius: 8,
                        border: `1px solid ${TIER_COLORS[tier]}`,
                        background: "#07111f",
                        color: "#fff",
                        fontWeight: 900,
                      }}
                    >
                      {tier}
                    </button>
                  ))}

                  {placedKeys.has(
                    selectedMobileItem._tierKey
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleMobilePlacement("ONE_PICK")
                      }
                      style={{
                        height: 38,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: "1px solid #19bfff",
                        background: "#073653",
                        color: "#fff",
                        fontWeight: 900,
                      }}
                    >
                      ⭐ {text.onePickTitle}
                    </button>
                  )}

                  {placedKeys.has(
                    selectedMobileItem._tierKey
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleMobilePlacement("UNRANKED")
                      }
                      style={{
                        height: 38,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: "1px solid #315a8f",
                        background: "#101d32",
                        color: "#fff",
                        fontWeight: 900,
                      }}
                    >
                      {text.moveUnranked}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ============================================
                나만의 원픽
                ============================================ */}

            <div
              style={{
                marginBottom:
                  26,

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    isMobile
                      ? 22
                      : 28,

                  fontWeight:
                    900,

                  color:
                    "#fff",
                }}
              >
                ⭐{" "}
                {text.onePickTitle}
              </div>


              <div
                style={{
                  marginTop:
                    6,

                  color:
                    "#8fa6c3",

                  fontSize:
                    isMobile
                      ? 12
                      : 14,

                  fontWeight:
                    700,
                }}
              >
                {text.onePickDesc}
              </div>


              <div
                onDragOver={(
                  e
                ) => {
                  e.preventDefault();

                  e.dataTransfer.dropEffect =
                    "copy";
                }}
                onDrop={
                  handleOnePickDrop
                }
                style={{
                  marginTop:
                    14,

                  width:
                    isMobile
                      ? 190
                      : 230,

                  minHeight:
                    isMobile
                      ? 190
                      : 230,

                  boxSizing:
                    "border-box",

                  padding:
                    12,

                  borderRadius:
                    16,

                  border:
                    "2px dashed #19bfff",

                  background:
                    "linear-gradient(180deg, rgba(25,191,255,0.11), rgba(7,17,31,0.96))",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  position:
                    "relative",
                }}
              >
                {onePick ? (
                  <div
                    style={{
                      width:
                        "100%",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "100%",

                        aspectRatio:
                          "1 / 1",

                        overflow:
                          "hidden",

                        borderRadius:
                          11,

                        background:
                          "#07111f",

                        border:
                          "1px solid #315a8f",
                      }}
                    >
                      {onePick.image ? (
                        onePick._source ===
                        "local" ? (
                          <img
                            src={
                              onePick.image
                            }
                            alt={
                              onePick.name ||
                              ""
                            }
                            draggable={
                              false
                            }
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                          objectFit: "contain",
objectPosition: "center",

                              display:
                                "block",
                            }}
                          />
                        ) : (
                          <MediaRenderer
                            url={
                              onePick.image
                            }
                            alt={
                              onePick.name ||
                              ""
                            }
                            playable={
                              false
                            }
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                        objectFit: "contain",
objectPosition: "center",

                              display:
                                "block",
                            }}
                          />
                        )
                      ) : (
                        <div
                          style={{
                            width:
                              "100%",

                            height:
                              "100%",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            color:
                              "#607086",

                            fontWeight:
                              800,
                          }}
                        >
                          {text.noImage}
                        </div>
                      )}
                    </div>


                    <div
                      style={{
                        marginTop:
                          8,

                        fontSize:
                          isMobile
                            ? 14
                            : 16,

                        fontWeight:
                          900,

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {onePick.name ||
                        text.untitledCandidate}
                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        setOnePick(
                          null
                        )
                      }
                      style={{
                        marginTop:
                          8,

                        padding:
                          "6px 11px",

                        border:
                          "1px solid #315a8f",

                        borderRadius:
                          7,

                        background:
                          "#101d32",

                        color:
                          "#aebdd2",

                        cursor:
                          "pointer",

                        fontSize:
                          12,

                        fontWeight:
                          800,
                      }}
                    >
                      ×{" "}
                      {text.clearOnePick}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      color:
                        "#6f849f",

                      fontSize:
                        isMobile
                          ? 13
                          : 14,

                      fontWeight:
                        800,

                      lineHeight:
                        1.6,

                      padding:
                        10,
                    }}
                  >
                    ⭐
                    <br />
                    {text.onePickEmpty}
                  </div>
                )}
              </div>
            </div>


            {/* ============================================
                S / A / B / C / D
                ============================================ */}

            {TIERS.map(
              (
                tier
              ) => (
                <div
                  key={
                    tier
                  }
                  onDragOver={(
                    e
                  ) => {
                    e.preventDefault();

                    e.dataTransfer.dropEffect =
                      "move";
                  }}
                  onDrop={(
                    e
                  ) =>
                    handleTierDrop(
                      e,
                      tier
                    )
                  }
                  style={{
                    minHeight:
                      isMobile
                        ? 105
                        : 132,

                    display:
                      "flex",

                    marginBottom:
                      8,

                    border:
                      "1px solid #27466f",

                    background:
                      "#0b1628",

                    borderRadius:
                      8,

                    overflow:
                      "hidden",

                    transform:
                      "translateZ(0)",
                  }}
                >
                  {/* 티어 이름 */}

                  <div
                    style={{
                      width:
                        isMobile
                          ? 66
                          : 100,

                      minWidth:
                        isMobile
                          ? 66
                          : 100,

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      background:
                        TIER_COLORS[
                          tier
                        ],

                      color:
                        "#111",
                    }}
                  >
                    <input
                      value={
                        tierLabels[
                          tier
                        ] ||
                        ""
                      }
                      onChange={(
                        e
                      ) => {
                        const value =
                          e.target.value.slice(
                            0,
                            20
                          );


                        setTierLabels(
                          (
                            prev
                          ) => ({
                            ...prev,

                            [tier]:
                              value,
                          })
                        );
                      }}
                      disabled={
                        saving
                      }
                      aria-label={`${text.tierNameLabel} ${tier}`}
                      title={`${text.tierNameLabel}: ${tier}`}
                      style={{
                        width:
                          "100%",

                        maxWidth:
                          isMobile
                            ? 58
                            : 92,

                        padding:
                          "0 4px",

                        border:
                          "none",

                        outline:
                          "none",

                        background:
                          "transparent",

                        color:
                          "#111",

                        textAlign:
                          "center",

                        fontSize:
                          isMobile
                            ? 20
                            : 27,

                        fontWeight:
                          900,

                        boxSizing:
                          "border-box",
                      }}
                    />
                  </div>


                  {/* 티어 후보 */}

                  <div
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,

                      display:
                        "flex",

                      alignItems:
                        "flex-start",

                      gap:
                        8,

                      flexWrap:
                        "wrap",

                      padding:
                        10,
                    }}
                  >
                    {tierItems[
                      tier
                    ].map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item._tierKey
                          }
                          onDoubleClick={() =>
                            returnToUnranked(
                              item
                            )
                          }
                        >
                          <CandidateCard
                            item={
                              item
                            }
                            compact
                            isMobile={
                              isMobile
                            }
                            text={
                              text
                            }
                            onDragStartItem={
                              handleDragStartItem
                            }
                            onDragEndItem={
                              handleDragEndItem
                            }
                            onRemoveLocal={
                              removeLocalCandidate
                            }
                            onSelectItem={
                              setSelectedMobileItem
                            }
                          />
                        </div>
                      )
                    )}


                    {tierItems[
                      tier
                    ].length ===
                      0 && (
                      <div
                        style={{
                          alignSelf:
                            "center",

                          color:
                            "#607086",

                          fontSize:
                            13,

                          fontWeight:
                            700,
                        }}
                      >
                        {text.dropHere}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}


            {/* 티어표와 미분류 후보 사이 등록 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 20,
                marginBottom: 4,
              }}
            >
              <button
                type="button"
                onClick={saveTierList}
                disabled={saving}
                style={{
                  minWidth: isMobile ? 170 : 220,
                  padding: isMobile ? "11px 18px" : "12px 24px",
                  borderRadius: 10,
                  border: "1px solid #19bfff",
                  background: saving
                    ? "rgba(57,85,106,0.88)"
                    : "rgba(8,123,168,0.92)",
                  color: "#fff",
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 900,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
                  backdropFilter: "blur(3px)",
                }}
              >
                {saving
                  ? editingTierListId
                    ? text.updateSaving
                    : text.saving
                  : editingTierListId
                    ? text.saveChanges
                    : text.registerMiddle}
              </button>
            </div>


            {/* ============================================
                미분류 후보
                ============================================ */}

            <div
              onDragOver={(
                e
              ) => {
                e.preventDefault();

                e.dataTransfer.dropEffect =
                  "move";
              }}
              onDrop={
                handleUnrankedDrop
              }
              style={{
                marginTop:
                  24,

                padding:
                  16,

                borderRadius:
                  12,

                background:
                  "#07111f",

                border:
                  "1px solid #27466f",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  gap:
                    12,

                  alignItems:
                    "center",

                  flexWrap:
                    "wrap",

                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    fontSize:
                      18,

                    fontWeight:
                      900,
                  }}
                >
                  {text.unrankedCandidates}

                  {" · "}

                  {unrankedCandidates.length}
                </div>


                <label
                  style={{
                    padding:
                      "8px 13px",

                    borderRadius:
                      8,

                    border:
                      "1px solid #19bfff",

                    background:
                      "#073653",

                    color:
                      "#fff",

                    fontSize:
                      13,

                    fontWeight:
                      900,

                    cursor:
                      "pointer",
                  }}
                >
                  ＋{" "}
                  {text.addImages}


                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(
                      e
                    ) => {
                      addLocalFiles(
                        e.target.files
                      );


                      e.target.value =
                        "";
                    }}
                    style={{
                      display:
                        "none",
                    }}
                  />
                </label>
              </div>


              {/* 검색 */}

              <div
                style={{
                  position:
                    "relative",

                  marginBottom:
                    14,
                }}
              >
                <input
                  type="text"
                  value={
                    searchKeyword
                  }
                  onChange={(
                    e
                  ) =>
                    setSearchKeyword(
                      e.target.value
                    )
                  }
                  placeholder={
                    text.searchPlaceholder
                  }
                  style={{
                    width:
                      "100%",

                    height:
                      42,

                    boxSizing:
                      "border-box",

                    padding:
                      "0 42px 0 13px",

                    borderRadius:
                      8,

                    border:
                      "1px solid #315a8f",

                    background:
                      "#0b1628",

                    color:
                      "#fff",

                    outline:
                      "none",

                    fontSize:
                      14,

                    fontWeight:
                      700,
                  }}
                />


                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchKeyword(
                        ""
                      )
                    }
                    style={{
                      position:
                        "absolute",

                      right:
                        8,

                      top:
                        "50%",

                      transform:
                        "translateY(-50%)",

                      width:
                        28,

                      height:
                        28,

                      border:
                        "none",

                      borderRadius:
                        "50%",

                      background:
                        "#17263a",

                      color:
                        "#aebdd2",

                      cursor:
                        "pointer",

                      fontSize:
                        16,

                      fontWeight:
                        900,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>


              {searchKeyword && (
                <div
                  style={{
                    marginBottom:
                      10,

                    color:
                      "#7fa8d7",

                    fontSize:
                      12,

                    fontWeight:
                      800,
                  }}
                >
                  {text.searchResult(
                    visibleCandidates.length
                  )}
                </div>
              )}


              {/* 후보 그리드 */}

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    isMobile
                      ? "repeat(3, minmax(0, 1fr))"
                      : "repeat(8, minmax(0, 1fr))",

                  gap: 8,

                  // 후보가 많아져도 페이지 전체가 끝없이 길어지지 않도록
                  // 이 후보 영역 자체에 스크롤바를 만듭니다.
                  maxHeight: isMobile ? 520 : 650,
                  overflowY: "auto",
                  overflowX: "hidden",
                  paddingRight: 4,
                  overscrollBehavior: "contain",
                  scrollbarGutter: "stable",
                }}
              >
            {visibleCandidates
  .slice(0, visibleCandidateCount)
  .map(
                  (
                    item
                  ) => (
                    <CandidateCard
                      key={
                        item._tierKey
                      }
                      item={
                        item
                      }
                      isMobile={
                        isMobile
                      }
                      text={
                        text
                      }
                      onDragStartItem={
                        handleDragStartItem
                      }
                      onDragEndItem={
                        handleDragEndItem
                      }
                      onRemoveLocal={
                        removeLocalCandidate
                      }
                      onSelectItem={
                        setSelectedMobileItem
                      }
                    />
                  )
                )}
              </div>

{visibleCandidates.length > visibleCandidateCount && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      marginTop: 16,
    }}
  >
    <button
      type="button"
      onClick={() =>
        setVisibleCandidateCount(
          (prev) => prev + 80
        )
      }
      style={{
        minWidth: 160,
        padding: "11px 20px",
        borderRadius: 8,
        border: "1px solid #315a8f",
        background: "#101d32",
        color: "#fff",
        fontSize: 14,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {text.loadMore}
    </button>
  </div>
)}

              {visibleCandidates.length ===
                0 && (
                <div
                  style={{
                    padding:
                      "24px 10px",

                    textAlign:
                      "center",

                    color:
                      "#607086",

                    fontWeight:
                      800,
                  }}
                >
                  {text.noSearchResult}
                </div>
              )}
            </div>


            {/* 이미지 재사용 안내 */}

            <div
              style={{
                width: "fit-content",
                maxWidth: "100%",
                margin: "18px auto 0",
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(7,17,31,0.94)",
                border: "1px solid rgba(25,191,255,0.42)",
                boxShadow: "0 5px 18px rgba(0,0,0,0.22)",
                color: "#c7eaff",
                fontSize: isMobile ? 13 : 15,
                fontWeight: 800,
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              {text.imageReuseNotice}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


export default TierListMaker;