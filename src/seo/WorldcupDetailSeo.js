import React, { useEffect, useState } from 'react';
import Seo from './Seo';
import metadata from './worldcupMetadata';
import { fetchWinnerStatsFromDB } from '../utils.js';
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
    let live = true;
    // The round page already reads this cached, in-flight-deduplicated RPC.
    // Reuse it instead of calling the unimplemented SEO image endpoint.
    fetchWinnerStatsFromDB(id)
      .then(stats => {
        if (live) setSelected({ id, image: metadata.winnerImage(cup, stats), fromServer: false });
      })
      .catch(() => {});
    return () => { live = false; };
  }, [id, fromServer, cup]);
  const image = selected.id === id && selected.image ? selected.image : metadata.fallbackImage(cup);
  return <Seo {...props} image={image} />;
}
