import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUFnEmVcaa5HsDqni2mBhyjGc22fiMPBE",
  authDomain: "officedeskdsk.firebaseapp.com",
  projectId: "officedeskdsk",
  storageBucket: "officedeskdsk.firebasestorage.app",
  messagingSenderId: "548105639285",
  appId: "1:548105639285:web:06d8d33168955c5543af3c",
  measurementId: "G-MGC1BGWHC6"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
