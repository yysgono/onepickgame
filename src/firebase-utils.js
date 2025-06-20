import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";  // 경로 수정: 루트 src 폴더 안 firebase.js에서 불러오기

export async function savePost(post) {
  try {
    const docRef = await addDoc(collection(db, "posts"), post);
    console.log("게시글 저장 성공, 문서 ID:", docRef.id);
  } catch (error) {
    console.error("게시글 저장 실패:", error);
    throw error;  // 에러를 호출한 쪽으로 다시 던져서 처리 가능하게 함
  }
}
