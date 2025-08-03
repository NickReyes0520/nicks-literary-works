// admin.js

document.addEventListener("DOMContentLoaded", () => {
  // Initially hide admin-only links
  document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");

  const loginForm = document.getElementById("admin-login-form");
  const loginStatus = document.getElementById("login-status");
  const successOverlay = document.getElementById("login-success");
  const welcomeSection = document.getElementById("admin-welcome");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const isValid = username === "nicks-literary-works" && password === "nickreyes0520";

    if (isValid) {
      // Show success overlay
      successOverlay.style.display = "flex";

      // Unlock admin links and welcome message after delay
      setTimeout(() => {
        successOverlay.style.display = "none";
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "inline-block");

        document.getElementById("access-message").style.display = "none";
        document.getElementById("login-form").style.display = "none";
        welcomeSection.style.display = "block";
      }, 2000); // Match with fadeOut animation delay

      loginStatus.textContent = "";
    } else {
      loginStatus.textContent = "❌ Invalid credentials.";
    }
  });
});
