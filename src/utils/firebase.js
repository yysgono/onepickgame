// src/utils/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 설정 (네가 올려준 값 그대로!)
const firebaseConfig = {
  apiKey: "AIzaSyA70eeXqzYcXRhSvlyONxCMCHeZBCi02dE",
  authDomain: "report-a69f5.firebaseapp.com",
  projectId: "report-a69f5",
  storageBucket: "report-a69f5.appspot.com",  // ← 여기 ".app"이 아니라 ".app**spot.com**" 이어야 함!
  messagingSenderId: "1093968940288",
  appId: "1:1093968940288:web:4719a1de6acb03906177e5",
  measurementId: "G-2H1VBDZPP7"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore DB 인스턴스 export (프로젝트 어디서든 쓸 수 있게)
export const db = getFirestore(app);
