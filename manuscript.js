// manuscript.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVhLP24BL4mibJhLuK5H8S4UIyc6SnbkM",
  authDomain: "nicks-literary-works-29a64.firebaseapp.com",
  projectId: "nicks-literary-works-29a64",
  storageBucket: "nicks-literary-works-29a64.firebasestorage.app",
  messagingSenderId: "1030818110758",
  appId: "1:1030818110758:web:6a47c5af6d6cba8b9635e7"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Get bookId from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('bookId');

if (!bookId) {
  alert("No book ID provided!");
}

// ✅ Initialize Quill
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: '#toolbar'
  }
});

// ✅ Firestore reference
const docRef = doc(db, "books", bookId);

// ✅ Load existing content
async function loadContent() {
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.content) {
      quill.root.innerHTML = data.content;
    }
  } else {
    // Create new entry if not exists
    await setDoc(docRef, {
      title: "Untitled Book",
      content: "",
      updatedAt: serverTimestamp()
    });
  }
}
loadContent();

// ✅ Real-time sync from Firestore
onSnapshot(docRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data.content !== quill.root.innerHTML) {
      quill.root.innerHTML = data.content;
    }
  }
});

// ✅ Auto-save on text change
quill.on('text-change', () => {
  setDoc(docRef, {
    content: quill.root.innerHTML,
    updatedAt: serverTimestamp()
  }, { merge: true });
});

console.log("Auto-save enabled for book ID:", bookId);
