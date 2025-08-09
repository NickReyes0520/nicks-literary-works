// profile.js - Complete Profile Management
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

// DOM Elements
const userAvatar = document.getElementById('user-avatar');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const avatarUpload = document.getElementById('avatar-upload');
const displayName = document.getElementById('display-name');
const userEmail = document.getElementById('user-email');
const userBio = document.getElementById('user-bio');
const interestsContainer = document.getElementById('interests-container');
const saveProfileBtn = document.getElementById('save-profile-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const navProfile = document.getElementById('navProfile');

// Available book interests (matches your account.html)
const ALL_INTERESTS = [
  "Fiction", "Non-Fiction", "Theology", "Fantasy", 
  "Brainstorming", "Novel", "Social Commentary", 
  "Scientific", "Philosophy", "Random"
];

// Load user profile data
async function loadProfileData(user) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();

      console.log("User data loaded from Firestore:", userData);
      console.log("Email from Firebase Auth user object:", user.email);
      
      // Set basic info
      displayName.value = userData.username || '';
      userEmail.value = user.email || '';
      userBio.value = userData.bio || '';
      
      // Set avatar if exists
      if (userData.avatarURL) {
        userAvatar.src = userData.avatarURL;
      } else if (user.photoURL) {
        userAvatar.src = user.photoURL;
      }
      
      // Render interests checkboxes
      renderInterests(userData.interests || []);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    alert("Failed to load profile data. Please try again.");
  }
}

// Render book interests checkboxes
function renderInterests(userInterests) {
  interestsContainer.innerHTML = '';
  
  ALL_INTERESTS.forEach(interest => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = interest;
    checkbox.checked = userInterests.includes(interest);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(interest));
    interestsContainer.appendChild(label);
  });
}

// Handle avatar change
changeAvatarBtn.addEventListener('click', () => avatarUpload.click());

avatarUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    // Delete old avatar if exists
    const oldAvatarRef = storageRef(storage, `avatars/${user.uid}/avatar`);
    try { await deleteObject(oldAvatarRef); } catch {} // Ignore if not exists

    // Upload new avatar
    const newAvatarRef = storageRef(storage, `avatars/${user.uid}/${file.name}`);
    await uploadBytes(newAvatarRef, file);
    const avatarURL = await getDownloadURL(newAvatarRef);

    // Update profile
    await Promise.all([
      updateProfile(user, { photoURL: avatarURL }),
      updateDoc(doc(db, "users", user.uid), {
        avatarURL: avatarURL
      })
    ]);

    userAvatar.src = avatarURL;
    alert("Avatar updated successfully!");
  } catch (error) {
    console.error("Avatar upload failed:", error);
    alert("Failed to update avatar. Please try again.");
  }
});

// Save profile changes
saveProfileBtn.addEventListener('click', async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const bio = userBio.value.trim();
    const selectedInterests = Array.from(
      interestsContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map(el => el.value);

    await updateDoc(doc(db, "users", user.uid"), {
      bio: bio,
      interests: selectedInterests,
      updatedAt: new Date()
    });

    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Failed to save profile. Please try again.");
  }
});

// Sign out
signOutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch(error => {
    console.error("Sign out error:", error);
    alert("Failed to sign out. Please try again.");
  });
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadProfileData(user);
    
    // Update nav profile link
    if (navProfile) {
      navProfile.textContent = user.displayName || "My Profile";
    }
  } else {
    window.location.href = "signin.html";
  }
});
