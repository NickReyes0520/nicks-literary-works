document.addEventListener('DOMContentLoaded', () => {
  const editorBtn = document.getElementById('editorBtn');
  const bookEditor = document.getElementById('bookEditor');

  editorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bookEditor.style.display = 'block';
  });

  const commands = [
    { label: 'Bold', command: 'bold' },
    { label: 'Italic', command: 'italic' },
    { label: 'Underline', command: 'underline' },
    { label: 'Heading 1', command: 'formatBlock', value: 'H1' },
    { label: 'Heading 2', command: 'formatBlock', value: 'H2' },
    { label: 'Paragraph', command: 'formatBlock', value: 'P' },
    { label: 'Insert Image', command: 'insertImage', prompt: true },
  ];

  const controls = document.getElementById('editorControls');
  const editor = document.getElementById('editor');

  commands.forEach(ctrl => {
    const btn = document.createElement('button');
    btn.textContent = ctrl.label;
    btn.addEventListener('click', () => {
      if (ctrl.prompt) {
        const url = prompt('Enter image URL:');
        if (url) document.execCommand(ctrl.command, false, url);
      } else {
        document.execCommand(ctrl.command, false, ctrl.value || null);
      }
    });
    controls.appendChild(btn);
  });
});
