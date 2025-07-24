// /admin.js

// Hide admin-only links on page load
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = "none";
  });

  const form = document.getElementById("admin-login-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    login();
  });
});

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("login-status");

  if (username === "nicks-literary-works" && password === "nickreyes0520") {
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "inline-block";
    });

    document.getElementById("access-message").style.display = "none";
    document.getElementById("login-form").style.display = "none";
    status.textContent = "";
  } else {
    status.textContent = "❌ Invalid credentials. Please try again.";
    status.style.color = "red";
  }
}

