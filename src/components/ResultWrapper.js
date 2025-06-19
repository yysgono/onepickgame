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

  if (!cup || !winner)
    return <div style={{ padding: 80 }}>{t("cannotShowResult")}</div>;

  return (
    <Result
      winner={winner}
      cup={cup}
      onRestart={() => navigate(`/match/${cup.id}/${round}`)}
      onStats={() => navigate(`/stats/${cup.id}`)}
    />
  );
}

export default ResultWrapper;
