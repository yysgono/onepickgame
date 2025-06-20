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

function SignupBox() {
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleNicknameChange(e) {
    const val = e.target.value;
    const sliced = sliceByByte(val, 12);
    setNickname(sliced);
  }

  function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!nickname || !userId || !password) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    if (getByteLength(nickname) > 12) {
      setError("닉네임은 최대 12바이트까지 가능합니다.");
      return;
    }
    const userList = JSON.parse(localStorage.getItem("userList") || "[]");
    if (userList.some(u => u.userId === userId)) {
      setError("이미 존재하는 아이디입니다.");
      return;
    }
    userList.push({ nickname, userId, password });
    localStorage.setItem("userList", JSON.stringify(userList));
    setSuccess("회원가입이 완료되었습니다! 로그인 해주세요.");
    setNickname("");
    setUserId("");
    setPassword("");
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #0001", padding: 30 }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>회원가입</h2>
      <form onSubmit={handleSignup}>
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
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            style={{ width: "100%", padding: 10, borderRadius: 7, border: "1.2px solid #bbb", fontSize: 16 }}
            maxLength={20}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#1976ed", color: "#fff", fontWeight: 800, border: "none",
            borderRadius: 9, fontSize: 19, padding: "11px 0", marginBottom: 8, cursor: "pointer"
          }}
        >가입하기</button>
      </form>
      {success && <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>{success}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default SignupBox;
