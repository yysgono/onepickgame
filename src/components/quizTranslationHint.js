const HINTS = {
 ko:'선택지가 번역되지 않으면 마우스 오른쪽 버튼을 누른 뒤 원하는 언어로 번역을 선택하세요. 모바일에서는 브라우저 메뉴의 번역 기능을 이용하세요.',
 en:'If the choices are not translated, right-click and choose Translate to your language. On mobile, use Translate in the browser menu.',
 ja:'選択肢が翻訳されていない場合は、右クリックして自分の言語への翻訳を選んでください。スマートフォンではブラウザの翻訳メニューを使ってください。',
 zh:'如果选项未翻译，请右键点击并选择翻译成您的语言。手机上可使用浏览器菜单中的翻译功能。',
 es:'Si las opciones no están traducidas, haz clic derecho y elige traducir a tu idioma. En el móvil, usa Traducir en el menú del navegador.',
 fr:'Si les choix ne sont pas traduits, faites un clic droit et choisissez la traduction dans votre langue. Sur mobile, utilisez le menu de traduction du navigateur.',
 vi:'Nếu các lựa chọn chưa được dịch, hãy nhấp chuột phải và chọn dịch sang ngôn ngữ của bạn. Trên điện thoại, dùng mục Dịch trong trình duyệt.',
 de:'Sind die Antworten nicht übersetzt, klicke mit der rechten Maustaste und wähle die Übersetzung in deine Sprache. Mobil findest du Übersetzen im Browsermenü.',
 ru:'Если варианты не переведены, нажмите правой кнопкой мыши и выберите перевод на свой язык. На телефоне используйте перевод в меню браузера.',
 id:'Jika pilihan belum diterjemahkan, klik kanan dan pilih terjemahkan ke bahasa Anda. Di ponsel, gunakan Terjemahkan di menu browser.',
 pt:'Se as opções não estiverem traduzidas, clique com o botão direito e escolha traduzir para seu idioma. No celular, use Traduzir no menu do navegador.',
 hi:'यदि विकल्प अनुवादित नहीं हैं, तो दायाँ क्लिक करके अपनी भाषा में अनुवाद चुनें। मोबाइल पर ब्राउज़र मेनू में अनुवाद का उपयोग करें।',
 tr:'Seçenekler çevrilmediyse sağ tıklayıp dilinize çeviriyi seçin. Mobilde tarayıcı menüsündeki çeviri özelliğini kullanın.',
 th:'หากตัวเลือกยังไม่ได้แปล ให้คลิกขวาแล้วเลือกแปลเป็นภาษาของคุณ บนมือถือใช้เมนูแปลภาษาของเบราว์เซอร์',
 ar:'إذا لم تُترجم الخيارات، فانقر بزر الفأرة الأيمن واختر الترجمة إلى لغتك. على الهاتف استخدم الترجمة من قائمة المتصفح.',
 bn:'বিকল্পগুলো অনুবাদ না হলে ডান ক্লিক করে নিজের ভাষায় অনুবাদ বেছে নিন। মোবাইলে ব্রাউজারের মেনু থেকে অনুবাদ ব্যবহার করুন।'
};
export default function quizTranslationHint(lang){return HINTS[String(lang).split(/[-_]/)[0]]||HINTS.en;}
