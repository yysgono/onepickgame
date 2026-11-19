const labels = require('../seo/categoryLabels.json');
const QUIZ_CATEGORIES = ['knowledge','animation','game','entertainment','sports','food','animals_plants','person','brands','movie_drama','travel','other'];
const QUIZ_HOME_CATEGORIES = ['animals_plants','animation','game','entertainment','sports','food','brands','travel','other'];
const QUIZ_EXTRA_CATEGORIES = ['animals_plants','person','brands','movie_drama','travel'];
function quizCategoryLabels(language) {
 const source = labels[language] || labels.en;
 return Object.fromEntries(QUIZ_EXTRA_CATEGORIES.map(key => [key, source[key]]));
}
module.exports = {QUIZ_HOME_CATEGORIES,QUIZ_CATEGORIES,QUIZ_EXTRA_CATEGORIES,quizCategoryLabels};
