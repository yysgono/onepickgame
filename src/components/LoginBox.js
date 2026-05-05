import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useTranslation } from "react-i18next";

function LoginBox({ setUser, setNickname }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (loginError) {
      if (
        loginError.message.includes("Invalid login credentials") ||
        loginError.message.includes("invalid") ||
        loginError.message.includes("잘못된")
      ) {
        setError(t("login_fail_wrong_info"));
      } else {
        setError(loginError.message || t("login_failed"));
      }
      return;
    }
    if (data?.user) {
      setUser && setUser(data.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.user.id)
        .single();
      setNickname && setNickname(profile?.nickname || "");
    }
    setEmail("");
    setPassword("");
    navigate(`/${i18n.language || "en"}`);
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "80px auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: 30,
      }}
      aria-label={t("login")}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20,  color: "#111" }}>{t("login")}</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t("email")}
          aria-label={t("email")}
          autoCapitalize="none"
          autoComplete="email"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 7,
            border: "1.2px solid #bbb",
            fontSize: 16,
            marginBottom: 12,
              boxSizing: "border-box", // ⭐ 이거 추가
          }}
          required
          spellCheck={false}
        />
<div style={{ position: "relative", marginBottom: 18 }}>
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={e => setPassword(e.target.value)}
    placeholder={t("password")}
    style={{
      width: "100%",
          padding: "10px 40px 10px 10px", // ⭐ 이거 추가
boxSizing: "border-box",
      borderRadius: 7,
      border: "1.2px solid #bbb",
      fontSize: 16,
    }}
    required
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#1976ed",
      fontSize: 18,
    }}
  >
    👁
  </span>
</div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#1976ed",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(25,118,237,0.4)",
            fontWeight: 800,
            border: "none",
            borderRadius: 9,
            fontSize: 19,
            padding: "11px 0",
            marginBottom: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("logging_in") : t("login")}
        </button>
        {error && (
          <div style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {error}
          </div>
        )}
      </form>
      <div style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
        <Link to={`/${i18n.language || "en"}/signup`} style={{ color: "#1976ed", marginBottom: 7, display: "block" }}>
          {t("register_as_member")}
        </Link>
        <Link to={`/${i18n.language || "en"}/find-id`} style={{ color: "#555", marginBottom: 5, display: "block" }}>
          {t("find_id")}
        </Link>
        <Link to={`/${i18n.language || "en"}/find-pw`} style={{ color: "#555", display: "block" }}>
          {t("find_pw")}
        </Link>
      </div>
    </div>
  );
}

export default LoginBox;
