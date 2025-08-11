// bookeditor.js - Google Drive Integration for Nick's Literary Works

// ===============================================
// 1. IMPORTS & CONFIGURATION
// ===============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Drive Configuration
const GOOGLE_API_KEY = "AIzaSyBT9JEi6PvroCcBSZpfL4ozqKZ9g83lDB0";
const GOOGLE_CLIENT_ID = "832365472915-ktjj2o7o2cafgi609e8l4fg0bbku62kj.apps.googleusercontent.com";
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let gapiClientReady = false;
let googleAuthInstance = null;

// ===============================================
// 2. GOOGLE DRIVE FUNCTIONS
// ===============================================
async function initGoogleClient() {
  try {
    if (typeof gapi === 'undefined') {
      throw new Error("Google API client not loaded");
    }

    await gapi.load('client:auth2', async () => {
      await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: GOOGLE_DRIVE_SCOPE
      });
      
      googleAuthInstance = gapi.auth2.getAuthInstance();
      gapiClientReady = true;
      console.log("Google API initialized");
      console.log("Google Auth Instance:", googleAuthInstance);
      console.log("Sign-In Status:", googleAuthInstance.isSignedIn.get());
    });
  } catch (error) {
    console.error("Google API init error:", error);
    throw error;
  }
}

async function uploadToDrive(file, folderId = 'root') {
  if (!gapiClientReady || !googleAuthInstance?.isSignedIn.get()) {
    throw new Error("Google Drive not ready");
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
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Drive upload failed");
  }

  return response.json();
}

function getDriveThumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
}

// ===============================================
// 3. BOOK MANAGEMENT FUNCTIONS
// ===============================================
async function loadBooks() {
  const bookGrid = document.querySelector('.book-grid');
  const dualActionBox = document.querySelector('.book-box.dual-action');
  
  // Clear existing books (except dual-action box)
  Array.from(bookGrid.children).forEach(child => {
    if (child !== dualActionBox) bookGrid.removeChild(child);
  });

  // Remove any existing "no books" message
  const existingMsg = bookGrid.querySelector('.no-books-message');
  if (existingMsg) bookGrid.removeChild(existingMsg);

  if (!auth.currentUser) return;

  try {
    const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const msg = document.createElement('p');
      msg.className = 'no-books-message';
      msg.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; color: #555;';
      msg.textContent = 'No books found. Click "Create Book" or "Import Book" to get started!';
      bookGrid.appendChild(msg);
    } else {
      querySnapshot.forEach(doc => renderBook(doc.data()));
    }
  } catch (error) {
    console.error("Load books error:", error);
    alert("Failed to load books. Please check console.");
  }
}

function renderBook(book) {
  const bookBox = document.createElement('div');
  bookBox.className = 'book-box';
  bookBox.innerHTML = `
    <img src="${book.coverDriveId ? getDriveThumbnailUrl(book.coverDriveId) : '/images/default-cover.png'}" alt="${book.title || 'Untitled'}">
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
// 4. MODAL HANDLERS
// ===============================================
function setupModals() {
  // Create Book Modal
  document.querySelector('.action.create').addEventListener('click', async () => {
    try {
      if (!gapiClientReady) await initGoogleClient();
      if (!googleAuthInstance.isSignedIn.get()) await googleAuthInstance.signIn();
      document.getElementById('createBookModal').style.display = 'block';
    } catch (error) {
      console.error("Create book error:", error);
      alert("Google sign-in required");
    }
  });

  // Import Book Modal
  document.querySelector('.action.import').addEventListener('click', async () => {
    try {
      if (!gapiClientReady) await initGoogleClient();
      if (!googleAuthInstance.isSignedIn.get()) await googleAuthInstance.signIn();
      document.getElementById('importBookModal').style.display = 'block';
    } catch (error) {
      console.error("Import book error:", error);
      alert("Google sign-in required");
    }
  });

  // Form Submissions
  document.getElementById('createBookForm').addEventListener('submit', handleCreateBook);
  document.getElementById('importBookForm').addEventListener('submit', handleImportBook);
}

async function handleCreateBook(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    const title = form.bookTitle.value.trim();
    const coverFile = form.bookCover.files[0];
    if (!title || !coverFile) throw new Error("Title and cover required");

    const coverResponse = await uploadToDrive(coverFile);
    const bookRef = doc(collection(db, "books"));
    
    await setDoc(bookRef, {
      id: bookRef.id,
      title,
      coverDriveId: coverResponse.id,
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "",
      status: "draft"
    });

    form.reset();
    window.location.href = `manuscript.html?bookId=${bookRef.id}`;
  } catch (error) {
    console.error("Create error:", error);
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Book';
  }
}

async function handleImportBook(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Importing...';
    
    const title = form.importTitle.value.trim();
    const manuscriptFile = form.importFile.files[0];
    if (!title || !manuscriptFile) throw new Error("Title and manuscript required");

    const manuscriptResponse = await uploadToDrive(manuscriptFile);
    const bookRef = doc(collection(db, "books"));
    const bookData = {
      id: bookRef.id,
      title,
      manuscriptDriveId: manuscriptResponse.id,
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "",
      status: "draft"
    };

    // Optional cover upload
    if (form.importCover.files[0]) {
      const coverResponse = await uploadToDrive(form.importCover.files[0]);
      bookData.coverDriveId = coverResponse.id;
    }

    await setDoc(bookRef, bookData);
    form.reset();
    loadBooks();
    alert("Book imported successfully!");
  } catch (error) {
    console.error("Import error:", error);
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Import Book';
  }
}

// ===============================================
// 5. INITIALIZATION
// ===============================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await initGoogleClient();
      setupModals();
      loadBooks();
    } catch (error) {
      console.error("Initialization error:", error);
    }
  } else {
    window.location.href = 'admin.html';
  }
});
