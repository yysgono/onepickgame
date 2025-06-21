// src/db.js
import { db } from "./firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

// 월드컵 리스트 불러오기 함수
export async function fetchWorldcups() {
  const worldcupCol = collection(db, "worldcups");
  const snapshot = await getDocs(worldcupCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 월드컵 추가하기 함수
export async function addWorldcup(data) {
  await addDoc(collection(db, "worldcups"), data);
}

// 월드컵 삭제 함수
export async function deleteWorldcup(worldcupId) {
  // worldcups 컬렉션에서 해당 id의 문서 삭제
  await deleteDoc(doc(db, "worldcups", worldcupId));
}