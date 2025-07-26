document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    // TODO: Upload to Firebase or process locally
    console.log("File selected:", file.name);
  }
});
