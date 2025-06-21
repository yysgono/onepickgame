// src/utils/firebaseGameApi.js

import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // 반드시 src/utils/firebase.js에 있는 db import

// 월드컵 게임 저장 (게임 생성)
export async function saveGame(gameData) {
  const docRef = await addDoc(collection(db, "games"), gameData);
  return docRef.id; // 새로 생성된 게임 문서 ID 반환
}

// 월드컵 게임 전체 불러오기
export async function fetchAllGames() {
  const snapshot = await getDocs(collection(db, "games"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
