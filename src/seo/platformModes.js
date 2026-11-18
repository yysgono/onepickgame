const paths = require('./sitePaths');
const MODES = [
  { kind: 'worldcup', headerKey: 'worldcup', slug: 'ideal-type-world-cup', icon: '🏆' },
  { kind: 'quiz', headerKey: 'quiz', slug: 'quiz', icon: '❓' },
  { kind: 'tier', headerKey: 'tier-list', slug: 'tier-list', icon: '📊' },
  { kind: 'nine', headerKey: 'top-nine', slug: 'mytop9', icon: '▦' },
  { kind: 'random', headerKey: 'random-pick', slug: 'random-pick', icon: '🎲' },
];
function hrefs(lang) { return MODES.map(mode => mode.kind === 'worldcup' ? paths.worldcupHome(lang) : '/' + lang + '/' + mode.slug); }
module.exports = { MODES, hrefs };
