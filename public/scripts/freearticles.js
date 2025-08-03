document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".read-more-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-article");
      const articleDiv = document.getElementById(targetId);

      if (articleDiv.style.display === "none" || articleDiv.style.display === "") {
        articleDiv.style.display = "block";
        button.textContent = "Hide Article";
      } else {
        articleDiv.style.display = "none";
        button.textContent = "Read for Free!";
      }
    });
  });
});
