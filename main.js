import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.firebasestorage.app",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign in with Google
const provider = new GoogleAuthProvider();
document.getElementById("google-login").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(result => console.log("Logged in as", result.user))
    .catch(error => alert(error.message));
});
