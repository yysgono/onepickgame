import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Match from "./Match";

function MatchPage({ worldcupList }) {
  const { id, round } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const cup = worldcupList.find(c => String(c.id) === id);
  const roundNum = Number(round) || (cup ? cup.data.length : 4);

  // 언어코드 추출 (라우트 일치용)
  const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const lang = langMatch ? langMatch[1] : "ko";

  if (!cup) return null;

  return (
    <Match
      cup={cup}
      selectedCount={roundNum}
      onResult={(winner, matchHistory) => {
        // 반드시 /:lang/result/:id/:round로 이동해야 함!
        navigate(`/${lang}/result/${cup.id}/${roundNum}`, {
          state: { winner, matchHistory }
        });
      }}
    />
  );
}

export default MatchPage;
