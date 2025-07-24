// admin.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginStatus = document.getElementById("login-status");
  const accessMessage = document.getElementById("access-message");
  const loginFormSection = document.getElementById("login-form");
  const adminOnlyButtons = document.querySelectorAll(".admin-only");

  // 🔒 Always hide admin buttons on page load
  adminOnlyButtons.forEach(button => {
    button.style.display = "none";
  });

  // Handle form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "nicks-literary-works" && password === "nickreyes0520") {
      // ✅ Show admin-only buttons
      adminOnlyButtons.forEach(button => {
        button.style.display = "inline-block";
      });

      // ✅ Hide access message and login form
      accessMessage.style.display = "none";
      loginFormSection.style.display = "none";

      loginStatus.textContent = "";
    } else {
      // ❌ Show error
      loginStatus.textContent = "❌ Invalid credentials. Please try again.";
      loginStatus.style.color = "red";
    }
  });
});
