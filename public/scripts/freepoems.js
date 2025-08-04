import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const poemList = document.getElementById("poem-list");

  const q = query(collection(db, "free_poems"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const poem = doc.data();
    const card = document.createElement("div");
    card.className = "poem-card";

    card.innerHTML = `
      <img src="${poem.thumbnailURL}" alt="Poem Thumbnail" />
      <h2>${poem.title}</h2>
      <p class="date">${new Date(poem.timestamp.seconds * 1000).toLocaleDateString()}</p>
    `;

    poemList.appendChild(card);
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.read-poem-btn');

  buttons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const content = document.getElementById(targetId);
      content.classList.toggle('show');
    });
  });
});
