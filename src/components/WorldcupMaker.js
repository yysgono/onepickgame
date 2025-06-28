// src/components/WorldcupMaker.jsx

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import CandidateInput from "./CandidateInput";
import COLORS from "../styles/theme";
import { mainButtonStyle, grayButtonStyle } from "../styles/common";
import { addWorldcupGame } from "../utils/supabaseWorldcupApi";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { supabase } from "../utils/supabaseClient";

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
    { id: uuidv4(), name: "", image: "" },
    { id: uuidv4(), name: "", image: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 로그인 유저/닉네임 state
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const mobile = isMobile();

  // 유저 인증 정보 불러오기
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // 닉네임은 별도 쿼리
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();
        setNickname(profile?.nickname || "");
      }
    }
    fetchUser();
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2>{t("loginRequired") || "로그인 후 이용 가능합니다."}</h2>
      </div>
    );
  }

  function addCandidate() {
    setCandidates((candidates) => [
      ...candidates,
      { id: uuidv4(), name: "", image: "" },
    ]);
  }
  function updateCandidate(idx, val) {
    setCandidates((cands) => cands.map((c, i) => (i === idx ? val : c)));
  }
  function removeCandidate(idx) {
    setCandidates((cands) => cands.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (loading) return;

    // 입력값 검사
    const list = candidates
      .map((c) => ({
        ...c,
        name: c.name.trim(),
        image: c.image.trim(),
        id: c.id || uuidv4(), // 혹시 id 누락시 uuid 생성
      }))
      .filter((c) => c.name && c.image);

    if (!title.trim()) return setError("제목을 입력하세요.");
    if (list.length < 2) return setError("후보를 2개 이상 입력하세요.");

    setLoading(true);

    try {
      // base64 이미지 → Storage 업로드 후 url로 변환
      const updatedList = await Promise.all(
        list.map(async (c) => {
          if (c.image.startsWith("data:image")) {
            const file = await fetch(c.image).then(r => r.blob());
            const url = await uploadCandidateImage(
              new File([file], `${c.name}.png`, { type: file.type }),
              nickname || user.email // 폴더명(닉 or 이메일)
            );
            return { ...c, image: url };
          }
          return c;
        })
      );

      // supabase worldcups 테이블에 맞춰 새 월드컵 오브젝트 준비
      const newCup = {
        title: title.trim(),
        description: desc.trim(),
        data: updatedList,
        created_at: new Date().toISOString(),
        owner: user.email,
        creator: user.id, // 반드시 uuid!
      };

      const id = await addWorldcupGame(newCup);
      alert("월드컵이 저장되었습니다!\nID: " + id);

      if (onCreate) {
        onCreate({
          ...newCup,
          id,
        });
      }

      // 폼 초기화
      setTitle("");
      setDesc("");
      setCandidates([
        { id: uuidv4(), name: "", image: "" },
        { id: uuidv4(), name: "", image: "" },
      ]);
    } catch (e) {
      setError("저장 실패! 잠시 후 다시 시도해 주세요.");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        position: "relative",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          marginBottom: 20,
          fontSize: mobile ? 22 : 27,
          letterSpacing: "-1px",
          color: COLORS.main,
        }}
      >
        {t("createWorldcup")}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("worldcupTitle") || "월드컵 제목"}
          maxLength={36}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 15 : 18,
            marginBottom: 16,
          }}
          disabled={loading}
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("descriptionOptional") || "설명(선택)"}
          maxLength={100}
          rows={2}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: mobile ? 13 : 15,
            marginBottom: 18,
          }}
          disabled={loading}
        />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>
            {t("candidateList") || "후보 목록"}
          </div>
          {candidates.map((c, i) => (
            <CandidateInput
              key={c.id}
              value={c}
              onChange={(val) => updateCandidate(i, val)}
              onRemove={() => removeCandidate(i)}
              disabled={loading}
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
              width: mobile ? "100%" : undefined,
            }}
            disabled={loading}
          >
            + {t("addCandidate") || "후보 추가"}
          </button>
        </div>
        {error && (
          <div
            style={{
              color: COLORS.danger || "#d33",
              marginBottom: 10,
              textAlign: "center",
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
              padding: mobile ? "11px 0" : "13px 0",
            }}
            disabled={loading}
          >
            {loading ? t("saving") || "저장중..." : t("create") || "생성"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...grayButtonStyle(mobile),
              fontSize: mobile ? 15 : 17,
              borderRadius: 10,
              padding: mobile ? "11px 0" : "13px 0",
            }}
            disabled={loading}
          >
            {t("cancel") || "취소"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorldcupMaker;
