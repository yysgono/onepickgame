import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";

// 바이트 길이 체크
function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 127 ? 2 : 1;
  }
  return len;
}
function isValidNickname(nick, i18n) {
  if (!nick) return false;
  // 한글/영문/숫자/_/- 허용, 3~12바이트, 금지어 제외
  const regex = /^[\uAC00-\uD7A3\w-]+$/;
  if (!regex.test(nick)) return false;
  if (getByteLength(nick) < 3 || getByteLength(nick) > 12) return false;
  if (hasBadword(nick, i18n.language)) return false;
  return true;
}

export default function AuthBox({ onLogin }) {
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 현재 로그인 확인
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg(error.message);
      else {
        setMsg(t("login_success")); // "로그인 성공!"
        if (onLogin) onLogin(data.user);
        window.location.reload();
      }
    } else {
      // 닉네임 검사
      if (!isValidNickname(nickname, i18n)) {
        setMsg(
          t("nickname_rule", { defaultValue: "닉네임은 한글, 영문, 숫자, -, _만, 3~12바이트, 금지어 불가" })
        );
        setLoading(false);
        return;
      }
      // 닉네임 대소문자 무시, 완전일치 중복 체크 (DB는 그대로!)
      const { data: exists, error: existError } = await supabase
        .from("profiles")
        .select("nickname")
        .ilike("nickname", nickname); // 부분일치로 다 받아오기

      if (existError) {
        setMsg(existError.message);
        setLoading(false);
        return;
      }
      // JS에서 대소문자 무시 완전일치로 체크
      const isDup = exists && exists.some(row =>
        row.nickname.toLowerCase() === nickname.toLowerCase()
      );
      if (isDup) {
        setMsg(t("nickname_exists", { defaultValue: "이미 사용 중인 닉네임입니다." }));
        setLoading(false);
        return;
      }
      // 회원가입
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) setMsg(error.message);
      else {
        const user = data.user;
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            nickname,
            created_at: new Date().toISOString(),
          });
        }
        setMsg(t("signup_success", { defaultValue: "가입 성공! 이메일 인증을 완료해 주세요." }));
      }
    }
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (user)
    return (
      <div style={{ padding: 18 }}>
        <b>{user.email}</b> {t("login_greeting", { defaultValue: "님, 환영합니다!" })}
        <button style={{ marginLeft: 10 }} onClick={logout}>
          {t("logout", { defaultValue: "로그아웃" })}
        </button>
      </div>
    );

  return (
    <div style={{
      maxWidth: 340,
      margin: "80px auto",
      background: "#fff",
      borderRadius: 10,
      boxShadow: "0 2px 12px #1976ed13",
      padding: 24
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>
        {mode === "login" ? t("login", { defaultValue: "로그인" }) : t("signup", { defaultValue: "회원가입" })}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t("email", { defaultValue: "이메일" })}
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder={t("password", { defaultValue: "비밀번호" })}
          value={pw}
          onChange={e => setPw(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
        {mode === "signup" &&
          <input
            type="text"
            placeholder={t("nickname", { defaultValue: "닉네임" })}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            style={inputStyle}
            required
            maxLength={14}
            disabled={loading}
          />
        }
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading
            ? t("processing", { defaultValue: "처리중..." })
            : mode === "login"
              ? t("login", { defaultValue: "로그인" })
              : t("signup", { defaultValue: "회원가입" })}
        </button>
      </form>
      <div style={{ margin: "14px 0" }}>
        <button
          style={switchBtnStyle}
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? t("to_signup", { defaultValue: "회원가입 하기" })
            : t("to_login", { defaultValue: "로그인 하기" })}
        </button>
      </div>
      <div style={{
        color: msg.startsWith(t("signup_success", { defaultValue: "가입" })) ? "#1976ed" : "red",
        marginTop: 9,
        textAlign: "center"
      }}>
        {msg}
      </div>
    </div>
  );
}
const inputStyle = {
  width: "100%",
  marginBottom: 12,
  padding: 9,
  borderRadius: 7,
  border: "1px solid #bbb",
  fontSize: 16
};
const buttonStyle = {
  width: "100%",
  background: "#1976ed",
  color: "#fff",
  borderRadius: 8,
  padding: "11px 0",
  fontWeight: 700,
  fontSize: 17,
  border: "none",
  cursor: "pointer"
};
const switchBtnStyle = {
  background: "none",
  color: "#1976ed",
  border: "none",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  textDecoration: "underline"
};
