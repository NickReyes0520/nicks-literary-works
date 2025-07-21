import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.firebasestorage.app",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch books from Firestore and display them
const productGrid = document.getElementById("product-grid");

async function loadBooks() {
  const querySnapshot = await getDocs(collection(db, "books"));
  querySnapshot.forEach((doc) => {
    const book = doc.data();

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${book.coverURL}" alt="${book.title}" />
      <h3>${book.title}</h3>
      <p>${book.description}</p>
      <p><strong>₱${book.price}</strong></p>
      <button>View More</button>
    `;
    productGrid.appendChild(card);
  });
}

loadBooks();
