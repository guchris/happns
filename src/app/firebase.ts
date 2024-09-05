import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDKsebP5_GFk6JqHO0uLCQ5EHckNJnV1U0",
    authDomain: "happns.firebaseapp.com",
    databaseURL: "https://happns-default-rtdb.firebaseio.com",
    projectId: "happns",
    storageBucket: "happns.appspot.com",
    messagingSenderId: "938929125199",
    appId: "1:938929125199:web:db68660ca770e31bdb773a",
    measurementId: "G-6PP7KBF1Z2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };