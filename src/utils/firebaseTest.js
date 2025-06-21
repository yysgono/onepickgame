// src/utils/firebaseTest.js
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

// 파이어베이스 연동이 제대로 됐는지 테스트하는 함수
export async function firebaseTestWrite() {
  try {
    const docRef = await addDoc(collection(db, "test"), {
      message: "Firebase 연동 성공!",
      timestamp: new Date()
    });
    console.log("문서가 저장되었습니다! ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("저장 실패:", e);
    throw e;
  }
}
