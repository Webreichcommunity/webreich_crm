import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBw_EeYARECoqrb_jyEtUbp5jrf7nhLax8",
  authDomain: "webreichcrm.firebaseapp.com",
  projectId: "webreichcrm",
  storageBucket: "webreichcrm.firebasestorage.app",
  messagingSenderId: "430902203259",
  appId: "1:430902203259:web:d84633fe48e0aa5329e3de",
  databaseURL: "https://webreichcrm-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

export { app, database, storage };