import React, { useEffect, useState } from 'react';
import Seo from './Seo';
function initialImage(cup) {
  if (typeof document !== 'undefined') {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    try {
      if (new URL(canonical).pathname.endsWith(`/select-round/${cup.id}`)) {
        return { id: String(cup.id), image: document.querySelector('meta[property="og:image"]')?.content || '', fromServer: true };
      }
    } catch {}
  }
  return { id: String(cup.id), image: '', fromServer: false };
}
export default function WorldcupDetailSeo({ cup, ...props }) {
  const [selected, setSelected] = useState(() => initialImage(cup));
  const id = String(cup.id);
  const fromServer = selected.id === id && selected.fromServer;
  useEffect(() => {
    if (fromServer) return;
    const controller = new AbortController();
    fetch(`/api/worldcup-seo-image?id=${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : { image: '' })
      .then(result => {
        if (!controller.signal.aborted) setSelected({ id, image: typeof result.image === 'string' ? result.image : '', fromServer: false });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [id, fromServer]);
  return <Seo {...props} image={selected.id === id ? selected.image : ''} />;
}
