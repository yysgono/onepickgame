import React, { useState } from "react";

function FindIdBox() {
  const [nickname, setNickname] = useState("");
  const [foundId, setFoundId] = useState("");
  const [error, setError] = useState("");

  function handleFindId(e) {
    e.preventDefault();
    setFoundId("");
    setError("");
    if (!nickname) {
      setError("닉네임을 입력하세요.");
      return;
    }
    const userList = JSON.parse(localStorage.getItem("userList") || "[]");
    const user = userList.find(u => u.nickname === nickname);
    if (!user) {
      setError("해당 닉네임으로 가입된 아이디가 없습니다.");
      return;
    }
    setFoundId(`아이디: ${user.userId}`);
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #0001", padding: 30 }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>아이디 찾기</h2>
      <form onSubmit={handleFindId}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="닉네임"
            style={{ width: "100%", padding: 10, borderRadius: 7, border: "1.2px solid #bbb", fontSize: 16 }}
            maxLength={16}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#1976ed", color: "#fff", fontWeight: 800, border: "none",
            borderRadius: 9, fontSize: 19, padding: "11px 0", marginBottom: 8, cursor: "pointer"
          }}
        >아이디 찾기</button>
      </form>
      {foundId && <div style={{ color: "#1976ed", marginTop: 12, textAlign: "center" }}>{foundId}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default FindIdBox;
