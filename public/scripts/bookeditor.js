// bookeditor.js - Google Drive Integration for Nick's Literary Works (Unified Auth)

// ===============================================
// 1. IMPORTS & CONFIGURATION
// ===============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider, // Add this for Firebase Google Auth
  signInWithPopup     // Add this for Firebase Google Auth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};
firebase.initializeApp(firebaseConfig);

// Google Drive API setup
function initGoogleDrive() {
  gapi.load("client", () => {
    gapi.client.init({
      apiKey: "AIzaSyBT9JEi6PvroCcBSZpfL4ozqKZ9g83lDB0", // Google Drive key
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    }).then(() => {
      console.log("Google Drive API initialized");
    });
  });
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================================
// 2. AUTHENTICATION & GOOGLE DRIVE FUNCTIONS (Unified Auth)
// ===============================================
// Initialize Firebase's Google Auth Provider and request Drive file scope
const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');

/**
 * Handles Google Sign-In using Firebase Auth. This will prompt the user if not already signed in.
 * @returns {Promise<string>} The Google Drive access token.
 */
async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    // The Drive access token is part of the credential returned by signInWithPopup
    const credential = GoogleAuthProvider.credentialFromResult(result);
    console.log("Firebase Google Sign-In successful.");
    return credential.accessToken; // This is the token needed for Drive API calls
  } catch (error) {
    console.error("Firebase Google Sign-In Error:", error);
    // User might have closed the popup or denied access
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      alert("Google Sign-In was cancelled or blocked. Please try again and allow popups.");
    } else {
      alert(`Failed to sign in to Google: ${error.message}`);
    }
    throw error; // Re-throw to propagate the error to calling functions
  }
}

/**
 * Uploads a file to Google Drive using the access token obtained via Firebase Auth.
 * @param {File} file The file object to upload.
 * @param {string} folderId The ID of the parent folder in Google Drive (e.g., 'root' for My Drive).
 * @returns {Promise<Object>} A promise that resolves with the Drive file metadata.
 */
async function uploadToDrive(file, folderId = 'root') {
  // This will implicitly trigger Firebase Google sign-in if the user hasn't signed in yet for Drive access
  const accessToken = await handleGoogleSignIn();

  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId]
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Drive upload error:", errorData);
    throw new Error(errorData.error?.message || "Google Drive upload failed");
  }

  return response.json();
}

/**
 * Generates a thumbnail URL for a Google Drive file.
 * @param {string} fileId The ID of the Google Drive file.
 * @returns {string} The URL for the file's thumbnail.
 */
function getDriveThumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
}

// ===============================================
// 3. BOOK MANAGEMENT FUNCTIONS
// ===============================================

/**
 * Loads books from Firestore for the current user and renders them in the grid.
 * Handles displaying "No books found" message.
 */
async function loadBooks() {
  const bookGrid = document.querySelector('.book-grid');
  // Identify the static 'dual-action' box
  const dualActionBox = document.querySelector('.book-box.dual-action');

  // Remove any previous "no books found" message
  const noBooksMsgExisting = bookGrid.querySelector('.no-books-message');
  if (noBooksMsgExisting) {
    bookGrid.removeChild(noBooksMsgExisting);
  }

  // Clear all *other* book boxes from the grid, leaving the dual-action box intact
  // Create a static copy of the children array to avoid issues during removal
  const currentChildren = Array.from(bookGrid.children);
  currentChildren.forEach(child => {
    if (child !== dualActionBox) {
      bookGrid.removeChild(child);
    }
  });

  if (!auth.currentUser) {
    console.warn("No user signed in. Cannot load books.");
    // Display a message if no user is signed in (though redirection should handle this)
    const msg = document.createElement('p');
    msg.className = 'no-books-message';
    msg.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; color: #555;';
    msg.textContent = 'Please sign in to view your books.';
    bookGrid.appendChild(msg);
    return;
  }

  // Query books belonging to the currently authenticated user
  const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Display a message if no books are found
      const msg = document.createElement('p');
      msg.className = 'no-books-message';
      msg.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; color: #555;';
      msg.textContent = 'No books found. Click "Create Book" or "Import Book" to get started!';
      bookGrid.appendChild(msg);
    } else {
      querySnapshot.forEach(doc => renderBook(doc.data())); // Render each book found
    }
  } catch (error) {
    console.error("Error loading books:", error);
    alert("Failed to load books. Please check your internet connection or console for details.");
  }
}

/**
 * Helper function to render a single book box in the grid.
 * @param {Object} book The book data object from Firestore.
 */
function renderBook(book) {
  const bookBox = document.createElement('div');
  bookBox.className = 'book-box';
  // Use getDriveThumbnailUrl for cover images
  bookBox.innerHTML = `
    <img src="${book.coverDriveId ? getDriveThumbnailUrl(book.coverDriveId) : '/images/default-cover.png'}" alt="${book.title || 'Untitled Book'}">
    <div class="overlay">
      <h2>${book.title || 'Untitled Book'}</h2>
      <div class="overlay-buttons">
        <button onclick="location.href='managebooks.html?bookId=${book.id}'">⚙️ Manage</button>
        <button onclick="location.href='manuscript.html?bookId=${book.id}'">✍🏻 Write</button>
      </div>
    </div>
  `;
  document.querySelector('.book-grid').appendChild(bookBox);
}

// ===============================================
// 4. MODAL & FORM HANDLERS
// ===============================================

/**
 * Sets up event listeners for modal open/close and form submissions.
 */
function setupModals() {
  const createBookModal = document.getElementById('createBookModal');
  const importBookModal = document.getElementById('importBookModal');

  // Modal open buttons
  document.querySelector('.action.create').addEventListener('click', () => {
    createBookModal.style.display = 'block';
  });

  document.querySelector('.action.import').addEventListener('click', () => {
    importBookModal.style.display = 'block';
  });

  // Modal close buttons
  const createCloseBtn = document.querySelector('.close.create-close');
  const importCloseBtn = document.querySelector('.close.import-close');

  if (createCloseBtn) {
    createCloseBtn.addEventListener('click', () => {
      createBookModal.style.display = 'none';
      document.getElementById('createBookForm').reset(); // Clear form on close
    });
  }

  if (importCloseBtn) {
    importCloseBtn.addEventListener('click', () => {
      importBookModal.style.display = 'none';
      document.getElementById('importBookForm').reset(); // Clear form on close
    });
  }

  // Close modals if clicking outside
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

  // Form Submissions
  document.getElementById('createBookForm').addEventListener('submit', handleCreateBook);
  document.getElementById('importBookForm').addEventListener('submit', handleImportBook);
}

/**
 * Handles the submission of the Create Book form.
 * @param {Event} e The submit event.
 */
async function handleCreateBook(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const title = form.bookTitle.value.trim();
  const coverFile = form.bookCover.files[0];

  if (!title || !coverFile) {
    alert("Please provide a title and a cover image for your new book.");
    return;
  }

  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...'; // Provide feedback

  try {
    // Upload cover to Google Drive (Firebase Google Auth will handle sign-in)
    const coverUploadResponse = await uploadToDrive(coverFile, 'root'); // 'root' uploads to My Drive
    const coverDriveId = coverUploadResponse.id; // Get Drive File ID

    // Create a new document reference in the 'books' collection
    const bookRef = doc(collection(db, "books"));

    // Save book data to Firestore, storing Drive File ID
    await setDoc(bookRef, {
      id: bookRef.id,
      title: title,
      coverDriveId: coverDriveId, // Store Google Drive File ID
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "", // Initial empty content
      status: "draft"
    });

    document.getElementById('createBookModal').style.display = 'none';
    form.reset();
    window.location.href = `manuscript.html?bookId=${bookRef.id}`; // Redirect to manuscript editor

  } catch (error) {
    console.error("Error creating book:", error);
    alert(`Failed to create book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

/**
 * Handles the submission of the Import Book form.
 * @param {Event} e The submit event.
 */
async function handleImportBook(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const title = form.importTitle.value.trim();
  const manuscriptInput = form.importFile;
  const coverInput = form.importCover;

  const manuscriptFile = manuscriptInput.files[0];
  const coverFile = coverInput.files[0];

  if (!title || !manuscriptFile) {
    alert("Please provide a title and a manuscript file for import.");
    return;
  }

  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Importing...';

  try {
    let coverDriveId = '';
    // Upload cover if provided
    if (coverFile) {
      const coverUploadResponse = await uploadToDrive(coverFile, 'root');
      coverDriveId = coverUploadResponse.id;
    }

    // Upload manuscript file
    const manuscriptUploadResponse = await uploadToDrive(manuscriptFile, 'root');
    const manuscriptDriveId = manuscriptUploadResponse.id;

    const bookRef = doc(collection(db, "books"));
    await setDoc(bookRef, {
      id: bookRef.id,
      title: title,
      coverDriveId: coverDriveId, // Store Google Drive File ID
      manuscriptDriveId: manuscriptDriveId, // Store Google Drive File ID
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "", // Initial empty content for imported book
      status: "draft"
    });

    document.getElementById('importBookModal').style.display = 'none';
    form.reset();
    loadBooks(); // Refresh the book grid to show the newly imported book
    alert("Book imported successfully! (Note: Manuscript content will be editable once parsing is implemented)");

  } catch (error) {
    console.error("Error importing book:", error);
    alert(`Failed to import book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}


// ===============================================
// 5. INITIALIZATION (ON AUTH STATE CHANGED)
// ===============================================
onAuthStateChanged(auth, async (user) => {
  // Recommendation: Add a status element in your HTML like <div id="authStatus"></div>
  const authStatusEl = document.getElementById('authStatus');

  if (user) {
    console.log("Firebase user signed in:", user.email);
    if (authStatusEl) {
      authStatusEl.textContent = `Connected as ${user.email}`;
      authStatusEl.style.color = 'green';
    }
    try {
      setupModals(); // Set up modals only once Firebase user is authenticated
      loadBooks();   // Load books after Firebase auth is ready
    } catch (error) {
      console.error("Initialization error:", error);
      if (authStatusEl) {
        authStatusEl.textContent = `Error during initialization: ${error.message}`;
        authStatusEl.style.color = 'red';
      }
    }
  } else {
    console.log("No Firebase user signed in, redirecting.");
    if (authStatusEl) {
      authStatusEl.textContent = "Not connected (redirecting to admin login)";
      authStatusEl.style.color = 'red';
    }
    window.location.href = 'admin.html'; // Redirect to admin login page
  }
});
