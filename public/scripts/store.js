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

// DOM Elements
const bookGrid = document.getElementById("book-grid");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const cartCount = document.getElementById("cart-count");

// Fetch books from Firestore and display them
let booksData = [];

async function loadBooks() {
  const querySnapshot = await getDocs(collection(db, "books"));
  booksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderBooks(booksData);
}

function renderBooks(data) {
  bookGrid.innerHTML = "";
  data.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.dataset.bookId = book.id;
    card.dataset.bookTitle = book.title;
    card.dataset.price = book.price;
    card.dataset.category = book.category;

    card.innerHTML = `
      <img src="${book.coverURL}" alt="${book.title}" />
      <h3>${book.title}</h3>
      <p class="desc">${book.description}</p>
      <p class="price">₱${book.price}</p>
      <div class="actions">
        <button class="preview-btn">📖 Preview</button>
        <button class="add-cart-btn">🛒 Add to Cart</button>
        <button class="physical-copy-btn">📦 Physical Copy</button>
      </div>
    `;

    bookGrid.appendChild(card);
  });
  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll('.physical-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.book-card');
      document.querySelector('#physical-form [name="bookId"]').value = card.dataset.bookId;
      document.querySelector('#physical-form [name="bookTitle"]').value = card.dataset.bookTitle;
      document.querySelector('#physical-form [name="price"]').value = card.dataset.price;
      document.getElementById('physical-modal').classList.remove('hidden');
    });
  });

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.book-card');
      const item = {
        bookId: card.dataset.bookId,
        title: card.dataset.bookTitle,
        type: 'digital',
        price: parseFloat(card.dataset.price)
      };
      addToCart(item);
      alert(`🛒 "${item.title}" added to cart!`);
    });
  });
}

function addToCart(item) {
  const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
  existingCart.push(item);
  localStorage.setItem('cart', JSON.stringify(existingCart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cartCount.textContent = cart.length;
}

// Modal logic
const modal = document.getElementById('physical-modal');
const form = document.getElementById('physical-form');
const closeBtn = modal.querySelector('.close-btn');

closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
});

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

  addToCart(order);
  alert(`📦 "${order.title}" physical copy added to cart!`);
  modal.classList.add('hidden');
  form.reset();
});

// Search and filter logic
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = booksData.filter(book => book.title.toLowerCase().includes(query));
  renderBooks(filtered);
});

categoryFilter.addEventListener('change', () => {
  const category = categoryFilter.value;
  const filtered = category === "all"
    ? booksData
    : booksData.filter(book => book.category === category);
  renderBooks(filtered);
});

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadBooks();
});