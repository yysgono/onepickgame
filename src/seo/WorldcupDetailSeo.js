import React, { useEffect, useState } from 'react';
import Seo from './Seo';
import { fetchWinnerStatsFromDB } from '../utils';
import metadata from './worldcupMetadata.js';

function initialImage(cup) {
  if (typeof document !== 'undefined') {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    try {
      if (new URL(canonical).pathname.endsWith(`/select-round/${cup.id}`)) {
        const image = document.querySelector('meta[property="og:image"]')?.content;
        if (image) return { id: String(cup.id), image, fromServer: true };
      }
    } catch {}
  }
  return { id: String(cup.id), image: metadata.fallbackImage(cup), fromServer: false };
}

export default function WorldcupDetailSeo({ cup, ...props }) {
  const [selected, setSelected] = useState(() => initialImage(cup));
  useEffect(() => {
    let alive = true;
    // Preserve the server-selected winner on a direct visit.
    if (selected.id === String(cup.id) && selected.fromServer) return;
    fetchWinnerStatsFromDB(cup.id)
      .then(stats => {
        if (alive) setSelected({ id: String(cup.id), image: metadata.winnerImage(cup, stats), fromServer: false });
      })
      .catch(error => console.warn('Failed to load world cup SEO winner image', error));
    return () => { alive = false; };
    // Only a change of game needs a new winner lookup.
  }, [cup.id]);
  const image = selected.id === String(cup.id) ? selected.image : metadata.fallbackImage(cup);
  return <Seo {...props} image={image} />;
}
