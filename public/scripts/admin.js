// admin.js - Firebase Integrated Admin Login

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase configuration (must be the same across all your Firebase-enabled JS files)
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get DOM elements
const loginForm = document.getElementById("admin-login-form");
const loginStatus = document.getElementById("login-status");
const successOverlay = document.getElementById("login-success");
const welcomeSection = document.getElementById("admin-welcome");
const accessMessage = document.getElementById("access-message");
const adminOnlyLinks = document.querySelectorAll(".admin-only");
const backToHomeBtn = document.getElementById("backToHomeBtn"); // NEW: Get the Back to Home button

/**
 * Handles signing out the admin user and redirecting.
 */
async function adminSignOut() {
  try {
    await signOut(auth);
    console.log("Admin signed out.");
    window.location.href = 'index.html'; // Redirect to home page after sign out
  } catch (error) {
    console.error("Error signing out admin:", error);
    alert("Failed to sign out. Please try again.");
  }
}

/**
 * Updates the UI based on whether the current user is an authenticated admin.
 * @param {firebase.User} user - The Firebase authenticated user object.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 */
async function updateAdminUI(user) {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        if (accessMessage) accessMessage.style.display = "none";
        if (loginForm) loginForm.style.display = "none";
        if (welcomeSection) welcomeSection.style.display = "block";
        adminOnlyLinks.forEach(el => el.style.display = "inline-block");
        return true;
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  }

  if (welcomeSection) welcomeSection.style.display = "none";
  adminOnlyLinks.forEach(el => el.style.display = "none");
  if (accessMessage) accessMessage.style.display = "block";
  if (loginForm) loginForm.style.display = "block";
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  adminOnlyLinks.forEach(el => el.style.display = "none");

  // Initial UI setup based on auth state
  onAuthStateChanged(auth, async (user) => {
    await updateAdminUI(user);
    if (!user || (user && !(await getDoc(doc(db, 'users', user.uid))).data()?.role === 'admin')) {
      if (loginForm) loginForm.style.display = "block";
      if (accessMessage) accessMessage.style.display = "block";
    }
  });

  // Event listener for "Back to Home" button to sign out
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default link navigation
      adminSignOut();
    });
  }

  // Handle Admin Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      loginStatus.textContent = "Logging in...";

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          if (successOverlay) successOverlay.style.display = "flex";

          setTimeout(async () => {
            if (successOverlay) successOverlay.style.display = "none";
            loginStatus.textContent = "";
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            await updateAdminUI(user);
          }, 2000);

        } else {
          await signOut(auth);
          loginStatus.textContent = "❌ Invalid credentials or user is not authorized as an administrator.";
          console.warn("Attempted admin login by non-admin user:", email);
        }
      } catch (error) {
        let errorMessage = "❌ An unknown error occurred.";
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "❌ Invalid username or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "❌ Invalid email format.";
            break;
          case 'auth/user-disabled':
            errorMessage = "❌ Your account has been disabled.";
            break;
          default:
            errorMessage = `❌ Login failed: ${error.message}`;
            break;
        }
        loginStatus.textContent = errorMessage;
        console.error("Admin login error:", error);
      }
    });
  }
});
