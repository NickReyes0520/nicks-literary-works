// management.js - Admin User Management Dashboard

// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut // Needed for potential sign-out if non-admin
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp // For timestamps on updates
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  deleteObject // For deleting associated avatar from storage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// --- Firebase Configuration ---
// IMPORTANT: This configuration must be identical across all your Firebase-enabled JS files
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
const navButtons = document.getElementById('nav-buttons'); // The container for navigation links


// --- Constants ---
const DEFAULT_AVATAR = '/images/default-photo.jpg'; // Path to your default avatar image


// --- ADMIN ACCESS CONTROL ---
// This listener runs whenever the user's authentication state changes (e.g., login, logout, page load)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // A user is logged in. Now, check if they are an admin.
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        // User is logged in AND their Firestore document has 'role: "admin"'
        console.log("Admin logged in. Loading user management dashboard.");
        loadAllUsers(); // Proceed to load users
      } else {
        // User is logged in but is NOT an admin
        alert("Access Denied: You must be an administrator to view this page. Redirecting to home.");
        await signOut(auth); // Sign them out of the admin portal
        window.location.href = 'index.html'; // Redirect non-admins
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      alert("An error occurred while verifying admin access. Redirecting to sign-in.");
      await signOut(auth);
      window.location.href = 'signin.html'; // Redirect on error
    }
  } else {
    // No user is logged in
    alert("Please sign in to access the admin portal. Redirecting to sign-in page.");
    window.location.href = 'signin.html'; // Redirect to sign-in page
  }
});


// --- LOAD AND DISPLAY USERS ---
async function loadAllUsers() {
  userGrid.innerHTML = '<h2>Loading users...</h2>'; // Show a loading message
  try {
    const usersCollectionRef = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollectionRef);

    if (userSnapshot.empty) {
      userGrid.innerHTML = '<h2>No registered users found.</h2>'; // Message if no users
      return;
    }

    userGrid.innerHTML = ''; // Clear the loading message
    userSnapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() }; // Get user data and their UID
      renderUserCard(userData); // Create and append a card for each user
    });

  } catch (error) {
    console.error("Error loading users:", error);
    userGrid.innerHTML = '<h2>Error loading users. Please try again.</h2>'; // Error message
  }
}

/**
 * Creates and appends a user card to the grid.
 * @param {object} userData - The user's data from Firestore.
 */
function renderUserCard(userData) {
  const userCard = document.createElement('div');
  userCard.className = 'user-card';
  userCard.dataset.userId = userData.id; // Store UID for easy access

  // Determine avatar source: first Firestore `avatarURL`, then Firebase Auth `photoURL`, then default
  const avatarSrc = userData.avatarURL || userData.photoURL || DEFAULT_AVATAR;
  // Determine display username: first Firestore `username` (e.g., @handle), then Firebase Auth email
  const usernameDisplay = userData.username || userData.email || 'N/A';
  // Combine first and last name for real name display
  const realNameDisplay = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

  userCard.innerHTML = `
    <img src="${avatarSrc}" alt="${usernameDisplay}'s avatar" />
    <div class="username">${usernameDisplay}</div>
    <div class="realname">${realNameDisplay || 'N/A'}</div>
  `;

  // Add click listener to open the detailed modal
  userCard.addEventListener('click', () => showUserDetailsModal(userData));
  userGrid.appendChild(userCard);
}


// --- USER DETAILS MODAL ---
/**
 * Populates and displays the modal with detailed user information.
 * @param {object} userData - The user's data from Firestore.
 */
function showUserDetailsModal(userData) {
  userDetailsDiv.innerHTML = ''; // Clear any previously displayed details

  // Safely get user data, providing 'N/A' defaults for missing fields
  const avatarSrc = userData.avatarURL || userData.photoURL || DEFAULT_AVATAR;
  const usernameDisplay = userData.username || userData.email || 'N/A';
  const realNameDisplay = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A';
  const emailDisplay = userData.email || 'N/A';
  const phoneDisplay = userData.phone || 'N/A';
  const genderDisplay = userData.gender || 'N/A';
  const birthdayDisplay = userData.birthday || 'N/A';
  const bioDisplay = userData.bio || 'N/A';
  const interestsDisplay = userData.interests && userData.interests.length > 0 ? userData.interests.join(', ') : 'None';
  // Convert Firebase Timestamp to a readable date string
  const createdAtDisplay = userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'N/A';
  // Determine user status (defaults to 'active' if not set)
  const statusDisplay = userData.status || 'active';

  // Construct the HTML for the modal content
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
      <!-- Example activity: <li>Purchased "Book Title" on YYYY-MM-DD</li> -->
      <li>No recent activities logged (placeholder)</li>
    </ul>

    <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
      <button id="blockUnblockBtn" class="admin-action-btn" style="
        padding: 0.75rem 1.5rem;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        background-color: ${userData.status === 'blocked' ? '#28a745' : '#ffc107'}; /* Green for unblock, yellow for block */
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
        background-color: #dc3545; /* Red for delete */
        color: white;
      ">Delete User Data</button>
    </div>
    <p style="text-align: center; font-size: 0.8rem; color: #888; margin-top: 1rem;">
      Note: Blocking prevents sign-in. "Delete User Data" removes their Firestore document and associated avatar, but does NOT delete their Firebase Authentication account. For full deletion, you need a Firebase Cloud Function.
    </p>
  `;

  // Add event listeners for the new buttons within the modal
  document.getElementById('blockUnblockBtn').addEventListener('click', () => {
    const newStatus = userData.status === 'blocked' ? 'active' : 'blocked';
    updateUserStatus(userData.id, newStatus);
  });
  document.getElementById('deleteUserBtn').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete all data for ${usernameDisplay}? This cannot be undone!`)) {
      deleteUserData(userData.id, userData.avatarURL); // Pass avatarURL for storage deletion
    }
  });

  userModal.style.display = 'block'; // Show the modal
}

// --- Modal Close Listeners ---
// Closes the modal when the 'x' button is clicked
closeModalBtn.addEventListener('click', () => {
  userModal.style.display = 'none';
});

// Closes the modal when clicking outside of its content
window.addEventListener('click', (event) => {
  if (event.target === userModal) {
    userModal.style.display = 'none';
  }
});


// --- ADMIN ACTIONS ---

/**
 * Updates a user's status (e.g., 'active' or 'blocked') in Firestore.
 * @param {string} userId - The UID of the user to update.
 * @param {string} newStatus - The new status to set ('active' or 'blocked').
 */
async function updateUserStatus(userId, newStatus) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp() // Add a timestamp for the last update
    });
    alert(`User ${userId} status updated to: ${newStatus}`);
    userModal.style.display = 'none'; // Close the modal after action
    loadAllUsers(); // Refresh the user list to reflect changes
  } catch (error) {
    console.error("Error updating user status:", error);
    alert(`Failed to update user status: ${error.message}`);
  }
}

/**
 * Deletes a user's data document from Firestore and their avatar from Storage.
 * This is a "soft delete" as it does NOT delete the user from Firebase Authentication.
 * @param {string} userId - The UID of the user to delete.
 * @param {string} avatarURL - The URL of the user's avatar to delete from Storage (optional).
 */
async function deleteUserData(userId, avatarURL) {
  try {
    // Delete user document from Firestore
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // If an avatar exists, attempt to delete it from Firebase Storage
    if (avatarURL && avatarURL.startsWith('https://firebasestorage.googleapis.com/')) {
      try {
        const fileRef = storageRef(storage, avatarURL);
        await deleteObject(fileRef);
        console.log(`Successfully deleted avatar for user ${userId}`);
      } catch (storageError) {
        // Log storage deletion error, but don't prevent Firestore deletion if avatar not found
        console.warn(`Could not delete avatar for user ${userId}:`, storageError);
      }
    }

    alert(`User data for ${userId} successfully deleted from Firestore (and avatar if present).`);
    userModal.style.display = 'none'; // Close modal
    loadAllUsers(); // Refresh the user list
  } catch (error) {
    console.error("Error deleting user data:", error);
    alert(`Failed to delete user data: ${error.message}`);
  }
}


// --- OPTIONAL: Navigation Highlight ---
// Ensures the "User Management" button remains active when on this page
document.addEventListener('DOMContentLoaded', () => {
  const userManagementLink = navButtons.querySelector('a[href="#"]'); // Find the link with href="#"
  if (userManagementLink) {
    // Remove 'active' class from all other nav links
    Array.from(navButtons.children).forEach(link => {
      link.classList.remove('active');
    });
    // Add 'active' class to the User Management link
    userManagementLink.classList.add('active');
  }
});