// admin.js

document.addEventListener("DOMContentLoaded", () => {
  const adminOnlyButtons = document.querySelectorAll(".admin-only");
  const accessMessage = document.getElementById("access-message");
  const loginFormSection = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const form = document.getElementById("admin-login-form");

  // ✅ Hide all admin-only buttons by default
  adminOnlyButtons.forEach(btn => {
    btn.style.display = "none";
  });

  // ✅ Add form submit listener
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form from reloading the page

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username === "nicks-literary-works" && password === "nickreyes0520") {
      // ✅ Show admin-only buttons
      adminOnlyButtons.forEach(btn => {
        btn.style.display = "inline-block";
      });

      // ✅ Hide login and message
      accessMessage.style.display = "none";
      loginFormSection.style.display = "none";

      // ✅ Clear any previous error
      loginStatus.textContent = "";
    } else {
      // ❌ Wrong credentials
      loginStatus.textContent = "❌ Invalid credentials. Please try again.";
      loginStatus.style.color = "red";
    }
  });
});
