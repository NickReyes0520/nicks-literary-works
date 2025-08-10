// bookeditor.js - Core Functionality
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, getDocs, 
  serverTimestamp, query, where 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth();

// DOM Elements
const bookGrid = document.querySelector('.book-grid');
const createBookModal = document.getElementById('createBookModal');
const importBookModal = document.getElementById('importBookModal');

// ========================
// 1. LOAD BOOKS (REALTIME)
// ========================
async function loadBooks() {
  const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));
  const querySnapshot = await getDocs(q);
  
  bookGrid.innerHTML = ''; // Clear existing books
  
  querySnapshot.forEach((doc) => {
    const book = doc.data();
    renderBook(book);
  });
}

function renderBook(book) {
  const bookBox = document.createElement('div');
  bookBox.className = 'book-box';
  bookBox.innerHTML = `
    <img src="${book.coverURL}" alt="${book.title}">
    <div class="overlay">
      <h2>${book.title}</h2>
      <div class="overlay-buttons">
        <button onclick="location.href='managebooks.html?bookId=${book.id}'">⚙️ Manage</button>
        <button onclick="location.href='manuscript.html?bookId=${book.id}'">✍🏻 Write</button>
      </div>
    </div>
  `;
  bookGrid.appendChild(bookBox);
}

// ========================
// 2. CREATE BOOK MODAL
// ========================
function setupCreateBookModal() {
  document.querySelector('.action.create').addEventListener('click', () => {
    createBookModal.style.display = 'block';
  });

  document.getElementById('createBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const coverFile = document.getElementById('bookCover').files[0];
    
    // Upload cover to Firebase Storage
    const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
    await uploadBytes(coverRef, coverFile);
    const coverURL = await getDownloadURL(coverRef);
    
    // Save to Firestore
    const bookRef = doc(collection(db, "books"));
    await setDoc(bookRef, {
      id: bookRef.id,
      title,
      coverURL,
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      content: "", // Initialize empty content
      status: "draft" // Default status
    });
    
    createBookModal.style.display = 'none';
    window.location.href = `manuscript.html?bookId=${bookRef.id}`; // AUTO-REDIRECT
  });
}

// ========================
// 3. IMPORT BOOK MODAL
// ========================
function setupImportBookModal() {
  document.querySelector('.action.import').addEventListener('click', () => {
    importBookModal.style.display = 'block';
  });

  document.getElementById('importBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('importTitle').value;
    const manuscriptFile = document.getElementById('importFile').files[0];
    const coverFile = document.getElementById('importCover').files[0];
    
    // Upload files
    const [coverURL, manuscriptURL] = await Promise.all([
      uploadFile(coverFile, `covers/${Date.now()}_${coverFile.name}`),
      uploadFile(manuscriptFile, `manuscripts/${Date.now()}_${manuscriptFile.name}`)
    ]);
    
    // Save to Firestore
    const bookRef = doc(collection(db, "books"));
    await setDoc(bookRef, {
      id: bookRef.id,
      title,
      coverURL,
      manuscriptURL,
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    
    importBookModal.style.display = 'none';
    loadBooks();
  });
}

async function uploadFile(file, path) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// ========================
// INITIALIZE
// ========================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadBooks();
    setupCreateBookModal();
    setupImportBookModal();
  } else {
    window.location.href = 'admin.html';
  }
});

