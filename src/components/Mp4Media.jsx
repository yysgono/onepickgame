import React, { useEffect, useRef, useState } from "react";

// Muted MP4 loops in a match/winner view; lists load only a preview frame.
export default function Mp4Media({ src, alt = "", autoPlay = false, active = true, style = {}, onError }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { rootMargin: "80px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setBlocked(false); }, [src]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    let cancelled = false;
    if (autoPlay && active && visible) {
      const promise = video.play();
      if (promise?.catch) promise.catch(() => { if (!cancelled) setBlocked(true); });
    } else video.pause();
    return () => { cancelled = true; video.pause(); };
  }, [src, autoPlay, active, visible]);
  return <video ref={ref} src={visible ? src : undefined} aria-label={alt}
    muted loop playsInline autoPlay={autoPlay && active && visible}
    controls={blocked && autoPlay && active} preload="metadata"
    onError={onError} onLoadedData={() => { if (!autoPlay) ref.current?.pause(); }}
    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#111827", ...style }} />;
}
