export const TIERS = [
  "S",
  "A+",
  "A",
  "B",
  "C",
  "D",
  "F",
];


export const TIER_COLORS = {
  S: "#ff6b6b",
  "A+": "#ff8052",
  A: "#ff9f43",
  B: "#ffd93d",
  C: "#6bcb77",
  D: "#4d96ff",
  F: "#a78bda",
};

export function visibleTierRows(labels, items) {
  const hidden = Array.isArray(labels?._hiddenTiers) ? labels._hiddenTiers : [];
  const visible = TIERS.filter(tier => !hidden.includes(tier) || items?.[tier]?.length);
  return visible.length ? visible : [TIERS[0]];
}
