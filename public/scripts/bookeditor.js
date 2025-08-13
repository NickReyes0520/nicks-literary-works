// bookeditor.js

// --- 1. Firebase Initialization and Authentication ---
// We use the global variables provided by the environment for Firebase configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Global variables for the canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;

// Authenticate the user when the app loads
onAuthStateChanged(auth, async (user) => {
  const authStatusDiv = document.getElementById('authStatus');
  if (user) {
    // User is signed in.
    userId = user.uid;
    authStatusDiv.textContent = `Authenticated as: ${userId}`;
    console.log(`User authenticated with ID: ${userId}`);

    // Once authenticated, start listening for book data
    listenForBooks();
  } else {
    // No user is signed in. Attempt to sign in with custom token or anonymously.
    try {
      if (typeof __initial_auth_token !== 'undefined') {
        await signInWithCustomToken(auth, __initial_auth_token);
        console.log("Signed in with custom token.");
      } else {
        await signInAnonymously(auth);
        console.log("Signed in anonymously.");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      authStatusDiv.textContent = `Authentication failed: ${error.message}`;
    }
  }
});

// --- 2. DOM Elements and Event Listeners ---
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');
const bookGrid = document.querySelector('.book-grid');

// Create Book button and modal
document.querySelector('.action.create').addEventListener('click', () => {
  createBookModal.style.display = 'block';
});
document.querySelector('.close.create-close').addEventListener('click', () => {
  createBookModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === createBookModal) {
    createBookModal.style.display = 'none';
  }
});

// Import Book button and modal
document.querySelector('.action.import').addEventListener('click', () => {
  importBookModal.style.display = 'block';
});
document.querySelector('.close.import-close').addEventListener('click', () => {
  importBookModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === importBookModal) {
    importBookModal.style.display = 'none';
  }
});

// --- 3. Firestore Data Management ---

// This function listens for real-time changes in the books collection
function listenForBooks() {
  if (!userId) {
    console.warn("User ID is not available yet. Skipping Firestore listener.");
    return;
  }
  
  // Create a private collection for the user's books.
  const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
  
  // Set up a real-time listener
  onSnapshot(booksCollectionRef, (snapshot) => {
    const books = [];
    snapshot.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() });
    });
    renderBooks(books);
  }, (error) => {
    console.error("Error fetching books:", error);
  });
}

// Renders the books to the UI
function renderBooks(books) {
  // Clear existing book entries, but keep the static create/import box
  const bookElements = bookGrid.querySelectorAll('.book-box:not(.dual-action)');
  bookElements.forEach(el => el.remove());

  const noBooksMessage = document.getElementById('no-books-message');
  if (noBooksMessage) {
    noBooksMessage.remove();
  }
  
  if (books.length === 0) {
    // Display "No books found" message if no books exist
    const message = document.createElement('div');
    message.id = 'no-books-message';
    message.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; font-size: 1.2rem; color: #666;';
    message.textContent = "No books found. Click 'Create Book' or 'Import Book' to get started!";
    bookGrid.appendChild(message);
  } else {
    // Render each book dynamically
    books.forEach(book => {
      const bookBox = document.createElement('div');
      bookBox.className = 'book-box';
      bookBox.innerHTML = `
        <img src="${book.coverUrl || 'https://placehold.co/180x270/cccccc/333333?text=No+Cover'}" alt="${book.title} Cover">
        <div class="overlay">
          <div class="overlay-buttons">
            <h2>${book.title}</h2>
            <button class="manage-btn" onclick="window.location.href='managebook.html?bookId=${book.id}'">Manage</button>
            <button class="write-btn" onclick="window.location.href='manuscript.html?bookId=${book.id}'">Write</button>
          </div>
        </div>
      `;
      bookGrid.appendChild(bookBox);
    });
  }
}

// This is a placeholder for file upload functionality.
// In a real application, you would use Google Drive API, Firebase Storage, or another service.
async function uploadFile(file) {
  // Simulate a file upload and return a mock URL.
  // In a real scenario, this would be an async operation uploading to storage.
  console.log(`Simulating upload for file: ${file.name}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
  return `https://placehold.co/180x270?text=${encodeURIComponent(file.name)}`;
}


// --- 4. Form Submission Handlers ---

// Create Book Form
document.getElementById('createBookForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const loader = form.querySelector('.loader');
  const errorMessage = form.querySelector('.error-message');

  try {
    loader.style.display = 'block';
    errorMessage.style.display = 'none';

    const bookTitle = form.querySelector('#bookTitle').value;
    const bookCoverFile = form.querySelector('#bookCover').files[0];

    // Upload the book cover file (simulated)
    const coverUrl = await uploadFile(bookCoverFile);

    // Add the new book to Firestore
    const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
    await addDoc(booksCollectionRef, {
      title: bookTitle,
      coverUrl: coverUrl,
      createdAt: new Date()
    });

    // Close modal and reset form
    createBookModal.style.display = 'none';
    form.reset();

  } catch (error) {
    console.error("Error creating book:", error);
    errorMessage.textContent = "Failed to create book. Please try again.";
    errorMessage.style.display = 'block';
  } finally {
    loader.style.display = 'none';
  }
});

// Import Book Form
document.getElementById('importBookForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const loader = form.querySelector('.loader');
  const errorMessage = form.querySelector('.error-message');

  try {
    loader.style.display = 'block';
    errorMessage.style.display = 'none';

    const importTitle = form.querySelector('#importTitle').value;
    const importFile = form.querySelector('#importFile').files[0];
    const importCover = form.querySelector('#importCover').files[0];

    // Upload manuscript and cover (simulated)
    const manuscriptUrl = await uploadFile(importFile);
    let coverUrl = null;
    if (importCover) {
      coverUrl = await uploadFile(importCover);
    }

    // Add the imported book to Firestore
    const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
    await addDoc(booksCollectionRef, {
      title: importTitle,
      manuscriptUrl: manuscriptUrl,
      coverUrl: coverUrl, // This will be null if no cover was provided
      createdAt: new Date()
    });

    // Close modal and reset form
    importBookModal.style.display = 'none';
    form.reset();

  } catch (error) {
    console.error("Error importing book:", error);
    errorMessage.textContent = "Failed to import book. Please try again.";
    errorMessage.style.display = 'block';
  } finally {
    loader.style.display = 'none';
  }
});
