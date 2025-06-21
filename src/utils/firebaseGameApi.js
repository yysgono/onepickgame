import { db } from "./firebase";
import { collection, addDoc, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";

// 월드컵 게임 저장
export async function addWorldcupGame(gameData) {
  try {
    const docRef = await addDoc(collection(db, "games"), gameData);
    return docRef.id;
  } catch (e) {
    console.error("게임 저장 실패:", e);
    throw e;
  }
}

// 월드컵 게임 목록 불러오기
export async function getWorldcupGames() {
  try {
    const snapshot = await getDocs(collection(db, "games"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("게임 목록 불러오기 실패:", e);
    throw e;
  }
}

// ✅ 실시간 월드컵 게임 구독(onSnapshot)
export function subscribeWorldcupGames(callback) {
  const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}
