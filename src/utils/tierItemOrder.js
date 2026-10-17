// Insert relative to a candidate key after removing the source, avoiding index shifts.
export function moveTierItem(tiers, item, targetTier, { targetKey, placement = 'before' } = {}) {
  if (!item?._tierKey || !Array.isArray(tiers?.[targetTier])) return tiers;
  if (targetKey === item._tierKey && tiers[targetTier].some(value => value._tierKey === targetKey)) return tiers;
  const next = Object.fromEntries(Object.entries(tiers).map(([tier, items]) => [
    tier, Array.isArray(items) ? items.filter(value => value._tierKey !== item._tierKey) : items,
  ]));
  const row = next[targetTier];
  const targetIndex = targetKey ? row.findIndex(value => value._tierKey === targetKey) : -1;
  const index = targetIndex < 0 ? row.length : targetIndex + (placement === 'after' ? 1 : 0);
  row.splice(index, 0, item);
  return next;
}

export function tierDropPosition(event) {
  const target = event.target?.closest?.('[data-tier-candidate-key]');
  if (!target || !event.currentTarget.contains(target)) return {};
  const rect = target.getBoundingClientRect();
  return {
    targetKey: target.dataset.tierCandidateKey,
    placement: event.clientX < rect.left + rect.width / 2 ? 'before' : 'after',
  };
}
