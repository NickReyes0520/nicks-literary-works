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

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('physical-modal');
  const form = document.getElementById('physical-form');
  const closeBtn = modal.querySelector('.close-btn');

  // Open modal on physical-copy-btn click
  document.querySelectorAll('.physical-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.book-card');
      const bookId = card.dataset.bookId;
      const bookTitle = card.dataset.bookTitle;
      const price = card.dataset.price;

      // Populate hidden fields in the form
      form.bookId.value = bookId;
      form.bookTitle.value = bookTitle;
      form.price.value = price;

      modal.classList.remove('hidden');
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
  });

  // Submit form: Add to cart
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const order = {
      bookId: form.bookId.value,
      title: form.bookTitle.value,
      type: 'physical',
      price: parseFloat(form.price.value),
      name: form.name.value,
      phone: form.phone.value,
      address: form.address.value
    };

    // Store in localStorage or Firestore cart collection
    addToCart(order);

    alert(`📦 "${order.title}" physical copy added to cart!`);
    modal.classList.add('hidden');
    form.reset();
  });

  function addToCart(item) {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    existingCart.push(item);
    localStorage.setItem('cart', JSON.stringify(existingCart));
  }
});

loadBooks();
