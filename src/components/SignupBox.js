import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../utils/supabaseUserApi";
import { generateRandomNickname } from "../utils/randomNickname";
import { useTranslation } from "react-i18next";

function getLangPath(i18n, path = "") {
  const lang = i18n.language || "en";
  if (path.startsWith("/")) path = path.slice(1);
  return `/${lang}${path ? "/" + path : ""}`;
}

function SignupBox() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function validate() {
    if (!email || !password) {
      setError(t("fill_this_field"));
      return false;
    }
    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError(t("need_at_in_email"));
      return false;
    }
    if (password.length < 6) {
      setError(t("pw_min_length"));
      return false;
    }
    return true;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;
    setLoading(true);

    const nickname = generateRandomNickname();

    const { user, error: signupErr } = await signupUser(email, password, nickname);

    if (signupErr) {
      if (
        signupErr.message.includes("User already registered") ||
        signupErr.message.includes("already registered") ||
        signupErr.message.includes("already exists") ||
        signupErr.message.includes("이미 가입")
      ) {
        setError(t("already_registered_email"));
      } else {
        setError(signupErr.message || t("signup_failed"));
      }
      setLoading(false);
      return;
    }

    setSuccess(t("signup_success"));
    setEmail("");
    setPassword("");
    setLoading(false);

    setTimeout(() => {
      navigate(getLangPath(i18n)); // always move to "/en" etc.
    }, 2000);
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "60px auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: 30,
      }}
      aria-label={t("signup")}
    >
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>{t("signup")}</h2>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            }}
            required
            spellCheck={false}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            aria-label={t("password")}
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16,
            }}
            maxLength={20}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#1976ed",
            color: "#fff",
            fontWeight: 800,
            border: "none",
            borderRadius: 9,
            fontSize: 19,
            padding: "11px 0",
            marginBottom: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("signing_up") : t("register")}
        </button>
      </form>
      {success && (
        <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default SignupBox;
