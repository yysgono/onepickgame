import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next"; // i18n

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

function FindPwBox() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNicknameChange(e) {
    const val = e.target.value;
    const sliced = sliceByByte(val, 12);
    setNickname(sliced);
  }

  async function handleFindPw(e) {
    e.preventDefault();
    setSuccessMsg("");
    setError("");
    if (!userId || !nickname) {
      setError(t("find_pw.input_all")); // "Please enter both email and nickname."
      return;
    }
    if (getByteLength(nickname) > 12) {
      setError(t("nickname_max_length"));
      return;
    }
    setLoading(true);

    try {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("email")
        .eq("nickname", nickname.trim())
        .eq("email", userId.trim())
        .single();

      if (pErr || !profile?.email) {
        setError(t("no_match_info"));
        setLoading(false);
        return;
      }

      // Supabase resetPasswordForEmail
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userId.trim(), {
        redirectTo: window.location.origin + "/reset-password"
      });
      if (resetErr) {
        setError(t("pw_reset_send_fail"));
      } else {
        setSuccessMsg(t("pw_reset_send_success"));
      }
    } catch (e) {
      setError(t("temporary_error"));
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #0001", padding: 30 }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>{t("find_pw.title")}</h2>
      <form onSubmit={handleFindPw}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder={t("email_id")}
            style={{ width: "100%", padding: 10, borderRadius: 7, border: "1.2px solid #bbb", fontSize: 16 }}
            maxLength={50}
            disabled={loading}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder={t("nickname")}
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
        >{loading ? t("find_pw.loading") : t("find_pw.button")}</button>
      </form>
      {successMsg && <div style={{ color: "#1976ed", marginTop: 12, textAlign: "center" }}>{successMsg}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default FindPwBox;
