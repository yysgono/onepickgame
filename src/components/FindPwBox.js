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

function FindPwBox() {
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [foundPw, setFoundPw] = useState("");
  const [error, setError] = useState("");

  function handleNicknameChange(e) {
    const val = e.target.value;
    const sliced = sliceByByte(val, 12);
    setNickname(sliced);
  }

  function handleFindPw(e) {
    e.preventDefault();
    setFoundPw("");
    setError("");
    if (!userId || !nickname) {
      setError("아이디와 닉네임을 모두 입력하세요.");
      return;
    }
    if (getByteLength(nickname) > 12) {
      setError("닉네임은 최대 12바이트까지 가능합니다.");
      return;
    }
    const userList = JSON.parse(localStorage.getItem("userList") || "[]");
    const user = userList.find(u => u.userId === userId && u.nickname === nickname);
    if (!user) {
      setError("일치하는 정보가 없습니다.");
      return;
    }
    setFoundPw(`비밀번호: ${user.password}`);
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #0001", padding: 30 }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>비밀번호 찾기</h2>
      <form onSubmit={handleFindPw}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="아이디"
            style={{ width: "100%", padding: 10, borderRadius: 7, border: "1.2px solid #bbb", fontSize: 16 }}
            maxLength={18}
          />
        </div>
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
        >비밀번호 찾기</button>
      </form>
      {foundPw && <div style={{ color: "#1976ed", marginTop: 12, textAlign: "center" }}>{foundPw}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default FindPwBox;
