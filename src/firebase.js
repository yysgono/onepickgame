// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA70eeXqzYcXRhSvlyONxCMCHeZBCi02dE",
  authDomain: "report-a69f5.firebaseapp.com",
  projectId: "report-a69f5",
  storageBucket: "report-a69f5.appspot.com",
  messagingSenderId: "1093968940288",
  appId: "1:1093968940288:web:4719a1de6acb03906177e5",
  measurementId: "G-2H1VBDZPP7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
