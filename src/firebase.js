// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDARqwJHZT7bMjVYCGj47mFYYiFatfKJ8E",
  authDomain: "personalfinancetracker-d2b4d.firebaseapp.com",
  databaseURL: "https://personalfinancetracker-d2b4d-default-rtdb.firebaseio.com",
  projectId: "personalfinancetracker-d2b4d",
  storageBucket: "personalfinancetracker-d2b4d.firebasestorage.app",
  messagingSenderId: "600251589623",
  appId: "1:600251589623:web:b95dbad10d6772de4004f2",
  measurementId: "G-WQRXMYC2XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);