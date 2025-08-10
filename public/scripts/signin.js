// signin.js - Firebase Integrated Version (Updated with Google User Handling)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  fetchSignInMethodsForEmail // Added for Google user detection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initialize Firebase 
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
const signinPasswordField = document.getElementById('signinPassword'); // For visual feedback

// ========================
// EMAIL/PASSWORD SIGN-IN (UPDATED)
// ========================
if (signInForm) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;

    try {
      // Check if email is linked to Google
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes('google.com')) {
        alert('You registered with Google. Please click "Continue with Google" instead.');
        return;
      }

      // Proceed with normal email/password login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        alert('Please verify your email before signing in.');
        await signOut(auth);
        return;
      }

      // Check if account is blocked
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().status === 'blocked') {
        alert("Your account has been blocked. Please contact support.");
        await signOut(auth);
        return;
      }

      window.location.href = 'profile.html';
    } catch (error) {
      let errorMessage = `Sign-in failed: ${error.message}`;
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        default:
          break;
      }
      alert(errorMessage);
      console.error(error);
    }
  });
}

// ========================
// PASSWORD RESET FLOW (UNCHANGED)
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
      console.error(error);
    }
  });
}

// ========================
// GOOGLE SIGN-IN (UPDATED WITH VISUAL FEEDBACK)
// ========================
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Hide password field for Google users (visual feedback)
      if (signinPasswordField) signinPasswordField.style.display = 'none';

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const username = await showModalPrompt('Choose a username (without @):');
        if (!username) {
          await signOut(auth);
          return;
        }

        const finalUsername = `@${username}`;

        await Promise.all([
          updateProfile(user, {
            displayName: finalUsername
          }),
          setDoc(userDocRef, {
            username: finalUsername,
            email: user.email,
            avatarURL: user.photoURL || "",
            createdAt: serverTimestamp()
          })
        ]);
      } else if (userDoc.data().status === 'blocked') {
        alert("Your account has been blocked. Please contact support.");
        await signOut(auth);
        return;
      }

      window.location.href = 'profile.html';
    } catch (error) {
      let errorMessage = `Google Sign-In failed: ${error.message}`;
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Popup was closed.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Email already in use with another method.';
      }
      alert(errorMessage);
      console.error(error);
    }
  });
}

// ========================
// AUTH STATE MANAGEMENT (UPDATED)
// ========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Visual feedback: Hide password field for Google users
    if (user.providerData.some(provider => provider.providerId === 'google.com')) {
      if (signinPasswordField) signinPasswordField.style.display = 'none';
    } else {
      if (signinPasswordField) signinPasswordField.style.display = 'block';
    }

    let usernameToDisplay = "My Account";
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().username) {
        usernameToDisplay = userDoc.data().username;
      } else if (user.displayName) {
        usernameToDisplay = user.displayName;
      }
    } catch (e) {
      console.warn("Error fetching user doc:", e);
      usernameToDisplay = user.displayName || "My Account";
    }

    if (navRegister) navRegister.style.display = 'none';
    if (navSignIn) navSignIn.style.display = 'none';
    if (navProfile) {
      navProfile.textContent = usernameToDisplay;
      navProfile.href = "profile.html";
      navProfile.style.display = 'inline-block';
    }
  } else {
    if (navRegister) navRegister.style.display = 'inline-block';
    if (navSignIn) navSignIn.style.display = 'inline-block';
    if (navProfile) navProfile.style.display = 'none';
    if (signinPasswordField) signinPasswordField.style.display = 'block'; // Reset on sign-out
  }
});

// ========================
// HELPER FUNCTIONS (UNCHANGED)
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
    document.getElementById('modalInput').focus();

    document.getElementById('modalSubmit').addEventListener('click', () => {
      const value = document.getElementById('modalInput').value.trim();
      document.body.removeChild(modal);
      resolve(value);
    });

    document.getElementById('modalInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        document.getElementById('modalSubmit').click();
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
