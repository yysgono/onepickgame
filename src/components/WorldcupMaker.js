import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CandidateInput from "./CandidateInput";

// 공통 스타일 import
import COLORS from "../styles/theme";
import {
  mainButtonStyle,
  grayButtonStyle,
} from "../styles/common";

function isMobile() {
  if (typeof window !== "undefined") {
    return window.innerWidth <= 700;
  }
  return false;
}

function WorldcupMaker({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [candidates, setCandidates] = useState([
    { id: 1, name: "", image: "" },
    { id: 2, name: "", image: "" }
  ]);
  const [error, setError] = useState("");
  const user = localStorage.getItem("onepickgame_user");
  const mobile = isMobile();

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2>{t("loginRequired")}</h2>
      </div>
    );
  }

  function addCandidate() {
    setCandidates(candidates => [
      ...candidates,
      { id: Date.now(), name: "", image: "" }
    ]);
  }
  function updateCandidate(idx, val) {
    setCandidates(cands => cands.map((c, i) => (i === idx ? val : c)));
  }
  function removeCandidate(idx) {
    setCandidates(cands => cands.filter((_, i) => i !== idx));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const list = candidates
      .map(c => ({
        ...c,
        name: c.name.trim(),
        image: c.image.trim()
      }))
      .filter(c => c.name && c.image);
    if (!title.trim()) return setError(t("enterWorldcupTitle"));
    if (list.length < 2) return setError(t("enterAtLeast2Candidates"));
    const newCup = {
      id: "cup-" + Date.now(),
      title: title.trim(),
      desc: desc.trim(),
      data: list.map((c, i) => ({
        id: String(i + 1),
        name: c.name,
        image: c.image
      })),
      creator: user,
      owner: user
    };
    onCreate(newCup);
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 20px #0002",
        padding: mobile ? 18 : 30,
        position: "relative"
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          marginBottom: 20,
          fontSize: mobile ? 22 : 27,
          letterSpacing: "-1px",
          color: COLORS.main
        }}
      >
        {t("createWorldcup")}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t("worldcupTitle")}
          maxLength={36}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 15 : 18,
            marginBottom: 16
          }}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder={t("descriptionOptional")}
          maxLength={100}
          rows={2}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 13 : 15,
            marginBottom: 18
          }}
        />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>
            {t("candidateList")}
          </div>
          {candidates.map((c, i) => (
            <CandidateInput
              key={c.id}
              value={c}
              onChange={val => updateCandidate(i, val)}
              onRemove={() => removeCandidate(i)}
            />
          ))}
          <button
            type="button"
            onClick={addCandidate}
            style={{
              ...mainButtonStyle(mobile),
              fontSize: 15,
              padding: mobile ? "8px 16px" : "10px 22px",
              borderRadius: 8,
              marginTop: 6,
              width: mobile ? "100%" : undefined
            }}
          >
            + {t("addCandidate")}
          </button>
        </div>
        {error && (
          <div
            style={{
              color: COLORS.danger,
              marginBottom: 10,
              textAlign: "center"
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            style={{
              ...mainButtonStyle(mobile),
              fontSize: mobile ? 15 : 17,
              borderRadius: 10,
              padding: mobile ? "11px 0" : "13px 0"
            }}
          >
            {t("create")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...grayButtonStyle(mobile),
              fontSize: mobile ? 15 : 17,
              borderRadius: 10,
              padding: mobile ? "11px 0" : "13px 0"
            }}
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;
