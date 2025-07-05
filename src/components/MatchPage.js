import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Match from "./Match";

function MatchPage({ worldcupList }) {
  const { id, round } = useParams();
  const navigate = useNavigate();

  const cup = worldcupList.find(c => String(c.id) === id);
  const roundNum = Number(round) || (cup ? cup.data.length : 4);

  // 월드컵 정보 없으면 아무것도 렌더링하지 않음
  if (!cup) return null;

  return (
    <Match
      cup={cup}
      selectedCount={roundNum}
      onResult={(winner, matchHistory) => {
        navigate(`/result/${cup.id}/${roundNum}`, {
          state: { winner, matchHistory }
        });
      }}
    />
  );
}

export default MatchPage;
