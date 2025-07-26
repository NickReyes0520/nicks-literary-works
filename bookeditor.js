function execCmd(command, value = null) {
  document.execCommand(command, false, value);
}

function addChapter() {
  const editor = document.getElementById('editor');
  const chapter = document.createElement('h2');
  chapter.textContent = 'New Chapter';
  editor.appendChild(chapter);
}

function insertImage() {
  const url = prompt('Enter image URL:');
  if (url) execCmd('insertImage', url);
}

// Handle font selection
document.getElementById('fontSelect').addEventListener('change', function() {
  execCmd('fontName', this.value);
});
