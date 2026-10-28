import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const COPY = {
 ko:['이메일 또는 Google / NAVER 계정으로 가입할 수 있어요. 계속하기 전에 이용약관과 개인정보처리방침을 확인해 주세요.','이용약관','개인정보처리방침','가입 안내는 맞춤 광고·선택 정보 처리에 대한 동의가 아닙니다.'],
 en:['You can register with email or Google / NAVER. Please read the Terms and Privacy Policy before continuing.','Terms of Service','Privacy Policy','This notice is not consent to personalized ads or optional data processing.'],
 ja:['メールまたはGoogle / NAVERで登録できます。続行前に利用規約とプライバシーポリシーをご確認ください。','利用規約','プライバシーポリシー','この案内は、パーソナライズ広告や任意のデータ処理への同意ではありません。'],
 zh:['可通过邮箱或Google / NAVER注册。继续前请阅读服务条款与隐私政策。','服务条款','隐私政策','此提示不代表您同意个性化广告或可选的数据处理。'],
 es:['Puedes registrarte con correo o Google / NAVER. Lee las condiciones y la política de privacidad antes de continuar.','Condiciones de uso','Política de privacidad','Este aviso no constituye consentimiento para anuncios personalizados ni tratamientos opcionales.'],
 fr:['Inscrivez-vous par e-mail ou avec Google / NAVER. Lisez les conditions et la politique de confidentialité avant de continuer.','Conditions d’utilisation','Politique de confidentialité','Cet avis ne vaut pas consentement aux publicités personnalisées ni aux traitements facultatifs.'],
 de:['Du kannst dich per E-Mail oder Google / NAVER registrieren. Lies vorher die Nutzungsbedingungen und Datenschutzerklärung.','Nutzungsbedingungen','Datenschutzerklärung','Dieser Hinweis ist keine Einwilligung in personalisierte Werbung oder optionale Datenverarbeitung.'],
 vi:['Bạn có thể đăng ký bằng email hoặc Google / NAVER. Hãy đọc điều khoản và chính sách quyền riêng tư trước khi tiếp tục.','Điều khoản sử dụng','Chính sách quyền riêng tư','Thông báo này không phải sự đồng ý cho quảng cáo cá nhân hóa hay xử lý dữ liệu tùy chọn.'],
 ru:['Можно зарегистрироваться через почту или Google / NAVER. Перед продолжением прочитайте условия и политику конфиденциальности.','Условия использования','Политика конфиденциальности','Это уведомление не является согласием на персонализированную рекламу или необязательную обработку данных.'],
 id:['Daftar dengan email atau Google / NAVER. Baca ketentuan dan kebijakan privasi sebelum melanjutkan.','Ketentuan layanan','Kebijakan privasi','Pemberitahuan ini bukan persetujuan untuk iklan personal atau pemrosesan data opsional.'],
 pt:['Cadastre-se por e-mail ou Google / NAVER. Leia os termos e a política de privacidade antes de continuar.','Termos de uso','Política de privacidade','Este aviso não é consentimento para anúncios personalizados ou tratamento opcional de dados.'],
 hi:['ईमेल या Google / NAVER से पंजीकरण करें। आगे बढ़ने से पहले शर्तें और गोपनीयता नीति पढ़ें।','सेवा की शर्तें','गोपनीयता नीति','यह सूचना वैयक्तिकृत विज्ञापनों या वैकल्पिक डेटा प्रोसेसिंग की सहमति नहीं है।'],
 tr:['E-posta veya Google / NAVER ile kaydolabilirsiniz. Devam etmeden önce koşulları ve gizlilik politikasını okuyun.','Kullanım koşulları','Gizlilik politikası','Bu bildirim kişiselleştirilmiş reklamlara veya isteğe bağlı veri işlemeye onay değildir.'],
 th:['สมัครด้วยอีเมลหรือ Google / NAVER ได้ โปรดอ่านข้อกำหนดและนโยบายความเป็นส่วนตัวก่อนดำเนินการต่อ','ข้อกำหนดการใช้งาน','นโยบายความเป็นส่วนตัว','ประกาศนี้ไม่ใช่ความยินยอมสำหรับโฆษณาเฉพาะบุคคลหรือการประมวลผลข้อมูลที่ไม่จำเป็น'],
 ar:['يمكن التسجيل بالبريد الإلكتروني أو Google / NAVER. اقرأ الشروط وسياسة الخصوصية قبل المتابعة.','شروط الخدمة','سياسة الخصوصية','هذا الإشعار ليس موافقة على الإعلانات المخصصة أو معالجة البيانات الاختيارية.'],
 bn:['ইমেইল বা Google / NAVER দিয়ে নিবন্ধন করা যায়। এগোনোর আগে শর্তাবলি ও গোপনীয়তা নীতি পড়ুন।','ব্যবহারের শর্তাবলি','গোপনীয়তা নীতি','এই বিজ্ঞপ্তি ব্যক্তিগতকৃত বিজ্ঞাপন বা ঐচ্ছিক তথ্য প্রক্রিয়াকরণের সম্মতি নয়।'],
};
export default function AccountPolicyNotice({ language } = {}) {
 const {i18n}=useTranslation();const requested=String(language||i18n.language||'en').split(/[-_]/)[0];const lang=Object.prototype.hasOwnProperty.call(COPY,requested)?requested:'en';
 const [intro,terms,privacy,separate]=COPY[lang]||COPY.en;
 return <aside aria-label={privacy} dir={lang==='ar'?'rtl':undefined} style={{margin:'18px 0',padding:16,border:'1px solid #cbd5e1',borderRadius:10,background:'#fff',fontSize:14,lineHeight:1.65,textAlign:'start',color:'#334155'}}>
  <p style={{margin:'0 0 9px'}}>{intro}</p>
  <nav style={{display:'flex',gap:14,flexWrap:'wrap'}}>
   <Link to={`/${lang}/terms-of-service`} target="_blank" rel="noopener noreferrer" style={{fontWeight:700,color:'#5542b8',textDecoration:'underline'}}>{terms}</Link>
   <Link to={`/${lang}/privacy-policy`} target="_blank" rel="noopener noreferrer" style={{fontWeight:700,color:'#5542b8',textDecoration:'underline'}}>{privacy}</Link>
  </nav>
  <p style={{margin:'8px 0 0'}}>{separate}</p>
 </aside>;
}


