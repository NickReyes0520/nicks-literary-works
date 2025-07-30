// management.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.firebasestorage.app",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const userContainer = document.getElementById("user-container");
const userModal = document.getElementById("user-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  userContainer.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <img src="${user.photoURL || 'images/default-photo.jpg'}" alt="Profile Photo">
      <div class="username">${user.username}</div>
      <div class="realname">${user.fullName}</div>
    `;
    card.addEventListener("click", () => openUserModal(docSnap.id));
    userContainer.appendChild(card);
  });
}

async function openUserModal(userId) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const user = docSnap.data();
    modalBody.innerHTML = `
      <h2>${user.fullName} (@${user.username})</h2>
      <img src="${user.photoURL || 'images/default-photo.jpg'}" alt="Profile Photo">
      <p><strong>Activities:</strong></p>
      <ul>${(user.activities || []).map(act => `<li>${act}</li>`).join('')}</ul>
      <p><strong>Purchases:</strong></p>
      <ul>${(user.purchases || []).map(p => `<li>${p}</li>`).join('')}</ul>
      <p><strong>Comments:</strong></p>
      <ul>${(user.comments || []).map(c => `<li><em>${c.bookId}</em>: ${c.comment}</li>`).join('')}</ul>
    `;
    userModal.classList.remove("hidden");
  }
}

modalClose.addEventListener("click", () => {
  userModal.classList.add("hidden");
});

// Wait for Firebase Auth to confirm login
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUsers();
  } else {
    alert("You must be logged in to view this page.");
    window.location.href = "/index.html";
  }
});
