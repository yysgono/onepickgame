// src/utils/userId.js

// RFC4122 v4 단축 uuid
function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// guest로 사용할 uuid가 없으면 생성/저장, 있으면 꺼냄
export function getOrCreateUserId() {
  // 로그인 정보(localStorage의 onepickgame_user) 우선
  const userRaw = localStorage.getItem("onepickgame_user");
  if (userRaw) {
    try {
      if (userRaw.startsWith("{")) {
        const user = JSON.parse(userRaw);
        return user.userid || user.id || user.nickname || getGuestUserId();
      }
      return userRaw;
    } catch {
      // JSON 파싱 실패하면 guest
      return getGuestUserId();
    }
  }
  return getGuestUserId();
}

// 비회원 고유 uuid (guest_xxx)
function getGuestUserId() {
  let id = localStorage.getItem("onepickgame_userid");
  if (id) return id;
  id = "guest_" + generateUuid();
  localStorage.setItem("onepickgame_userid", id);
  return id;
}
