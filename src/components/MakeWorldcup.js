import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { uploadCandidateImage } from "../utils/supabaseImageUpload";
import { addWorldcupGame } from "../utils/supabaseGameApi";
import { supabase } from "../utils/supabaseClient";
import imageCompression from "browser-image-compression"; // ★ 추가

// Youtube thumbnail helper
function getYoutubeThumb(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}
function getFileExtension(url) {
  if (!url) return "";
  const parts = url.split("?")[0].split("/").pop().split(".");
  if (parts.length === 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

export default function MakeWorldcup({ worldcupList, setWorldcupList, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [candidates, setCandidates] = useState([
    { id: uuidv4(), name: "", image: "" },
    { id: uuidv4(), name: "", image: "" },
  ]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef([]);

  useEffect(() => {
    fileInputRefs.current = fileInputRefs.current.slice(0, candidates.length);
  }, [candidates.length]);

  function addCandidate() {
    setCandidates(arr => [...arr, { id: uuidv4(), name: "", image: "" }]);
  }
  function removeCandidate(idx) {
    setCandidates(arr => arr.filter((_, i) => i !== idx));
  }
  function updateCandidate(idx, key, value) {
    setCandidates(arr =>
      arr.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );
  }

  // ★★★ 이미지 자동 webp 변환/압축 적용!
  async function handleFileInput(idx, e) {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = /\.(jpe?g|png|gif|svg|webp|avif)$/i.test(file.name);
    const isVideo = /\.(mp4|webm|mov)$/i.test(file.name);

    if (isImage && file.size > 6 * 1024 * 1024) {
      alert(t("only_images_under_6mb") || "Only images up to 6MB can be uploaded.");
      return;
    }
    if (isVideo && file.size > 20 * 1024 * 1024) {
      alert(t("only_videos_under_20mb") || "Only videos up to 20MB can be uploaded.");
      return;
    }
    if (!isImage && !isVideo) {
      alert(t("unsupported_file_type") || "Unsupported file type.");
      return;
    }

    let finalFile = file;
    if (isImage) {
      try {
        finalFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        });
      } catch (e) {
        finalFile = file;
      }
    }

    const reader = new FileReader();
    reader.onload = ev => updateCandidate(idx, "image", ev.target.result);
    reader.readAsDataURL(finalFile);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setOk("");
    if (loading) return;

    if (!title.trim()) return setError(t("enter_title") || "Please enter a title.");
    if (candidates.length < 2) return setError(t("need_at_least_two_candidates") || "Please add at least two candidates.");
    if (candidates.some(c => !c.name.trim())) return setError(t("enter_name_for_all_candidates") || "Please enter a name for every candidate.");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("No login info");

      const updatedCandidates = await Promise.all(
        candidates.map(async c => {
          let imageUrl = c.image?.trim();
          if (imageUrl && (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:"))) {
            const file = await fetch(imageUrl).then(r => r.blob());
            const ext = getFileExtension(imageUrl) || "webp"; // webp로 저장!
            const url = await uploadCandidateImage(
              new File([file], `${c.name}.${ext}`, { type: file.type }),
              user.id
            );
            imageUrl = url;
          }
          return { ...c, id: c.id || uuidv4(), image: imageUrl, name: c.name.trim() };
        })
      );

      const newCup = {
        title: title.trim(),
        description: desc.trim(),
        data: updatedCandidates,
        created_at: new Date().toISOString(),
        owner: user.id,
        creator: user.id,
      };

      await addWorldcupGame(newCup);
      setOk(t("worldcup_created") || "Worldcup created!");
      setTitle(""); setDesc("");
      setCandidates([
        { id: uuidv4(), name: "", image: "" },
        { id: uuidv4(), name: "", image: "" },
      ]);
      if (setWorldcupList) setWorldcupList([...(worldcupList || []), newCup]);
      if (onClose) setTimeout(onClose, 600);
    } catch (e) {
      setError(t("save_failed_try_again") || "Failed to save! Please try again later.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: 520, margin: "40px auto", background: "#fff",
      borderRadius: 16, padding: 24, boxShadow: "0 4px 18px #1976ed18"
    }}>
      <h2 style={{ textAlign: "center", fontWeight: 900, fontSize: 25, marginBottom: 22 }}>
        {t("makeWorldcup") || "Create Worldcup"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t("worldcup_title") || "Worldcup Title"}
            maxLength={36}
            style={{ width: "100%", fontSize: 18, padding: 9, borderRadius: 8, border: "1.5px solid #bbb" }}
            autoFocus
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={t("description_optional") || "Description (optional)"}
            maxLength={400}
            style={{ width: "100%", fontSize: 16, padding: 8, borderRadius: 8, border: "1.2px solid #bbb" }}
            disabled={loading}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, margin: "8px 0 9px 0" }}>
            {t("candidate_list", { count: candidates.length }) || `Candidates (${candidates.length})`}
          </div>
          <div style={{ color: "#1976ed", marginBottom: 8, fontSize: 15 }}>
            {t("image_video_upload_limit") || "Images: up to 6MB, Videos: up to 20MB."}
          </div>
          {candidates.map((c, idx) => {
            const youtubeThumb = getYoutubeThumb(c.image);
            const ext = getFileExtension(c.image);
            const isVideoFile = ext === "mp4" || ext === "mov" || ext === "webm" || ext === "ogg";
            const thumb = youtubeThumb
              ? youtubeThumb
              : !isVideoFile && c.image?.startsWith("data:image")
                ? c.image
                : !isVideoFile
                  ? c.image
                  : null;

            return (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "center" }}>
                <input
                  value={c.name}
                  onChange={e => updateCandidate(idx, "name", e.target.value)}
                  placeholder={t("name") || "Name"}
                  maxLength={22}
                  style={{ width: 120, fontSize: 15, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                  disabled={loading}
                />
                <input
                  value={c.image}
                  onChange={e => updateCandidate(idx, "image", e.target.value)}
                  placeholder={t("image_video_url_optional") || "Image/Video URL (optional)"}
                  style={{ flex: 1, fontSize: 14, padding: 7, borderRadius: 7, border: "1.1px solid #bbb" }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  style={{
                    background: "linear-gradient(90deg, #1976ed 70%, #45b7fa 100%)",
                    color: "#fff", border: "none", borderRadius: 7,
                    padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                  disabled={loading}
                >
                  {t("choose_file") || "File"}
                </button>
                <input
                  ref={el => (fileInputRefs.current[idx] = el)}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.svg,.webp,.avif,.mp4,.webm,.mov"
                  style={{ display: "none" }}
                  onChange={e => handleFileInput(idx, e)}
                  disabled={loading}
                />
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(idx)}
                    style={{ background: "#f5f5f5", color: "#d33", border: "none", borderRadius: 7, padding: "5px 13px", fontWeight: 700 }}
                    disabled={loading}
                  >
                    {t("delete") || "Delete"}
                  </button>
                )}
                {thumb && (
                  <img
                    src={thumb}
                    alt=""
                    style={{
                      width: 32, height: 32, objectFit: "cover", borderRadius: 8, background: "#f2f2f2",
                      boxShadow: "0 2px 8px #0001", border: "1.2px solid #eee", marginLeft: 8,
                    }}
                  />
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addCandidate}
            style={{ marginTop: 6, background: "#1976ed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700 }}
            disabled={loading}
          >
            + {t("add_candidate") || "Add Candidate"}
          </button>
        </div>
        {error && <div style={{ color: "red", marginTop: 15, textAlign: "center" }}>{error}</div>}
        {ok && <div style={{ color: "#1976ed", marginTop: 15, textAlign: "center" }}>{ok}</div>}
        <div style={{ marginTop: 26, textAlign: "center" }}>
          <button
            type="submit"
            style={{ background: "#1976ed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 19, padding: "11px 40px", marginRight: 9 }}
            disabled={loading}
          >
            {loading ? t("saving") || "Saving..." : t("create") || "Create"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "#ddd", color: "#333", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 16, padding: "10px 32px" }}
              disabled={loading}
            >
              {t("close") || "Close"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
