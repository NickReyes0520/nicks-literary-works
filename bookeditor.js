import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  // your config here...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Example: Load books
async function loadBooks() {
  const querySnapshot = await getDocs(collection(db, "books"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    // Dynamically populate your book cards based on this data
  });
}
