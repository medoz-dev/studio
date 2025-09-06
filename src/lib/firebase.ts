
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    projectId: "monapp-pyyf6",
    appId: "1:917297956047:web:019b80a7490d7b5012e3ba",
    storageBucket: "monapp-pyyf6.firebasestorage.app",
    apiKey: "AIzaSyDR4l7vuiy8PXzP7a2GPKwS6eoGLdmaYY0",
    authDomain: "monapp-pyyf6.firebaseapp.com",
    messagingSenderId: "917297956047"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}


export const auth = getAuth(app);
export const db = getFirestore(app);
