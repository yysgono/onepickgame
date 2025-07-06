import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Match from "./Match";

function MatchPage({ worldcupList }) {
  const { id, round } = useParams();
  const navigate = useNavigate();

  const cup = worldcupList.find(c => String(c.id) === id);
  const roundNum = Number(round) || (cup ? cup.data.length : 4);

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
