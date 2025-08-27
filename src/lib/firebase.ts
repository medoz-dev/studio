
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "inventaire-pro-b3898.firebaseapp.com",
  projectId: "inventaire-pro-b3898",
  storageBucket: "inventaire-pro-b3898.appspot.com",
  messagingSenderId: "1058292833073",
  appId: "1:1058292833073:web:72304d2b3803020621379c",
  measurementId: "G-5B331J9D33"
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
