import React from "react";

// 예시로 localStorage에서 winnerStats, comments, visitLogs 가져옴
export default function AdminStatsPage() {
  const winnerStats = JSON.parse(localStorage.getItem("winnerStats") || "{}");
  const comments = JSON.parse(localStorage.getItem("comments") || "{}");
  const totalComments = Object.values(comments).reduce((a, v) => a + v.length, 0);

  // 방문자 통계
  const visitLogs = JSON.parse(localStorage.getItem("visitLogs") || "{}");
  const today = new Date().toISOString().slice(0, 10);
  const todayUsers = visitLogs[today] ? visitLogs[today].length : 0;

  // 최근 7일치 날짜/유저수
  const recent7 = Object.keys(visitLogs)
    .sort()
    .slice(-7)
    .map(date => ({
      date,
      count: visitLogs[date].length,
    }));

  // 누적 월드컵 개수 추정: winnerStats에서 id만으로 추산 (혹시 더 정확하게 하려면 worldcupList 개수 사용!)
  const totalWorldcups = Object.keys(winnerStats).length;

  // 그래프를 위한 값
  const chartMax = Math.max(...recent7.map(r => r.count), 1);

  return (
    <div style={{
      maxWidth: 950,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 4px 24px #e6ecfa",
      padding: "40px 16px 56px 16px"
    }}>
      <h2 style={{
        fontWeight: 900,
        fontSize: 32,
        color: "#1976ed",
        marginBottom: 32,
        letterSpacing: -1,
        textAlign: "center",
        textShadow: "0 1px 10px #b1deff30"
      }}>
        관리자 통계 대시보드
      </h2>

      {/* 카드형 통계 */}
      <div style={{
        display: "flex",
        gap: 30,
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 46
      }}>
        {[
          {
            label: "누적 월드컵",
            value: totalWorldcups,
            icon: "🥇",
            color: "#1976ed"
          },
          {
            label: "누적 댓글",
            value: totalComments,
            icon: "💬",
            color: "#38b27a"
          },
          {
            label: "오늘 접속자",
            value: todayUsers,
            icon: "👥",
            color: "#f2b518"
          }
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            style={{
              background: "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",
              borderRadius: 20,
              boxShadow: "0 4px 18px #1976ed13",
              minWidth: 210,
              padding: "34px 36px",
              textAlign: "center",
              transition: "box-shadow 0.18s, transform 0.18s",
              cursor: "pointer"
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = "0 10px 36px #1976ed33";
              e.currentTarget.style.transform = "translateY(-5px) scale(1.045)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = "0 4px 18px #1976ed13";
              e.currentTarget.style.transform = "none";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 7 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3b4872" }}>{label}</div>
            <div style={{
              fontSize: 40,
              fontWeight: 900,
              color,
              marginTop: 8,
              textShadow: "0 2px 12px #1976ed13"
            }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 최근 7일 통계 + 그래프 */}
      <div style={{
        background: "#f5f7fb",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 1px 10px #dde5ef77",
        marginBottom: 32
      }}>
        <h4 style={{
          fontWeight: 800,
          marginBottom: 22,
          fontSize: 20,
          color: "#26326b"
        }}>
          최근 7일 접속자 수
        </h4>
        {/* Bar Chart */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 19,
          height: 120,
          marginBottom: 12
        }}>
          {recent7.map(r => (
            <div key={r.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                height: `${(r.count / chartMax) * 80 + 18}px`,
                width: 21,
                background: "linear-gradient(180deg, #4ea2f9 70%, #1976ed 100%)",
                borderRadius: 8,
                marginBottom: 6,
                transition: "height 0.25s"
              }} title={r.count} />
              <span style={{
                fontSize: 12,
                color: "#bbb",
                letterSpacing: 0,
                textAlign: "center"
              }}>{r.date.slice(5).replace("-", "/")}</span>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#f9faff", marginTop: 9 }}>
          <thead>
            <tr style={{ background: "#ecf1fa" }}>
              <th style={{ padding: "10px 0", borderBottom: "2px solid #e4e9f0", fontWeight: 700, fontSize: 15, color: "#26326b" }}>날짜</th>
              <th style={{ padding: "10px 0", borderBottom: "2px solid #e4e9f0", fontWeight: 700, fontSize: 15, color: "#26326b" }}>접속자 수</th>
            </tr>
          </thead>
          <tbody>
            {recent7.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", padding: 22, color: "#aaa" }}>데이터 없음</td>
              </tr>
            ) : recent7.map(r => (
              <tr key={r.date} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "11px 0", textAlign: "center", fontSize: 15 }}>{r.date}</td>
                <td style={{ padding: "11px 0", textAlign: "center", fontSize: 15, fontWeight: 700 }}>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: "#b6bbd2", textAlign: "center", fontSize: 13, marginTop: 32 }}>
        <span>onepickgame 관리자 통계 © {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
