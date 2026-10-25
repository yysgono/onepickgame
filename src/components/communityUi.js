import copy from './communityUiCopy.json';
export function getCommunityUi(lang){return copy[String(lang||'en').split('-')[0]]||copy.en;}
