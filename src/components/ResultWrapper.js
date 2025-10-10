import React, { useMemo, useTransition } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Result from "./Result";
import { useTranslation } from "react-i18next";

function ResultWrapper({ worldcupList = [] }) {
  const { id, round } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [, startTransition] = useTransition();

  // worldcupList가 비어있을 수도 있으니 안전 가드 + 메모
  const cup = useMemo(
    () => worldcupList?.find((c) => String(c.id) === String(id)) || null,
    [worldcupList, id]
  );

  // 언어코드: URL 우선, 없으면 i18n.language
  const lang = useMemo(() => {
    const m = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
    return m ? m[1] : (i18n.language?.split("-")[0] || "ko");
  }, [location.pathname, i18n.language]);

  const winner = location.state?.winner;

  // winner가 없으면(새로고침/직접 진입) 통계로 우회 유도
  if (!cup || !winner) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>
          {t("cannotShowResult")}
        </div>
        {cup ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() =>
                startTransition(() =>
                  navigate(`/${lang}/stats/${cup.id}`)
                )
              }
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1.5px solid #1976ed",
                background: "#1976ed",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("stats")}
            </button>
            <button
              onClick={() =>
                startTransition(() =>
                  navigate(`/${lang}`)
                )
              }
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1.5px solid #ccc",
                background: "#fff",
                color: "#333",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("home")}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Result
      winner={winner}
      cup={cup}
      onRestart={() =>
        startTransition(() =>
          navigate(`/${lang}/match/${cup.id}/${round}`)
        )
      }
      onStats={() =>
        startTransition(() =>
          navigate(`/${lang}/stats/${cup.id}`)
        )
      }
    />
  );
}

export default ResultWrapper;
