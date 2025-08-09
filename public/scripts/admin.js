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
const accessMessage = document.getElementById("access-message"); // "This portal is for administrator access only."
const adminOnlyLinks = document.querySelectorAll(".admin-only"); // Links with class="admin-only"

/**
 * Updates the UI based on whether the current user is an authenticated admin.
 * @param {firebase.User} user - The Firebase authenticated user object.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 */
async function updateAdminUI(user) {
  if (user) {
    try {
      // Fetch the user's document from Firestore to check their role
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        // User is logged in AND has the 'admin' role
        if (accessMessage) accessMessage.style.display = "none";
        if (loginForm) loginForm.style.display = "none";
        if (welcomeSection) welcomeSection.style.display = "block";
        adminOnlyLinks.forEach(el => el.style.display = "inline-block");
        return true; // Confirmed admin
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      // Fall through to non-admin state if there's an error
    }
  }

  // If no user, or user is not an admin, or an error occurred
  if (welcomeSection) welcomeSection.style.display = "none";
  adminOnlyLinks.forEach(el => el.style.display = "none");
  if (accessMessage) accessMessage.style.display = "block"; // Show access message
  if (loginForm) loginForm.style.display = "block"; // Show login form
  return false; // Not an admin
}

// Event listener for when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initial UI setup: hide admin-only links by default
  adminOnlyLinks.forEach(el => el.style.display = "none");

  // Set up Firebase Auth state listener to handle persistent login sessions
  // This runs on page load and whenever the auth state changes (login/logout)
  onAuthStateChanged(auth, async (user) => {
    // Attempt to update UI based on current auth state
    await updateAdminUI(user);
    // If not an admin, ensure login form is visible
    if (!user || (user && !(await getDoc(doc(db, 'users', user.uid))).data()?.role === 'admin')) {
      if (loginForm) loginForm.style.display = "block";
      if (accessMessage) accessMessage.style.display = "block";
    }
  });

  // Handle Admin Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent default form submission

      // Get email (using 'username' field) and password from the form
      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      loginStatus.textContent = "Logging in..."; // Provide feedback to user

      try {
        // Authenticate user with Firebase Email/Password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // After successful authentication, verify if this user has the 'admin' role in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          // Admin login successful: Show success animation and update UI
          if (successOverlay) successOverlay.style.display = "flex"; // Show success overlay

          setTimeout(async () => {
            if (successOverlay) successOverlay.style.display = "none"; // Hide overlay
            loginStatus.textContent = ""; // Clear status message
            document.getElementById("username").value = ""; // Clear form fields
            document.getElementById("password").value = "";
            await updateAdminUI(user); // Update UI to show admin tools
          }, 2000); // Duration matches your CSS animation
        } else {
          // User exists but does NOT have the 'admin' role
          await signOut(auth); // Sign out the non-admin user immediately
          loginStatus.textContent = "❌ Invalid credentials or user is not authorized as an administrator.";
          console.warn("Attempted admin login by non-admin user:", email);
        }
      } catch (error) {
        // Handle various login errors from Firebase
        let errorMessage = "❌ An unknown error occurred.";
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Modern Firebase version combines these
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
