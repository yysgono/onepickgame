import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 본인 프로젝트 정보로 수정!
const supabase = createClient(
  "https://irfyuvuazhujtlgpkfci.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZnl1dnVhemh1anRsZ3BrZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDY0MTAsImV4cCI6MjA2NjEyMjQxMH0.q4s3G9mGnCbX7Urtks6_63XOSD8Ry2_GcmGM1wE7TBE"
);

function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 127 ? 2 : 1;
  }
  return len;
}
function sliceByByte(str, maxBytes) {
  let bytes = 0;
  let result = "";
  for (let i = 0; i < str.length; i++) {
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
  const [loading, setLoading] = useState(false);

  function handleNicknameChange(e) {
    const val = e.target.value;
    const sliced = sliceByByte(val, 12);
    setNickname(sliced);
  }

  async function handleFindId(e) {
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
    setLoading(true);

    try {
      // profiles 테이블에서 닉네임으로 이메일 바로 찾기!
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("email")
        .eq("nickname", nickname.trim())
        .single();

      if (pErr || !profile?.email) {
        setError("해당 닉네임으로 가입된 아이디(이메일)가 없습니다.");
      } else {
        setFoundId(`아이디(이메일): ${profile.email}`);
      }
    } catch (e) {
      setError("일시적인 오류가 발생했습니다.");
    }
    setLoading(false);
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
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#1976ed", color: "#fff", fontWeight: 800, border: "none",
            borderRadius: 9, fontSize: 19, padding: "11px 0", marginBottom: 8, cursor: "pointer"
          }}
          disabled={loading}
        >{loading ? "검색 중..." : "아이디 찾기"}</button>
      </form>
      {foundId && <div style={{ color: "#1976ed", marginTop: 12, textAlign: "center" }}>{foundId}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default FindIdBox;
