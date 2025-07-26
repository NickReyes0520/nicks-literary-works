// Watermark Settings
const watermarkText = "www.rgr-nicksliteraryworks.com";
const watermarkImageSrc = "public/logo-watermark.png";

// Disable right-click on entire page
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable common shortcuts: F12, Ctrl+U, Ctrl+Shift+I
document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey && (e.key.toLowerCase() === "u" || (e.shiftKey && e.key.toLowerCase() === "i")))
  ) {
    e.preventDefault();
  }
});

// Prevent long-press on mobile (disable context menu)
document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Load watermark image
const watermarkImg = new Image();
watermarkImg.src = watermarkImageSrc;

// Function to render image with watermarks
async function renderImage(div, url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply image watermark (bottom-right)
      const applyImageWatermark = () => {
        const wmWidth = img.width * 0.15; // 15% of image width
        const wmHeight = watermarkImg.height * (wmWidth / watermarkImg.width);
        ctx.globalAlpha = 0.5; // Transparency
        ctx.drawImage(
          watermarkImg,
          img.width - wmWidth - 20,
          img.height - wmHeight - 20,
          wmWidth,
          wmHeight
        );
        ctx.globalAlpha = 1.0;

        // Apply text watermark (bottom-center)
        ctx.font = `${img.width * 0.03}px Arial`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText(watermarkText, img.width / 2, img.height - 40);

        // Append canvas to div
        div.appendChild(canvas);

        // Revoke blob URL
        URL.revokeObjectURL(img.src);
      };

      if (watermarkImg.complete) {
        applyImageWatermark();
      } else {
        watermarkImg.onload = applyImageWatermark;
      }
    };
  } catch (err) {
    console.error("Error loading image:", err);
  }
}

// Render all secure-image elements
document.querySelectorAll(".secure-image").forEach((div) => {
  const imgSrc = div.dataset.src;
  renderImage(div, imgSrc);
});
