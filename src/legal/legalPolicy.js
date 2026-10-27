const COPY = require('./legalCopy.json');
const LANGUAGES = Object.keys(COPY);
const OPERATOR = '윤영석';
const EMAIL = 'yysgono@gmail.com';
const VERSION = '2026-10-28';
function legalLanguage(value) {
 const lang = String(value || 'en').toLowerCase().split(/[-_]/)[0];
 return Object.prototype.hasOwnProperty.call(COPY,lang) ? lang : 'en';
}
function getLegalPolicy(language, page) {
 const lang=legalLanguage(language), copy=COPY[lang];
 const privacy=page==='privacy-policy';
 return {lang,dir:lang==='ar'?'rtl':'ltr',title:privacy?copy.privacyTitle:copy.termsTitle,
  sections:privacy?copy.privacy:copy.terms,operatorLabel:copy.operatorLabel,country:copy.country,
  contactLabel:copy.contactLabel,updatedLabel:copy.updatedLabel,otherTitle:privacy?copy.termsTitle:copy.privacyTitle,
  otherPage:privacy?'terms-of-service':'privacy-policy',operator:OPERATOR,email:EMAIL,version:VERSION};
}
module.exports={COPY,LANGUAGES,legalLanguage,getLegalPolicy};
