import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";  // 추가

const firebaseConfig = {
  apiKey: "AIzaSyA70eeXqzYcXRhSvlyONxCMCHeZBCi02dE",
  authDomain: "report-a69f5.firebaseapp.com",
  projectId: "report-a69f5",
  storageBucket: "report-a69f5.firebasestorage.app",
  messagingSenderId: "1093968940288",
  appId: "1:1093968940288:web:4719a1de6acb03906177e5",
  measurementId: "G-2H1VBDZPP7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);  // 여기가 중요합니다!
