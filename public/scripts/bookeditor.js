// bookeditor.js

// --- 1. Firebase Initialization and Authentication ---
// We use the provided Firebase configuration directly for local testing.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase configuration, taken directly from your provided details.
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// The app ID for the collection path.
const appId = 'nicks-literary-works-29a64';

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
    // Apply styling to the auth status message
    authStatusDiv.textContent = `Authenticated with Firebase as: ${userId}`;
    authStatusDiv.classList.add('auth-status-styled'); // Add the new class for styling
    console.log(`User authenticated with ID: ${userId}`);

    // Once authenticated with Firebase, listen for book data and initialize Google API
    listenForBooks();
    initGoogleClient();

  } else {
    // No user is signed in. Sign in anonymously since this is a local environment.
    try {
      await signInAnonymously(auth);
      console.log("Signed in anonymously with Firebase.");
    } catch (error) {
      console.error("Firebase Authentication failed:", error);
      authStatusDiv.textContent = `Firebase Authentication failed: ${error.message}`;
    }
  }
});

// --- 2. Google API Client and Sign-In for Google Drive ---
const API_KEY = "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM"; // Your API key
const CLIENT_ID = "1030818110758-ivtvih92p8i4odf8bngo5om2nofid2f5.apps.googleusercontent.com"; // Your client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; // Scope for creating files

let gapiInited = false;
let gisInited = false;

// Loads the Google API client library
function initGoogleClient() {
  gapi.load('client', initializeGapiClient);
  gapi.load('auth2', initializeGisClient); // Use auth2 for older GAPI sign-in

  function initializeGapiClient() {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(() => {
      gapiInited = true;
      console.log("Google API client initialized.");
      checkAndRenderBooks();
    }).catch(error => {
      console.error("Error initializing Google API client:", error);
    });
  }

  function initializeGisClient() {
    const auth2 = gapi.auth2.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
    });
    auth2.then(() => {
      gisInited = true;
      console.log("Google Auth client initialized.");
      checkAndRenderBooks();
    });
  }
}

// Function to handle Google Sign-In
async function handleAuthClick() {
  console.log("Attempting to sign in with Google...");
  if (gapi.auth2.getAuthInstance()) {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      if (user.isSignedIn()) {
        console.log("Successfully signed in with Google Drive.");
        const googleAuthStatus = document.getElementById('googleAuthStatus');
        if (googleAuthStatus) {
            googleAuthStatus.style.display = 'none';
        }
      }
    } catch (error) {
      console.error("Google Sign-In failed:", error);
    }
  } else {
    console.error("Google Auth client not initialized.");
  }
}

// Check if all clients are ready before trying to render books and add listeners
function checkAndRenderBooks() {
  if (gapiInited && gisInited && userId) {
    const googleAuthStatus = document.getElementById('googleAuthStatus');
    if (googleAuthStatus) {
      if (gapi.auth2.getAuthInstance().isSignedIn().get()) {
        console.log("User is already signed in with Google. Hiding the button.");
        googleAuthStatus.style.display = 'none';
      } else {
        console.log("Google Auth is ready. Attaching click listener to button.");
        googleAuthStatus.style.display = 'block';
        const signInButton = googleAuthStatus.querySelector('button');
        if (signInButton) {
            // New: Attach the click listener here, only when gapi is ready
            signInButton.removeEventListener('click', handleAuthClick); // Prevent duplicate listeners
            signInButton.addEventListener('click', handleAuthClick);
        }
      }
    }
  }
}

// --- 3. DOM Elements and Event Listeners ---
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');
const bookGrid = document.querySelector('.book-grid');

// Add a button for Google Sign-In
const googleAuthStatus = document.createElement('div');
googleAuthStatus.id = 'googleAuthStatus';
googleAuthStatus.innerHTML = `
    <button class="google-sign-in-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-google">
        <path d="M12 10.9v2.8h7.9c-.4 2.8-2.6 4.9-5.9 4.9-3.5 0-6.4-2.8-6.4-6.4s2.8-6.4 6.4-6.4c1.9 0 3.5.7 4.8 1.9l2.1-2.1c-1.6-1.5-3.6-2.4-5.9-2.4-5.2 0-9.4 4.2-9.4 9.4s4.2 9.4 9.4 9.4c5.3 0 9.2-3.8 9.2-9.2 0-.6-.1-1.2-.2-1.7h-9z"/>
      </svg>
      Sign in with Google Drive
    </button>
`;
googleAuthStatus.style.cssText = `
  width: 100%; 
  text-align: center; 
  margin-top: 50px;
`;
document.querySelector('main').prepend(googleAuthStatus);

// Create some custom styles for the buttons and text
const style = document.createElement('style');
style.innerHTML = `
  /* Remove header border */
  header {
    border-bottom: none !important;
  }
  
  /* Style for the Google Sign-in Button */
  .google-sign-in-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-image: linear-gradient(to right, #4285F4, #33A852);
    color: #ffffff;
    font-weight: 600;
    border-radius: 9999px; /* This creates a pill shape */
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  }
  .google-sign-in-btn:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }

  /* Style for the authenticated status text */
  .auth-status-styled {
    font-size: 0.9em;
    font-style: italic;
    color: #555;
    text-align: center;
    margin: 10px 0;
    padding: 5px 0;
  }
`;
document.head.appendChild(style);

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

// --- 4. Firestore Data Management ---
function listenForBooks() {
  if (!userId) {
    console.warn("User ID is not available yet. Skipping Firestore listener.");
    return;
  }
  
  const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
  
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
  const bookElements = bookGrid.querySelectorAll('.book-box:not(.dual-action)');
  bookElements.forEach(el => el.remove());

  const noBooksMessage = document.getElementById('no-books-message');
  if (noBooksMessage) {
    noBooksMessage.remove();
  }
  
  if (books.length === 0) {
    const message = document.createElement('div');
    message.id = 'no-books-message';
    message.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; font-size: 1.2rem; color: #666;';
    message.textContent = "No books found. Click 'Create Book' or 'Import Book' to get started!";
    bookGrid.appendChild(message);
  } else {
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

// --- 5. File Upload Functionality using Google Drive API ---
async function uploadFile(file) {
  if (!file || !gapi.auth2.getAuthInstance().isSignedIn().get()) {
    console.error("Google Drive not authenticated.");
    return null;
  }
  
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token }),
      body: form
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('File uploaded to Google Drive:', data);
    
    // The Google Drive API returns a file ID, not a direct URL. We can use
    // a placeholder URL with the file ID to retrieve the file later.
    return `https://drive.google.com/uc?export=download&id=${data.id}`;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
}

// --- 6. Form Submission Handlers ---

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

    // Upload the book cover file
    let coverUrl = null;
    if (bookCoverFile) {
      coverUrl = await uploadFile(bookCoverFile);
    }
    
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

    // Upload manuscript and cover
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
