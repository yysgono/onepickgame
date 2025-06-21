// firebaseGameApi.js

// 1. 파이어베이스 관련 함수 불러오기
import { collection, getDocs } from "firebase/firestore";

// 2. 파이어베이스 설정에서 export 한 db 인스턴스 불러오기
import { db } from "./firebase"; // 네 firebase 설정한 js 파일명에 맞게 import해!

// 3. 모든 월드컵(문서) 불러오는 함수
export async function fetchAllWorldcups() {
  // 'onepick' 컬렉션에서 모든 문서를 가져옴
  const querySnapshot = await getDocs(collection(db, "onepick"));
  // 문서의 데이터만 배열로 만들어서 return
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
