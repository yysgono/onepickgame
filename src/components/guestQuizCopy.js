const copy = {
  ko: {
    intro: "비회원은 월드컵 후보를 가져와 퀴즈를 만들 수 있습니다. 컴퓨터의 새 이미지를 업로드하려면 로그인하세요.",
    nickname: "비회원 닉네임 (수정용 아이디)", password: "수정용 비밀번호", verify: "확인하고 수정하기",
    remember: "닉네임과 비밀번호를 기억해 주세요. 퀴즈 수정에 필요하며, 비밀번호는 복구할 수 없습니다.",
    credentials: "닉네임은 1~20자, 비밀번호는 4~50자(UTF-8 72바이트 이하)로 입력해 주세요.",
    source: "비회원 퀴즈는 월드컵에서 가져온 후보로만 만들 수 있습니다.",
    upload: "새 파일 업로드는 로그인 후 가능합니다. 비회원 퀴즈는 가져온 후보 이미지를 사용해 주세요.",
    denied: "닉네임 또는 비밀번호가 다르거나, 비회원이 수정할 수 없는 퀴즈입니다. 여러 번 틀렸다면 5분 후 다시 시도하세요.",
    unavailable: "비회원 퀴즈 설정을 확인해 주세요. 관리자에게 문의해 주세요.", edit: "비회원 퀴즈 수정", loading: "불러오는 중…",
  },
  en: {
    intro: "Guests can create quizzes by importing World Cup candidates. Sign in to upload new images from your computer.",
    nickname: "Guest nickname (editing ID)", password: "Editing password", verify: "Verify and edit",
    remember: "Remember your nickname and password. You need both to edit this quiz. Password recovery is unavailable.",
    credentials: "Use a nickname of 1–20 characters and a password of 4–50 characters (at most 72 UTF-8 bytes).",
    source: "Guest quizzes must use candidates imported from World Cups.",
    upload: "Sign in to upload new files. Guest quizzes use imported candidate images.",
    denied: "The nickname/password is incorrect or this quiz cannot be edited as a guest. After repeated attempts, wait 5 minutes.",
    unavailable: "Guest quiz settings need to be checked. Please contact the administrator.", edit: "Edit guest quiz", loading: "Loading…",
  },

"it":{"intro":"Gli ospiti possono creare quiz importando i candidati ai tornei. Accedi per caricare nuove immagini dal tuo computer.","nickname":"Nickname dell'ospite (ID modifica)","password":"Modifica password","verify":"Verifica e modifica","remember":"Ricorda il tuo soprannome e password. È necessario entrambi per modificare questo quiz. Recupero password non è disponibile.","credentials":"Usa un nickname di 1–20 caratteri e una password di 4–50 caratteri (massimo 72 byte UTF-8).","source":"I quiz degli ospiti devono usare i candidati importati dai tornei.","upload":"Accedi per caricare nuovi file. I quiz degli ospiti utilizzano immagini candidate importate.","denied":"Il nickname/password non è corretto o questo quiz non può essere modificato come ospite. Dopo ripetuti tentativi, attendere 5 minuti.","unavailable":"Le impostazioni del quiz degli ospiti devono essere controllate. Contattare l'amministratore.","edit":"Modifica quiz degli ospiti","loading":"Caricamento..."},
"pl":{"intro":"Goście mogą tworzyć quizy poprzez importowanie kandydatów na turniej. Zaloguj się, aby przesłać nowe obrazy z komputera.","nickname":"Nazwa gościa (edycja ID)","password":"Edycja hasła","verify":"Sprawdź i edytuj","remember":"Zapamiętaj swój pseudonim i hasło. Musisz zarówno do edycji tego quizu. Odzyskiwanie hasła jest niedostępne.","credentials":"Użyj pseudonimu o długości 1–20 znaków i hasła o długości 4–50 znaków (maksymalnie 72 bajty UTF-8).","source":"quizy gości muszą korzystać z kandydatów importowanych z turniejów.","upload":"Zaloguj się, aby przesłać nowe pliki. quizy gości używają importowanych zdjęć kandydatów.","denied":"Przydomek/hasło jest nieprawidłowe lub ten quiz nie może być edytowany jako gość. Po powtarzających się próbach, odczekać 5 minut.","unavailable":"Należy sprawdzić ustawienia quizu dla gości. Proszę skontaktować się z administratorem.","edit":"Modyfikuj quiz gości","loading":"Wczytywanie..."},
"nl":{"intro":"Gasten kunnen quizzen maken door toernooikandidaten te importeren. Meld u aan om nieuwe afbeeldingen van uw computer te uploaden.","nickname":"Gastbijnaam (bewerken ID)","password":"Wachtwoord bewerken","verify":"Verifiëren en bewerken","remember":"Onthoud uw bijnaam en wachtwoord. U moet beide deze quiz bewerken. Wachtwoordherstel is niet beschikbaar.","credentials":"Gebruik een bijnaam van 1–20 tekens en een wachtwoord van 4–50 tekens (maximaal 72 UTF-8-bytes).","source":"Gastquizzen moeten kandidaten geïmporteerd uit toernooien gebruiken.","upload":"Meld u aan om nieuwe bestanden te uploaden. Gastenquizzen gebruiken geïmporteerde candidate-afbeeldingen.","denied":"De bijnaam/wachtwoord is onjuist of deze quiz kan niet als gast worden bewerkt. Na herhaalde pogingen, wacht 5 minuten.","unavailable":"De instellingen van de gastquiz moeten worden gecontroleerd. Neem contact op met de beheerder.","edit":"Gastquiz bewerken","loading":"Laden..."},
"cs":{"intro":"Hosté mohou vytvořit kvízy importem kandidátů na turnaj. Přihlaste se k nahrávání nových obrázků z vašeho počítače.","nickname":"Přezdívka hosta (identifikace editace)","password":"Editace hesla","verify":"Ověřit a upravit","remember":"Pamatujte si svou přezdívku a heslo. Musíte oba upravit tento kvíz. Obnovení hesla není k dispozici.","credentials":"Použijte přezdívku o délce 1–20 znaků a heslo o délce 4–50 znaků (nejvýše 72 bajtů UTF-8).","source":"Kvízy pro hosty musí používat kandidáty dovážené z turnajů.","upload":"Přihlaste se pro nahrávání nových souborů. Kvízy hostů používají importované kandidátské obrázky.","denied":"Přezdívka/heslo je nesprávné nebo tento kvíz nelze upravit jako host. Po opakovaných pokusech, počkejte 5 minut.","unavailable":"Nastavení kvízu pro hosty je třeba zkontrolovat. Kontaktujte prosím správce.","edit":"Upravit kvíz pro hosty","loading":"Načítám..."}
};
export function getGuestQuizCopy(lang) { return copy[lang] || copy.en; }
export function validGuestQuizCredentials(nickname, password) {
  return nickname.trim().length > 0 && nickname.trim().length <= 20 && password.length >= 4 && password.length <= 50 && new TextEncoder().encode(password).length <= 72;
}
export function guestQuizError(error, copy) {
  const message = error?.message || "";
  if (message === "GUEST_AUTH_FAILED") return copy.denied;
  if (message === "GUEST_CREDENTIALS_INVALID") return copy.credentials;
  if (message === "GUEST_SOURCE_REQUIRED") return copy.source;
  if (error?.code === "PGRST202" || message === "GUEST_SETUP_REQUIRED") return copy.unavailable;
  return message || copy.unavailable;
}
