document.addEventListener('DOMContentLoaded', () => {
  const editorBtn = document.getElementById('editorBtn');
  const bookEditor = document.getElementById('bookEditor');

  editorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bookEditor.style.display = 'block';
  });

  const commands = [
    { label: 'Bold', command: 'bold' },
    { label: 'Italic', command: 'italic' },
    { label: 'Underline', command: 'underline' },
    { label: 'Heading 1', command: 'formatBlock', value: 'H1' },
    { label: 'Heading 2', command: 'formatBlock', value: 'H2' },
    { label: 'Paragraph', command: 'formatBlock', value: 'P' },
    { label: 'Insert Image', command: 'insertImage', prompt: true },
  ];

  const controls = document.getElementById('editorControls');

  const saveBtn = document.createElement('button');
saveBtn.textContent = '💾 Save Now';
saveBtn.addEventListener('click', async () => {
  try {
    await setDoc(bookDocRef, {
      content: editor.innerHTML,
      updatedAt: new Date(),
    });
    alert('✅ Draft saved!');
  } catch (err) {
    alert('❌ Save failed: ' + err.message);
  }
});
controls.appendChild(saveBtn);
  
  const editor = document.getElementById('editor');

  commands.forEach(ctrl => {
    const btn = document.createElement('button');
    btn.textContent = ctrl.label;
    btn.addEventListener('click', () => {
      if (ctrl.prompt) {
        const url = prompt('Enter image URL:');
        if (url) document.execCommand(ctrl.command, false, url);
      } else {
        document.execCommand(ctrl.command, false, ctrl.value || null);
      }
    });
    controls.appendChild(btn);
  });
});

import { db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const editor = document.getElementById('editor');
const editorBtn = document.getElementById('editorBtn');
const bookEditor = document.getElementById('bookEditor');

// For now we’ll use a fixed book ID (later make this dynamic)
const bookDocRef = doc(db, 'books', 'my-first-book');

// 🔄 Auto-load when editor opens
editorBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  bookEditor.style.display = 'block';

  try {
    const snap = await getDoc(bookDocRef);
    if (snap.exists()) {
      editor.innerHTML = snap.data().content;
      console.log('✅ Loaded draft from Firebase');
    } else {
      console.log('📄 New draft – no content yet.');
    }
  } catch (err) {
    console.error('❌ Error loading:', err);
  }
});

// 💾 Auto-save every 2 seconds (you can change to manual later)
let saveTimeout;
editor.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(bookDocRef, {
        content: editor.innerHTML,
        updatedAt: new Date(),
      });
      console.log('💾 Auto-saved to Firebase');
    } catch (err) {
      console.error('❌ Save failed:', err);
    }
  }, 2000);
});
