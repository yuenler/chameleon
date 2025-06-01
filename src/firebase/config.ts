import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNDduyHCblDKtXezT6dHxWZmVACVsmUNg",
  authDomain: "chameleon-997de.firebaseapp.com",
  projectId: "chameleon-997de",
  storageBucket: "chameleon-997de.appspot.com", // Fixed the storage bucket URL
  messagingSenderId: "38183920310",
  appId: "1:38183920310:web:5a0cabe0b293cf284a7c17",
  measurementId: "G-V7BHCWQN4T"
};

console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  // Enable offline persistence
  enableIndexedDbPersistence(db)
    .then(() => console.log('Firestore persistence enabled'))
    .catch((err: any) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all features required for Firestore persistence.');
      } else {
        console.error('Error enabling persistence:', err);
      }
    });
  
  auth = getAuth(app);
  console.log('Firebase auth initialized');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { app, db, auth };
