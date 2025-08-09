// account.js - Consolidated Version with All Fixes and Google Sign-in Username Uniqueness

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  getDocs // Needed for uniqueness check
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase configuration (keep this consistent across all your JS files)
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Initialize services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// DOM elements
const form = document.getElementById("register-form");
const googleBtn = document.getElementById("googleSignIn");
const navRegister = document.getElementById("navRegister");
const navSignIn = document.getElementById("navSignIn");
const navProfile = document.getElementById("navProfile");


// ========================
// EMAIL/PASSWORD REGISTRATION
// ========================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rawUsername = form.username.value.trim();
    const username = `@${rawUsername}`; // Prepend '@' for consistency
    const email = form.email.value.trim();
    const password = form.password.value;
    const avatarFile = form.avatar.files[0];
    const interests = Array.from(form.querySelectorAll("input[name='interests']:checked")).map(el => el.value);

    // Validate username length
    if (rawUsername.length === 0) { // Check if username is empty
        alert("❌ Username cannot be empty.");
        return;
    }
    if (rawUsername.length > 14) {
      alert("❌ Username must be 14 characters or less.");
      return;
    }

    // Check username uniqueness in Firestore
    const usernameQuery = await getDocs(collection(db, "users"));
    const taken = usernameQuery.docs.some(doc => doc.data().username === username); // Check for exact match
    if (taken) {
      alert("❌ That username is already taken. Try another.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let avatarURL = "";
      if (avatarFile) {
        const avatarRef = storageRef(storage, `avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarURL = await getDownloadURL(avatarRef);
      }

      await Promise.all([
        updateProfile(user, {
          displayName: username, // Set display name for Firebase Auth
          photoURL: avatarURL
        }),
        sendEmailVerification(user),
        setDoc(doc(db, "users", user.uid), {
          username, // Store the @username in Firestore
          email,
          firstName: form.firstName.value.trim(),
          lastName: form.lastName.value.trim(),
          phone: `${form["country-code"].value}${form.phone.value.trim()}`,
          gender: form.gender.value,
          birthday: form.birthday.value,
          interests,
          avatarURL,
          createdAt: serverTimestamp()
        })
      ]);

      alert("✅ Registration successful! Please verify your email.");
      form.reset();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      console.error(error);
    }
  });
}


// ========================
// GOOGLE SIGN-IN/POPUP
// ========================
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      // Create modal for username input
      const rawUsernameInput = await showModalPrompt("Choose a username (without @):");
      if (!rawUsernameInput) { // If user cancels modal
          return;
      }

      // Validate username length for Google Sign-in
      if (rawUsernameInput.length === 0) {
        alert("❌ Username cannot be empty.");
        return;
      }
      if (rawUsernameInput.length > 14) {
        alert("❌ Username must be 14 characters or less.");
        return;
      }

      const desiredUsername = `@${rawUsernameInput}`; // Prepend '@' for the check and storage

      // --- NEW: Add Username Uniqueness Check for Google Sign-in ---
      const usernameQuery = await getDocs(collection(db, "users"));
      const taken = usernameQuery.docs.some(doc => doc.data().username === desiredUsername);
      if (taken) {
        alert("❌ That username is already taken. Try another.");
        return; // Prevent Google Sign-in if username is taken
      }
      // --- END NEW ---

      // Sign in with Google (this will create user if new, or sign in if existing)
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Update profile and save to Firestore
      await Promise.all([
        updateProfile(user, {
          displayName: desiredUsername, // Set Firebase Auth display name
          photoURL: user.photoURL || "" // Use Google's photo or empty string
        }),
        setDoc(doc(db, "users", user.uid), {
          username: desiredUsername, // Store the @username in Firestore
          email: user.email,
          avatarURL: user.photoURL || "", // Store Google's photo as avatarURL
          createdAt: serverTimestamp()
        }, { merge: true }) // Use merge: true to avoid overwriting if user already exists (e.g. from email/pass)
      ]);

      // Redirect to profile
      window.location.href = "profile.html";
    } catch (error) {
      alert(`❌ Google Sign-In failed: ${error.message}`);
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
    // Fetch Firestore document to get the correct username (which includes '@')
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const usernameToDisplay = userDoc.exists()
      ? userDoc.data().username // Use the @username from Firestore
      : user.displayName || "My Account"; // Fallback to displayName or generic

    // Update navigation links
    if (navRegister) navRegister.style.display = 'none';
    if (navSignIn) navSignIn.style.display = 'none';
    if (navProfile) {
      navProfile.textContent = usernameToDisplay;
      navProfile.style.display = 'inline-block';
      navProfile.href = "profile.html"; // Ensure correct href
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

// Username validation helper (used by account.html's input)
function validateUsername(input) {
  input.value = input.value.replace(/@/g, ''); // Remove any @ symbol user might type
  input.value = input.value.replace(/[^a-zA-Z0-9]/g, ''); // Only allow alphanumeric

  if (input.value.length > 14) {
    input.value = input.value.slice(0, 14); // Enforce max length
  }
}

// Modal prompt for Google Sign-in username
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null); // Resolve with null if clicked outside
      }
    });
  });
}
