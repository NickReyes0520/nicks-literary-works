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
