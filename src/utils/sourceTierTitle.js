// Shared title rule for source-candidate invitations; configured titles stay intact.
const suffixes = require('../locales/sourceTierTitleSuffix.json');
function sourceTierTitle(title, language) {
 const lang = String(language || 'en').toLowerCase().split(/[-_]/)[0];
 const suffix = suffixes[lang] || suffixes.en;
 const base = String(title || '').trim();
 if (!base) return suffix;
 return base.toLocaleLowerCase().endsWith(suffix.toLocaleLowerCase()) ? base : base + ' ' + suffix;
}
module.exports = {sourceTierTitle};
