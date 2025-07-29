// account.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

const registerForm = document.getElementById("register-form");
const googleBtn = document.getElementById("googleSignIn");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = registerForm["firstName"].value;
  const lastName = registerForm["lastName"].value;
  const username = registerForm["username"].value;
  const email = registerForm["email"].value;
  const phone = registerForm["phone"].value;
  const password = registerForm["password"].value;
  const gender = registerForm["gender"].value;
  const birthday = registerForm["birthday"].value;

  const avatarFile = registerForm["avatar"].files[0];

  const interests = [...registerForm.querySelectorAll("input[name='interests']:checked")].map(el => el.value);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    let avatarURL = "";
    if (avatarFile) {
      const avatarRef = storageRef(storage, `avatars/${user.uid}/${avatarFile.name}`);
      await uploadBytes(avatarRef, avatarFile);
      avatarURL = await getDownloadURL(avatarRef);
    }

    // Update displayName with @username
    await updateProfile(user, {
      displayName: `@${username}`,
      photoURL: avatarURL
    });

    // Save extra data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      username: `@${username}`,
      email,
      phone,
      gender,
      birthday,
      avatar: avatarURL,
      interests,
      createdAt: new Date()
    });

    alert("Registration successful! Please verify your email before signing in.");
    registerForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

// Google Sign-In Handler
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const username = prompt("Choose a username (@handle):");
      const gender = prompt("Enter your gender (Male/Female):");
      const birthday = prompt("Enter your birthday (YYYY-MM-DD):");
      const phone = prompt("Enter your phone number (optional):");

      await updateProfile(user, {
        displayName: `@${username}`
      });

      await setDoc(doc(db, "users", user.uid), {
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ")[1] || "",
        username: `@${username}`,
        email: user.email,
        phone,
        gender,
        birthday,
        avatar: user.photoURL || "",
        interests: [],
        createdAt: new Date()
      });

      alert("Google Sign-Up successful! Your profile is now created.");
    } catch (error) {
      alert(error.message);
    }
  });
}
