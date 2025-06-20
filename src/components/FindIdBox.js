import React, { useState } from "react";

function getByteLength(str) {
  let len = 0;
  for (let i=0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 127 ? 2 : 1;
  }
  return len;
}
function sliceByByte(str, maxBytes) {
  let bytes = 0;
  let result = "";
  for (let i=0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    const charBytes = code > 127 ? 2 : 1;
    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }
  return result;
}

function FindIdBox() {
  const [nickname, setNickname] = useState("");
  const [foundId, setFoundId] = useState("");
  const [error, setError] = useState("");

  function handleNicknameChange(e) {
    const val = e.target.value;
    const sliced = sliceByByte(val, 12);
    setNickname(sliced);
  }

  function handleFindId(e) {
    e.preventDefault();
    setFoundId("");
    setError("");
    if (!nickname) {
      setError("닉네임을 입력하세요.");
      return;
    }
    if (getByteLength(nickname) > 12) {
      setError("닉네임은 최대 12바이트까지 가능합니다.");
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
            onChange={handleNicknameChange}
            placeholder="닉네임"
            style={{ width: "100%", padding: 10, borderRadius: 7, border: "1.2px solid #bbb", fontSize: 16 }}
            autoComplete="off"
            spellCheck={false}
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
