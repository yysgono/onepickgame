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
