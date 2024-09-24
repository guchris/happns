import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
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

let db: Firestore;
if (typeof window !== "undefined") {
    // Only initialize Firestore persistence in the browser
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager() // Enables multi-tab support for offline persistence
        })
    });
} else {
    // Initialize Firestore without persistence for server environments
    db = initializeFirestore(app, {});
}

// Initialize Firebase Authentication and set session persistence
const auth = getAuth(app);

// Set session persistence only in client environment
if (typeof window !== "undefined") {
    setPersistence(auth, browserSessionPersistence).catch((error) => {
        console.error("Failed to set session persistence:", error);
    });
}

export { db, auth };