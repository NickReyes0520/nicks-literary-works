document.addEventListener("DOMContentLoaded", () => {
  const articleList = document.getElementById("article-list");
  const modal = document.getElementById("article-modal");
  const modalContent = document.getElementById("modal-article");
  const closeBtn = document.getElementById("close-modal");

  // Example articles – you’ll load from Firebase later
  const articles = [
    {
      id: "article1",
      title: "The True Value of Resilience",
      excerpt: "A brief reflection on enduring trials and staying faithful in a chaotic world...",
      content: `<h2>The True Value of Resilience</h2><p>Resilience is more than surviving storms; it's the ability to continue walking in faith...</p><p>Here's the full content of the article. You can write as long as you want here!</p>`
    },
    {
      id: "article2",
      title: "Faith and Discipline: Twin Pillars of Strength",
      excerpt: "Explore the harmony of unwavering faith and self-control in our daily walk with God...",
      content: `<h2>Faith and Discipline: Twin Pillars of Strength</h2><p>In our spiritual journey, discipline walks hand in hand with belief...</p>`
    }
  ];

  // Render article cards
  articles.forEach(article => {
    const card = document.createElement("div");
    card.classList.add("article-card");

    card.innerHTML = `
      <h2>${article.title}</h2>
      <p class="excerpt">${article.excerpt}</p>
      <button class="read-button" data-id="${article.id}">Read for Free!</button>
    `;

    articleList.appendChild(card);
  });

  // Modal handling
  articleList.addEventListener("click", (e) => {
    if (e.target.classList.contains("read-button")) {
      const articleId = e.target.dataset.id;
      const article = articles.find(a => a.id === articleId);
      if (article) {
        modalContent.innerHTML = article.content;
        modal.classList.remove("hidden");
      }
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    modalContent.innerHTML = "";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      modalContent.innerHTML = "";
    }
  });
});
