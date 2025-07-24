// admin.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("admin-login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginStatus = document.getElementById("login-status");

  const navButtons = document.querySelectorAll(".admin-only");
  const loginSection = document.getElementById("login-form");
  const accessMessage = document.getElementById("access-message");
  const welcomeMessage = document.getElementById("admin-welcome");

  // Hide admin-only buttons by default
  navButtons.forEach(button => {
    button.style.display = "none";
  });

  // Handle login
  loginForm.addEventListener("submit", event => {
    event.preventDefault(); // Prevent page reload

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();


    // Successful login message prompt
    if (username === "nicks-literary-works" && password === "nickreyes0520") {
      document.querySelectorAll(".admin-only").forEach(btn => btn.style.display = "inline-block");
      document.getElementById("access-message").style.display = "none";
      document.getElementById("login-form").style.display = "none";
      document.getElementById("login-status").textContent = "";

      // ✅ Show welcome message and overlay
      document.getElementById("admin-welcome").style.display = "block";
      document.getElementById("login-success").style.display = "flex";

      // 🧹 Optionally remove success overlay after animation
      setTimeout(() => {
        document.getElementById("login-success").style.display = "none";
      }, 3500);
    }
    
    // Simple admin credentials check
    if (username === "nicks-literary-works" && password === "nickreyes0520") {
      // Show admin-only buttons
      navButtons.forEach(button => {
        button.style.display = "inline-block";
      });

      // Hide login form and access message
      loginSection.style.display = "none";
      if (accessMessage) accessMessage.style.display = "none";

      // Show welcome message
      if (welcomeMessage) {
        welcomeMessage.style.display = "block";
      }

      loginStatus.textContent = "";
    } else {
      // Invalid login feedback
      loginStatus.textContent = "❌ Invalid username or password. Please try again.";
      loginStatus.style.color = "red";
    }
  });
});
