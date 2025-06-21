// src/db.js
import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

// 월드컵 리스트 전체 불러오기
export async function fetchWorldcups() {
  const worldcupCol = collection(db, "worldcups");
  const snapshot = await getDocs(worldcupCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 월드컵 하나만 불러오기 (id로)
export async function fetchWorldcupById(id) {
  if (!id) throw new Error("ID가 필요합니다.");
  const ref = doc(db, "worldcups", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// 월드컵 추가하기
export async function addWorldcup(data) {
  await addDoc(collection(db, "worldcups"), data);
}

// 월드컵 삭제하기
export async function deleteWorldcup(id) {
  if (!id) throw new Error("삭제할 ID가 없습니다.");
  const docRef = doc(db, "worldcups", id);
  await deleteDoc(docRef);
}
