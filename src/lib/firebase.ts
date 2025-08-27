
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyADSUgm3BFkJP8P6nUwzIAioFMyMUt-Ccg",
    authDomain: "inventaire-pro.firebaseapp.com",
    projectId: "inventaire-pro",
    storageBucket: "inventaire-pro.firebasestorage.app",
    messagingSenderId: "876091676084",
    appId: "1:876091676084:web:c3ab3e842278640c140ee1"
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
