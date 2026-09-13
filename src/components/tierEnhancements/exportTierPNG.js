const COLORS = {
  S: "#ff6b6b",
  A: "#ff9f43",
  B: "#ffd93d",
  C: "#6bcb77",
  D: "#4d96ff",
};

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    let finished = false;

    const finish = (value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(value);
    };

    const timer = setTimeout(
      () => finish(null),
      12000
    );

    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = url;
  });
}

function fitText(ctx, text, maxWidth) {
  let value = String(text || "");

  if (ctx.measureText(value).width <= maxWidth) {
    return value;
  }

  while (
    value &&
    ctx.measureText(`${value}…`).width > maxWidth
  ) {
    value = value.slice(0, -1);
  }

  return `${value}…`;
}

export async function exportTierPNG({
  title,
  tiers,
  labels = {},
  onePick = null,
  only = "all",
  noImageText = "NO IMAGE",
  onePickFallbackText = "One Pick",
}) {
  const keys = Object.keys(tiers).filter(
    (key) => only === "all" || key === only
  );

  const width = 1440;
  const pad = 32;
  const labelWidth = 110;
  const cell = 130;
  const gap = 8;
  const cols = 9;

  const rows = keys.map((key) => ({
    key,
    items: tiers[key] || [],
    height: Math.max(
      150,
      Math.ceil((tiers[key] || []).length / cols) * 166 + 24
    ),
  }));

  const top = onePick ? 260 : 110;
  const height =
    top +
    rows.reduce((sum, row) => sum + row.height + 10, 0) +
    40;

  const scale = Math.min(
    1,
    8192 / height,
    Math.sqrt(16000000 / (width * height))
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = "#07111f";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(
    fitText(ctx, title || "Tier List", width - 64),
    pad,
    50
  );

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#b5c8df";
  ctx.fillText("One Pick Game · Tier List", pad, 82);

  let failed = 0;

  if (onePick) {
    const img = await loadImage(onePick.image);

    if (img) {
      const ratio = Math.min(
        120 / img.naturalWidth,
        120 / img.naturalHeight
      );

      ctx.drawImage(
        img,
        pad,
        106,
        img.naturalWidth * ratio,
        img.naturalHeight * ratio
      );
    } else {
      failed += 1;
    }

    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText(
      fitText(
        ctx,
        `★ ${onePick.name || onePickFallbackText}`,
        width - 220
      ),
      180,
      170
    );
  }

  let y = top;

  for (const row of rows) {
    ctx.fillStyle = "#152338";
    ctx.fillRect(pad, y, width - pad * 2, row.height);

    ctx.fillStyle = COLORS[row.key] || "#55b7d5";
    ctx.fillRect(pad, y, labelWidth, row.height);

    ctx.fillStyle = "#09101c";
    ctx.font = "bold 23px sans-serif";
    ctx.fillText(
      fitText(ctx, labels[row.key] || row.key, labelWidth - 16),
      pad + 8,
      y + 46
    );

    for (let offset = 0; offset < row.items.length; offset += 6) {
      const chunk = row.items.slice(offset, offset + 6);
      const images = await Promise.all(
        chunk.map((item) => loadImage(item.image))
      );

      chunk.forEach((item, j) => {
        const i = offset + j;
        const x =
          pad + labelWidth + 12 + (i % cols) * (cell + gap);
        const cellY =
          y + 12 + Math.floor(i / cols) * 166;
        const img = images[j];

        ctx.fillStyle = "#0b1628";
        ctx.fillRect(x, cellY, cell, cell);

        if (img) {
          const ratio = Math.min(
            cell / img.naturalWidth,
            cell / img.naturalHeight
          );
          const w = img.naturalWidth * ratio;
          const h = img.naturalHeight * ratio;

          ctx.drawImage(
            img,
            x + (cell - w) / 2,
            cellY + (cell - h) / 2,
            w,
            h
          );
        } else {
          failed += 1;
          ctx.fillStyle = "#b5c8df";
          ctx.font = "14px sans-serif";
          ctx.fillText(
            fitText(ctx, noImageText, cell - 10),
            x + 5,
            cellY + 65
          );
        }

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(
          fitText(ctx, item.name, cell),
          x,
          cellY + 150
        );
      });
    }

    y += row.height + 10;
  }

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  if (!blob) {
    throw new Error("PNG generation failed");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeTitle = String(title || "tier-list")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80);

  link.href = url;
  link.download = `${safeTitle}${
    only === "all" ? "" : `_${only}`
  }.png`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 30000);

  return {
    failed,
    scaled: scale < 1,
  };
}
