document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.read-poem-btn');
  const modal = document.getElementById('poem-modal');
  const closeBtn = document.getElementById('close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');

  const poemContents = {
    'pilipinas-poem': `Sa pagsikat ng araw’y unang sinisinagan,\nPitong libo niyang pulo sa Malayong Silangan.\nDalisay at luntian tuwing liliwanagan—\nLupain ng pag-ibig, pag-asa't katapangan.`,
    'chess-poem': `Each soul on earth is placed with care and firm design,\nNo role too small, no crown too great, no greater sign.\nA pawn may rise through trials fierce, beyond the board,\nAnd reach the rank of king or queen with God's accord.`,
    'bridge-poem': `Habang naglalakad sa dalampasigan,\nTanaw din ang araw sa ‘di kalayuan.\nMay ngiti pang tangan sa bawat pagdaan\nSa baybaying lupa nitong kamunduhan.`,
    'scientific-poem': `Before the time-space fabric ever came to be,\nHe voiced the laws that birthed reality’s decree.\nThe constants fixed—like pi and Planck’s elusive length—\nRevealed the Artisan behind all cosmic strength.`
  };

  buttons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      modalTitle.textContent = this.closest('.poem-info').querySelector('h2').textContent;
      modalText.textContent = poemContents[targetId];
      modal.classList.remove('hidden');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});
