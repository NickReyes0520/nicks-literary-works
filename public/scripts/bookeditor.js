// bookeditor.js

// --- 1. Firebase Initialization and Authentication ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

const appId = 'nicks-literary-works-29a64';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;
let googleAccessToken = null;

// --- 2. Firebase Authentication ---
onAuthStateChanged(auth, async (user) => {
  const authStatusDiv = document.getElementById('authStatus');
  if (user) {
    userId = user.uid;
    authStatusDiv.textContent = `Authenticated with Firebase as: ${userId}`;
    authStatusDiv.classList.add('auth-status-styled');
    console.log(`User authenticated with ID: ${userId}`);
    listenForBooks();
  } else {
    try {
      await signInAnonymously(auth);
      console.log("Signed in anonymously with Firebase.");
    } catch (error) {
      console.error("Firebase Authentication failed:", error);
      authStatusDiv.textContent = `Firebase Authentication failed: ${error.message}`;
    }
  }
});

// --- 3. Google Identity Services Setup ---
window.onload = () => {
  google.accounts.id.initialize({
    client_id: "1030818110758-ivtvih92p8i4odf8bngo5om2nofid2f5.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("googleAuthStatus"),
    { theme: "filled_blue", size: "large", shape: "pill", text: "signin_with" }
  );
};

function handleCredentialResponse(response) {
  console.log("Google ID token received:", response.credential);
  // Exchange token for access token via OAuth2 flow if needed
  // For simplicity, assume access token is retrieved elsewhere
  googleAccessToken = response.credential; // Placeholder
}

// --- 4. DOM Elements and Event Listeners ---
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');
const bookGrid = document.querySelector('.book-grid');

const googleAuthStatus = document.createElement('div');
googleAuthStatus.id = 'googleAuthStatus';
googleAuthStatus.style.cssText = `width: 100%; text-align: center; margin-top: 50px;`;
document.querySelector('main').prepend(googleAuthStatus);

const style = document.createElement('style');
style.innerHTML = `
  header { border-bottom: none !important; }
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

document.querySelector('.action.create').addEventListener('click', () => {
  createBookModal.style.display = 'block';
});
document.querySelector('.close.create-close').addEventListener('click', () => {
  createBookModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === createBookModal) createBookModal.style.display = 'none';
});

document.querySelector('.action.import').addEventListener('click', () => {
  importBookModal.style.display = 'block';
});
document.querySelector('.close.import-close').addEventListener('click', () => {
  importBookModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === importBookModal) importBookModal.style.display = 'none';
});

// --- 5. Firestore Book Listener ---
function listenForBooks() {
  if (!userId) return console.warn("User ID not available yet.");
  const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
  onSnapshot(booksCollectionRef, (snapshot) => {
    const books = [];
    snapshot.forEach((doc) => books.push({ id: doc.id, ...doc.data() }));
    renderBooks(books);
  }, (error) => console.error("Error fetching books:", error));
}

function renderBooks(books) {
  const bookElements = bookGrid.querySelectorAll('.book-box:not(.dual-action)');
  bookElements.forEach(el => el.remove());
  const noBooksMessage = document.getElementById('no-books-message');
  if (noBooksMessage) noBooksMessage.remove();

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

// --- 6. Google Drive File Upload ---
async function uploadFile(file) {
  if (!file || !googleAccessToken) {
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
      headers: new Headers({ 'Authorization': 'Bearer ' + googleAccessToken }),
      body: form
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('File uploaded to Google Drive:', data);
    return `https://drive.google.com/uc?export=download&id=${data.id}`;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
}

// --- 7. Form Submission Handlers ---
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
    let coverUrl = null;
    if (bookCoverFile) coverUrl = await uploadFile(bookCoverFile);

    const booksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/books`);
    await addDoc(booksCollectionRef, {
      title: bookTitle,
      coverUrl: coverUrl,
      createdAt: new Date()
    });

    createBookModal.style.display = 'none';
    form.reset();
  } catch (error) {
    console.error("Error creating book:", error);
    errorMessage.textContent = "Failed to create book. Please try again.";
    errorMessage
