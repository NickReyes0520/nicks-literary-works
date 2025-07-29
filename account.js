// account.js – Final Combined & Cleaned

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const form = document.querySelector("#registration-form");
const googleBtn = document.querySelector("#google-signin-btn");
const navProfileLink = document.querySelector("a[href='profile.html']");

// 🔐 Firestore Security Tip (configure in Firebase console)
/**
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/

// ✍️ Email/Password Registration
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const avatarFile = form.avatar.files[0];
  const interests = Array.from(form.querySelectorAll("input[name='interests[]']:checked")).map(el => el.value);

  const rawUsername = form.username.value.trim();
  const username = `@${rawUsername}`;

  // Check length
  if (rawUsername.length > 14) {
    alert("❌ Username must be 14 characters or less.");
    return;
  }

  // Check uniqueness
  const usernameQuery = await getDocs(collection(db, "users"));
  const taken = usernameQuery.docs.some(doc => doc.data().username === username);

  if (taken) {
    alert("❌ That username is already taken. Try another.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user);

    let avatarURL = "";
    if (avatarFile) {
      const avatarRef = storageRef(storage, `avatars/${user.uid}/${avatarFile.name}`);
      await uploadBytes(avatarRef, avatarFile);
      avatarURL = await getDownloadURL(avatarRef);
    }

    await updateProfile(user, {
      displayName: `@${username}`,
      photoURL: avatarURL
    });

    await setDoc(doc(db, "users", user.uid), {
      username: `@${username}`,
      email,
      interests,
      avatarURL,
      createdAt: serverTimestamp()
    });

    alert("✅ Registration successful! Please verify your email before signing in.");
    form.reset();
  } catch (error) {
    alert("❌ Error: " + error.message);
    console.error(error);
  }
});

// 🌐 Google Sign-In
googleBtn?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const username = prompt("Choose a username (@handle):")?.trim() || "user";
    const gender = prompt("Enter your gender (Male/Female):");
    const birthday = prompt("Enter your birthday (YYYY-MM-DD):");
    const phone = prompt("Enter your phone number (optional):");

    await updateProfile(user, {
      displayName: `@${username}`
    });

    await setDoc(doc(db, "users", user.uid), {
      username: `@${username}`,
      email: user.email,
      phone,
      gender,
      birthday,
      avatarURL: user.photoURL || "",
      interests: [],
      createdAt: serverTimestamp()
    }, { merge: true });

    alert("✅ Google Sign-Up successful! Your profile is now created.");
    window.location.href = "profile.html";
  } catch (error) {
    alert("❌ Google Sign-In failed: " + error.message);
    console.error(error);
  }
});

// 🔄 Navbar Username Update
onAuthStateChanged(auth, (user) => {
  if (user) {
    navProfileLink.textContent = user.displayName || "My Profile";
    navProfileLink.href = "profile.html";
  } else {
    navProfileLink.textContent = "My Profile";
    navProfileLink.href = "signin.html";
  }
});

// === STEP 4: PROFILE PAGE LOGIC ===

// Auto-fill profile form with current user info
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    const userDocRef = firebase.firestore().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const data = userDoc.data();
      document.getElementById('profile-username').value = data.username || '';
      document.getElementById('profile-email').value = user.email || '';
      document.getElementById('profile-bio').value = data.bio || '';
      document.getElementById('profile-interests').value = data.interests || '';
      if (data.avatarUrl) {
        document.getElementById('profile-avatar').src = data.avatarUrl;
      }
    }
  }
});

// Save profile changes
const saveProfileBtn = document.getElementById('save-profile-btn');
saveProfileBtn?.addEventListener('click', async () => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const username = document.getElementById('profile-username').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const interests = document.getElementById('profile-interests').value.trim();

  await firebase.firestore().collection('users').doc(user.uid).update({
    username,
    bio,
    interests,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  alert('Profile updated successfully!');
});

// Change avatar
const changeAvatarBtn = document.getElementById('change-avatar-btn');
changeAvatarBtn?.addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const user = firebase.auth().currentUser;
    const storageRef = firebase.storage().ref();
    const avatarRef = storageRef.child(`avatars/${user.uid}/${file.name}`);
    await avatarRef.put(file);
    const avatarUrl = await avatarRef.getDownloadURL();

    await firebase.firestore().collection('users').doc(user.uid).update({
      avatarUrl,
    });

    document.getElementById('profile-avatar').src = avatarUrl;
    alert('Avatar updated successfully!');
  };
  fileInput.click();
});

// Sign out from profile page
const signOutBtn = document.querySelector('.signout-btn');
signOutBtn?.addEventListener('click', () => {
  firebase.auth().signOut().then(() => {
    window.location.href = 'account.html';
  });
});
