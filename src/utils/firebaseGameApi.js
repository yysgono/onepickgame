// src/utils/firebaseGameApi.js

import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // 이미 있는 파이어베이스 초기화 파일에서 db import

// 월드컵 게임 저장
export async function saveGame(gameData) {
  const docRef = await addDoc(collection(db, "games"), gameData);
  return docRef.id; // 새로 생성된 게임 문서 ID 반환
}

// 월드컵 게임 전체 불러오기
export async function fetchAllGames() {
  const snapshot = await getDocs(collection(db, "games"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
