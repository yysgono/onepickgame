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
  background: "#f5f6fa",
  border: "1px solid #dde2ea",
  borderRadius: 20,
  boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
  padding: "34px 32px 30px",
  boxSizing: "border-box",
  color: "#202534",
  fontFamily: "'Pretendard','Noto Sans KR',Arial,sans-serif",
};

const inputStyle = {
  width: "100%",
  minHeight: 48,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #dde2ea",
  background: "#ffffff",
  color: "#202534",
  fontSize: 18,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  minHeight: 50,
  background: "#6650d8",
  color: "#ffffff",
  fontWeight: 900,
  border: "none",
  borderRadius: 11,
  fontSize: 19,
  padding: "11px 14px",
  boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#202534",
  fontSize: 16,
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
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1.1, color: "#5542b8", marginBottom: 8 }}>ONE PICK GAME</div>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 950, color: "#202534" }}>{t("auth.login.title")}</h2>
          <p style={{ margin: "9px 0 0", color: "#5542b8", fontSize: 16, lineHeight: 1.55 }}>{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>{t("auth.common.email")}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.common.emailPlaceholder")} autoCapitalize="none" autoComplete="email" style={{...inputStyle, marginBottom: 16}} required spellCheck={false} />

          <label style={labelStyle}>{t("auth.common.password")}</label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.common.passwordPlaceholder")} autoComplete="current-password" style={{...inputStyle, paddingRight: 48}} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={t("auth.common.togglePassword")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, border: 0, background: "transparent", color: "#5542b8", cursor: "pointer", fontSize: 19 }}>👁</button>
          </div>

          <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer"}}>
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>
          {error && <div style={{ color: "#b42346", marginTop: 14, textAlign: "center", fontSize: 16, fontWeight: 700 }}>{error}</div>}
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #dde2ea", textAlign: "center" }}>
          <Link to={`/${lang}/signup`} style={{ color: "#5542b8", fontWeight: 900, textDecoration: "none", display: "block", marginBottom: 13 }}>{t("auth.login.signupLink")}</Link>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link to={`/${lang}/find-id`} style={{ color: "#5542b8", textDecoration: "none", fontSize: 16 }}>{t("auth.login.findId")}</Link>
            <span style={{ color: "#425a75" }}>•</span>
            <Link to={`/${lang}/find-pw`} style={{ color: "#5542b8", textDecoration: "none", fontSize: 16 }}>{t("auth.login.findPw")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginBox;
