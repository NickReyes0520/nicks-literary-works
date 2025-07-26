/* script.js */

const watermarkText = "www.rgr-nicksliteraryworks.com";
const watermarkImageSrc = "public/logo-watermark.png";

// Disable right-click on entire page
document.addEventListener("contextmenu", e => e.preventDefault());

// Disable common shortcuts: F12, Ctrl+U, Ctrl+Shift+I
document.addEventListener("keydown", e => {
    if (
        e.key === "F12" ||
        (e.ctrlKey && (e.key.toLowerCase() === "u" || e.shiftKey && e.key.toLowerCase() === "i"))
    ) {
        e.preventDefault();
    }
});

// Load watermark image
const watermarkImg = new Image();
watermarkImg.src = watermarkImageSrc;

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

            // Add image watermark (bottom-right)
            watermarkImg.onload = () => {
                const wmWidth = img.width * 0.15; // 15% of image width
                const wmHeight = watermarkImg.height * (wmWidth / watermarkImg.width);
                ctx.globalAlpha = 0.5; // Transparency
                ctx.drawImage(watermarkImg, img.width - wmWidth - 20, img.height - wmHeight - 20, wmWidth, wmHeight);
                ctx.globalAlpha = 1.0;

                // Add text watermark
                ctx.font = `${img.width * 0.03}px Arial`;
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.textAlign = "center";
                ctx.fillText(watermarkText, img.width / 2, img.height - 40);

                // Append canvas
                div.appendChild(canvas);

                // Revoke blob URL
                URL.revokeObjectURL(img.src);
            };
        };
    } catch (err) {
        console.error("Error loading image:", err);
    }
}

// Process all book pages
document.querySelectorAll(".book-page").forEach(div => {
    renderImage(div, div.dataset.src);
});
