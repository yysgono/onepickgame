// src/components/MatchPage.js
import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Match from "./Match";
import MatchCommunityBox from "./MatchCommunityBox";
import AdsenseSide from "./AdsenseSide";
import { pushRecentWorldcup } from "../utils";
import Seo from "../seo/Seo";

function useViewport() {
  const [vw, setVw] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setVw(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isMobile: vw < 1000,
  };
}

/**
 * props:
 * - worldcupList: App에서 내려준 전체 월드컵 목록
 */
export default function MatchPage({ worldcupList = [] }) {
  const { id, round } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isMobile } = useViewport();

  const lang = (i18n.language || "en").split("-")[0];

  const cup = useMemo(() => {
    return worldcupList.find(
      (item) => String(item.id) === String(id)
    );
  }, [worldcupList, id]);

  useEffect(() => {
    if (cup?.id) {
      pushRecentWorldcup(cup.id);
    }
  }, [cup?.id]);

  const selectedCount = Math.max(
    2,
    Math.min(Number(round) || 2, 10000)
  );

  if (!cup) {
    return (
      <div
        style={{
          minHeight: "60vh",
          padding: 40,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {t("not_found", {
            defaultValue: "Bracket not found.",
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/${lang}`)}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            border: "none",
            borderRadius: 8,
            background: "#1976ed",
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t("home", {
            defaultValue: "Home",
          })}
        </button>
      </div>
    );
  }

  const roundLabel = t("round_of", {
    count: selectedCount,
    defaultValue: "Round of {{count}}",
  });

  const seoDescription =
    cup.description ||
    cup.desc ||
    t("match_page_description", {
      title: cup.title,
      defaultValue: "Choose your favorite from {{title}}.",
    });

  return (
    <>
      <Seo
        lang={lang}
        slug={`match/${cup.id}/${selectedCount}`}
        title={`${cup.title} ${roundLabel} | OnePickGame`}
        description={seoDescription}
        image={
          cup.thumbnail ||
          cup.image ||
          cup.data?.[0]?.image ||
          "/onepick-social.png"
        }
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {!isMobile && (
            <aside
              aria-label="Left advertisement"
              style={{
                width: 160,
                flexShrink: 0,
                marginRight: 20,
              }}
            >
              <AdsenseSide />
            </aside>
          )}

          <main
            style={{
              width: "100%",
              maxWidth: 1200,
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <Match
              cup={cup}
              onResult={() => {}}
              selectedCount={selectedCount}
            />

            <MatchCommunityBox cupId={cup.id} />
          </main>

          {!isMobile && (
            <aside
              aria-label="Right advertisement"
              style={{
                width: 160,
                flexShrink: 0,
                marginLeft: 20,
              }}
            >
              <AdsenseSide />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}