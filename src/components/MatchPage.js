import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Match from "./Match";

// MatchPage: 특정 월드컵에서 N강(라운드) 경기를 시작하는 페이지
function MatchPage({ worldcupList }) {
  const { id, round } = useParams();
  const navigate = useNavigate();

  // 현재 월드컵 찾기
  const cup = worldcupList.find(c => String(c.id) === id);
  // 라운드 숫자 (파라미터 round 없으면 후보 개수로 자동 결정, 예: 8, 16 등)
  const roundNum = Number(round) || (cup ? cup.data.length : 4);

  // 월드컵이 없을 때 null (또는 Not Found 처리)
  if (!cup) return null;

  // Match 컴포넌트로 위임, 결과 나오면 /result/:id/:round로 이동 (state에 winner, matchHistory)
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
