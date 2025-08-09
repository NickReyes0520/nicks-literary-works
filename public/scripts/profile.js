// --- Firebase Imports ---
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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DOM Elements ---
const userAvatar = document.getElementById('user-avatar');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const avatarUpload = document.getElementById('avatar-upload');
const displayNameInput = document.getElementById('display-name');
const userEmailInput = document.getElementById('user-email');
const userBioInput = document.getElementById('user-bio');
const interestsContainer = document.getElementById('interests-container');
const saveProfileBtn = document.getElementById('save-profile-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const navProfile = document.getElementById('navProfile');

const ALL_INTERESTS = [
  "Fiction", "Non-Fiction", "Theology", "Fantasy",
  "Brainstorming", "Novel", "Social Commentary",
  "Scientific", "Philosophy", "Random"
];
const DEFAULT_AVATAR_PATH = '/images/default-photo.jpg';

// --- Load Profile Data ---
async function loadProfileData(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    console.log("Username from Firestore:", userData.username);
    console.log("Email from Auth:", user.email);

    if (userDoc.exists()) {
      const data = userDoc.data();
      displayNameInput.value = userData.username || user.email || '';
      userEmailInput.value = user.email || '';
      userBioInput.value = data.bio || '';
      userAvatar.src = data.avatarURL || user.photoURL || DEFAULT_AVATAR_PATH;
      renderInterests(data.interests || []);
    } else {
      // Fallback if Firestore doc doesn't exist
      displayNameInput.value = user.displayName || '';
      userEmailInput.value = user.email || '';
      userBioInput.value = '';
      userAvatar.src = user.photoURL || DEFAULT_AVATAR_PATH;
      renderInterests([]);
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    alert("Could not load profile. Please try again.");
  }
}

// --- Render Interests ---
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

// --- Avatar Upload ---
changeAvatarBtn?.addEventListener('click', () => avatarUpload?.click());

avatarUpload?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return window.location.href = "signin.html";

  try {
    const newAvatarRef = storageRef(storage, `avatars/${user.uid}/${file.name}`);
    await uploadBytes(newAvatarRef, file);
    const avatarURL = await getDownloadURL(newAvatarRef);

    await Promise.all([
      updateProfile(user, { photoURL: avatarURL }),
      updateDoc(doc(db, "users", user.uid), {
        avatarURL,
        updatedAt: new Date()
      })
    ]);

    userAvatar.src = avatarURL;
    alert("Avatar updated!");
  } catch (err) {
    console.error("Avatar update failed:", err);
    alert("Failed to update avatar.");
  }
});

// --- Save Profile ---
saveProfileBtn?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return window.location.href = "signin.html";

  const bio = userBioInput.value.trim();
  const selectedInterests = Array.from(
    interestsContainer.querySelectorAll('input[type="checkbox"]:checked')
  ).map(el => el.value);

  try {
    await updateDoc(doc(db, "users", user.uid), {
      bio,
      interests: selectedInterests,
      updatedAt: new Date()
    });
    alert("Profile saved!");
  } catch (err) {
    console.error("Save failed:", err);
    alert("Could not save profile.");
  }
});

// --- Sign Out ---
signOutBtn?.addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = "index.html")
    .catch(err => {
      console.error("Sign out error:", err);
      alert("Sign out failed.");
    });
});

// --- Auth Listener ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadProfileData(user);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const username = userDoc.exists() ? userDoc.data().username : user.displayName || "My Profile";
      navProfile.textContent = username;
      navProfile.href = "profile.html";
      navProfile.style.display = 'inline-block';
    } catch (err) {
      console.warn("Nav username fallback:", err);
      navProfile.textContent = user.displayName || "My Profile";
    }
  } else {
    window.location.href = "signin.html";
  }
});

console.log("Enhanced profile.js loaded.");
