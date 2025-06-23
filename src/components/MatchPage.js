import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Match from "./Match";

function MatchPage({ worldcupList }) {
  const { id, round } = useParams();
  const navigate = useNavigate();

  const cup = worldcupList.find(c => String(c.id) === id);
  const roundNum = Number(round) || (cup ? cup.data.length : 4);

  if (!cup) {
    return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <Match
      cup={cup}
      selectedCount={roundNum} // ★ 핵심: selectedCount로 넘김
      onResult={(winner, matchHistory) => {
        navigate(`/result/${cup.id}/${roundNum}`, {
          state: { winner, matchHistory }
        });
      }}
    />
  );
}

export default MatchPage;
