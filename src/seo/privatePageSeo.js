// Shared metadata for the personal World Cup collection; never index user-specific lists.
const COPY = {
  ko: ['내 월드컵', '내가 만든 이상형 월드컵을 확인하고 관리하세요.'],
  en: ['My World Cups', 'View and manage the World Cups you created.'],
  ja: ['自分のワールドカップ', '作成した理想型ワールドカップを確認・管理できます。'],
  zh: ['我的理想型世界杯', '查看和管理你创建的理想型世界杯。'],
  ru: ['Мои турниры', 'Просматривайте созданные вами турниры и управляйте ими.'],
  pt: ['Meus torneios', 'Veja e gerencie os torneios que você criou.'],
  es: ['Mis torneos', 'Consulta y administra los torneos que has creado.'],
  fr: ['Mes tournois', 'Consultez et gérez les tournois que vous avez créés.'],
  id: ['World Cup Saya', 'Lihat dan kelola World Cup yang kamu buat.'],
  hi: ['मेरे वर्ल्ड कप', 'अपने बनाए हुए वर्ल्ड कप देखें और प्रबंधित करें।'],
  de: ['Meine Turniere', 'Sieh dir deine erstellten Turniere an und verwalte sie.'],
  vi: ['World Cup của tôi', 'Xem và quản lý các World Cup bạn đã tạo.'],
  ar: ['بطولاتي', 'اعرض البطولات التي أنشأتها وقم بإدارتها.'],
  bn: ['আমার ওয়ার্ল্ড কাপ', 'আপনার তৈরি ওয়ার্ল্ড কাপ দেখুন ও পরিচালনা করুন।'],
  th: ['เวิลด์คัพของฉัน', 'ดูและจัดการเวิลด์คัพที่คุณสร้าง'],
  tr: ['World Cup Oyunlarım', 'Oluşturduğun World Cup oyunlarını görüntüle ve yönet.'],
};
function getPrivatePageSeo(language) {
  const requested = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  const lang = Object.prototype.hasOwnProperty.call(COPY, requested) ? requested : 'en';
  const [heading, description] = COPY[lang];
  return { lang, heading, title: `${heading} | ${lang === 'ko' ? '원픽게임' : 'OnePickGame'}`, description };
}
module.exports = { getPrivatePageSeo };
