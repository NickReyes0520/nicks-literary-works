// account.js - Consolidated Version with All Fixes
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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase configuration
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

    // Get form values
    const rawUsername = form.username.value.trim();
    const username = `@${rawUsername}`;
    const email = form.email.value.trim();
    const password = form.password.value;
    const avatarFile = form.avatar.files[0];
    const interests = Array.from(form.querySelectorAll("input[name='interests']:checked")).map(el => el.value);

    // Validate username
    if (rawUsername.length > 14) {
      alert("❌ Username must be 14 characters or less.");
      return;
    }

    // Check username uniqueness
    const usernameQuery = await getDocs(collection(db, "users"));
    const taken = usernameQuery.docs.some(doc => doc.data().username === username);

    if (taken) {
      alert("❌ That username is already taken. Try another.");
      return;
    }

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Upload avatar if exists
      let avatarURL = "";
      if (avatarFile) {
        const avatarRef = storageRef(storage, `avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarURL = await getDownloadURL(avatarRef);
      }

      // Update profile and save to Firestore
      await Promise.all([
        updateProfile(user, {
          displayName: username,
          photoURL: avatarURL
        }),
        sendEmailVerification(user),
        setDoc(doc(db, "users", user.uid), {
          username,
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
      const username = await showModalPrompt("Choose a username (without @):");
      if (!username) return;

      // Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Update profile and save to Firestore
      await Promise.all([
        updateProfile(user, {
          displayName: `@${username}`
        }),
        setDoc(doc(db, "users", user.uid), {
          username: `@${username}`,
          email: user.email,
          avatarURL: user.photoURL || "",
          createdAt: serverTimestamp()
        }, { merge: true })
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

// Username validation helper
// This function cleans the input value directly on input.
// It ensures that the @ symbol is not manually typed and enforces rules.
function validateUsername(input) {
  // Remove any @ symbols user might try to add
  input.value = input.value.replace(/@/g, '');
  
  // Enforce max length (14 chars as per your existing validation)
  // This helps prevent issues before form submission.
  if (input.value.length > 14) {
    input.value = input.value.slice(0, 14);
  }
  
  // Only allow alphanumeric characters
  input.value = input.value.replace(/[^a-zA-Z0-9]/g, '');
}

function showModalPrompt(message) {
  return new Promise(resolve => {
    // Create modal elements
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

    // Handle submission
    document.getElementById('modalSubmit').addEventListener('click', () => {
      const value = document.getElementById('modalInput').value.trim();
      document.body.removeChild(modal);
      resolve(value);
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null);
      }
    });
  });
}
