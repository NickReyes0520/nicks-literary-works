// profile.js - Reconstructed for Robustness and Debugging

// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  updateProfile,
  onAuthStateChanged // Listens for user login state changes
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,    // For reading user data
  updateDoc, // For saving profile changes
  serverTimestamp // For accurate timestamps
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject // For deleting old avatar from storage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Firebase Configuration ---
// IMPORTANT: This configuration must be identical across all your Firebase-enabled JS files.
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
// Ensure these IDs match exactly with your profile.html's element IDs.
// If any of these are null, their respective functionalities will not attach.
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
  console.log("loadProfileData: Function called for user:", user.uid);
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("loadProfileData: User data fetched from Firestore:", userData);
      
      // 4. & 5. Populate Username and Email fields:
      // Assuming 'username' field in Firestore stores the @username
      if (displayNameInput) {
        displayNameInput.value = userData.username || '';
        console.log("loadProfileData: Username set to:", displayNameInput.value);
      } else {
        console.warn("loadProfileData: displayNameInput element not found.");
      }
      
      // Email comes directly from the Firebase Auth user object, as it's the most reliable source
      if (userEmailInput) {
        userEmailInput.value = user.email || '';
        console.log("loadProfileData: Email set to:", userEmailInput.value);
      } else {
        console.warn("loadProfileData: userEmailInput element not found.");
      }

      if (userBioInput) {
        userBioInput.value = userData.bio || '';
        console.log("loadProfileData: Bio set to:", userBioInput.value);
      } else {
        console.warn("loadProfileData: userBioInput element not found.");
      }
      
      // Set avatar: prioritize avatarURL from Firestore, then user.photoURL from Auth, then default
      if (userAvatar) {
        if (userData.avatarURL) {
          userAvatar.src = userData.avatarURL;
          console.log("loadProfileData: Avatar from Firestore URL:", userData.avatarURL);
        } else if (user.photoURL) {
          userAvatar.src = user.photoURL;
          console.log("loadProfileData: Avatar from Firebase Auth photoURL:", user.photoURL);
        } else {
          userAvatar.src = DEFAULT_AVATAR_PATH;
          console.log("loadProfileData: Using default avatar.");
        }
      } else {
        console.warn("loadProfileData: userAvatar element not found.");
      }
      
      // Render interests checkboxes based on user's saved interests
      renderInterests(userData.interests || []);

    } else {
      // This case indicates a user is authenticated but no Firestore document exists for them.
      // This might happen if a user was created via Auth but their Firestore document failed to create.
      console.warn("loadProfileData: User is authenticated but no Firestore document found for UID:", user.uid);
      // Fallback: Populate fields with data available from Firebase Auth user object
      if (displayNameInput) displayNameInput.value = user.displayName || '';
      if (userEmailInput) userEmailInput.value = user.email || '';
      if (userBioInput) userBioInput.value = ''; // No bio if no Firestore doc
      if (userAvatar) userAvatar.src = user.photoURL || DEFAULT_AVATAR_PATH;
      renderInterests([]); // No interests if no Firestore doc
      alert("Your profile data could not be fully loaded. Please contact support.");
    }
  } catch (error) {
    console.error("loadProfileData: Error loading profile data:", error);
    alert("Failed to load profile data. Please try again. Check console for details.");
    // Optionally: if critical data loading fails, consider signing out the user
    // signOut(auth).then(() => window.location.href = "signin.html");
  }
}

// --- Helper Function: Render Interests Checkboxes ---
/**
 * Dynamically creates and renders checkboxes for book interests.
 * @param {Array<string>} userInterests - An array of interests the user has selected.
 */
function renderInterests(userInterests) {
  console.log("renderInterests: Function called with interests:", userInterests);
  if (!interestsContainer) {
    console.error("renderInterests: interestsContainer element not found. Cannot render interests.");
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
    label.appendChild(document.createTextNode(` ${interest}`)); // Added space for better visual
    interestsContainer.appendChild(label);
  });
  console.log("renderInterests: Checkboxes rendered.");
}

// --- Event Listeners for Profile Actions ---

// 3. Handle avatar change: Click the hidden file input when 'Change Avatar' button is clicked
if (changeAvatarBtn && avatarUpload) {
  changeAvatarBtn.addEventListener('click', () => {
    console.log("changeAvatarBtn: Clicked, triggering avatarUpload input.");
    avatarUpload.click();
  });
} else {
  console.warn("changeAvatarBtn or avatarUpload element not found. Avatar change function disabled.");
}

// Handle file selection for avatar upload
if (avatarUpload && userAvatar) {
  avatarUpload.addEventListener('change', async (e) => {
    console.log("avatarUpload: File selected, attempting upload.");
    const file = e.target.files[0];
    if (!file) {
      console.log("avatarUpload: No file selected.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("avatarUpload: No authenticated user found.");
        alert("You must be logged in to change your avatar.");
        window.location.href = "signin.html";
        return;
      }

      // Delete old avatar if it exists and is from our storage bucket
      // This is important to avoid orphaned files in Storage
      if (userAvatar.src && userAvatar.src.startsWith('https://firebasestorage.googleapis.com/')) {
        try {
          const oldAvatarRef = storageRef(storage, userAvatar.src);
          await deleteObject(oldAvatarRef);
          console.log("avatarUpload: Old avatar deleted successfully.");
        } catch (deleteError) {
          // Ignore if file doesn't exist (e.g., first time setting avatar) or other deletion error (e.g., permission)
          console.warn("avatarUpload: Could not delete old avatar (might not exist or permission issue):", deleteError.message);
        }
      }

      // Upload new avatar to Firebase Storage
      const newAvatarRef = storageRef(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(newAvatarRef, file);
      const avatarURL = await getDownloadURL(newAvatarRef);
      console.log("avatarUpload: New avatar uploaded to:", avatarURL);

      // Update user's profile in Firebase Auth (displayName might not be used, but photoURL is)
      // and update their custom Firestore document
      await Promise.all([
        updateProfile(user, { photoURL: avatarURL }), // Update Auth profile
        updateDoc(doc(db, "users", user.uid), {       // Update Firestore document
          avatarURL: avatarURL,
          updatedAt: serverTimestamp() // Use serverTimestamp for accuracy
        })
      ]);

      userAvatar.src = avatarURL; // Update the displayed avatar immediately
      alert("Avatar updated successfully!");
      console.log("avatarUpload: Profile and avatar updated successfully.");
    } catch (error) {
      console.error("avatarUpload: Error during avatar upload or update:", error);
      alert("Failed to update avatar. Please try again: " + error.message);
    }
  });
} else {
  console.warn("avatarUpload or userAvatar element not found. Avatar upload function disabled.");
}

// 1. Save profile changes: bio and interests
if (saveProfileBtn && userBioInput && interestsContainer) {
  saveProfileBtn.addEventListener('click', async () => {
    console.log("saveProfileBtn: Clicked, attempting to save changes.");
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("saveProfileBtn: No authenticated user found.");
        alert("You must be logged in to save your profile.");
        window.location.href = "signin.html";
        return;
      }

      const bio = userBioInput.value.trim();
      // Get all selected interests from the checkboxes
      const selectedInterests = Array.from(
        interestsContainer.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      console.log("saveProfileBtn: Bio:", bio, "Interests:", selectedInterests);

      // Update the user's document in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        bio: bio,
        interests: selectedInterests,
        updatedAt: serverTimestamp() // Use serverTimestamp for accuracy
      });

      alert("Profile updated successfully!");
      console.log("saveProfileBtn: Profile updated successfully in Firestore.");
    } catch (error) {
      console.error("saveProfileBtn: Error saving profile:", error);
      alert("Failed to save profile. Please try again: " + error.message);
    }
  });
} else {
  console.warn("saveProfileBtn, userBioInput, or interestsContainer element not found. Save Profile function disabled.");
}

// 2. Sign out button functionality
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    console.log("signOutBtn: Clicked, attempting to sign out.");
    signOut(auth).then(() => {
      console.log("signOutBtn: User signed out successfully.");
      window.location.href = "index.html"; // Redirect to home after sign out
    }).catch(error => {
      console.error("signOutBtn: Error during sign out:", error);
      alert("Failed to sign out. Please try again: " + error.message);
    });
  });
} else {
  console.warn("signOutBtn element not found. Sign Out function disabled.");
}


// --- Authentication State Listener ---
// This is the primary entry point for loading profile data and updating navigation.
onAuthStateChanged(auth, async (user) => {
  console.log("onAuthStateChanged: Auth state changed. User object:", user ? user.uid : "null");
  if (user) {
    // User is logged in: load profile data and update nav
    console.log("onAuthStateChanged: User is logged in. Calling loadProfileData...");
    await loadProfileData(user); // Call the function to load and display profile details

    // Update nav profile link to show the username (bonus point)
    if (navProfile) {
      console.log("onAuthStateChanged: Updating navProfile link.");
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const usernameForNav = userDoc.exists() && userDoc.data().username
                               ? userDoc.data().username
                               : user.displayName || "My Profile"; // Fallback to Auth displayName or generic
        navProfile.textContent = usernameForNav;
        navProfile.style.display = 'inline-block'; // Make sure nav link is visible
        navProfile.href = "profile.html"; // Ensure it links to profile
        console.log("onAuthStateChanged: navProfile text set to:", usernameForNav);
      } catch (e) {
        console.warn("onAuthStateChanged: Could not fetch Firestore username for nav profile:", e);
        navProfile.textContent = user.displayName || "My Profile"; // Fallback if Firestore fails
      }
    } else {
      console.warn("onAuthStateChanged: navProfile element not found. Cannot update nav link.");
    }
  } else {
    // User is not logged in: redirect to sign-in page
    console.log("onAuthStateChanged: No user detected. Redirecting to signin.html...");
    window.location.href = "signin.html";
  }
});

// --- Initial Console Log for Debugging Loading ---
console.log("profile.js: Script fully loaded and beginning execution.");