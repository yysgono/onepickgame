const tierCopy = require('./tierListSeoData.json');
const quizCopy = require('./quizSeoData.json');
const CATEGORIES = ['all','game','entertainment','animation','food','sports','knowledge','other'];
function getListSeo(kind, lang, search = '') {
  const language = String(lang || 'en').split(/[-_]/)[0];
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const allowed = kind === 'quiz' ? CATEGORIES : CATEGORIES.filter(c => c !== 'knowledge');
  const requested = params.get('category');
  const category = allowed.includes(requested) ? requested : 'all';
  const base = kind === 'quiz' ? quizCopy[language] || quizCopy.en : tierCopy[language] || tierCopy.en;
  const label = (tierCopy[language]?.categories || {})[category] || (category === 'knowledge' ? ({ko:'상식',en:'Trivia'}[language] || 'Trivia') : category);
  const slug = (kind === 'quiz' ? 'quiz' : 'tier-list') + (category === 'all' ? '' : `?category=${category}`);
  const privateView = ['mine','source','preset','tag','search'].some(key => !!params.get(key));
  return { category, slug, indexable: !privateView,
    title: category === 'all' ? base.title : `${label} · ${base.title}`,
    description: category === 'all' ? base.description : `${label}: ${base.description}`,
  };
}
module.exports = { getListSeo };
