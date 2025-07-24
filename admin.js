/* admin.js */

if (username === "nicks-literary-works" && password === "nickreyes0520") {
  document.querySelectorAll(".admin-only").forEach(btn => btn.style.display = "inline-block");
  document.getElementById("access-message").style.display = "none";
  document.getElementById("login-form").style.display = "none";
  document.getElementById("login-success").style.display = "flex"; // Show the success overlay

  setTimeout(() => {
    document.getElementById("login-success").style.display = "none"; // Hide it after animation
  }, 3500); // Wait for animation to finish before removing
}

if (username === "nicks-literary-works" && password === "nickreyes0520") {
  // ✅ Show admin-only buttons
  adminOnlyButtons.forEach(button => {
    button.style.display = "inline-block";
  });

  // ✅ Hide login and access message
  accessMessage.style.display = "none";
  loginFormSection.style.display = "none";

  // ✅ Show welcome message
  const welcome = document.getElementById("admin-welcome");
  welcome.style.display = "block";

  loginStatus.textContent = "";
}