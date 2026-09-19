import { TierTags, PresetTitle } from "./TierTagTools";
import "../registerPresetTranslations";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import MediaRenderer from "./MediaRenderer";
import Seo from "../seo/Seo";

import {
  supabase,
} from "../utils/supabaseClient";

import {
  getUserOrGuestId,
} from "../utils";


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


const CLONE_STORAGE_KEY =
  "onepick_tier_clone_v1";

const EDIT_STORAGE_KEY =
  "onepick_tier_edit_v1";

const WORLDCUP_FROM_TIER_STORAGE_KEY =
  "onepick_worldcup_from_tier_v1";

  function getTierListTitle(tierList, lang, fallback = "Tier List") {
  if (!tierList) return fallback;

  let translations = tierList.title_translations || {};

  // 혹시 문자열 형태로 들어오는 경우도 대비
  if (typeof translations === "string") {
    try {
      translations = JSON.parse(translations);
    } catch {
      translations = {};
    }
  }

  return (
    translations?.[lang] ||
    translations?.en ||
    tierList.title ||
    fallback
  );
}

/* =========================================================
   Canvas export helpers
   ========================================================= */

function roundedRect(ctx, x, y, width, height, radius = 12) {
  const safeRadius = Math.max(
    0,
    Math.min(Number(radius) || 0, Math.abs(width) / 2, Math.abs(height) / 2)
  );

  ctx.beginPath();

  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, safeRadius);
    return;
  }

  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function loadCanvasImage(url) {
  return new Promise((resolve) => {
    if (!url || typeof Image === "undefined") {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), 12000);
    image.onload = () => finish(image);
    image.onerror = () => finish(null);

    try {
      image.src = String(url);
    } catch {
      finish(null);
    }
  });
}


/* =========================================================
   결과 페이지 문구

   지금은 여기 묶어두고
   티어표 완성 후 기존 16개 언어 번역 파일로 이동
   ========================================================= */



/* =========================================================
   TierListResultPage
   ========================================================= */

function TierListResultPage() {
  const navigate =
    useNavigate();


  const {
    id,
  } =
    useParams();


  const {
    t,
    i18n,
  } =
    useTranslation();


  const lang =
    (
      i18n.language ||
      "en"
    ).split("-")[0];


  const text =
    useMemo(
      () => ({
        loading: t("tierList.result.loading"),
        loadFailed: t("tierList.result.loadFailed"),
        notFound: t("tierList.result.notFound"),
        tierHome: t("tierList.result.tierHome"),
        tierList: t("tierList.result.tierList"),
        onePickTitle: t("tierList.common.onePick"),
        onePickEmpty: t("tierList.result.onePickEmpty"),
        author: t("tierList.common.author"),
        guestAuthor: t("tierList.common.guestAuthor"),
        unknownAuthor: t("tierList.common.unknownAuthor"),
        share: t("tierList.common.share"),
        shareText: (title) => t("tierList.result.shareText", { title }),
        linkCopied: t("tierList.result.linkCopied"),
        download: t("tierList.result.download"),
        downloading: t("tierList.result.downloading"),
        downloadFailed: t("tierList.result.downloadFailed"),
        createWithCandidates: t("tierList.result.createWithCandidates"),
        edit: t("tierList.common.edit"),
        delete: t("tierList.common.delete"),
        deleteConfirm: t("tierList.result.deleteConfirm"),
        deleting: t("tierList.result.deleting"),
        deleteFailed: t("tierList.result.deleteFailed"),
        createTierList: t("tierList.result.createTierList"),
        usedPreset: t("tierList.result.usedPreset"),
        createBracketFromTier: t("tierList.result.createBracketFromTier"),
        createBracketFromPreset: t("tierList.result.createBracketFromPreset"),
        comments: t("tierList.common.comments"),
        nickname: t("tierList.common.nickname"),
        commentPlaceholder: t("tierList.result.commentPlaceholder"),
        nicknameRequired: t("tierList.result.nicknameRequired"),
        commentRequired: t("tierList.result.commentRequired"),
        commentMax: t("tierList.result.commentMax"),
        commentPostFailed: t("tierList.result.commentPostFailed"),
        posting: t("tierList.result.posting"),
        post: t("tierList.result.post"),
        noComments: t("tierList.result.noComments"),
        anonymous: t("tierList.common.anonymous"),
        unknownError: t("tierList.common.unknownError"),
        untitled: t("tierList.common.untitledCandidate"),
        guestPasswordPrompt: t("tierList.result.guestPasswordPrompt"),
        guestPasswordWrong: t("tierList.result.guestPasswordWrong"),
        guestPasswordRequired: t("tierList.result.guestPasswordRequired"),
        like: t("tierList.result.like"),
        liked: t("tierList.result.liked"),
        views: t("tierList.result.views"),
        likes: t("tierList.result.likes"),
        remixes: t("tierList.result.remixes"),
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


  const [
    tierList,
    setTierList,
  ] =
    useState(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    comments,
    setComments,
  ] =
    useState(
      []
    );


  const [
    commentLoading,
    setCommentLoading,
  ] =
    useState(
      false
    );


  const [
    commentText,
    setCommentText,
  ] =
    useState(
      ""
    );


  const [
    nickname,
    setNickname,
  ] =
    useState(
      ""
    );


  const [
    currentUser,
    setCurrentUser,
  ] =
    useState(
      null
    );
const [
  isAdmin,
  setIsAdmin,
] = useState(false);

  const [
    authorName,
    setAuthorName,
  ] =
    useState(
      ""
    );


  const [
    shareMessage,
    setShareMessage,
  ] =
    useState(
      ""
    );


  const [
    downloading,
    setDownloading,
  ] =
    useState(
      false
    );


  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false
    );


  const [
    liked,
    setLiked,
  ] =
    useState(false);


  const [
    likeLoading,
    setLikeLoading,
  ] =
    useState(false);


  /* =========================
     반응형
     ========================= */

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


  /* =========================
     현재 사용자
     ========================= */

  useEffect(() => {
    let mounted =
      true;


    async function loadUser() {
      try {
        const {
          data,
        } =
          await supabase
            .auth
            .getUser();


        const user =
          data?.user ||
          null;


        if (
          !mounted
        ) {
          return;
        }


        setCurrentUser(
          user
        );


        if (
          user?.id
        ) {
          const {
            data:
              profile,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "nickname"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();


if (mounted) {
  setNickname(
    profile?.nickname || ""
  );

  setIsAdmin(
    profile?.nickname === "admin"
  );
}
        } else {
          const savedGuestName =
            localStorage
              .getItem(
                "tier_list_guest_nickname"
              );


          if (
            savedGuestName
          ) {
            setNickname(
              savedGuestName
            );
          }
        }
      } catch (
        userError
      ) {
        console.error(
          "사용자 정보 조회 실패:",
          userError
        );
      }
    }


    loadUser();


    return () => {
      mounted =
        false;
    };
  }, []);


  /* =========================
     티어표 불러오기
     ========================= */

  const fetchTierList =
    useCallback(
      async () => {
        if (
          !id
        ) {
          return;
        }


        setLoading(
          true
        );

        setError(
          ""
        );


        try {
          const {
            data,
            error:
              fetchError,
          } =
            await supabase
              .from(
                "tier_lists"
              )
              .select(
                "*"
              )
              .eq(
                "id",
                id
              )
              .single();


          if (
            fetchError
          ) {
            throw fetchError;
          }


          setTierList(
            data
          );
        } catch (
          fetchError
        ) {
          console.error(
            "티어표 조회 실패:",
            fetchError
          );


          setError(
            text.loadFailed
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        id,
        text.loadFailed,
      ]
    );


  useEffect(() => {
    fetchTierList();
  }, [
    fetchTierList,
  ]);


  /* =========================
     조회수 / 좋아요 상태
     ========================= */

  useEffect(() => {
    if (!id) {
      return;
    }

    const key =
      `onepick_tier_viewed_${id}`;

    try {
      if (sessionStorage.getItem(key)) {
        return;
      }
      sessionStorage.setItem(key, "1");
    } catch {}

    supabase
      .rpc(
        "increment_tier_list_view",
        {
          p_tier_list_id: id,
        }
      )
      .then(({ error: viewError }) => {
        if (!viewError) {
          setTierList((current) =>
            current
              ? {
                  ...current,
                  view_count:
                    Number(current.view_count || 0) + 1,
                }
              : current
          );
        }
      });
  }, [id]);


  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    async function loadLikeStatus() {
      try {
        const { guest_id } =
          await getUserOrGuestId();

        const {
          data,
          error: likeStatusError,
        } = await supabase.rpc(
          "get_tier_list_like_status",
          {
            p_tier_list_id: id,
            p_guest_id: guest_id || null,
          }
        );

        if (!cancelled && !likeStatusError) {
          setLiked(Boolean(data));
        }
      } catch (likeStatusError) {
        console.warn(
          "Tier list like status failed",
          likeStatusError
        );
      }
    }

    loadLikeStatus();

    return () => {
      cancelled = true;
    };
  }, [id]);


  const handleLike =
    async () => {
      if (!id || likeLoading) {
        return;
      }

      setLikeLoading(true);

      try {
        const { guest_id } =
          await getUserOrGuestId();

        const {
          data,
          error: likeError,
        } = await supabase.rpc(
          "toggle_tier_list_like",
          {
            p_tier_list_id: id,
            p_guest_id: guest_id || null,
          }
        );

        if (likeError) {
          throw likeError;
        }

        const nextLiked =
          typeof data === "boolean"
            ? data
            : !liked;

        setLiked(nextLiked);
        setTierList((current) =>
          current
            ? {
                ...current,
                like_count: Math.max(
                  0,
                  Number(current.like_count || 0) +
                    (nextLiked ? 1 : -1)
                ),
              }
            : current
        );
      } catch (likeError) {
        console.warn(
          "Tier list like toggle failed",
          likeError
        );
      } finally {
        setLikeLoading(false);
      }
    };


  /* =========================
     작성자
     ========================= */

  useEffect(() => {
    let cancelled =
      false;


    async function loadAuthor() {
      if (
        !tierList
      ) {
        return;
      }


      if (
        !tierList.user_id
      ) {
        setAuthorName(
          tierList.guest_nickname ||
          text.guestAuthor
        );

        return;
      }


      try {
        const {
          data,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "nickname"
            )
            .eq(
              "id",
              tierList.user_id
            )
            .maybeSingle();


        if (
          !cancelled
        ) {
          setAuthorName(
            data
              ?.nickname ||
            text.unknownAuthor
          );
        }
      } catch (
        authorError
      ) {
        console.error(
          "티어표 작성자 조회 실패:",
          authorError
        );


        if (
          !cancelled
        ) {
          setAuthorName(
            text.unknownAuthor
          );
        }
      }
    }


    loadAuthor();


    return () => {
      cancelled =
        true;
    };
  }, [
    tierList,
    text.guestAuthor,
    text.unknownAuthor,
  ]);


  /* =========================
     본인 글 여부
     ========================= */

  const isMemberOwner =
    Boolean(
      currentUser?.id &&
      tierList?.user_id &&
      String(currentUser.id) ===
        String(tierList.user_id)
    );


  const isGuestPost =
    Boolean(
      tierList &&
      !tierList.user_id
    );


const canManage =
  isAdmin ||
  isMemberOwner ||
  isGuestPost;

  /* =========================
     댓글 불러오기
     ========================= */

  const fetchComments =
    useCallback(
      async () => {
        if (
          !id
        ) {
          return;
        }


        try {
          const {
            data,
            error:
              commentError,
          } =
            await supabase
              .from(
                "tier_list_comments"
              )
              .select(
                "id, tier_list_id, user_id, guest_id, nickname, content, created_at"
              )
              .eq(
                "tier_list_id",
                id
              )
              .order(
                "created_at",
                {
                  ascending:
                    true,
                }
              );


          if (
            commentError
          ) {
            throw commentError;
          }


          setComments(
            Array.isArray(
              data
            )
              ? data
              : []
          );
        } catch (
          commentError
        ) {
          console.error(
            "티어표 댓글 조회 실패:",
            commentError
          );
        }
      },
      [
        id,
      ]
    );


  useEffect(() => {
    fetchComments();
  }, [
    fetchComments,
  ]);


  /* =========================
     후보 map
     ========================= */

  const candidateMap =
    useMemo(() => {
      const map =
        new Map();


      const candidates =
        Array.isArray(
          tierList
            ?.candidates
        )
          ? tierList
              .candidates
          : [];


      candidates.forEach(
        (
          candidate
        ) => {
          map.set(
            String(
              candidate.id
            ),
            candidate
          );
        }
      );


      return map;
    }, [
      tierList,
    ]);


  /* =========================
     나만의 원픽 후보
     ========================= */

  const onePickCandidate =
    useMemo(() => {
      const onePickId =
        tierList
          ?.tiers
          ?.ONE_PICK;


      if (
        !onePickId
      ) {
        return null;
      }


      return (
        candidateMap.get(
          String(
            onePickId
          )
        ) ||
        null
      );
    }, [
      tierList,
      candidateMap,
    ]);


  /* =========================
     티어 후보
     ========================= */

  const getTierCandidates =
    useCallback(
      (
        tier
      ) => {
        const ids =
          Array.isArray(
            tierList
              ?.tiers
              ?.[tier]
          )
            ? tierList
                .tiers[
                  tier
                ]
            : [];


        return (
          ids
            .map(
              (
                candidateId
              ) =>
                candidateMap.get(
                  String(
                    candidateId
                  )
                )
            )
            .filter(
              Boolean
            )
        );
      },
      [
        tierList,
        candidateMap,
      ]
    );


  /* =========================
     날짜
     ========================= */

  const formatDate =
    useCallback(
      (
        dateString
      ) => {
        if (
          !dateString
        ) {
          return "";
        }


        try {
          return (
            new Intl
              .DateTimeFormat(
                lang ===
                  "ko"
                  ? "ko-KR"
                  : lang,
                {
                  year:
                    "numeric",

                  month:
                    "2-digit",

                  day:
                    "2-digit",

                  hour:
                    "2-digit",

                  minute:
                    "2-digit",
                }
              )
              .format(
                new Date(
                  dateString
                )
              )
          );
        } catch {
          return "";
        }
      },
      [
        lang,
      ]
    );


  /* =========================
     공유
     ========================= */

  const handleShare =
    async () => {
      const url =
        window.location.href;


   const title = getTierListTitle(
  tierList,
  lang,
  "OnePickGame Tier List"
);


      setShareMessage(
        ""
      );


      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title,

              text:
                text.shareText(
                  title
                ),

              url,
            }
          );


          return;
        }


        await navigator
          .clipboard
          .writeText(
            url
          );


        setShareMessage(
          text.linkCopied
        );


        setTimeout(
          () => {
            setShareMessage(
              ""
            );
          },
          2000
        );
      } catch (
        shareError
      ) {
        if (
          shareError
            ?.name ===
          "AbortError"
        ) {
          return;
        }


        try {
          await navigator
            .clipboard
            .writeText(
              url
            );


          setShareMessage(
            text.linkCopied
          );
        } catch {}
      }
    };


  /* =========================================================
     PNG 다운로드

     DOM 스크린샷이 아니라
     실제 후보 데이터를 Canvas에 직접 그림.
     ========================================================= */

  const handleDownload =
    async () => {
      if (
        !tierList ||
        downloading
      ) {
        return;
      }


      setDownloading(
        true
      );


      try {
        const canvasWidth =
          1600;

        const outerPadding =
          55;

        const titleArea =
          onePickCandidate
            ? 460
            : 170;

        const labelWidth =
          150;

        const cardWidth =
          160;

        const imageHeight =
          160;

        const nameHeight =
          44;

        const cardHeight =
          imageHeight +
          nameHeight;

        const gap =
          14;

        const rowPadding =
          20;


        const usableWidth =
          canvasWidth -
          outerPadding * 2 -
          labelWidth -
          rowPadding * 2;


        const cardsPerLine =
          Math.max(
            1,
            Math.floor(
              (
                usableWidth +
                gap
              ) /
              (
                cardWidth +
                gap
              )
            )
          );


        const tierLayouts =
          TIERS.map(
            (
              tier
            ) => {
              const items =
                getTierCandidates(
                  tier
                );


              const lines =
                Math.max(
                  1,
                  Math.ceil(
                    items.length /
                    cardsPerLine
                  )
                );


              const height =
                Math.max(
                  230,
                  rowPadding * 2 +
                    lines *
                      cardHeight +
                    (
                      lines -
                      1
                    ) *
                      gap
                );


              return {
                tier,
                items,
                height,
              };
            }
          );


        const totalTierHeight =
          tierLayouts.reduce(
            (
              sum,
              row
            ) =>
              sum +
              row.height +
              12,
            0
          );


        const canvasHeight =
          titleArea +
          totalTierHeight +
          outerPadding;


        const canvas =
          document.createElement(
            "canvas"
          );


        canvas.width =
          canvasWidth;

        canvas.height =
          canvasHeight;


        const ctx =
          canvas.getContext(
            "2d"
          );


        if (
          !ctx
        ) {
          throw new Error(
            "Canvas unavailable"
          );
        }


        /* 배경 */

        ctx.fillStyle =
          "#ffffff";

        ctx.fillRect(
          0,
          0,
          canvasWidth,
          canvasHeight
        );


        /* 제목 */

        ctx.fillStyle =
          "#182235";

        ctx.font =
          "900 48px Arial, sans-serif";

const exportTitle = getTierListTitle(
  tierList,
  lang,
  "Tier List"
);

ctx.fillText(
  exportTitle,
  outerPadding,
  75
);


        ctx.fillStyle =
          "#5c6f88";

        ctx.font =
          "700 22px Arial, sans-serif";

        ctx.fillText(
          `${text.author}: ${
            authorName ||
            text.unknownAuthor
          }`,
          outerPadding,
          116
        );


        const createdText =
          formatDate(
            tierList
              .created_at
          );


        if (
          createdText
        ) {
          ctx.fillText(
            createdText,
            outerPadding,
            148
          );
        }


        if (
          onePickCandidate
        ) {
          const onePickImage =
            await loadCanvasImage(
              onePickCandidate
                ?.image
            );


          ctx.fillStyle =
            "#182235";

          ctx.font =
            "900 32px Arial, sans-serif";

          ctx.textAlign =
            "center";


          ctx.fillText(
            `⭐ ${text.onePickTitle}`,
            canvasWidth / 2,
            205
          );


          const pickSize =
            210;

          const pickX =
            canvasWidth / 2 -
            pickSize / 2;

          const pickY =
            230;


          roundedRect(
            ctx,
            pickX - 10,
            pickY - 10,
            pickSize + 20,
            pickSize + 68,
            18
          );

          ctx.fillStyle =
            "#f8fbff";

          ctx.fill();


          if (
            onePickImage
          ) {
            const ratio =
              Math.max(
                pickSize /
                  onePickImage.width,
                pickSize /
                  onePickImage.height
              );


            const drawWidth =
              onePickImage.width *
              ratio;

            const drawHeight =
              onePickImage.height *
              ratio;


            ctx.save();

            ctx.beginPath();

            ctx.rect(
              pickX,
              pickY,
              pickSize,
              pickSize
            );

            ctx.clip();


            ctx.drawImage(
              onePickImage,
              pickX +
                (
                  pickSize -
                  drawWidth
                ) /
                  2,
              pickY +
                (
                  pickSize -
                  drawHeight
                ) /
                  2,
              drawWidth,
              drawHeight
            );


            ctx.restore();
          } else {
            ctx.fillStyle =
              "#ffffff";

            ctx.fillRect(
              pickX,
              pickY,
              pickSize,
              pickSize
            );


            ctx.fillStyle =
              "#607086";

            ctx.font =
              "700 18px Arial, sans-serif";

            ctx.textAlign =
              "center";

            ctx.fillText(
              "NO IMAGE",
              canvasWidth / 2,
              pickY +
                pickSize / 2
            );
          }


          ctx.fillStyle =
            "#182235";

          ctx.font =
            "800 22px Arial, sans-serif";

          ctx.textAlign =
            "center";


          let onePickName =
            onePickCandidate
              ?.name ||
            text.untitled;


          if (
            onePickName.length >
            18
          ) {
            onePickName =
              `${onePickName.slice(
                0,
                17
              )}…`;
          }


          ctx.fillText(
            onePickName,
            canvasWidth / 2,
            pickY +
              pickSize +
              38
          );


          ctx.textAlign =
            "left";
        }


        let currentY =
          titleArea;


        for (
          const row of
          tierLayouts
        ) {
          /* 티어 전체 */

          roundedRect(
            ctx,
            outerPadding,
            currentY,
            canvasWidth -
              outerPadding * 2,
            row.height,
            16
          );

          ctx.fillStyle =
            "#f5f8ff";

          ctx.fill();


          /* 티어 라벨 */

          roundedRect(
            ctx,
            outerPadding,
            currentY,
            labelWidth,
            row.height,
            16
          );

          ctx.fillStyle =
            TIER_COLORS[
              row.tier
            ];

          ctx.fill();


          ctx.fillStyle =
            "#101010";

          ctx.font =
            "900 64px Arial, sans-serif";

          ctx.textAlign =
            "center";

          ctx.textBaseline =
            "middle";


          ctx.fillText(
            row.tier,
            outerPadding +
              labelWidth / 2,
            currentY +
              row.height / 2
          );


          ctx.textAlign =
            "left";

          ctx.textBaseline =
            "alphabetic";


          const loaded =
            await Promise.all(
              row.items.map(
                (
                  item
                ) =>
                  loadCanvasImage(
                    item
                      ?.image
                  )
              )
            );


          for (
            let index = 0;
            index <
            row.items.length;
            index++
          ) {
            const candidate =
              row.items[
                index
              ];


            const line =
              Math.floor(
                index /
                cardsPerLine
              );


            const column =
              index %
              cardsPerLine;


            const x =
              outerPadding +
              labelWidth +
              rowPadding +
              column *
                (
                  cardWidth +
                  gap
                );


            const y =
              currentY +
              rowPadding +
              line *
                (
                  cardHeight +
                  gap
                );


            roundedRect(
              ctx,
              x,
              y,
              cardWidth,
              cardHeight,
              10
            );


            ctx.fillStyle =
              "#f5f8ff";

            ctx.fill();


            const image =
              loaded[
                index
              ];


            if (
              image
            ) {
              const ratio =
                Math.max(
                  cardWidth /
                    image.width,
                  imageHeight /
                    image.height
                );


              const drawWidth =
                image.width *
                ratio;

              const drawHeight =
                image.height *
                ratio;


              const drawX =
                x +
                (
                  cardWidth -
                  drawWidth
                ) /
                  2;


              const drawY =
                y +
                (
                  imageHeight -
                  drawHeight
                ) /
                  2;


              ctx.save();


              ctx.beginPath();

              ctx.rect(
                x,
                y,
                cardWidth,
                imageHeight
              );

              ctx.clip();


              ctx.drawImage(
                image,
                drawX,
                drawY,
                drawWidth,
                drawHeight
              );


              ctx.restore();
            } else {
              ctx.fillStyle =
                "#ffffff";

              ctx.fillRect(
                x,
                y,
                cardWidth,
                imageHeight
              );


              ctx.fillStyle =
                "#607086";

              ctx.font =
                "700 18px Arial, sans-serif";

              ctx.textAlign =
                "center";

              ctx.fillText(
                "NO IMAGE",
                x +
                  cardWidth /
                    2,
                y +
                  imageHeight /
                    2
              );

              ctx.textAlign =
                "left";
            }


            ctx.fillStyle =
              "#182235";

            ctx.font =
              "700 18px Arial, sans-serif";

            ctx.textAlign =
              "center";


            let candidateName =
              candidate
                ?.name ||
              text.untitled;


            if (
              candidateName.length >
              14
            ) {
              candidateName =
                `${candidateName.slice(
                  0,
                  13
                )}…`;
            }


            ctx.fillText(
              candidateName,
              x +
                cardWidth /
                  2,
              y +
                imageHeight +
                29
            );


            ctx.textAlign =
              "left";
          }


          currentY +=
            row.height +
            12;
        }


        /* 하단 로고 텍스트 */

        ctx.fillStyle =
          "#64d8ff";

ctx.font =
  "900 30px Arial, sans-serif";

        ctx.textAlign =
          "right";

        ctx.fillText(
          "OnePickGame",
          canvasWidth -
            outerPadding,
          canvasHeight -
            22
        );


        ctx.textAlign =
          "left";


        const blob =
          await new Promise(
            (
              resolve
            ) => {
              canvas.toBlob(
                resolve,
                "image/png"
              );
            }
          );


        if (
          !blob
        ) {
          throw new Error(
            "PNG generation failed"
          );
        }


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


    const safeTitle =
  (
    exportTitle ||
    "tier-list"
  )
            .replace(
              /[\\/:*?"<>|]/g,
              "_"
            )
            .slice(
              0,
              80
            );


        link.href =
          url;

        link.download =
          `${safeTitle}.png`;


        document.body
          .appendChild(
            link
          );


        link.click();

        link.remove();


        setTimeout(
          () => {
            URL.revokeObjectURL(
              url
            );
          },
          1000
        );
      } catch (
        downloadError
      ) {
        console.error(
          "티어표 이미지 다운로드 실패:",
          downloadError
        );


        alert(
          text.downloadFailed
        );
      } finally {
        setDownloading(
          false
        );
      }
    };


  /* =========================
     이 후보로 새 티어표
     ========================= */


  const handleCreateBracketFromTier =
    () => {
      if (!tierList) {
        return;
      }

      const bracketCandidates =
        Array.isArray(
          tierList.candidates
        )
          ? tierList.candidates.map(
              (
                candidate,
                index
              ) => ({
                id:
                  candidate?.id ||
                  "tier-candidate-" + index,
                name:
                  candidate?.name || "",
                image:
                  candidate?.image || "",
                file: null,
              })
            )
          : [];

      try {
        sessionStorage.setItem(
          WORLDCUP_FROM_TIER_STORAGE_KEY,
          JSON.stringify({
            fromTierListId:
              tierList.id,
          title:
  getTierListTitle(
    tierList,
    lang,
    tierList.title || ""
  ),
            category:
              tierList.category || "other",
            source_worldcup_id:
              tierList.source_worldcup_id || null,
            sourcePresetName:
              tierList?.tier_labels?._sourcePresetName || "",
            candidates:
              bracketCandidates,
          })
        );
      } catch (storageError) {
        console.error(
          "Tier-to-worldcup payload save failed",
          storageError
        );
      }

      navigate(
        "/" + lang + "/worldcup-maker",
        {
          state: {
            prefillFromTier: true,
          },
        }
      );
    };

  const handleClone =
    async () => {
      try {
        const { error: cloneError } =
          await supabase.rpc(
            "increment_tier_list_clone",
            {
              p_tier_list_id: tierList.id,
            }
          );

        if (!cloneError) {
          setTierList((current) =>
            current
              ? {
                  ...current,
                  clone_count:
                    Number(current.clone_count || 0) + 1,
                }
              : current
          );
        }
      } catch (cloneError) {
        console.warn(
          "Tier list clone count failed",
          cloneError
        );
      }
      try {
        sessionStorage.setItem(
          CLONE_STORAGE_KEY,
          JSON.stringify(
            {
              sourceTierListId:
                tierList.id,

              title:
                tierList.title,

              category:
                tierList.category ||
                "other",

              tier_labels:
                tierList.tier_labels ||
                {},

              candidates:
                Array.isArray(
                  tierList
                    .candidates
                )
                  ? tierList
                      .candidates
                  : [],
            }
          )
        );
      } catch (
        storageError
      ) {
        console.error(
          "티어표 후보 복제 데이터 저장 실패:",
          storageError
        );
      }


      navigate(
        `/${lang}/tier-list/create?clone=${tierList.id}`
      );
    };


  /* =========================
     수정
     ========================= */

  const handleEdit =
    async () => {
      if (!canManage || !tierList) {
        return;
      }

      let guestPassword = "";

      if (isGuestPost) {
        guestPassword =
          window.prompt(
            text.guestPasswordPrompt
          ) || "";

        if (!guestPassword) {
          return;
        }

        const {
          data: verified,
          error: verifyError,
        } = await supabase.rpc(
          "verify_guest_tier_list_password",
          {
            p_tier_list_id: tierList.id,
            p_password: guestPassword,
          }
        );

        if (verifyError) {
          alert(
            `${text.guestPasswordRequired}\n${verifyError.message || text.unknownError}`
          );
          return;
        }

        if (!verified) {
          alert(text.guestPasswordWrong);
          return;
        }
      }

      try {
        sessionStorage.setItem(
          EDIT_STORAGE_KEY,
          JSON.stringify({
            id: tierList.id,
            user_id: tierList.user_id || null,
            guest_nickname: tierList.guest_nickname || "",
            title: tierList.title,
            title_translations:
  tierList.title_translations || {},
            source_worldcup_id:
              tierList.source_worldcup_id || null,
            category: tierList.category || "other",
            tier_labels: tierList.tier_labels || {},
            tiers: tierList.tiers || {},
            candidates: Array.isArray(tierList.candidates)
              ? tierList.candidates
              : [],
          })
        );
      } catch (storageError) {
        console.error("Tier list edit payload save failed", storageError);
      }

      navigate(
        `/${lang}/tier-list/create?edit=${tierList.id}`,
        isGuestPost
          ? {
              state: {
                guestEditPassword:
                  guestPassword,
              },
            }
          : undefined
      );
    };

  /* =========================
     삭제
     ========================= */

  const handleDelete =
    async () => {
      if (
        !canManage ||
        !tierList ||
        deleting
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          text.deleteConfirm
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);

      try {
if (isAdmin) {
  const {
    error: deleteError,
  } = await supabase.rpc(
    "admin_delete_tier_list",
    {
      p_tier_list_id: tierList.id,
    }
  );

  if (deleteError) {
    throw deleteError;
  }
} else if (isGuestPost) {
  const guestPassword =
    window.prompt(
      text.guestPasswordPrompt
    ) || "";

  if (!guestPassword) {
    return;
  }

  const {
    error: deleteError,
  } = await supabase.rpc(
    "delete_guest_tier_list",
    {
      p_tier_list_id: tierList.id,
      p_password: guestPassword,
    }
  );

  if (deleteError) {
    throw deleteError;
  }
} else {
          if (!isMemberOwner) {
            return;
          }

          const {
            error: deleteError,
          } = await supabase
            .from("tier_lists")
            .delete()
            .eq("id", tierList.id)
            .eq("user_id", currentUser.id);

          if (deleteError) {
            throw deleteError;
          }
        }

        navigate(`/${lang}/tier-list`);
      } catch (deleteError) {
        console.error("Tier list delete failed", deleteError);
        alert(
          `${text.deleteFailed}\n${deleteError?.message || text.unknownError}`
        );
      } finally {
        setDeleting(false);
      }
    };

  /* =========================
     댓글 작성
     ========================= */

  const submitComment =
    async () => {
      if (
        commentLoading
      ) {
        return;
      }


      const cleanComment =
        commentText
          .trim();


      const cleanNickname =
        nickname
          .trim();


      if (
        !cleanNickname
      ) {
        alert(
          text.nicknameRequired
        );

        return;
      }


      if (
        !cleanComment
      ) {
        alert(
          text.commentRequired
        );

        return;
      }


      if (
        cleanComment.length >
        500
      ) {
        alert(
          text.commentMax
        );

        return;
      }


      setCommentLoading(
        true
      );


      try {
        let guestId =
          null;


        if (
          !currentUser
        ) {
          guestId =
            localStorage
              .getItem(
                "guest_id"
              );


          if (
            !guestId
          ) {
            guestId =
              crypto
                .randomUUID
                ?.() ||
              `${Math.random()
                .toString(36)
                .slice(2)}${Date.now()}`;


            localStorage
              .setItem(
                "guest_id",
                guestId
              );
          }


          localStorage
            .setItem(
              "tier_list_guest_nickname",
              cleanNickname
            );
        }


        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "tier_list_comments"
            )
            .insert([
              {
                tier_list_id:
                  id,

                user_id:
                  currentUser
                    ?.id ||
                  null,

                guest_id:
                  currentUser
                    ? null
                    : guestId,

                nickname:
                  cleanNickname,

                content:
                  cleanComment,
              },
            ]);


        if (
          insertError
        ) {
          throw insertError;
        }


        setCommentText(
          ""
        );


        await fetchComments();
      } catch (
        insertError
      ) {
        console.error(
          "댓글 등록 실패:",
          insertError
        );


        alert(
          `${text.commentPostFailed}: ${
            insertError
              ?.message ||
            text.unknownError
          }`
        );
      } finally {
        setCommentLoading(
          false
        );
      }
    };


  /* =========================
     로딩
     ========================= */

  if (
    loading
  ) {
    return (
      <>
        <Seo
          lang={lang}
          slug={`tier-list/${id}`}
          title={t("tierList.seo.resultFallbackTitle")}
          description={t("tierList.seo.resultFallbackDescription")}
          indexable={false}
        />
      <div
        style={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          boxSizing: "border-box",
          color: "#202534",
        }}
      >
        <div
          style={{
            width: "fit-content",
            maxWidth: "100%",
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid #dde2ea",
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
            fontWeight: 900,
            fontSize: 20,
            textAlign: "center",
          }}
        >
          {text.loading}
        </div>
      </div>
      </>
    );
  }


  /* =========================
     오류
     ========================= */

  if (
    error ||
    !tierList
  ) {
    return (
      <>
        <Seo
          lang={lang}
          slug={`tier-list/${id}`}
          title={t("tierList.seo.resultFallbackTitle")}
          description={t("tierList.seo.resultFallbackDescription")}
          indexable={false}
        />
      <div
        style={{
          minHeight:
            "100vh",

          background:
            "#ffffff",

          color:
            "#202534",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          justifyContent:
            "center",

          gap:
            16,

          padding:
            20,

          textAlign:
            "center",
        }}
      >
        <div
          style={{
            fontSize:
              22,

            fontWeight:
              900,
          }}
        >
          {error ||
            text.notFound}
        </div>


        
      </div>
      </>
    );
  }

const displayTitle = getTierListTitle(
  tierList,
  lang,
  t("tierList.result.tierList")
);

const seoResultTitle = t(
  "tierList.seo.resultTitle",
  {
    title: displayTitle,
  }
);

const seoResultDescription = t(
  "tierList.seo.resultDescription",
  {
    title: displayTitle,
    count: Number(tierList.candidate_count || 0),
  }
);
  const seoResultImage =
    tierList.thumbnail_url ||
    onePickCandidate?.image ||
    (Array.isArray(tierList.candidates)
      ? tierList.candidates.find((candidate) => candidate?.image)?.image
      : "") ||
    "/onepick-social.png";

  const createBracketCtaLabel =
    tierList.source_worldcup_id
      ? text.createBracketFromTier
      : text.createBracketFromPreset;

  const sourcePresetName = String(
    tierList?.tier_labels?._sourcePresetName || ""
  ).trim();

  const canBrowsePreset = Boolean(tierList.source_worldcup_id || sourcePresetName);
  const openPresetTierLists = (excludeCurrent = false) => {
    const params = new URLSearchParams();
    if (tierList.source_worldcup_id) params.set("source", String(tierList.source_worldcup_id));
    else if (sourcePresetName) params.set("preset", sourcePresetName);
    else return;

    navigate(`/${lang}/tier-list?${params.toString()}`);
  };

  const detailActionLabels = {
    makeBracket: t("tierList.result.makeBracketCandidates", {
      defaultValue: "Make a bracket with these candidates",
    }),
    browseTierLists: t("tierList.result.browseTierLists", {
      defaultValue: "See other user tier lists on this topic",
    }),
    cloneTierList: t("tierList.result.cloneTierList", {
      defaultValue: "Make this tier list too",
    }),
  };


  return (
    <>
      <Seo
        lang={lang}
        slug={`tier-list/${id}`}
        title={seoResultTitle}
        description={seoResultDescription}
        image={seoResultImage}
        indexable={true}
      />
<div
  style={{
    width: "100vw",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",

    minHeight: "100vh",

        background:
          "#ffffff",

        color:
          "#202534",
      }}
    >
      <div
        style={{
width: "100%",
maxWidth: 1380,
minWidth: 0,

          margin:
            "0 auto",

          padding:
            isMobile
              ? "12px 8px 40px"
              : "22px 28px 80px",

          boxSizing:
            "border-box",
        }}
      >

 {/* =============================================
    게시물 헤더
    ============================================= */}

<div
  style={{
    position: "relative",

    width: "100%",

marginTop: isMobile ? 6 : 16,

padding: isMobile
  ? "12px 10px 14px"
  : "18px 24px 20px",

    boxSizing: "border-box",

    borderRadius: 14,

    border: "1px solid #dde2ea",

    background: "#ffffff",
  }}
>
<div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: isMobile ? "nowrap" : "wrap",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 8 : 12,
    marginBottom: isMobile ? 10 : 12,
  }}
>

  {/* =========================
      좌측 상단 - 티어표 홈
      ========================= */}

      

  

  {/* =========================
      우측 상단 - 액션
      ========================= */}

 <div
  style={{
    display: isMobile ? "grid" : "flex",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : undefined,
    flexWrap: isMobile ? undefined : "wrap",
    alignItems: "center",
    justifyContent: isMobile ? "stretch" : "flex-end",
    gap: isMobile ? 7 : 8,
    marginLeft: isMobile ? 0 : "auto",
    width: isMobile ? "100%" : "auto",
    minWidth: 0,
    maxWidth: "100%",
  }}
>
    <button
      type="button"
      onClick={handleLike}
      disabled={likeLoading}
      style={{
        minHeight: isMobile ? 42 : 52,

        width: isMobile ? "100%" : "auto",

        padding: isMobile ? "0 8px" : "0 18px",

        borderRadius: 10,

        border: liked
          ? "1px solid #ff6b88"
          : "1px solid #dde2ea",

        background: liked
          ? "#ffffff"
          : "#ffffff",

        color: liked
          ? "#b42346"
          : "#202534",

        fontSize: isMobile ? 14 : 16,

        fontWeight: 900,

        cursor: likeLoading
          ? "default"
          : "pointer",

        whiteSpace: "nowrap",

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",
      }}
    >
      ♥ {liked
        ? text.liked
        : text.like}
    </button>

    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      style={{
        minHeight: isMobile ? 42 : 52,

        width: isMobile ? "100%" : "auto",

        padding: isMobile ? "0 8px" : "0 18px",

        borderRadius: 10,

        border:
          "1px solid #dde2ea",

        background:
          "#ffffff",

        color:
          "#202534",

        fontSize:
          isMobile ? 14 : 16,

        fontWeight:
          900,

        cursor: downloading
          ? "default"
          : "pointer",

        whiteSpace:
          "nowrap",

        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",
      }}
    >
      📥{" "}
      {downloading
        ? text.downloading
        : text.download}
    </button>

    <button
      type="button"
      onClick={handleShare}
      style={{
        minHeight: isMobile ? 42 : 52,

        width: isMobile ? "100%" : "auto",

        padding: isMobile ? "0 8px" : "0 18px",

        borderRadius: 10,

        border:
          "1px solid #19bfff",

        background:
          "#ffffff",

        color:
          "#202534",

        fontSize:
          isMobile ? 14 : 16,

        fontWeight:
          900,

        cursor:
          "pointer",

        whiteSpace:
          "nowrap",

        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",
      }}
    >
      🔗 {text.share}
    </button>

    {canManage && (
      <>
        <button
          type="button"
          onClick={handleEdit}
          style={{
            minHeight: isMobile ? 40 : 52,

            width: isMobile ? "100%" : "auto",

            padding: isMobile ? "0 8px" : "0 18px",

            borderRadius: 10,

            border:
              "1px solid #dde2ea",

            background:
              "#ffffff",

            color:
              "#202534",

            fontSize:
              isMobile ? 14 : 16,

            fontWeight:
              900,

            cursor:
              "pointer",

            whiteSpace:
              "nowrap",

            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",
          }}
        >
          ✏️ {text.edit}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            minHeight: isMobile ? 40 : 52,

            width: isMobile ? "100%" : "auto",

            padding: isMobile ? "0 8px" : "0 18px",

            borderRadius: 10,

            border:
              "1px solid #dde2ea",

            background:
              "#ffffff",

            color:
              "#b42346",

            fontSize:
              isMobile ? 14 : 16,

            fontWeight:
              900,

            cursor: deleting
              ? "default"
              : "pointer",

            whiteSpace:
              "nowrap",

            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",
          }}
        >
          🗑️{" "}
          {deleting
            ? text.deleting
            : text.delete}
        </button>
      </>
    )}
  </div>

 </div>

  {/* =========================
      중앙 제목
      ========================= */}

  <div
    style={{
      width: "100%",

      maxWidth: isMobile
        ? "100%"
        : 980,

      margin: "0 auto",

      textAlign: "center",
    }}
  >
    <h1
      style={{
        margin: 0,

        color: "#202534",

        fontSize: isMobile
          ? 26
          : 42,

        fontWeight: 900,

        lineHeight: 1.28,

        textAlign: "center",

        wordBreak: "break-word",

        overflowWrap: "anywhere",
      }}
    >
{displayTitle}
    </h1>
  </div>

  <div style={{display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", justifyContent: isMobile ? "center" : "space-between", alignItems: isMobile ? "center" : "baseline", gap: isMobile ? 6 : 12, marginTop: isMobile ? 10 : 14, color: "#5542b8", fontSize: isMobile ? 13 : 16, fontWeight: 700, textAlign: isMobile ? "center" : "left"}}>
    <div>
      👤 {text.author}: <strong style={{color: "#202534"}}>{authorName || text.unknownAuthor}</strong>
      {" · "}{formatDate(tierList.created_at)}
    </div>
    {canBrowsePreset && (
      <div style={{marginLeft: isMobile ? 0 : "auto", minWidth: 0, maxWidth: "100%", textAlign: isMobile ? "center" : "right"}}>
        {t("tierList.result.usedPresetLabel")}{": "}
        <button type="button" onClick={() => openPresetTierLists(false)} style={{border: 0, background: "transparent", color: "#5542b8", padding: 0, font: "inherit", textDecoration: "underline", cursor: "pointer", overflowWrap: "anywhere", textAlign: "inherit"}}>
          <PresetTitle id={tierList.source_worldcup_id} snapshot={sourcePresetName} lang={lang} />
        </button>
      </div>
    )}
  </div>
  <TierTags value={tierList.tier_labels?._tags} lang={lang} />
</div>
        {/* =============================================
            티어표 / 나만의 원픽
            ============================================= */}

        <div
          style={{
            marginTop: isMobile ? 12 : 18,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: isMobile ? 14 : 18,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 24 : 28,
                fontWeight: 900,
                color: "#202534",
              }}
            >
              ⭐ {text.onePickTitle}
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 12 : 24,
                width: "100%",
              }}
            >
              <div
                style={{
                  width: isMobile ? 180 : 190,
                  padding: 10,
                  boxSizing: "border-box",
                  borderRadius: 16,
                  border: "2px solid #a99bdf",
                  background: "#f5f3ff",
                  boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
                }}
              >
                {onePickCandidate ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        borderRadius: 11,
                        background: "#ffffff",
                      }}
                    >
                      {onePickCandidate?.image ? (
                        <MediaRenderer
                          url={onePickCandidate.image}
                          alt={onePickCandidate.name || ""}
                          playable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            objectPosition: "center",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#607086",
                            fontWeight: 800,
                          }}
                        >
                          NO IMAGE
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 9,
                        fontSize: isMobile ? 16 : 18,
                        fontWeight: 900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {onePickCandidate.name || text.untitled}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "32px 10px",
                      color: "#596579",
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    ⭐
                    <br />
                    {text.onePickEmpty}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  width: isMobile ? "100%" : 260,
                  maxWidth: "100%",
                }}
              >
                <button
                  type="button"
                  onClick={handleCreateBracketFromTier}
                  style={{
                    width: "100%",
                    padding: isMobile ? "13px 14px" : "14px 16px",
                    borderRadius: 13,
                    border: "1px solid #ff9f1a",
                    background: "#ffffff",
                    color: "#202534",
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 900,
                    lineHeight: 1.25,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
                  }}
                >
                  {detailActionLabels.makeBracket}
                </button>

                {canBrowsePreset && (
                  <button
                    type="button"
                    onClick={() => openPresetTierLists(false)}
                    style={{
                      width: "100%",
                      padding: isMobile ? "13px 14px" : "14px 16px",
                      borderRadius: 13,
                      border: "1px solid #19bfff",
                      background: "#ffffff",
                      color: "#202534",
                      fontSize: isMobile ? 15 : 16,
                      fontWeight: 900,
                      lineHeight: 1.25,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
                    }}
                  >
                    {detailActionLabels.browseTierLists}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClone}
                  style={{
                    width: "100%",
                    padding: isMobile ? "13px 14px" : "14px 16px",
                    borderRadius: 13,
                    border: "1px solid #7c5cff",
                    background: "#ffffff",
                    color: "#202534",
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 900,
                    lineHeight: 1.25,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
                  }}
                >
                  {detailActionLabels.cloneTierList}
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
            }}
          >
            {TIERS.map((tier) => {
              const items = getTierCandidates(tier);

              return (
                <div
                  key={tier}
                  style={{
                    minHeight: isMobile ? 108 : 154,
                    display: "flex",
                    marginBottom: 10,
                    border: "1px solid #dde2ea",
                    background: "#ffffff",
                    borderRadius: 9,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 66 : 112,
                      minWidth: isMobile ? 66 : 112,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? 30 : 46,
                      fontWeight: 900,
                      background: TIER_COLORS[tier],
                      color: "#111",
                    }}
                  >
                    {tier}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: isMobile ? 9 : 13,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      gap: isMobile ? 7 : 10,
                    }}
                  >
                    {items.map((candidate) => (
                      <div
                        key={String(candidate.id)}
                        style={{
                          width: isMobile ? 72 : 112,
                          minWidth: isMobile ? 72 : 112,
                          overflow: "hidden",
                          borderRadius: 8,
                          border: "1px solid #dde2ea",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            overflow: "hidden",
                            background: "#ffffff",
                          }}
                        >
                          {candidate?.image ? (
                            <MediaRenderer
                              url={candidate.image}
                              alt={candidate.name || ""}
                              playable={false}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                objectPosition: "center",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#5542b8",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              NO IMAGE
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: isMobile ? "5px 4px" : "7px 5px",
                            textAlign: "center",
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 800,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {candidate.name || text.untitled}
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div
                        style={{
                          alignSelf: "center",
                          color: "#53657d",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =============================================
            액션 버튼
            ============================================= */}

        <div
          style={{
            marginTop:
              24,

            display:
              "flex",

            justifyContent:
              "center",

            gap:
              10,

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            onClick={
              handleClone
            }
            style={{
              padding:
                "12px 20px",

              borderRadius:
                9,

              border:
                "1px solid #19bfff",

              background:
                "#6650d8",

              color:
                "#ffffff",

              cursor:
                "pointer",

              fontWeight:
                900,
            }}
          >
            ♻️{" "}
            {text.createWithCandidates}
          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                `/${lang}/tier-list/create`
              )
            }
            style={{
              padding:
                "12px 20px",

              borderRadius:
                9,

              border:
                "1px solid #dde2ea",

              background:
                "#ffffff",

              color:
                "#202534",

              cursor:
                "pointer",

              fontWeight:
                900,
            }}
          >
            ＋{" "}
            {text.createTierList}
          </button>


          <button
            type="button"
            onClick={
              handleShare
            }
            style={{
              padding:
                "12px 20px",

              borderRadius:
                9,

              border:
                "1px solid #dde2ea",

              background:
                "#ffffff",

              color:
                "#202534",

              cursor:
                "pointer",

              fontWeight:
                900,
            }}
          >
            🔗{" "}
            {text.share}
          </button>
        </div>


        {/* =============================================
            댓글
            ============================================= */}

        <div
          style={{
            marginTop:
              isMobile
                ? 34
                : 48,

            padding:
              isMobile
                ? 14
                : 22,

            borderRadius:
              14,

            border:
              "1px solid #dde2ea",

            background:
              "#ffffff",
          }}
        >
          <div
            style={{
              fontSize:
                isMobile
                  ? 21
                  : 24,

              fontWeight:
                900,

              marginBottom:
                16,
            }}
          >
            💬{" "}
            {text.comments}

            {" · "}

            {comments.length}
          </div>


          {/* 댓글 작성 */}

          <div
            style={{
              padding:
                12,

              borderRadius:
                10,

              border:
                "1px solid #dde2ea",

              background:
                "#ffffff",
            }}
          >
            <input
              type="text"
              value={
                nickname
              }
              onChange={(
                e
              ) =>
                setNickname(
                  e.target.value
                )
              }
              disabled={
                Boolean(
                  currentUser &&
                  nickname
                )
              }
              maxLength={
                30
              }
              placeholder={
                text.nickname
              }
              style={{
                width:
                  "100%",

                maxWidth:
                  280,

                height:
                  38,

                boxSizing:
                  "border-box",

                padding:
                  "0 11px",

                marginBottom:
                  9,

                borderRadius:
                  7,

                border:
                  "1px solid #dde2ea",

                background:
                  "#ffffff",

                color:
                  "#202534",

                outline:
                  "none",

                fontWeight:
                  700,

                opacity:
                  currentUser &&
                  nickname
                    ? 0.8
                    : 1,
              }}
            />


            <textarea
              value={
                commentText
              }
              onChange={(
                e
              ) =>
                setCommentText(
                  e.target.value
                )
              }
              maxLength={
                500
              }
              placeholder={
                text.commentPlaceholder
              }
              style={{
                width:
                  "100%",

                minHeight:
                  90,

                resize:
                  "vertical",

                boxSizing:
                  "border-box",

                padding:
                  11,

                borderRadius:
                  8,

                border:
                  "1px solid #dde2ea",

                background:
                  "#ffffff",

                color:
                  "#202534",

                outline:
                  "none",

                fontFamily:
                  "inherit",

                fontSize:
                  16,

                lineHeight:
                  1.5,
              }}
            />


            <div
              style={{
                marginTop:
                  8,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  10,
              }}
            >
              <div
                style={{
                  color:
                    "#5542b8",

                  fontSize:
                    14,

                  fontWeight:
                    700,
                }}
              >
                {commentText.length}
                /500
              </div>


              <button
                type="button"
                onClick={
                  submitComment
                }
                disabled={
                  commentLoading
                }
                style={{
                  padding:
                    "9px 16px",

                  borderRadius:
                    8,

                  border:
                    "1px solid #19bfff",

                  background:
                    commentLoading
                      ? "#ffffff"
                      : "#6650d8",

                  color:
                    (commentLoading) ? "#202534" : "#ffffff",

                  fontWeight:
                    900,

                  cursor:
                    commentLoading
                      ? "default"
                      : "pointer",
                }}
              >
                {commentLoading
                  ? text.posting
                  : text.post}
              </button>
            </div>
          </div>


          {/* 댓글 목록 */}

          <div
            style={{
              marginTop:
                16,
            }}
          >
            {comments.length ===
            0 ? (
              <div
                style={{
                  padding:
                    "25px 10px",

                  textAlign:
                    "center",

                  color:
                    "#61748c",

                  fontWeight:
                    700,

                  fontSize:
                    16,
                }}
              >
                {text.noComments}
              </div>
            ) : (
              comments.map(
                (
                  comment
                ) => (
                  <div
                    key={
                      comment.id
                    }
                    style={{
                      padding:
                        "13px 4px",

                      borderBottom:
                        "1px solid #dde2ea",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          8,

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#202534",

                          fontSize:
                            16,

                          fontWeight:
                            900,
                        }}
                      >
                        {comment.nickname ||
                          text.anonymous}
                      </span>


                      <span
                        style={{
                          color:
                            "#566b83",

                          fontSize:
                            13,

                          fontWeight:
                            700,
                        }}
                      >
                        {formatDate(
                          comment
                            .created_at
                        )}
                      </span>
                    </div>


                    <div
                      style={{
                        marginTop:
                          6,

                        color:
                          "#596579",

                        fontSize:
                          16,

                        lineHeight:
                          1.55,

                        whiteSpace:
                          "pre-wrap",

                        wordBreak:
                          "break-word",
                      }}
                    >
                      {comment.content}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}


export default TierListResultPage;