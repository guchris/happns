import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the new persistent local cache and multi-tab support
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager() // Enables multi-tab support for offline persistence
    })
});

// Initialize Firebase Authentication and set session persistence
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);

export { db, auth };