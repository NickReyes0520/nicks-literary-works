// /admin.js

document.addEventListener("DOMContentLoaded", () => {
  const adminOnlyButtons = document.querySelectorAll(".admin-only");
  const accessMessage = document.getElementById("access-message");
  const loginFormSection = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const form = document.getElementById("admin-login-form");

  // Hide admin-only buttons by default
  adminOnlyButtons.forEach(btn => btn.style.display = "none");

  // Handle login form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page reload

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username === "nicks-literary-works" && password === "nickreyes0520") {
      // Show admin-only buttons
      adminOnlyButtons.forEach(btn => btn.style.display = "inline-block");

      // Hide message and form
      accessMessage.style.display = "none";
      loginFormSection.style.display = "none";

      // Clear any error
      loginStatus.textContent = "";
    } else {
      loginStatus.textContent = "❌ Invalid credentials. Please try again.";
      loginStatus.style.color = "red";
    }
  });
});
