import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../utils/supabaseUserApi";
import { generateRandomNickname } from "../utils/randomNickname";
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


function SignupBox() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const lang = (i18n.language || "en").split("-")[0];

  function validate() {
    if (!email || !password) { setError(t("auth.signup.fillAll")); return false; }
    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) { setError(t("auth.signup.invalidEmail")); return false; }
    if (password.length < 6) { setError(t("auth.signup.passwordMin")); return false; }
    return true;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validate()) return;
    setLoading(true);
    const nickname = generateRandomNickname();
    const { error: signupErr } = await signupUser(email, password, nickname);
    if (signupErr) {
      if (/already registered|already exists|이미 가입/i.test(signupErr.message || "")) setError(t("auth.signup.alreadyRegistered"));
      else setError(signupErr.message || t("auth.signup.failed"));
      setLoading(false);
      return;
    }
    setSuccess(t("auth.signup.success"));
    setEmail("");
    setPassword("");
    setLoading(false);
    setTimeout(() => navigate(`/${lang}/login`), 1600);
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle} aria-label={t("auth.signup.title")}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1a6fd0,#27a6ff)", boxShadow: "0 10px 28px rgba(39,166,255,.28)", fontSize: 25 }}>✨</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: "#fff" }}>{t("auth.signup.title")}</h2>
          <p style={{ margin: "9px 0 0", color: "#8fa8c2", fontSize: 14, lineHeight: 1.55 }}>{t("auth.signup.subtitle")}</p>
        </div>

        <form onSubmit={handleSignup}>
          <label style={labelStyle}>{t("auth.common.email")}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.common.emailPlaceholder")} autoCapitalize="none" autoComplete="email" style={{...inputStyle, marginBottom: 16}} required spellCheck={false} />

          <label style={labelStyle}>{t("auth.common.password")}</label>
          <div style={{ position: "relative" }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.common.passwordPlaceholder")} autoComplete="new-password" style={{...inputStyle, paddingRight: 48}} maxLength={20} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={t("auth.common.togglePassword")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, border: 0, background: "transparent", color: "#64d8ff", cursor: "pointer", fontSize: 17 }}>👁</button>
          </div>
          <div style={{ color: "#7f96b0", fontSize: 12, margin: "8px 0 20px" }}>{t("auth.signup.passwordHint")}</div>

          <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.65 : 1, cursor: loading ? "not-allowed" : "pointer"}}>
            {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
          </button>
        </form>

        {success && <div style={{ color: "#62e6a7", marginTop: 15, textAlign: "center", fontWeight: 800 }}>{success}</div>}
        {error && <div style={{ color: "#ff728e", marginTop: 15, textAlign: "center", fontWeight: 700 }}>{error}</div>}

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #233b58", textAlign: "center" }}>
          <span style={{ color: "#91a6bd", fontSize: 14 }}>{t("auth.signup.alreadyHave")} </span>
          <Link to={`/${lang}/login`} style={{ color: "#64d8ff", fontWeight: 900, textDecoration: "none" }}>{t("auth.signup.backToLogin")}</Link>
        </div>
      </div>
    </div>
  );
}
export default SignupBox;
