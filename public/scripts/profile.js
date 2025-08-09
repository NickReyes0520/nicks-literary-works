// profile.js - Complete Profile Management (Reconstructed for Robustness)

// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  updateProfile,
  onAuthStateChanged // Crucial for listening to user login state
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,    // For reading user data
  updateDoc  // For saving profile changes
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Firebase Configuration ---
// IMPORTANT: This must be identical across all your Firebase-enabled JS files
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DOM Elements ---
// Ensure these IDs match exactly with your profile.html
const userAvatar = document.getElementById('user-avatar');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const avatarUpload = document.getElementById('avatar-upload'); // Hidden file input
const displayNameInput = document.getElementById('display-name'); // Input field for username
const userEmailInput = document.getElementById('user-email');     // Input field for email
const userBioInput = document.getElementById('user-bio');         // Textarea for bio
const interestsContainer = document.getElementById('interests-container'); // Container for checkboxes
const saveProfileBtn = document.getElementById('save-profile-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const navProfile = document.getElementById('navProfile'); // The navigation link to update


// --- Constants ---
// Available book interests (matches your account.html)
const ALL_INTERESTS = [
  "Fiction", "Non-Fiction", "Theology", "Fantasy", 
  "Brainstorming", "Novel", "Social Commentary", 
  "Scientific", "Philosophy", "Random"
];
const DEFAULT_AVATAR_PATH = '/images/default-photo.jpg'; // Ensure this path is correct


// --- Main Function: Load User Profile Data ---
/**
 * Loads user profile data from Firestore and populates the form fields.
 * @param {firebase.User} user - The authenticated Firebase User object.
 */
async function loadProfileData(user) {
  try {
    // Fetch the user's custom data from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();

      console.log("User data loaded from Firestore:", userData);
      console.log("Email from Firebase Auth user object:", user.email);
      
      // Populate the username and email fields (which should not be empty)
      // Use userData.username from Firestore for the display name field
      // Use user.email from Firebase Auth for the email field
      displayNameInput.value = userData.username || '';
      userEmailInput.value = user.email || '';
      userBioInput.value = userData.bio || '';
      
      // Set avatar: prioritize avatarURL from Firestore, then user.photoURL from Auth, then default
      if (userData.avatarURL) {
        userAvatar.src = userData.avatarURL;
      } else if (user.photoURL) {
        userAvatar.src = user.photoURL;
      } else {
        userAvatar.src = DEFAULT_AVATAR_PATH;
      }
      
      // Render interests checkboxes based on user's saved interests
      renderInterests(userData.interests || []);
    } else {
        // This case indicates a user is authenticated but no Firestore document exists for them.
        // This should ideally not happen if signup/login correctly creates the Firestore doc.
        console.warn("User is authenticated but no Firestore document found:", user.uid);
        // Fallback for empty Firestore doc: use data from Firebase Auth object
        displayNameInput.value = user.displayName || '';
        userEmailInput.value = user.email || '';
        userAvatar.src = user.photoURL || DEFAULT_AVATAR_PATH;
        userBioInput.value = ''; // Bio would be empty if no Firestore doc
        renderInterests([]); // No interests if no Firestore doc
    }
  } catch (error) {
    console.error("Error loading profile data:", error);
    alert("Failed to load profile data. Please try again.");
    // Optionally, sign out if data loading fails critically
    // signOut(auth).then(() => window.location.href = "signin.html");
  }
}

// --- Helper Function: Render Interests Checkboxes ---
/**
 * Dynamically creates and renders checkboxes for book interests.
 * @param {Array<string>} userInterests - An array of interests the user has selected.
 */
function renderInterests(userInterests) {
  if (!interestsContainer) {
    console.error("interestsContainer not found. Cannot render interests.");
    return;
  }
  interestsContainer.innerHTML = ''; // Clear existing checkboxes
  
  ALL_INTERESTS.forEach(interest => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = interest;
    checkbox.checked = userInterests.includes(interest); // Check if this interest is in user's saved interests
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(interest));
    interestsContainer.appendChild(label);
  });
}

// --- Event Listeners for Profile Actions ---

// Handle avatar change: Click the hidden file input when 'Change Avatar' button is clicked
if (changeAvatarBtn && avatarUpload) {
  changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
}

// Handle file selection for avatar upload
if (avatarUpload && userAvatar) {
  avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return; // No file selected

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to change your avatar.");
        window.location.href = "signin.html";
        return;
      }

      // Delete old avatar if it exists and is from our storage bucket
      if (userAvatar.src && userAvatar.src.startsWith('https://firebasestorage.googleapis.com/')) {
        try {
          const oldAvatarRef = storageRef(storage, userAvatar.src);
          await deleteObject(oldAvatarRef);
          console.log("Old avatar deleted successfully.");
        } catch (deleteError) {
          // Ignore if file doesn't exist or other deletion error (e.g., permission)
          console.warn("Could not delete old avatar:", deleteError);
        }
      }

      // Upload new avatar to Firebase Storage
      const newAvatarRef = storageRef(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(newAvatarRef, file);
      const avatarURL = await getDownloadURL(newAvatarRef);

      // Update user's profile in Firebase Auth and Firestore
      await Promise.all([
        updateProfile(user, { photoURL: avatarURL }), // Update Auth profile
        updateDoc(doc(db, "users", user.uid), {       // Update Firestore document
          avatarURL: avatarURL,
          updatedAt: new Date() // Add an update timestamp
        })
      ]);

      userAvatar.src = avatarURL; // Update the displayed avatar immediately
      alert("Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Failed to update avatar. Please try again: " + error.message);
    }
  });
}

// Save profile changes: bio and interests
if (saveProfileBtn && userBioInput && interestsContainer) {
  saveProfileBtn.addEventListener('click', async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save your profile.");
        window.location.href = "signin.html";
        return;
      }

      const bio = userBioInput.value.trim();
      // Get all selected interests from the checkboxes
      const selectedInterests = Array.from(
        interestsContainer.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      // Update the user's document in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        bio: bio,
        interests: selectedInterests,
        updatedAt: new Date() // Add an update timestamp
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again: " + error.message);
    }
  });
}

// Sign out button functionality
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = "index.html"; // Redirect to home after sign out
    }).catch(error => {
      console.error("Sign out error:", error);
      alert("Failed to sign out. Please try again.");
    });
  });
}


// --- Authentication State Listener ---
// This is the primary entry point for loading profile data and updating navigation.
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is logged in: load profile data and update nav
    console.log("User detected, loading profile data...");
    await loadProfileData(user); // Call the function to load and display profile details

    // Update nav profile link to show the username
    if (navProfile) {
      // Fetch the username from Firestore for the nav bar as well, for consistency
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const usernameForNav = userDoc.exists() && userDoc.data().username
                               ? userDoc.data().username
                               : user.displayName || "My Profile"; // Fallback
        navProfile.textContent = usernameForNav;
      } catch (e) {
        console.warn("Could not fetch Firestore username for nav profile:", e);
        navProfile.textContent = user.displayName || "My Profile"; // Fallback if Firestore fails
      }
      navProfile.style.display = 'inline-block'; // Make sure nav link is visible
      navProfile.href = "profile.html"; // Ensure it links to profile
    }
  } else {
    // User is not logged in: redirect to sign-in page
    console.log("No user detected, redirecting to signin.html...");
    window.location.href = "signin.html";
  }
});

// --- Initial Console Log for Debugging Loading ---
console.log("profile.js script loaded.");
