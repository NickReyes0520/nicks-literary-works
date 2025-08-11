// bookeditor.js - Using Google Drive for Storage (Temporary Solution)

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

// Note: Firebase Storage imports are removed as we are using Google Drive temporarily.

// Firebase Configuration (Keep this for Auth and Firestore)
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com", // This field is no longer actively used for file uploads in this version
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // Firebase Storage is not initialized here

// ===============================================
// 2. GOOGLE DRIVE API CONFIGURATION & CLIENT
// ===============================================
const GOOGLE_API_KEY = "AIzaSyCUCB0RGXI16eRzk_uLNdgyvBaCJ3t8bDg"; // Your Google API Key
const GOOGLE_CLIENT_ID = "278892341970-8ugrn87lh2v516oftr1sgftdbcgupufl.apps.googleusercontent.com"; // Your Google Client ID
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'; // Minimal scope for files created by the app

let gapiClientReady = false; // Flag to ensure gapi client is loaded and initialized
let googleAuthInstance = null; // Stores the gapi.auth2.GoogleAuth object

/**
 * Initializes the Google API client. This should be called once the gapi.js script is loaded.
 */
function initGoogleClient() {
  return new Promise((resolve, reject) => {
    // Check if gapi is defined
    if (typeof gapi === 'undefined') {
      console.error("Google API client (gapi.js) not loaded. Please ensure script tag is in HTML.");
      reject("gapi not loaded");
      return;
    }

    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: GOOGLE_DRIVE_SCOPE
      }).then(() => {
        googleAuthInstance = gapi.auth2.getAuthInstance();
        gapiClientReady = true;
        console.log("Google API client initialized.");
        resolve();
      }).catch((error) => {
        console.error("Error initializing Google API client:", error);
        reject(error);
      });
    });
  });
}

/**
 * Uploads a file to Google Drive.
 * @param {File} file The file object to upload.
 * @param {string} folderId The ID of the parent folder in Google Drive (e.g., 'root' for My Drive).
 * @returns {Promise<Object>} A promise that resolves with the Drive file metadata.
 */
async function uploadToDrive(file, folderId = 'root') {
  if (!gapiClientReady || !googleAuthInstance || !googleAuthInstance.isSignedIn.get()) {
    console.error("Google Drive API not ready or user not signed in to Google.");
    throw new Error("Google Drive API not ready or user not signed in.");
  }

  const accessToken = googleAuthInstance.currentUser.get().getAuthResponse().access_token;

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
    headers: new Headers({
      'Authorization': `Bearer ${accessToken}`
    }),
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Drive upload error:", errorData);
    throw new Error(`Google Drive upload failed: ${errorData.error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Generates a thumbnail URL for a Google Drive file.
 * Note: The file must be publicly accessible or accessible to the signed-in user.
 * For this 'drive.file' scope, it should be accessible to the creating user.
 * @param {string} fileId The ID of the Google Drive file.
 * @returns {string} The URL for the file's thumbnail.
 */
function getDriveThumbnailUrl(fileId) {
  // You might want to choose a specific size, e.g., &sz=w200 or &sz=s200
  // Defaulting to a moderate size for covers.
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
}


// ===============================================
// 3. DOM ELEMENTS
// ===============================================
const bookGrid = document.querySelector('.book-grid');
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');

// Modal close buttons (from the updated HTML)
const createCloseBtn = document.querySelector('.close.create-close');
const importCloseBtn = document.querySelector('.close.import-close');

// ===============================================
// 4. MODAL OPEN/CLOSE LOGIC
// ===============================================

// Open Create Book Modal
document.querySelector('.action.create').addEventListener('click', async () => {
  // Ensure Google client is ready and user is signed in to Google before showing modal
  if (!gapiClientReady) {
    alert("Initializing Google API. Please try again in a moment.");
    await initGoogleClient(); // Attempt to initialize if not ready
    return;
  }
  if (!googleAuthInstance.isSignedIn.get()) {
    try {
      await googleAuthInstance.signIn(); // Prompt for Google sign-in
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      alert("Failed to sign in to Google. Please allow popup.");
      return;
    }
  }
  createBookModal.style.display = 'block';
});

// Open Import Book Modal
document.querySelector('.action.import').addEventListener('click', async () => {
  // Ensure Google client is ready and user is signed in to Google before showing modal
  if (!gapiClientReady) {
    alert("Initializing Google API. Please try again in a moment.");
    await initGoogleClient(); // Attempt to initialize if not ready
    return;
  }
  if (!googleAuthInstance.isSignedIn.get()) {
    try {
      await googleAuthInstance.signIn(); // Prompt for Google sign-in
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      alert("Failed to sign in to Google. Please allow popup.");
      return;
    }
  }
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
// 5. LOAD BOOKS FUNCTIONALITY (UPDATED for Google Drive)
// ===============================================
async function loadBooks() {
  if (!auth.currentUser) {
    console.warn("No user signed in. Cannot load books.");
    return;
  }

  // Identify the static 'dual-action' box
  const dualActionBox = document.querySelector('.book-box.dual-action');

  // Clear all *other* book boxes from the grid, leaving the dual-action box intact
  // Iterate backwards to avoid issues with NodeList changing during removal
  for (let i = bookGrid.children.length - 1; i >= 0; i--) {
    const child = bookGrid.children[i];
    if (child !== dualActionBox) { // Ensure we DON'T remove the dual-action box
      bookGrid.removeChild(child);
    }
  }

  // Remove any previous "no books found" message
  const noBooksMsg = bookGrid.querySelector('.no-books-message');
  if (noBooksMsg) {
    bookGrid.removeChild(noBooksMsg);
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
      const msg = document.createElement('p');
      msg.className = 'no-books-message';
      msg.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; color: #555;'; // Inline style for quick fix
      msg.textContent = 'No books found. Click "Create Book" or "Import Book" to get started!';
      bookGrid.appendChild(msg);
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
  bookGrid.appendChild(bookBox);
}

// ===============================================
// 6. CREATE BOOK MODAL SUBMISSION (UPDATED for Google Drive)
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
    // Ensure user is signed in to Google
    if (!googleAuthInstance || !googleAuthInstance.isSignedIn.get()) {
      alert("Please sign in to your Google account first.");
      await googleAuthInstance.signIn(); // Prompt for Google sign-in
    }

    // Upload cover to Google Drive
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
      content: "",
      status: "draft"
    });

    createBookModal.style.display = 'none';
    document.getElementById('createBookForm').reset();
    window.location.href = `manuscript.html?bookId=${bookRef.id}`;

  } catch (error) {
    console.error("Error creating book:", error);
    alert(`Failed to create book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

// ===============================================
// 7. IMPORT BOOK MODAL SUBMISSION (UPDATED for Google Drive)
// ===============================================
document.getElementById('importBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('importTitle').value.trim();
  const manuscriptInput = document.getElementById('importFile');
  const coverInput = document.getElementById('importCover');

  const manuscriptFile = manuscriptInput.files[0];
  const coverFile = coverInput.files[0];

  if (!title || !manuscriptFile) {
    alert("Please provide a title and a manuscript file for import.");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Importing...';

  try {
    // Ensure user is signed in to Google
    if (!googleAuthInstance || !googleAuthInstance.isSignedIn.get()) {
      alert("Please sign in to your Google account first.");
      await googleAuthInstance.signIn(); // Prompt for Google sign-in
    }

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
      content: "",
      status: "draft"
    });

    importBookModal.style.display = 'none';
    document.getElementById('importBookForm').reset();
    loadBooks(); // Refresh the book grid to show the newly imported book
    alert("Book imported successfully! (Note: Manuscript content will be editable once parsing is implemented)");

  } catch (error) {
    console.error("Error importing book:", error);
    alert(`Failed to import book: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});


// ===============================================
// 8. INITIALIZATION (ON AUTH STATE CHANGED)
// ===============================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, initialize Google API client and load books
    try {
      await initGoogleClient(); // Initialize Google API client once Firebase user is authenticated
      await loadBooks(); // Load books after Firebase auth and Google API are ready
    } catch (e) {
      console.error("Initialization error:", e);
      alert("Failed to initialize required services. Please refresh or check console.");
    }
  } else {
    // User is signed out, redirect to admin login page
    window.location.href = 'admin.html';
  }
});
