import COPY from './randomPickCopy.json';
export const MODES = ['wheel','lotto','pinball','ladder','boxes','cards','order','dice','teams'];
export const LANGUAGES = Object.keys(COPY);
export function getCopy(lang) { return Object.prototype.hasOwnProperty.call(COPY,lang) ? COPY[lang] : COPY.en; }
