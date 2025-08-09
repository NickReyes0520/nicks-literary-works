// signin.js - Firebase Integrated Version
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize Firebase (use same config as account.js)
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DOM elements
const signInForm = document.getElementById('signinForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const googleBtn = document.getElementById('googleSignIn');
const navRegister = document.getElementById('navRegister');
const navSignIn = document.getElementById('navSignIn');
const navProfile = document.getElementById('navProfile');

// ========================
// EMAIL/PASSWORD SIGN-IN
// ========================
if (signInForm) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        alert('Please verify your email before signing in.');
        await signOut(auth);
        return;
      }

      // Successful sign-in
      window.location.href = 'profile.html';
    } catch (error) {
      alert(`Sign-in failed: ${error.message}`);
      console.error(error);
    }
  });
}

// ========================
// PASSWORD RESET FLOW
// ========================
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = prompt('Enter your registered email address:');
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
}

// ========================
// GOOGLE SIGN-IN
// ========================
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // First-time Google sign-in - prompt for username
        const username = await showModalPrompt('Choose a username (without @):');
        if (!username) {
          await signOut(auth);
          return;
        }

        await updateProfile(user, {
          displayName: `@${username}`
        });

        await setDoc(doc(db, "users", user.uid), {
          username: `@${username}`,
          email: user.email,
          avatarURL: user.photoURL || "",
          createdAt: serverTimestamp()
        });
      }

      // Successful sign-in
      window.location.href = 'profile.html';
    } catch (error) {
      alert(`Google Sign-In failed: ${error.message}`);
      console.error(error);
    }
  });
}

// ========================
// AUTH STATE MANAGEMENT
// ========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() 
      ? userDoc.data().username 
      : user.displayName || "My Account";

    // Update navigation
    if (navRegister) navRegister.style.display = 'none';
    if (navSignIn) navSignIn.style.display = 'none';
    if (navProfile) {
      navProfile.textContent = username;
      navProfile.style.display = 'inline-block';
    }
  } else {
    // User is signed out
    if (navRegister) navRegister.style.display = 'inline-block';
    if (navSignIn) navSignIn.style.display = 'inline-block';
    if (navProfile) navProfile.style.display = 'none';
  }
});

// ========================
// HELPER FUNCTIONS
// ========================
function showModalPrompt(message) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
      ">
        <p style="margin-bottom: 1rem;">${message}</p>
        <input type="text" id="modalInput" style="
          width: 100%;
          padding: 0.5rem;
          margin-bottom: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        ">
        <button id="modalSubmit" style="
          background: #990000;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">Submit</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('modalSubmit').addEventListener('click', () => {
      const value = document.getElementById('modalInput').value.trim();
      document.body.removeChild(modal);
      resolve(value);
    });

    document.getElementById('googleSignIn').addEventListener('click', async () => {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // Handle successful sign-in
      } catch (error) {
        console.error("Google Sign-In Error:", error);
        alert(`Google Sign-In failed: ${error.message}`);
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null);
      }
    });
  });
}
