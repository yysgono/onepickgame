import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useTranslation } from "react-i18next";


const pageStyle = {
  minHeight: "calc(100vh - 220px)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "54px 16px 80px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: 430,
  background: "linear-gradient(180deg, rgba(17,30,49,0.98) 0%, rgba(10,21,37,0.98) 100%)",
  border: "1px solid rgba(70,145,235,0.5)",
  borderRadius: 20,
  boxShadow: "0 24px 70px rgba(0,0,0,0.42), 0 0 28px rgba(25,118,237,0.10)",
  padding: "34px 32px 30px",
  boxSizing: "border-box",
  color: "#fff",
  fontFamily: "'Pretendard','Noto Sans KR',Arial,sans-serif",
};

const inputStyle = {
  width: "100%",
  minHeight: 48,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #35577e",
  background: "#0b1728",
  color: "#fff",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  minHeight: 50,
  background: "linear-gradient(90deg,#2999ff,#236de8 100%)",
  color: "#fff",
  fontWeight: 900,
  border: "none",
  borderRadius: 11,
  fontSize: 17,
  padding: "11px 14px",
  boxShadow: "0 8px 24px rgba(35,109,232,0.3)",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#c7d8eb",
  fontSize: 14,
  fontWeight: 800,
};


function LoginBox({ setUser, setNickname }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const lang = (i18n.language || "en").split("-")[0];

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      if (/invalid login credentials|invalid|잘못된/i.test(loginError.message || "")) {
        setError(t("auth.login.wrongInfo"));
      } else {
        setError(loginError.message || t("auth.login.failed"));
      }
      return;
    }
    if (data?.user) {
      setUser?.(data.user);
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", data.user.id).single();
      setNickname?.(profile?.nickname || "");
    }
    setEmail("");
    setPassword("");
    navigate(`/${lang}`);
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle} aria-label={t("auth.login.title")}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.1, color: "#64d8ff", marginBottom: 8 }}>ONE PICK GAME</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: "#fff" }}>{t("auth.login.title")}</h2>
          <p style={{ margin: "9px 0 0", color: "#8fa8c2", fontSize: 14, lineHeight: 1.55 }}>{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>{t("auth.common.email")}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.common.emailPlaceholder")} autoCapitalize="none" autoComplete="email" style={{...inputStyle, marginBottom: 16}} required spellCheck={false} />

          <label style={labelStyle}>{t("auth.common.password")}</label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.common.passwordPlaceholder")} autoComplete="current-password" style={{...inputStyle, paddingRight: 48}} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={t("auth.common.togglePassword")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, border: 0, background: "transparent", color: "#64d8ff", cursor: "pointer", fontSize: 17 }}>👁</button>
          </div>

          <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer"}}>
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
          {error && <div style={{ color: "#ff728e", marginTop: 14, textAlign: "center", fontSize: 14, fontWeight: 700 }}>{error}</div>}
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #233b58", textAlign: "center" }}>
          <Link to={`/${lang}/signup`} style={{ color: "#64d8ff", fontWeight: 900, textDecoration: "none", display: "block", marginBottom: 13 }}>{t("auth.login.signupLink")}</Link>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link to={`/${lang}/find-id`} style={{ color: "#a9bad0", textDecoration: "none", fontSize: 14 }}>{t("auth.login.findId")}</Link>
            <span style={{ color: "#425a75" }}>•</span>
            <Link to={`/${lang}/find-pw`} style={{ color: "#a9bad0", textDecoration: "none", fontSize: 14 }}>{t("auth.login.findPw")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginBox;
