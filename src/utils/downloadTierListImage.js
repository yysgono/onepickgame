import { TIER_COLORS } from './tierRows';

function roundedRect(ctx, x, y, width, height, radius = 12) {
  const safeRadius = Math.max(
    0,
    Math.min(Number(radius) || 0, Math.abs(width) / 2, Math.abs(height) / 2)
  );

  ctx.beginPath();

  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, safeRadius);
    return;
  }

  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function loadMedia(candidate) {
  const url = candidate?.image;
  if (!url) return Promise.resolve(null);

  return new Promise(resolve => {
    const isVideo = candidate.file?.type === 'video/mp4' || /\.mp4(?:[?#]|$)/i.test(url);
    const media = isVideo ? document.createElement('video') : new Image();
    const finish = value => {
      clearTimeout(timeout);
      media.onload = media.onloadeddata = media.onerror = null;
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), 12000);
    media.crossOrigin = 'anonymous';
    media.onerror = () => finish(null);
    if (isVideo) {
      media.preload = 'auto';
      media.muted = true;
      media.onloadeddata = () => finish(media);
    } else {
      media.onload = () => finish(media);
    }
    try {
      media.src = url;
    } catch {
      finish(null);
    }
  });
}

function drawMedia(ctx, media, x, y, size) {
  if (!media) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#607086';
    ctx.font = '700 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO IMAGE', x + size / 2, y + size / 2);
    return;
  }

  const width = media.videoWidth || media.naturalWidth || media.width;
  const height = media.videoHeight || media.naturalHeight || media.height;
  const scale = size / Math.max(width, height);
  ctx.drawImage(media, x + (size - width * scale) / 2, y + (size - height * scale) / 2, width * scale, height * scale);
}

export async function downloadTierListImage({
  tiers, labels = {}, getTierCandidates, onePickCandidate, onePickTitle, untitled,
  exportTitle, authorText, createdText,
}) {
  const width = 1600;
  const padding = 55;
  const labelWidth = 150;
  const cardSize = 160;
  const cardHeight = 204;
  const gap = 14;
  const rowPadding = 20;
  const contentWidth = width - padding * 2;
  const cardsPerLine = Math.floor((contentWidth - labelWidth - rowPadding * 2 + gap) / (cardSize + gap));
  const rows = tiers.map(tier => {
    const items = getTierCandidates(tier);
    const lines = Math.max(1, Math.ceil(items.length / cardsPerLine));
    const height = Math.max(230, rowPadding * 2 + lines * cardHeight + (lines - 1) * gap);
    return { tier, items, height };
  });

  const canvas = document.createElement('canvas');
  const titleHeight = onePickCandidate ? 460 : 170;
  canvas.width = width;
  canvas.height = titleHeight + rows.reduce((total, row) => total + row.height + 12, 0) + padding;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#182235';
  ctx.font = '900 48px Arial, sans-serif';
  ctx.fillText(exportTitle, padding, 75, contentWidth);
  ctx.fillStyle = '#5c6f88';
  ctx.font = '700 22px Arial, sans-serif';
  if (authorText) ctx.fillText(authorText, padding, 116);
  if (createdText) ctx.fillText(createdText, padding, 148);

  if (onePickCandidate) {
    const size = 188;
    const media = await loadMedia(onePickCandidate);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#182235';
    ctx.font = '900 32px Arial, sans-serif';
    ctx.fillText(`⭐ ${onePickTitle}`, width / 2, 192, contentWidth);
    drawMedia(ctx, media, (width - size) / 2, 210, size);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#182235';
    ctx.font = '800 22px Arial, sans-serif';
    ctx.fillText(onePickCandidate.name || untitled, width / 2, 430, contentWidth);
  }

  let rowY = titleHeight;
  for (const { tier, items, height } of rows) {
    ctx.fillStyle = '#f5f8ff';
    roundedRect(ctx, padding, rowY, contentWidth, height, 16);
    ctx.fill();
    ctx.fillStyle = TIER_COLORS[tier];
    roundedRect(ctx, padding, rowY, labelWidth, height, 16);
    ctx.fill();

    ctx.fillStyle = '#101010';
    ctx.font = '900 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[tier] || tier, padding + labelWidth / 2, rowY + height / 2, labelWidth - 12);
    ctx.textBaseline = 'alphabetic';

    for (let start = 0; start < items.length; start += cardsPerLine) {
      const line = items.slice(start, start + cardsPerLine);
      const media = await Promise.all(line.map(loadMedia));
      for (const [column, item] of line.entries()) {
        const x = padding + labelWidth + rowPadding + column * (cardSize + gap);
        const y = rowY + rowPadding + (start / cardsPerLine) * (cardHeight + gap);
        ctx.fillStyle = '#ffffff';
        roundedRect(ctx, x, y, cardSize, cardHeight, 12);
        ctx.fill();
        drawMedia(ctx, media[column], x, y, cardSize);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#182235';
        ctx.font = '700 18px Arial, sans-serif';
        const name = item.name || untitled;
        ctx.fillText(name.length > 14 ? `${name.slice(0, 13)}…` : name, x + cardSize / 2, y + cardSize + 27, cardSize - 12);
      }
    }
    rowY += height + 12;
  }

  ctx.fillStyle = '#182235';
  ctx.font = '900 30px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('OnePickGame', width - padding, canvas.height - 22);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG generation failed');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(exportTitle || 'tier-list').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)}.png`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
