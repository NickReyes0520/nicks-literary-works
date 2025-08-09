// signin.js - Firebase Integrated Version (Corrected)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,          // Ensure signOut is imported
  updateProfile     // Ensure updateProfile is imported (used when setting username)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,            // Ensure setDoc is imported
  serverTimestamp    // Ensure serverTimestamp is imported
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
    
    // IMPORTANT: Your signin.html has <label for="signinUsername">Username</label>
    // If this input contains the user's email, ensure it's labelled correctly in HTML (e.g., <input type="email" id="signinEmail">)
    // For now, assuming 'signinUsername' holds the email for Firebase Auth.
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

      // Check if user account is blocked (important for security)
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().status === 'blocked') {
        alert("Your account has been blocked. Please contact support for more information.");
        await signOut(auth); // Sign out the blocked user immediately
        return; // Stop further execution
      }

      // Successful sign-in
      window.location.href = 'profile.html';
    } catch (error) {
      // Improved error handling for common Firebase Auth errors
      let errorMessage = `Sign-in failed: ${error.message}`;
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Modern Firebase combines these
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        default:
          break; // Use generic message for other errors
      }
      alert(errorMessage);
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
    if (!email) return; // User cancelled prompt

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      alert(`Error sending password reset email: ${error.message}`); // More specific message
      console.error(error);
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
      const user = result.user; // User object from Firebase Authentication
      
      // Check if user's profile document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) { // This means it's a first-time Google sign-in for this user
        // First-time Google sign-in - prompt for username
        const username = await showModalPrompt('Choose a username (without @):');
        if (!username) { // If user cancels the prompt
          await signOut(auth); // Sign out the Firebase Auth user created by signInWithPopup
          return;
        }

        // Prepend '@' for consistent username format
        const finalUsername = `@${username}`;

        // Create new document in Firestore and update Firebase Auth profile
        await Promise.all([
          updateProfile(user, { // Update Firebase Auth profile's displayName
            displayName: finalUsername
          }),
          setDoc(doc(db, "users", user.uid), { // Create new document in Firestore for this user
            username: finalUsername,
            email: user.email,
            avatarURL: user.photoURL || "", // Use Google's photoURL as avatar
            createdAt: serverTimestamp()
          })
        ]);
      } else {
          // User's document already exists in Firestore (they signed in before with Google or linked accounts)
          // Check if account is blocked (for existing Google users)
          if (userDoc.data().status === 'blocked') {
            alert("Your account has been blocked. Please contact support for more information.");
            await signOut(auth); // Sign out the blocked user immediately
            return;
          }
      }

      // Successful sign-in, regardless if new or existing user
      window.location.href = 'profile.html';
    } catch (error) {
      // Improved error handling for common Firebase Auth errors
      let errorMessage = `Google Sign-In failed: ${error.message}`;

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google Sign-In popup was closed.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Google Sign-In was cancelled.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'The email associated with this Google account is already in use by another sign-in method. Please sign in with your existing account.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account with this email already exists using different credentials. Please sign in with your existing method.';
      } else if (error.code === 'permission-denied') { // This is a Firestore permission error
          errorMessage = 'Permission denied to access user data. Please check your Firestore rules.';
      } else if (error.code === 'unavailable') { // Often occurs with network issues or project config problems
          errorMessage = 'Service unavailable. Please check your internet connection or Firebase project settings.';
      }

      alert(errorMessage);
      console.error(error);
    }
  });
}

// ========================
// AUTH STATE MANAGEMENT
// ========================
onAuthStateChanged(auth, async (user) => {
  const navRegister = document.getElementById('navRegister');
  const navSignIn = document.getElementById('navSignIn');
  const navProfile = document.getElementById('navProfile');

  if (user) {
    // User is signed in
    let usernameToDisplay = "My Account";
    try {
      // Attempt to fetch username from Firestore document
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().username) {
        usernameToDisplay = userDoc.data().username; // Use the @username from Firestore
      } else if (user.displayName) {
        usernameToDisplay = user.displayName; // Fallback to Firebase Auth displayName
      }
    } catch (e) {
      console.warn("Could not fetch Firestore user doc for nav display:", e);
      usernameToDisplay = user.displayName || "My Account"; // Fallback on error
    }

    // Update navigation UI
    if (navRegister) navRegister.style.display = 'none';
    if (navSignIn) navSignIn.style.display = 'none';
    if (navProfile) {
      navProfile.textContent = usernameToDisplay;
      navProfile.href = "profile.html"; // Ensure the link points correctly
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

    document.getElementById('modalInput').focus(); // Focus the input field

    document.getElementById('modalSubmit').addEventListener('click', () => {
      const value = document.getElementById('modalInput').value.trim();
      document.body.removeChild(modal);
      resolve(value);
    });

    // Allow submission on Enter key press
    document.getElementById('modalInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            document.getElementById('modalSubmit').click();
        }
    });

    // --- CRITICAL FIX: REMOVED THE DUPLICATE googleSignIn EVENT LISTENER FROM HERE ---
    // document.getElementById('googleSignIn').addEventListener('click', async () => { ... });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null); // Resolve with null if user clicks outside modal
      }
    });
  });
}
