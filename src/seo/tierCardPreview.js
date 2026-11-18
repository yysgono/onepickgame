const TIERS = ['S', 'A+', 'A', 'B'];
const media = value => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
const map = value => { if (typeof value === 'string') { try { return JSON.parse(value) || {}; } catch { return {}; } } return value || {}; };
function snapshot(item) {
  const candidates = Array.isArray(item.candidates) ? item.candidates : [], byId = new Map(candidates.map(candidate => [String(candidate.id), candidate]));
  const tiers = map(item.tiers), counts = map(item.tier_preview_counts);
  const tierPreview = TIERS.map(tier => {
    const ids = Array.isArray(tiers[tier]) ? tiers[tier] : [];
    const previews = ids.map(id => byId.get(String(id?.id ?? id))).filter(Boolean).slice(0, 5).map(candidate => ({ name: String(candidate.name || ''), image: media(candidate.image || candidate.image_url) }));
    return { tier, candidates: previews, remaining: Math.max(0, Number(counts[tier] ?? ids.length) - previews.length) };
  });
  const ranked = TIERS.concat(['C', 'D', 'F']).flatMap(tier => Array.isArray(tiers[tier]) ? tiers[tier] : []).map(id => byId.get(String(id?.id ?? id))).find(candidate => media(candidate?.image || candidate?.image_url));
  const first = candidates.find(candidate => media(candidate.image || candidate.image_url));
  return { previewImage: media(item.thumbnail_url) || media(ranked?.image || ranked?.image_url) || media(first?.image || first?.image_url), tierPreview, hasTierPreview: tierPreview.some(row => row.candidates.length > 0 || row.remaining > 0) };
}
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
function render(item) {
  const img = (src, name = '') => media(src) ? '<img src="'+escape(src)+'" alt="'+escape(name)+'" loading="lazy">' : '';
  return '<div class="tier-card-preview'+(item.hasTierPreview?' tier-card-preview--ranked':'')+'"><div class="tier-card-preview-cover">'+(img(item.previewImage)||'<span>TIER LIST</span>')+'</div>'+(item.hasTierPreview?'<div class="tier-card-preview-rows">'+item.tierPreview.map(row=>'<div class="tier-card-preview-row"><span class="tier-card-preview-label" data-tier="'+escape(row.tier)+'">'+escape(row.tier)+'</span><div class="tier-card-preview-candidates">'+row.candidates.map(candidate=>'<span class="tier-card-preview-candidate" title="'+escape(candidate.name)+'">'+img(candidate.image,candidate.name)+'</span>').join('')+'</div></div>').join('')+'</div>':'')+'</div>';
}
module.exports = { snapshot, render };
