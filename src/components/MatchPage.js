import React from "react";
import Match from "./Match";

function MatchPage({ cup, round, onResult }) {
  if (!cup) {
    return (
      <div style={{ padding: 80, color: "#c00", textAlign: "center" }}>
        월드컵 정보를 찾을 수 없습니다.<br />
        <a href="/" style={{ color: "#1976ed" }}>홈으로 돌아가기</a>
      </div>
    );
  }

  return (
    <Match
      cup={cup}
      round={round}
      onResult={onResult}
    />
  );
}

export default MatchPage;
