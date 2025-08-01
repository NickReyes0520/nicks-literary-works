// updates.js
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".view-button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.closest(".update-entry").querySelector(".update-content");

      // Toggle visibility
      content.style.display = content.style.display === "block" ? "none" : "block";

      // Update button text
      button.textContent = content.style.display === "block" ? "Hide" : "View";
    });
  });
});
