import React, { useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";

function ResurrectionPage({
  eliminated = [],
  advanced = [],
  maxElim = 4,
  maxAdv = 4,
  selElim,
  setSelElim,
  selAdv,
  setSelAdv,
  onConfirm,
  onCancel,
  isSaving = false,
  saveInProgressMsg = "",
}) {
  const { t } = useTranslation();

  const [queryElim, setQueryElim] = useState("");
  const [queryAdv, setQueryAdv] = useState("");

  const filteredElim = useMemo(
    () =>
      eliminated.filter((c) =>
        c.name.toLowerCase().includes(queryElim.toLowerCase())
      ),
    [eliminated, queryElim]
  );

  const filteredAdv = useMemo(
    () =>
      advanced.filter((c) =>
        c.name.toLowerCase().includes(queryAdv.toLowerCase())
      ),
    [advanced, queryAdv]
  );

  function toggleElim(c) {
    if (selElim.find((x) => x.id === c.id)) {
      setSelElim(selElim.filter((x) => x.id !== c.id));
    } else if (selElim.length < maxElim) {
      setSelElim([...selElim, c]);
    }
  }
  function toggleAdv(c) {
    if (selAdv.find((x) => x.id === c.id)) {
      setSelAdv(selAdv.filter((x) => x.id !== c.id));
    } else if (selAdv.length < maxAdv) {
      setSelAdv([...selAdv, c]);
    }
  }

  const bothReady =
    selElim.length > 0 &&
    selElim.length === selAdv.length &&
    selElim.length <= maxElim &&
    selAdv.length <= maxAdv;

  const noticeStyle = {
    fontSize: 17,
    color: "#fff",
    background: "rgba(0,0,0,0.07)",
    padding: "12px 16px 10px 16px",
    borderRadius: 16,
    marginBottom: 20,
    fontWeight: 600,
    lineHeight: 1.5,
    textAlign: "center",
    maxWidth: 740,
    margin: "0 auto 25px auto",
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "none",
        padding: "44px 0 80px 0",
        fontFamily: "Noto Sans, Arial, sans-serif",
      }}
    >
      {/* Buttons */}
      <div
        style={{
          width: "100%",
          maxWidth: 800,
          margin: "0 auto 30px auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
        }}
      >
        <button
          onClick={onCancel}
          disabled={isSaving}
          style={{
            background: isSaving ? "#555" : "#27363e",
            color: "#fff",
            padding: "15px 38px",
            borderRadius: 13,
            fontWeight: 700,
            fontSize: 20,
            border: "none",
            cursor: isSaving ? "not-allowed" : "pointer",
            letterSpacing: "0.7px",
          }}
        >
          {t("resurrection.skip")}
        </button>
        <button
          onClick={() =>
            bothReady && !isSaving && onConfirm([
              ...advanced.filter((c) => !selAdv.some((x) => x.id === c.id)),
              ...selElim,
            ])
          }
          disabled={!bothReady || isSaving}
          style={{
            background: bothReady && !isSaving ? "#2976ed" : "#b3c5dd",
            color: "#fff",
            padding: "15px 38px",
            borderRadius: 13,
            fontWeight: 900,
            fontSize: 20,
            border: "none",
            cursor: bothReady && !isSaving ? "pointer" : "not-allowed",
            letterSpacing: "0.7px",
          }}
        >
          {t("resurrection.confirm")}
        </button>
      </div>

      {/* Saving message */}
      {saveInProgressMsg && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#aad",
            marginBottom: 18,
          }}
        >
          {saveInProgressMsg}
        </div>
      )}

      {/* Title & instructions */}
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          margin: "0 0 18px 0",
          color: "#fff",
        }}
      >
        {t("resurrection.title")}
      </div>
      <div style={noticeStyle}>
        <Trans i18nKey="resurrection.instruction">
          Please select <b>1~4 candidates to revive</b> from the left,
          <br />
          and <b>1~4 advanced candidates to drop</b> from the right.
          <br />
          <b>The number of revived and dropped candidates must be equal.</b>
          <br />
          If you don't want to proceed, just click Skip.
        </Trans>
        <br />
        <span style={{ color: "#99e", fontWeight: 400 }}>
          {t("resurrection.note")}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 34,
          width: "90vw",
          maxWidth: 1300,
          margin: "0 auto",
          alignItems: "flex-start",
        }}
      >
        {/* Eliminated Candidates */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "#fff",
              marginBottom: 6,
              textAlign: "left",
            }}
          >
            {t("resurrection.eliminated")}
          </div>
          <input
            placeholder={t("resurrection.search_placeholder")}
            value={queryElim}
            onChange={(e) => setQueryElim(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 520,
              fontSize: 16,
              marginBottom: 12,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1.7px solid #1976ed44",
              outline: "none",
              background: "#101826",
              color: "#fff",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 14,
              maxHeight: "54vh",
              overflowY: "auto",
              paddingBottom: 8,
              borderRadius: 12,
              background: "rgba(30,40,65,0.52)",
              marginBottom: 8,
            }}
          >
            {filteredElim.map((c) => {
              const selected = selElim.some((x) => x.id === c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleElim(c)}
                  style={{
                    background: selected ? "#2976ed" : "#202b3d",
                    color: selected ? "#fff" : "#d6eaff",
                    border: selected
                      ? "2.5px solid #6fd6fc"
                      : "2.5px solid #182345",
                    borderRadius: 14,
                    cursor: "pointer",
                    minHeight: 70,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",   // 중앙정렬
                    alignItems: "center",        // 중앙정렬
                    flexDirection: "column",
                    transition: "all 0.14s",
                    boxShadow: selected
                      ? "0 4px 18px #1976ed66"
                      : "0 1px 8px #1976ed33",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 17,
                      textAlign: "center",
                      maxWidth: 145,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#d1e0ff",
              margin: "7px 0 0 3px",
              fontWeight: 500,
            }}
          >
            {t("resurrection.select_count", {
              selected: selElim.length,
              max: maxElim,
            })}
          </div>
        </div>

        {/* Advanced Candidates */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "#fff",
              marginBottom: 6,
              textAlign: "left",
            }}
          >
            {t("resurrection.advanced")}
          </div>
          <input
            placeholder={t("resurrection.search_placeholder")}
            value={queryAdv}
            onChange={(e) => setQueryAdv(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 520,
              fontSize: 16,
              marginBottom: 12,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1.7px solid #1976ed44",
              outline: "none",
              background: "#101826",
              color: "#fff",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 14,
              maxHeight: "54vh",
              overflowY: "auto",
              paddingBottom: 8,
              borderRadius: 12,
              background: "rgba(30,40,65,0.52)",
              marginBottom: 8,
            }}
          >
            {filteredAdv.map((c) => {
              const selected = selAdv.some((x) => x.id === c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleAdv(c)}
                  style={{
                    background: selected ? "#2976ed" : "#202d3d",
                    color: selected ? "#fff" : "#d6eaff",
                    border: selected
                      ? "2.5px solid #6fd6fc"
                      : "2.5px solid #182345",
                    borderRadius: 14,
                    cursor: "pointer",
                    minHeight: 70,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",   // 중앙정렬
                    alignItems: "center",        // 중앙정렬
                    flexDirection: "column",
                    transition: "all 0.14s",
                    boxShadow: selected
                      ? "0 4px 18px #1976ed66"
                      : "0 1px 8px #1976ed33",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 17,
                      textAlign: "center",
                      maxWidth: 145,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#d1e0ff",
              margin: "7px 0 0 3px",
              fontWeight: 500,
            }}
          >
            {t("resurrection.select_count", {
              selected: selAdv.length,
              max: maxAdv,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResurrectionPage;
