// bookeditor.js - Google Drive Integration for Nick's Literary Works (Unified Auth)

// =============================================== // 1. IMPORTS & CONFIGURATION // ===============================================
import { signInWithRedirect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
    authDomain: "nicks literary works 29a64.firebaseapp.com",
    projectId: "nicks literary works 29a64",
    storageBucket: "nicks literary works 29a64.appspot.com",
    messagingSenderId: "1030818110758",
    appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// Initialize Firebase once (modular version)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =============================================== // 2. AUTHENTICATION & GOOGLE DRIVE FUNCTIONS // ===============================================
const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');

/**
 * Initialize Google Drive API
 */
function initGoogleDrive() {
    return new Promise((resolve) => {
        gapi.load("client", () => {
            gapi.client.init({
                apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).then(resolve);
        });
    });
}

async function handleGoogleSignIn() {
    try {
        // This function is designed to return the Google Drive access token.
        // If the user is already authenticated with Firebase using Google,
        // signInWithPopup will often resolve immediately without showing a popup again,
        // or prompt for re-authentication if necessary, and it correctly returns
        // the UserCredential containing the Google access token for Drive scope.
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (!credential?.accessToken) {
            throw new Error("No access token received");
        }

        return credential.accessToken;

    } catch (error) {
        console.error("Google Sign In Error:", error);
        // Special handling for popup issues
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            // Implement fallback to redirect if popup fails
            await signInWithRedirect(auth, googleAuthProvider);
            return new Promise(() => {}); // Never resolves to block further execution
        }
        throw error;
    }
}

async function uploadToDrive(file, folderId = 'root') {
    try {
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
            throw new Error("Upload failed");
        }

        return response.json();

    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
}

// =============================================== // 3. BOOK MANAGEMENT FUNCTIONS // ===============================================
function getDriveThumbnailUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}`;
}

function renderBook(book) {
    const bookBox = document.createElement('div');
    bookBox.className = 'book-box';
    bookBox.innerHTML = `
        <img src="${book.coverDriveId ? getDriveThumbnailUrl(book.coverDriveId) : '/images/default-cover.png'}" alt="${book.title || 'Untitled Book'}">
        <div class="overlay">
            <h2>${book.title || 'Untitled Book'}</h2>
            <div class="overlay-buttons">
                <button class="manage-btn" data-bookid="${book.id}">⚙️ Manage</button>
                <button class="write-btn" data-bookid="${book.id}">✍🏻 Write</button>
            </div>
        </div>
    `;
    document.querySelector('.book-grid').appendChild(bookBox);
}

async function loadBooks() {
    const bookGrid = document.querySelector('.book-grid');
    const dualActionBox = document.querySelector('.book-box.dual-action');

    // Clear existing messages and books
    const existingMessages = bookGrid.querySelectorAll('.no-books-message');
    existingMessages.forEach(msg => msg.remove());

    // Clear all children except the dual-action box (important for dynamic updates)
    const children = Array.from(bookGrid.children);
    children.forEach(child => {
        if (child !== dualActionBox) {
            bookGrid.removeChild(child);
        }
    });

    if (!auth.currentUser) {
        // This message should only appear if user is NOT authenticated, but this block
        // is reached after the auth check in DOMContentLoaded and redirection.
        // It's mostly a safeguard or for initial load before auth check completes.
        const msg = document.createElement('p');
        msg.className = 'no-books-message';
        msg.textContent = 'Please sign in to view your books.';
        bookGrid.appendChild(msg);
        return;
    }

    try {
        const q = query(collection(db, "books"), where("authorId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const msg = document.createElement('p');
            msg.className = 'no-books-message';
            // Inline style for quick fix, as per your original file
            msg.style.cssText = 'width: 100%; text-align: center; margin-top: 50px; color: #555;';
            msg.textContent = 'No books found. Click "Create Book" or "Import Book" to get started!';
            bookGrid.appendChild(msg);
        } else {
            querySnapshot.forEach(doc => renderBook(doc.data()));
        }
    } catch (error) {
        console.error("Error loading books:", error);
        alert("Failed to load books. Please check console for details.");
    }
}

// =============================================== // 4. MODAL & FORM HANDLERS // ===============================================

// Global helper function for modal toggling
// Moved outside setupModals to be accessible by form handlers like handleCreateBook/handleImportBook
const toggleModal = (modalId, show) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = show ? 'block' : 'none';
};

function setupModals() {
    // Event delegation for book buttons (Manage, Write)
    document.querySelector('.book-grid').addEventListener('click', (e) => {
        if (e.target.closest('.manage-btn')) {
            const bookId = e.target.closest('.manage-btn').dataset.bookid;
            window.location.href = `managebooks.html?bookId=${bookId}`;
        } else if (e.target.closest('.write-btn')) {
            const bookId = e.target.closest('.write-btn').dataset.bookid;
            window.location.href = `manuscript.html?bookId=${bookId}`;
        }
    });

    // Button event listeners for Create/Import actions (to open modals)
    document.querySelector('.action.create')?.addEventListener('click', () => {
        toggleModal('createBookModal', true);
    });
    document.querySelector('.action.import')?.addEventListener('click', () => {
        toggleModal('importBookModal', true);
    });

    // Close buttons for modals
    document.querySelector('.create-close')?.addEventListener('click', () => toggleModal('createBookModal', false));
    document.querySelector('.import-close')?.addEventListener('click', () => toggleModal('importBookModal', false));

    // Form submissions
    document.getElementById('createBookForm')?.addEventListener('submit', handleCreateBook);
    document.getElementById('importBookForm')?.addEventListener('submit', handleImportBook);
}

async function handleCreateBook(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        const title = form.bookTitle.value.trim();
        const coverFile = form.bookCover.files[0];

        if (!title || !coverFile) {
            throw new Error("Title and cover image are required");
        }

        const coverResponse = await uploadToDrive(coverFile);
        const bookRef = doc(collection(db, "books"));

        await setDoc(bookRef, {
            id: bookRef.id,
            title: title,
            coverDriveId: coverResponse.id,
            authorId: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            content: "", // Initial empty content
            status: "draft"
        });

        toggleModal('createBookModal', false);
        form.reset();
        window.location.href = `manuscript.html?bookId=${bookRef.id}`;

    } catch (error) {
        console.error("Create Book Error:", error);
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleImportBook(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Importing...';

        const title = form.importTitle.value.trim();
        const manuscriptFile = form.importFile.files[0];
        const coverFile = form.importCover.files[0];

        if (!title || !manuscriptFile) {
            throw new Error("Title and manuscript file are required");
        }

        // Upload files to Google Drive in parallel
        const [manuscriptResponse, coverResponse] = await Promise.all([
            uploadToDrive(manuscriptFile),
            coverFile ? uploadToDrive(coverFile) : Promise.resolve({ id: '' }) // Handle optional cover
        ]);

        // Create book record in Firestore
        const bookRef = doc(collection(db, "books"));
        await setDoc(bookRef, {
            id: bookRef.id,
            title: title,
            coverDriveId: coverResponse.id,
            manuscriptDriveId: manuscriptResponse.id, // Store manuscript ID
            authorId: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            content: "", // Initial empty content
            status: "draft"
        });

        toggleModal('importBookModal', false);
        form.reset();
        loadBooks(); // Reload books to show the newly imported entry
        alert("Book imported successfully!");

    } catch (error) {
        console.error("Import Book Error:", error);
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// =============================================== // 5. INITIALIZATION // ===============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initGoogleDrive();

        onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user);
            const authStatusEl = document.getElementById('authStatus');

            if (user) {
                if (authStatusEl) {
                    authStatusEl.textContent = `Connected as ${user.email}`;
                    authStatusEl.style.color = 'green';
                }
                // Call setupModals and loadBooks ONLY after user is authenticated
                setupModals();
                loadBooks();
            } else {
                if (authStatusEl) {
                    authStatusEl.textContent = "Redirecting to login...";
                    authStatusEl.style.color = 'red';
                }
                // Redirect if not authenticated to the admin login page
                window.location.href = 'admin.html';
            }
        });

    } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to initialize application. Please check console for details.");
    }
});

// Make functions available for HTML onclick handlers (though event listeners are generally preferred)
window.renderBook = renderBook;
window.handleCreateBook = handleCreateBook;
window.handleImportBook = handleImportBook;
// Expose toggleModal globally too, in case any HTML element relies on it directly via onclick,
// though current usage is via JavaScript event listeners.
window.toggleModal = toggleModal;
