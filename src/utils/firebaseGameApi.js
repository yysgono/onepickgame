// src/utils/firebaseGameApi.js
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

// 월드컵 게임 데이터 저장 함수
export async function addWorldcupGame(gameData) {
  try {
    const docRef = await addDoc(collection(db, "games"), gameData);
    return docRef.id; // 저장된 문서의 ID 반환
  } catch (e) {
    console.error("게임 저장 실패:", e);
    throw e;
  }
}

// 월드컵 게임 목록 불러오는 함수 (옵션)
export async function getWorldcupGames() {
  try {
    const snapshot = await getDocs(collection(db, "games"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("게임 목록 불러오기 실패:", e);
    throw e;
  }
}
