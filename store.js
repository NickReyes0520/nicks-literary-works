import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch and display books
async function loadBooks() {
  const storeSection = document.getElementById("store");
  const querySnapshot = await getDocs(collection(db, "books"));

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    const card = document.createElement("div");
    card.className = "book-card";

    card.innerHTML = `
      <img src="${data.coverImageUrl}" alt="${data.title}" />
      <h3>${data.title}</h3>
      <p>${data.description}</p>
      <p><strong>₱${data.price}</strong></p>
      <button onclick="alert('Login to purchase this book!')">Buy Now</button>
    `;

    storeSection.appendChild(card);
  });
}

loadBooks();
