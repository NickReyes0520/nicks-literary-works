// bookeditor.js - Fully Updated Version

// ===============================================
// 1. FIREBASE IMPORTS AND CONFIGURATION
// ===============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===============================================
// 2. DOM ELEMENTS
// ===============================================
const bookGrid = document.querySelector('.book-grid');
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');

// Modal close buttons (from the updated HTML)
const createCloseBtn = document.querySelector('.close.create-close');
const importCloseBtn = document.querySelector('.close.import-close');

// ===============================================
// 3. MODAL OPEN/CLOSE LOGIC
// ===============================================

// Open Create Book Modal
document.querySelector('.action.create').addEventListener('click', () => {
  createBookModal.style.display = 'block';
});

// Open Import Book Modal
document.querySelector('.action.import').addEventListener('click', () => {
  importBookModal.style.display = 'block';
});

// Close Create Book Modal
if (createCloseBtn) {
  createCloseBtn.addEventListener('click', () => {
    createBookModal.style.display = 'none';
    document.getElementById('createBookForm').reset(); // Clear form on close
  });
}

// Close Import Book Modal
if (importCloseBtn) {
  importCloseBtn.addEventListener('click', () => {
    importBookModal.style.display = 'none';
    document.getElementById('importBookForm').reset(); // Clear form on close
  });
}

// Close modals if clicking outside (optional, but good for UX)
if (createBookModal) {
  createBookModal.addEventListener('click', (e) => {
    if (e.target === createBookModal) {
      createBookModal.style.display = 'none';
      document.getElementById('createBookForm').reset();
    }
  });
}

if (importBookModal) {
  importBookModal.addEventListener('click', (e) => {
    if (e.target === importBookModal) {
      importBookModal.style.display = 'none';
      document.getElementById('importBookForm').reset();
    }
  });
}


// ===============================================
// 4. LOAD BOOKS FUNCTIONALITY
// ===============================================
async function loadBooks() {
  // Clear existing books from the grid to prepare for fresh load
  bookGrid.innerHTML = '';

  if (!auth.currentUser) {
    console.warn("No user signed in. Cannot load books.");
    return;
  }

  // Query books belonging to the currently authenticated user
  const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Display a message if no books are found
      bookGrid.innerHTML = '<p class="no-books-message" style="width: 100%; text-align: center; margin-top: 50px; color: #555;">No books found. Click "Create Book" or "Import Book" to get started!</p>';
    } else {
      querySnapshot.forEach((doc) => {
        const book = doc.data();
        renderBook(book); // Render each book found
      });
    }
  } catch (error) {
    console.error("Error loading books:", error);
    alert("Failed to load books. Please check your internet connection or console for details.");
  }
}

// Helper function to render a single book box in the grid
function renderBook(book) {
  const bookBox = document.createElement('div');
  bookBox.className = 'book-box';
  bookBox.innerHTML = `
    <img src="${book.coverURL || '/path/to/default-cover.png'}" alt="${book.title || 'Untitled Book'}">
    <div class="overlay">
      <h2>${book.title || 'Untitled Book'}</h2>
      <div class="overlay-buttons">
        <button onclick="location.href='managebooks.html?bookId=${book.id}'">⚙️ Manage</button>
        <button onclick="location.href='manuscript.html?bookId=${book.id}'">✍🏻 Write</button>
      </div>
    </div>
  `;
  bookGrid.appendChild(bookBox);
}

// ===============================================
// 5. CREATE BOOK MODAL SUBMISSION
// ===============================================
document.getElementById('createBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('bookTitle').value.trim();
  const coverInput = document.getElementById('bookCover');
  const coverFile = coverInput.files[0];

  if (!title || !coverFile) {
    alert("Please provide a title and a cover image for your new book.");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...'; // Provide feedback

  try {
    // Upload cover to Firebase Storage
    const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
    await uploadBytes(coverRef, coverFile);
    const coverURL = await getDownloadURL(coverRef);

    // Create a new document reference in the 'books' collection
    const bookRef = doc(collection(db, "books"));

    // Save book data to Firestore
    await setDoc(bookRef, {
      id: bookRef.id, // Store the document ID within the document
      title: title,
      coverURL: coverURL,
      authorId: auth.currentUser.uid, // Assign the current user as author
      createdAt: serverTimestamp(),
      content: "", // Initialize empty content for the new manuscript
      status: "draft" // Default status for new books
    });

    createBookModal.style.display = 'none'; // Close the modal
    document.getElementById('createBookForm').reset(); // Clear form
    window.location.href = `manuscript.html?bookId=${bookRef.id}`; // AUTO-REDIRECT to manuscript editor

  } catch (error) {
    console.error("Error creating book:", error);
    alert(`Failed to create book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText; // Restore button text
  }
});

// ===============================================
// 6. IMPORT BOOK MODAL SUBMISSION
// ===============================================
document.getElementById('importBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('importTitle').value.trim();
  const manuscriptInput = document.getElementById('importFile');
  const coverInput = document.getElementById('importCover');

  const manuscriptFile = manuscriptInput.files[0];
  const coverFile = coverInput.files[0]; // Cover is optional here

  if (!title || !manuscriptFile) {
    alert("Please provide a title and a manuscript file for import.");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Importing...'; // Provide feedback

  try {
    let coverURL = '';
    // Upload cover if provided
    if (coverFile) {
      const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
      await uploadBytes(coverRef, coverFile);
      coverURL = await getDownloadURL(coverRef);
    }

    // Upload manuscript file
    const manuscriptRef = ref(storage, `manuscripts/${Date.now()}_${manuscriptFile.name}`);
    await uploadBytes(manuscriptRef, manuscriptFile);
    const manuscriptURL = await getDownloadURL(manuscriptRef);

    // Note: For .doc/.docx, you'd typically need a server-side process
    // (e.g., Firebase Cloud Function) to parse the file content into text.
    // This client-side code just uploads the file.
    // For now, we'll store the URL to the manuscript file.

    const bookRef = doc(collection(db, "books"));
    await setDoc(bookRef, {
      id: bookRef.id,
      title: title,
      coverURL: coverURL, // Will be empty string if no cover uploaded
      manuscriptURL: manuscriptURL, // URL to the uploaded .doc/.docx
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "", // Content will be parsed later from manuscriptURL or edited directly
      status: "draft"
    });

    importBookModal.style.display = 'none'; // Close modal
    document.getElementById('importBookForm').reset(); // Clear form
    loadBooks(); // Refresh the book grid to show the newly imported book
    alert("Book imported successfully! (Note: Manuscript content will be editable once parsing is implemented)");

  } catch (error) {
    console.error("Error importing book:", error);
    alert(`Failed to import book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText; // Restore button text
  }
});


// ===============================================
// 7. HELPER FUNCTION: Upload File
// ===============================================
async function uploadFile(file, path) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}


// ===============================================
// 8. INITIALIZATION (ON AUTH STATE CHANGED)
// ===============================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, load books and set up modal listeners
    await loadBooks(); // Ensure books are loaded after auth state is determined
    // Modal setup is already handled by direct event listeners,
    // but this ensures they are "active" after user logs in.
    // No specific function calls are needed here for modal setup.
  } else {
    // User is signed out, redirect to admin login page
    window.location.href = 'admin.html';
  }
});
