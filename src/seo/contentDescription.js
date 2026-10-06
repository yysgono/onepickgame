// Shared by Node and React; .js is required for CRA to bundle this as code.
function list(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value : [];
}
function text(value) { return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function localized(map, fallback, lang) {
  if (typeof map === 'string') { try { map = JSON.parse(map); } catch { map = {}; } }
  return text(map?.[lang]) || text(map?.en) || text(fallback);
}
function join(values, max = 400) {
  let result = '';
  for (const value of [...new Set(values.map(text).filter(Boolean))]) {
    const next = result ? `${result}, ${value}` : value;
    if (next.length > max) { if (!result) result = value.slice(0, max); break; }
    result = next;
  }
  return result;
}
function tierDescription(tier, lang) {
  return localized(tier?.description_translations, tier?.description, lang) ||
    join(list(tier?.candidates).map(c => c?.name || c?.title));
}
const QUIZ_INTRO = {
  ko: ['퀴즈', '총 {n}문제.', '퀴즈를 풀어보세요.', '이미지를 보고 답을 맞혀보세요.', '객관식 문제를 풀어보세요.', '답을 직접 입력해보세요.', '객관식·주관식 문제에 도전해보세요.'],
  en: ['Quiz', '{n} questions.', 'Test your knowledge.', 'Look at the images and guess the answers.', 'Try the multiple-choice questions.', 'Type your answers.', 'Try multiple-choice and typed-answer questions.'],
  ja: ['クイズ', '全{n}問。', 'クイズに挑戦しましょう。', '画像を見て答えを当てましょう。', '選択式の問題に挑戦しましょう。', '答えを入力しましょう。', '選択式と入力式の問題に挑戦しましょう。'],
  zh: ['测验', '共{n}题。', '挑战你的知识。', '看图片猜答案。', '挑战选择题。', '输入你的答案。', '挑战选择题和填答题。'],
  es: ['Quiz', '{n} preguntas.', 'Pon a prueba tus conocimientos.', 'Mira las imágenes y adivina las respuestas.', 'Responde preguntas de opción múltiple.', 'Escribe tus respuestas.', 'Responde preguntas de opción múltiple y de respuesta escrita.'],
  fr: ['Quiz', '{n} questions.', 'Testez vos connaissances.', 'Regardez les images et trouvez les réponses.', 'Répondez aux questions à choix multiple.', 'Saisissez vos réponses.', 'Essayez les questions à choix multiple et à réponse écrite.'],
  vi: ['Đố vui', '{n} câu hỏi.', 'Thử sức với kiến thức của bạn.', 'Xem hình ảnh và đoán đáp án.', 'Thử trả lời các câu hỏi trắc nghiệm.', 'Nhập câu trả lời của bạn.', 'Thử các câu hỏi trắc nghiệm và nhập đáp án.'],
  de: ['Quiz', '{n} Fragen.', 'Teste dein Wissen.', 'Sieh dir die Bilder an und errate die Antworten.', 'Beantworte die Multiple-Choice-Fragen.', 'Gib deine Antworten ein.', 'Probiere Multiple-Choice-Fragen und Fragen mit Texteingabe.'],
  ru: ['Викторина', '{n} вопросов.', 'Проверьте свои знания.', 'Посмотрите на изображения и угадайте ответы.', 'Ответьте на вопросы с выбором ответа.', 'Введите свои ответы.', 'Попробуйте вопросы с выбором ответа и вводом текста.'],
  id: ['Kuis', '{n} pertanyaan.', 'Uji pengetahuanmu.', 'Lihat gambar dan tebak jawabannya.', 'Coba soal pilihan ganda.', 'Ketik jawabanmu.', 'Coba soal pilihan ganda dan jawaban tertulis.'],
  pt: ['Quiz', '{n} perguntas.', 'Teste seus conhecimentos.', 'Veja as imagens e adivinhe as respostas.', 'Responda às perguntas de múltipla escolha.', 'Digite suas respostas.', 'Experimente perguntas de múltipla escolha e de resposta escrita.'],
  hi: ['क्विज़', '{n} प्रश्न।', 'अपना ज्ञान परखें।', 'तस्वीरें देखकर उत्तर पहचानें।', 'बहुविकल्पीय प्रश्न हल करें।', 'अपने उत्तर लिखें।', 'बहुविकल्पीय और लिखित उत्तर वाले प्रश्न हल करें।'],
  tr: ['Quiz', '{n} soru.', 'Bilgini test et.', 'Görsellere bakıp cevapları tahmin et.', 'Çoktan seçmeli soruları çöz.', 'Cevaplarını yaz.', 'Çoktan seçmeli ve yazılı cevaplı soruları dene.'],
  th: ['ควิซ', 'ทั้งหมด {n} ข้อ', 'ทดสอบความรู้ของคุณ', 'ดูภาพแล้วทายคำตอบ', 'ลองตอบคำถามแบบเลือกตอบ', 'พิมพ์คำตอบของคุณ', 'ลองคำถามแบบเลือกตอบและพิมพ์คำตอบ'],
  ar: ['اختبار', '{n} سؤالًا.', 'اختبر معلوماتك.', 'شاهد الصور وخمّن الإجابات.', 'جرّب أسئلة الاختيار من متعدد.', 'اكتب إجاباتك.', 'جرّب أسئلة الاختيار من متعدد والإجابات المكتوبة.'],
  bn: ['কুইজ', '{n}টি প্রশ্ন।', 'আপনার জ্ঞান যাচাই করুন।', 'ছবি দেখে উত্তর অনুমান করুন।', 'বহুনির্বাচনী প্রশ্নের উত্তর দিন।', 'আপনার উত্তর লিখুন।', 'বহুনির্বাচনী ও লিখিত উত্তরের প্রশ্ন চেষ্টা করুন।'],
};
function quizDescription(quiz, questions, language) {
  const lang = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  const saved = localized(quiz?.description_translations, quiz?.description, lang);
  if (saved) return saved;
  // Use the same bounded sample as the server, without reading answer fields.
  const rows = list(questions).slice(0, 20);
  const names = rows.map(q => localized(q?.question_translations, q?.question_text, lang)).filter(Boolean);
  const unique = new Set(names);
  const repetitive = names.length > 1 && unique.size <= names.length / 2;
  const short = !names.length || names.every(name => [...name].length < 12);
  if (!repetitive && !short) return join(names);
  const copy = QUIZ_INTRO[lang] || QUIZ_INTRO.en;
  const title = localized(quiz?.title_translations, quiz?.title, lang) || copy[0];
  const rawCount = Number(quiz?.question_count);
  const count = Number.isInteger(rawCount) && rawCount > 0 ? rawCount : list(questions).length;
  const types = new Set(rows.map(q => q?.question_type).filter(Boolean));
  const mode = types.has('multiple_choice') && types.has('short_answer') ? 6 :
    types.has('multiple_choice') ? 4 : types.has('short_answer') ? 5 : 2;
  return [title + '.', count > 0 ? copy[1].replace('{n}', String(count)) : '',
    rows.some(q => text(q?.image_url)) ? copy[3] : '', copy[mode]].filter(Boolean).join(' ');
}
module.exports = { tierDescription, quizDescription };
