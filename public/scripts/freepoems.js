document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.read-poem-btn');
  const modal = document.getElementById('poem-modal');
  const closeBtn = document.getElementById('close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');

  const poemContents = {
    'pilipinas-poem': `Sa pagsikat ng araw’y unang sinisinagan,\nPitong libo niyang pulo sa Malayong Silangan.\nDalisay at luntian tuwing liliwanagan—\nLupain ng pag-ibig, pag-asa't katapangan.`
                      `Sa Dagat Pasipiko’y hiyas ang kapuluan;\nMula Luzon, Visayas, at Mindanao ay nariyan.\nWatawat niya’y dakila sa diwang makabayan,\nMaging dagat niya’t bundok, hanggang sa kapatagan.`
                      `Lupang pinagdanakan ng dugo ng magiting,\nAt ng mga bayaning ‘di na natin kapiling.\nLiglig sa kayumihan at pag-asang kasiping,\nHitik sa yamang likas at makulay na sining.`
                      `Perlas ng Silanganan, kung ito ay tawagin—\nKariktan niya’y salamin na mahirap basagin.\nTila ba kabundukan na ‘di kayang patagin,\nNgunit mga dayuha’y nagawa siyang bihagin.`
                      `Nanangis sa hilahil ang bayan kong minahal;\nInalipin sa dusa’t niyurakan ang dangal.\nPananakop at hirap ay lalo pang tumagal,\nBawat bibig ay tikom, waring may mga busal.`
                      `Hanggang mga bayani ay natutong lumaban,\nAt baguhin ang palad ng kawawa kong bayan.\nMula kay Lapu-Lapu, na nagwagi sa Mactan—\nDayuhan ay nalipol; pag-asa ay nahagkan.`
                      `Nang ang mga Kastila’y lubusang pumarito,\nGinamit ni Rizal ang natatanging talino.\nSa Noli Me Tangere’t El Filibusterismo,\nKaaway ay nilupig na parang ipo-ipo.`
                      `At nang siya ay pumanaw, si Bonifacio’y nariyan;\nMapayapang labana’y kaniya nang tinuldukan.\nBilang tagatatag at ama ng Katipunan,\nKalaban niya’y ginupo alang-alang sa bayan.`
                      `At nang mga Kastila’y unti-unting natalo,\nBansa’y ‘pinagbili sa mga Amerikano.\nPanibagong banyaga at bagong mga tao—\nBagong mang-aalipin at bagong mga amo.`
                      `Sa muling pagdirigma, gaya ng sinauna,\nMay isang heneral na tumindig at nanguna.\nKilala sa tapang, at bayan ang inuuna:\nNag-iisang mabangis na si Antonio Luna.`
                      `At maging sa paglipas ng marami pang taon,\nAng bansang Pilipinas ay sinakop ng Hapon.\nDigmaan ay sumiklab, tila alab ng dragon;\nBayan ay naalipin sa mahabang panahon.`
                      `Bagama’t lumipas na’ng maraming mga araw,\nAt ang mga bayani’y malaon nang pumanaw,\nSa’ting mga gunita’y lagi nawang dumalaw—\nAng diwang Pilipinong walang makaaagaw.`
                      `Ngunit ang Pilipinas ay sadyang pinagpala:\nLaya’t kapayapaan ngayo’y tinatamasa.\nLaging may gabay ng Dios na hindi nagsasawa,\nNa maiwawangis sa ‘di natutuyong sapa.`
                      `Sa bisa ng hula sa Banal na Kasulatan,\nPanukala ng Dios ay nagkaro’ng katuparan.\nLingkod Niya ay nagmula sa pinili Niyang bayan—\nGawain Niya’y lumitaw sa Malayong Silangan.`
                      `Sa kabutihan ng Dios ay Kaniyang minarapat\nNa bayan ay tumindig sa maraming habagat.\nMga pulo at tubig na Kaniyang ‘pinaglapat:\nBansang Pilipinas, sa mga pulo ng dagat.`,
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
