import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";

// 닉네임은 profiles 테이블에서 추가 관리!
export default function AuthBox({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg(error.message);
      else {
        setMsg("로그인 성공!");
        if (onLogin) onLogin(data.user);
        window.location.reload();
      }
    } else {
      // 회원가입
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) setMsg(error.message);
      else {
        // 닉네임은 profiles 테이블에 저장!
        const user = data.user;
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            nickname,
            created_at: new Date().toISOString(),
          });
        }
        setMsg("가입 성공! 이메일 인증 후 로그인하세요.");
      }
    }
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // 현재 로그인 확인
  const [user, setUser] = useState(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  if (user)
    return (
      <div style={{ padding: 18 }}>
        <b>{user.email}</b>님 로그인됨.
        <button style={{ marginLeft: 10 }} onClick={logout}>로그아웃</button>
      </div>
    );

  return (
    <div style={{ maxWidth: 340, margin: "80px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #1976ed13", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>{mode === "login" ? "로그인" : "회원가입"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required disabled={loading} />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} style={inputStyle} required disabled={loading} />
        {mode === "signup" &&
          <input type="text" placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} required disabled={loading} />
        }
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "처리중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
      <div style={{ margin: "14px 0" }}>
        <button style={switchBtnStyle} onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "회원가입으로" : "로그인으로"}
        </button>
      </div>
      <div style={{ color: msg.startsWith("가입") ? "#1976ed" : "red", marginTop: 9, textAlign: "center" }}>{msg}</div>
    </div>
  );
}
const inputStyle = { width: "100%", marginBottom: 12, padding: 9, borderRadius: 7, border: "1px solid #bbb", fontSize: 16 };
const buttonStyle = { width: "100%", background: "#1976ed", color: "#fff", borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 17, border: "none", cursor: "pointer" };
const switchBtnStyle = { background: "none", color: "#1976ed", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "underline" };
