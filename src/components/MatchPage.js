// src/components/MatchPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Match from "./Match";
import { fetchWorldcupById } from "../db"; // DB에서 월드컵 1개 불러오기

function MatchPage() {
  const { id, round } = useParams();
  const navigate = useNavigate();

  const [cup, setCup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchWorldcupById(id)
      .then(setCup)
      .finally(() => setLoading(false));
  }, [id]);

  const roundNum = Number(round) || (cup ? cup.data.length : 4);

  if (loading) {
    return <div style={{ padding: 80, textAlign: "center" }}>로딩 중...</div>;
  }
  if (!cup) {
    return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <Match
      cup={cup}
      round={roundNum}
      onResult={(winner, matchHistory) => {
        navigate(`/result/${cup.id}/${roundNum}`, {
          state: { winner, matchHistory }
        });
      }}
    />
  );
}

export default MatchPage;
