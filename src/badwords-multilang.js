const BADWORDS = {
  ko: [
    "시발", "씨발", "병신", "존나", "개새끼", "ㅅㅂ", "ㅄ", "애미", "좆", "새끼", "지랄", "ㅈㄹ",
    "염병", "ㅂㅅ", "좆같", "썅", "미친놈", "미친년", "꺼져", "ㅈ같"
  ],
  en: [
    "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "motherfucker",
    "dick", "faggot", "slut", "whore", "son of a bitch", "piss off", "douchebag"
  ],
  ja: [
    "くそ", "ばか", "ちくしょう", "しね", "アホ", "死ね", "馬鹿", "ファック", "うざい", "ビッチ", "くたばれ"
  ],
  zh: [
    "操你", "傻逼", "妈的", "屌", "垃圾", "狗娘养的", "死", "他妈的", "滚", "贱人", "你妈", "草泥马", "鸡巴"
  ],
  vi: [
    "địt", "cặc", "lồn", "đĩ", "má mày", "đéo", "vãi", "bú", "ngu", "chó chết"
  ],
  th: [
    "เหี้ย", "สัส", "ควาย", "ไอ้เหี้ย", "ไอ้สัส", "มึง", "กูเย็ด", "เชี่ย", "อีดอก", "สัตว์"
  ],
  id: [
    "anjing", "bangsat", "bajingan", "kontol", "memek", "goblok", "tolol", "kampret", "setan"
  ],
  es: [
    "puta", "joder", "mierda", "gilipollas", "pendejo", "coño", "cabron", "maldito", "puto", "mierd"
  ],
  fr: [
    "putain", "merde", "salope", "connard", "enculé", "con", "chiant", "bordel", "ordure"
  ],
  de: [
    "scheiße", "arschloch", "hure", "fotze", "wichser", "miststück", "verdammt", "schlampe"
  ],
  pt: [
    "porra", "caralho", "puta", "merda", "bosta", "foda-se", "otário", "vadia", "puta que pariu"
  ],
  ru: [
    "блядь", "сука", "хуй", "пизда", "черт", "мудак", "гандон", "ублюдок", "дерьмо", "сволочь"
  ],
  ar: [
    "لعنة", "قحبة", "كلب", "حقير", "أحمق", "ابن الكلب", "ابن العاهرة", "تافه", "وسخ"
  ],
  hi: [
    "चूतिया", "भोसड़ी", "हरामी", "कमीना", "साला", "मादर", "गांडू", "बेवकूफ", "फक", "रंडी"
  ],
  tr: [
    "amk", "orospu", "piç", "siktir", "yarrak", "ananı", "göt", "mal", "oç", "sikik"
  ]
};

export function hasBadword(text, lang = "ko") {
  if (!text) return false;
  const lower = text.toLowerCase();
  const words = BADWORDS[lang] || [];
  return words.some(word => lower.includes(word));
}

export function addBadwords(lang, words) {
  if (!BADWORDS[lang]) BADWORDS[lang] = [];
  BADWORDS[lang].push(...words);
}

export default BADWORDS;
