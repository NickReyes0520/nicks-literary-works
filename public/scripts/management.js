// management.js - Admin User Management Dashboard with Idle Timeout

// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.appspot.com",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// --- DOM Elements ---
const userGrid = document.getElementById('userGrid');
const userModal = document.getElementById('userModal');
const closeModalBtn = document.getElementById('closeModal');
const userDetailsDiv = document.getElementById('userDetails');
const navButtons = document.getElementById('nav-buttons');


// --- Constants ---
const DEFAULT_AVATAR = '/images/default-photo.jpg';
const IDLE_TIMEOUT_MINUTES = 3; // 3 minutes as requested
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;


// --- Idle Timeout Variables ---
let idleTimeout; // Holds the timeout ID


// --- Helper Function: Sign Out ---
/**
 * Handles signing out the admin user and redirecting.
 */
async function adminSignOut() {
  clearTimeout(idleTimeout); // Clear any pending timeout
  try {
    await signOut(auth);
    console.log("Admin signed out due to inactivity or explicit action.");
    alert("You have been signed out due to inactivity or explicit action.");
    window.location.href = 'index.html'; // Redirect to home page after sign out
  } catch (error) {
    console.error("Error signing out admin:", error);
    alert("Failed to sign out. Please try again.");
  }
}

// --- Helper Function: Idle Timer Management ---
/**
 * Starts the idle timer. If the timer runs out, the admin will be signed out.
 */
function startIdleTimer() {
  clearTimeout(idleTimeout); // Clear any existing timer before starting a new one
  idleTimeout = setTimeout(() => {
    adminSignOut();
  }, IDLE_TIMEOUT_MS);
  console.log(`Idle timer started for ${IDLE_TIMEOUT_MINUTES} minutes.`);
}

/**
 * Resets the idle timer. Call this on any user activity.
 */
function resetIdleTimer() {
  startIdleTimer(); // Restart the timer
}


// --- ADMIN ACCESS CONTROL ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        console.log("Admin logged in. Loading user management dashboard.");
        loadAllUsers();
        startIdleTimer(); // Start the idle timer once admin is confirmed

        // Attach activity listeners to the document
        // Any click, mouse movement, or key press will reset the idle timer
        document.addEventListener('click', resetIdleTimer);
        document.addEventListener('mousemove', resetIdleTimer);
        document.addEventListener('keydown', resetIdleTimer);

      } else {
        alert("Access Denied: You must be an administrator to view this page. Redirecting to home.");
        await signOut(auth);
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      alert("An error occurred while verifying admin access. Redirecting to sign-in.");
      await signOut(auth);
      window.location.href = 'signin.html';
    }
  } else {
    alert("Please sign in to access the admin portal. Redirecting to sign-in page.");
    window.location.href = 'signin.html';
  }
});


// --- LOAD AND DISPLAY USERS ---
async function loadAllUsers() {
  userGrid.innerHTML = '<h2>Loading users...</h2>';
  try {
    const usersCollectionRef = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollectionRef);

    if (userSnapshot.empty) {
      userGrid.innerHTML = '<h2>No registered users found.</h2>';
      return;
    }

    userGrid.innerHTML = '';
    userSnapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() };
      renderUserCard(userData);
    });

  } catch (error) {
    console.error("Error loading users:", error);
    userGrid.innerHTML = '<h2>Error loading users. Please try again.</h2>';
  }
}

function renderUserCard(userData) {
  const userCard = document.createElement('div');
  userCard.className = 'user-card';
  userCard.dataset.userId = userData.id;

  const avatarSrc = userData.avatarURL || userData.photoURL || DEFAULT_AVATAR;
  const usernameDisplay = userData.username || userData.email || 'N/A';
  const realNameDisplay = userData.fullName || 'N/A'; // ✅ Updated line

  userCard.innerHTML = `
    <img src="${avatarSrc}" alt="${usernameDisplay}'s avatar" />
    <div class="username">${usernameDisplay}</div>
    <div class="realname">${realNameDisplay}</div>
  `;

  userCard.addEventListener('click', () => showUserDetailsModal(userData));
  userGrid.appendChild(userCard);
}


// --- USER DETAILS MODAL ---
function showUserDetailsModal(userData) {
  userDetailsDiv.innerHTML = '';
  const avatarSrc = userData.avatarURL || userData.photoURL || DEFAULT_AVATAR;
  const usernameDisplay = userData.username || userData.email || 'N/A';
  const realNameDisplay = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A';
  const emailDisplay = userData.email || 'N/A';
  const phoneDisplay = userData.phone || 'N/A';
  const genderDisplay = userData.gender || 'N/A';
  const birthdayDisplay = userData.birthday || 'N/A';
  const bioDisplay = userData.bio || 'N/A';
  const interestsDisplay = userData.interests && userData.interests.length > 0 ? userData.interests.join(', ') : 'None';
  const createdAtDisplay = userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'N/A';
  const statusDisplay = userData.status || 'active';

  userDetailsDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <img src="${avatarSrc}" alt="${usernameDisplay}'s avatar" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #ce7e00;" />
      <h3 style="margin-top: 0.5rem; margin-bottom: 0.25rem;">${usernameDisplay}</h3>
      <p style="color: #666; font-size: 0.9rem;">${realNameDisplay}</p>
    </div>

    <p><strong>Email:</strong> ${emailDisplay}</p>
    <p><strong>Phone:</strong> ${phoneDisplay}</p>
    <p><strong>Gender:</strong> ${genderDisplay}</p>
    <p><strong>Birthday:</strong> ${birthdayDisplay}</p>
    <p>
      <strong>Status:</strong>
      <span style="font-weight: bold; color: ${statusDisplay === 'blocked' ? 'red' : 'green'};">
        ${statusDisplay.toUpperCase()}
      </span>
    </p>
    <p><strong>Bio:</strong> ${bioDisplay}</p>
    <p><strong>Interests:</strong> ${interestsDisplay}</p>
    <p><strong>Joined:</strong> ${createdAtDisplay}</p>

    <h4>Recent Activities (Placeholder)</h4>
    <p style="color: #888;">
      *Activity tracking needs to be implemented elsewhere in your site (e.g., logging book purchases, page visits to Firestore).
      This section would then display those logged events for this user.
    </p>
    <ul style="list-style-type: none; padding-left: 0; margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
      <li>No recent activities logged (placeholder)</li>
    </ul>

    <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
      <button id="blockUnblockBtn" class="admin-action-btn" style="
        padding: 0.75rem 1.5rem;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        background-color: ${userData.status === 'blocked' ? '#28a745' : '#ffc107'};
        color: ${userData.status === 'blocked' ? 'white' : '#333'};
      ">
        ${userData.status === 'blocked' ? 'Unblock User' : 'Block User'}
      </button>
      <button id="deleteUserBtn" class="admin-action-btn" style="
        padding: 0.75rem 1.5rem;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        background-color: #dc3545;
        color: white;
      ">Delete User Data</button>
    </div>
    <p style="text-align: center; font-size: 0.8rem; color: #888; margin-top: 1rem;">
      Note: Blocking prevents sign-in. "Delete User Data" removes their Firestore document and associated avatar, but does NOT delete their Firebase Authentication account. For full deletion, you need a Firebase Cloud Function.
    </p>
  `;

  document.getElementById('blockUnblockBtn').addEventListener('click', () => {
    const newStatus = userData.status === 'blocked' ? 'active' : 'blocked';
    updateUserStatus(userData.id, newStatus);
  });
  document.getElementById('deleteUserBtn').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete all data for ${usernameDisplay}? This cannot be undone!`)) {
      deleteUserData(userData.id, userData.avatarURL);
    }
  });

  userModal.style.display = 'block';
}

// Close Modal Listeners
closeModalBtn.addEventListener('click', () => {
  userModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === userModal) {
    userModal.style.display = 'none';
  }
});


// --- ADMIN ACTIONS ---
async function updateUserStatus(userId, newStatus) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    alert(`User ${userId} status updated to: ${newStatus}`);
    userModal.style.display = 'none';
    loadAllUsers();
  } catch (error) {
    console.error("Error updating user status:", error);
    alert(`Failed to update user status: ${error.message}`);
  }
}

async function deleteUserData(userId, avatarURL) {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    if (avatarURL && avatarURL.startsWith('https://firebasestorage.googleapis.com/')) {
      try {
        const fileRef = storageRef(storage, avatarURL);
        await deleteObject(fileRef);
        console.log(`Successfully deleted avatar for user ${userId}`);
      } catch (storageError) {
        console.warn(`Could not delete avatar for user ${userId}:`, storageError);
      }
    }

    alert(`User data for ${userId} successfully deleted from Firestore (and avatar if present).`);
    userModal.style.display = 'none';
    loadAllUsers();
  } catch (error) {
    console.error("Error deleting user data:", error);
    alert(`Failed to delete user data: ${error.message}`);
  }
}

// --- OPTIONAL: Navigation Highlight ---
document.addEventListener('DOMContentLoaded', () => {
  const userManagementLink = navButtons.querySelector('a[href="#"]');
  if (userManagementLink) {
    Array.from(navButtons.children).forEach(link => {
      link.classList.remove('active');
    });
    userManagementLink.classList.add('active');
  }
});
