import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Result from "./Result";
import { useTranslation } from "react-i18next";

function ResultWrapper({ worldcupList }) {
  const { id, round } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const winner = location.state?.winner;
  const cup = worldcupList.find(c => String(c.id) === id);

  // 언어코드 추출
  const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const lang = langMatch ? langMatch[1] : "ko";

  if (!cup || !winner)
    return <div style={{ padding: 80 }}>{t("cannotShowResult")}</div>;

  return (
    <Result
      winner={winner}
      cup={cup}
      onRestart={() => navigate(`/${lang}/match/${cup.id}/${round}`)}
      onStats={() => navigate(`/${lang}/stats/${cup.id}`)}
    />
  );
}

export default ResultWrapper;
