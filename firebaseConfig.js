// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6ItZlAAWg0mz3pU2RChDFzI0V8Qg0Hig",
  authDomain: "ioelab-d6d3c.firebaseapp.com",
  databaseURL: "https://ioelab-d6d3c-default-rtdb.firebaseio.com",
  projectId: "ioelab-d6d3c",
  storageBucket: "ioelab-d6d3c.appspot.com",
  messagingSenderId: "330156938094",
  appId: "1:330156938094:web:8bdac6a24fc3ebe84b277f",
  measurementId: "G-B91MTY1X13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
