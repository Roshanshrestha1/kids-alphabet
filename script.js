// Data will be loaded from JSON. Minimal fallback exists if fetch fails.
let DATA = {
  nepali: { swar: [], byanjan: [] },
  english: { az: [] },
};

const sections = {
  home: document.getElementById('section-home'),
  swar: document.getElementById('section-nepali-swar'),
  byanjan: document.getElementById('section-nepali-byanjan'),
  english: document.getElementById('section-english-az'),
  barakhari: document.getElementById('section-barakhari'),
  numbers: document.getElementById('section-numbers'),
};

const grids = {
  swar: document.getElementById('grid-nepali-swar'),
  byanjan: document.getElementById('grid-nepali-byanjan'),
  english: document.getElementById('grid-english-az'),
  barakhari: document.getElementById('grid-barakhari'),
  nepaliNumbers: document.getElementById('grid-nepali-numbers'),
  englishNumbers: document.getElementById('grid-english-numbers'),
};

// Lesson controls (Nepali Swar)
const swarLesson = {
  startBtn: document.getElementById('swarStart'),
  prevBtn: document.getElementById('swarPrev'),
  nextBtn: document.getElementById('swarNext'),
  speakBtn: document.getElementById('swarSpeak'),
  index: -1,
};

const modal = {
  root: document.getElementById('letterModal'),
  letter: document.getElementById('letterDisplay'),
  pron: document.getElementById('letterPronunciation'),
  latin: document.getElementById('letterLatin'),
  example: document.getElementById('letterExample'),
  image: document.getElementById('letterImage'),
  phrase: document.getElementById('letterPhrase'),
  phraseLetter: document.getElementById('phraseLetter'),
  phraseWord: document.getElementById('phraseWord'),
  writingPreview: document.getElementById('writingPreview'),
  play: document.getElementById('btnPlayAudio'),
  how: document.getElementById('btnHowToWrite'),
  speakPhrase: document.getElementById('btnSpeakPhrase'),
  spellWord: document.getElementById('btnSpellWord'),
};

const writingModal = {
  root: document.getElementById('writingModal'),
  object: document.getElementById('writingObject'),
  title: document.getElementById('writingTitle'),
};

// Lesson modal (fullscreen) for Nepali Swar
const lessonModal = {
  root: document.getElementById('lessonModal'),
  title: document.getElementById('lessonTitle'),
  close: document.getElementById('lessonClose'),
  prev: document.getElementById('lessonPrev'),
  next: document.getElementById('lessonNext'),
  speak: document.getElementById('lessonSpeak'),
  letter: document.getElementById('lessonLetter'),
  indexEl: document.getElementById('lessonIndex'),
  nameEl: document.getElementById('lessonName'),
};

const sectionStartButtons = {
  swar: document.getElementById('swarStart'),
  byanjan: document.getElementById('byanjanStart'),
  english: document.getElementById('englishStart'),
  barakhari: document.getElementById('barakhariStart'),
};

let currentlySelected = null;
let audioPlayer = new Audio();
// TTS voice selection (internal auto-pick; UI removed)
let selectedVoiceName = '';
if ('speechSynthesis' in window) {
  const updateVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /ne|hi|hin|ne-NP|hi-IN|Devanagari/i.test(`${v.lang} ${v.name}`));
    selectedVoiceName = preferred ? preferred.name : (voices[0]?.name || '');
  };
  updateVoice();
  window.speechSynthesis.onvoiceschanged = updateVoice;
}

function showSection(name) {
  Object.values(sections).forEach(s => s.classList.remove('active'));
  switch (name) {
    case 'nepali-swar': sections.swar.classList.add('active'); break;
    case 'nepali-byanjan': sections.byanjan.classList.add('active'); break;
    case 'english-az': sections.english.classList.add('active'); break;
    case 'barakhari': sections.barakhari.classList.add('active'); break;
    case 'numbers': sections.numbers.classList.add('active'); break;
    default: sections.home.classList.add('active');
  }
  // Update body data-section for CSS to hide/show header options
  document.body.setAttribute('data-section', name === 'home' ? 'home' : 'section');
}

// Render helpers
function createTile(content, sub) {
  const el = document.createElement('button');
  el.className = 'alphabet-tile';
  el.innerHTML = `<div><div class="alphabet-letter">${content}</div>${sub ? `<div class="alphabet-sub">${sub}</div>` : ''}</div>`;
  return el;
}

function renderAllGrids() {
  // Nepali Swar
  grids.swar.innerHTML = '';
  (DATA.nepali.swar || []).forEach(item => {
    const tile = createTile(item.letter);
    tile.addEventListener('click', () => openLetter('nepali-swar', item));
    grids.swar.appendChild(tile);
  });

  // Nepali Byanjan
  grids.byanjan.innerHTML = '';
  (DATA.nepali.byanjan || []).forEach(item => {
    const tile = createTile(item.letter);
    tile.addEventListener('click', () => openLetter('nepali-byanjan', item));
    grids.byanjan.appendChild(tile);
  });

  // English A-Z
  grids.english.innerHTML = '';
  (DATA.english.az || []).forEach(item => {
    const tile = createTile(item.letter, item.lower);
    tile.addEventListener('click', () => openLetter('english-az', item));
    grids.english.appendChild(tile);
  });
}

function openLetter(category, item) {
  currentlySelected = { category, item };
  modal.letter.textContent = item.letter + (item.lower ? ' / ' + item.lower : '');
  modal.pron.textContent = item.sound;
  modal.latin.textContent = item.latin || '';
  modal.example.textContent = item.example || '';
  modal.image.src = item.image || './assets/images/placeholder.svg';
  // Show writing preview if available
  if (modal.writingPreview) {
    modal.writingPreview.setAttribute('data', item.svg || './assets/svg/write-placeholder.svg');
  }
  // Phrase display: e.g., क बाट कमल
  if (modal.phrase) {
    const word = item.word || (item.example && item.example.split(/[\s(]/)[0]) || '';
    modal.phraseLetter.textContent = item.letter || '';
    modal.phraseWord.textContent = word;
    modal.phrase.hidden = !(item.letter && word);
  }
  modal.root.classList.add('open');
  modal.root.setAttribute('aria-hidden', 'false');
  playAudio(item.audio, item.letter || item.latin || '');
  // Hide barakhari variations strip if shown previously
  const v = document.getElementById('barakhariVariations');
  if (v) { v.hidden = true; v.innerHTML = ''; }
}

function closeModals() {
  [modal.root, writingModal.root].forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
}

function playAudio(src, fallbackText) {
  try { audioPlayer.pause(); } catch {}
  // Always try to play audio file first
  if (src) {
    audioPlayer = new Audio(src);
    audioPlayer.play().catch(() => {
      console.warn('Audio file missing or failed:', src, 'Falling back to TTS for:', fallbackText);
      if ('speechSynthesis' in window && fallbackText) {
        const utter = new SpeechSynthesisUtterance(fallbackText);
        const voices = window.speechSynthesis.getVoices();
        let chosen = voices.find(v => v.name === selectedVoiceName);
        if (!chosen) chosen = voices.find(v => /ne|hi|hin|ne-NP|hi-IN|Devanagari/i.test(`${v.lang} ${v.name}`));
        if (chosen) utter.voice = chosen;
        utter.rate = 0.85;
        window.speechSynthesis.speak(utter);
      }
    });
    return;
  }
  // If no audio src, fallback to TTS
  if ('speechSynthesis' in window && fallbackText) {
    const utter = new SpeechSynthesisUtterance(fallbackText);
    const voices = window.speechSynthesis.getVoices();
    let chosen = voices.find(v => v.name === selectedVoiceName);
    if (!chosen) chosen = voices.find(v => /ne|hi|hin|ne-NP|hi-IN|Devanagari/i.test(`${v.lang} ${v.name}`));
    if (chosen) utter.voice = chosen;
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }
}

function openWriting() {
  if (!currentlySelected) return;
  const { category, item } = currentlySelected;
  let svg = item.svg;
  if (category === 'barakhari' && item && item.base && item.vowel) {
    svg = barakhariSvgFor(item.base.id, item.vowel.key) || svg;
  }
  writingModal.title.textContent = `How to write: ${item.letter || (item.base && item.base.letter) || ''}`;
  writingModal.object.setAttribute('data', svg || './assets/svg/write-placeholder.svg');
  writingModal.root.classList.add('open');
  writingModal.root.setAttribute('aria-hidden', 'false');
}

// Wire up header buttons and cards
document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.getAttribute('data-target')));
});

// Modal controls
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModals));
modal.play.addEventListener('click', () => currentlySelected && playAudio(currentlySelected.item.audio));
modal.how.addEventListener('click', openWriting);
if (modal.speakPhrase) {
  modal.speakPhrase.addEventListener('click', () => {
    const text = `${modal.phraseLetter?.textContent || ''} बाट ${modal.phraseWord?.textContent || ''}`.trim();
    playAudio('', text);
  });
}
if (modal.spellWord) {
  modal.spellWord.addEventListener('click', () => {
    if (!currentlySelected) return;
    const word = modal.phraseWord?.textContent || '';
    if (!word) return;
    // Spell each character with a brief gap using TTS
    const chars = [...word];
    let i = 0;
    const speakNext = () => {
      if (i >= chars.length) return;
      const ch = chars[i++];
      playAudio('', ch);
      setTimeout(speakNext, 550);
    };
    speakNext();
  });
}

// Load data from JSON then render
(async function init() {
  try {
    const res = await fetch('./assets/data/alphabets.json', { cache: 'no-cache' });
    const json = await res.json();
    DATA = json;
  } catch (e) {
    // Minimal fallback with two example entries per set
    DATA = {
      nepali: {
        swar: [
          { id: 'a', letter: 'अ', latin: 'a', sound: 'a', example: 'अन्न', image: './assets/images/nepali/a.png', audio: './assets/audio/nepali/a.mp3', svg: './assets/svg/nepali/a.svg' },
          { id: 'aa', letter: 'आ', latin: 'aa', sound: 'aa', example: 'आकाश', image: './assets/images/nepali/aa.png', audio: './assets/audio/nepali/aa.mp3', svg: './assets/svg/nepali/aa.svg' }
        ],
        byanjan: [
          { id: 'ka', letter: 'क', latin: 'ka', sound: 'ka', example: 'कुकुर', image: './assets/images/nepali/ka.png', audio: './assets/audio/nepali/ka.mp3', svg: './assets/svg/nepali/ka.svg' },
          { id: 'kha', letter: 'ख', latin: 'kha', sound: 'kha', example: 'खरायो', image: './assets/images/nepali/kha.png', audio: './assets/audio/nepali/kha.mp3', svg: './assets/svg/nepali/kha.svg' }
        ]
      },
      english: {
        az: [
          { id: 'a', letter: 'A', lower: 'a', latin: 'A a', sound: 'ay', example: 'Apple', image: './assets/images/english/a.png', audio: './assets/audio/english/a.mp3', svg: './assets/svg/english/a.svg' },
          { id: 'b', letter: 'B', lower: 'b', latin: 'B b', sound: 'bee', example: 'Ball', image: './assets/images/english/b.png', audio: './assets/audio/english/b.mp3', svg: './assets/svg/english/b.svg' }
        ]
      }
    };
  }
  renderAllGrids();
  // Ensure Barakhari table renders once data is available
  try { renderBarakhari(); } catch {}
  showSection('home');
})();

// ===== Barakhari =====
function combineBarakhari(baseLetter, vowel) {
  if (!vowel || !('matra' in vowel)) return baseLetter;
  // Always append matra to base per Unicode; pre-base matras (ि) are rendered before visually
  // when the code point follows the base consonant.
  return baseLetter + vowel.matra;
}

function barakhariAudioFor(baseId, vowelKey) {
  return `./assets/audio/nepali/barakhari/${baseId}_${vowelKey}.mp3`;
}
function barakhariImageFor(baseId, vowelKey) {
  return `./assets/images/nepali/barakhari/${baseId}_${vowelKey}.png`;
}
function barakhariSvgFor(baseId, vowelKey) {
  return `./assets/svg/nepali/barakhari/${baseId}_${vowelKey}.svg`;
}

function renderBarakhari() {
  grids.barakhari.innerHTML = '';
  const data = DATA.barakhari;
  if (!data || !data.vowels || !data.baseConsonants) {
    grids.barakhari.textContent = 'Barakhari data not available.';
    return;
  }
  // Exclude unwanted vowels
  const filteredVowels = data.vowels.filter(v => v.key !== 'ri' && v.key !== 'anb');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  // Top-left corner cell
  const corner = document.createElement('th');
  corner.textContent = '';
  hr.appendChild(corner);
  filteredVowels.forEach(v => {
    const th = document.createElement('th');
    th.textContent = v.label;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.baseConsonants.forEach(base => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = base.letter;
    tr.appendChild(th);

    filteredVowels.forEach(vowel => {
      const td = document.createElement('td');
      const btn = document.createElement('div');
      btn.className = 'barakhari-cell';
      const combined = combineBarakhari(base.letter, vowel);
      btn.textContent = combined;
      btn.addEventListener('click', () => openBarakhariDetail(base, vowel, combined));
      td.appendChild(btn);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  grids.barakhari.appendChild(table);
}

function openBarakhariDetail(base, vowel, combinedText) {
  const audio = barakhariAudioFor(base.id, vowel.key);
  const image = barakhariImageFor(base.id, vowel.key);
  const svg = barakhariSvgFor(base.id, vowel.key);

  currentlySelected = { category: 'barakhari', item: { letter: combinedText, base, vowel, audio, image, svg, latin: `${base.latin || ''} + ${vowel.latin || ''}`, sound: vowel.sound || vowel.latin || '' } };

  modal.letter.textContent = combinedText;
  modal.pron.textContent = vowel.sound || vowel.latin || '';
  modal.latin.textContent = `${base.latin || ''} ${vowel.latin || ''}`.trim();
  modal.example.textContent = DATA.barakhari.exampleHint || 'Tap variations below';
  modal.image.src = image;

  // Build variations strip for this base
  const strip = document.getElementById('barakhariVariations');
  if (strip) {
    strip.hidden = false;
    strip.innerHTML = '';
    // Exclude unwanted vowels
    const filteredVowels = DATA.barakhari.vowels.filter(v => v.key !== 'ri' && v.key !== 'anb');
    filteredVowels.forEach(v => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'variation-chip' + (v.key === vowel.key ? ' active' : '');
      chip.textContent = combineBarakhari(base.letter, v);
      chip.addEventListener('click', () => openBarakhariDetail(base, v, combineBarakhari(base.letter, v)));
      strip.appendChild(chip);
    });
  }

  modal.root.classList.add('open');
  modal.root.setAttribute('aria-hidden', 'false');
  playAudio(audio, combinedText);
}

// ===== Nepali Swar Lesson Mode =====
function highlightSwar(index) {
  const items = DATA.nepali.swar || [];
  if (!items.length) return;
  const clamped = Math.max(0, Math.min(index, items.length - 1));
  swarLesson.index = clamped;
  const tiles = grids.swar.querySelectorAll('.alphabet-tile');
  tiles.forEach(t => t.classList.remove('active'));
  const tile = tiles[clamped];
  if (tile) tile.classList.add('active');
  const item = items[clamped];
  openLetter('nepali-swar', item);
}

function nextSwar(delta) {
  const items = DATA.nepali.swar || [];
  if (!items.length) return;
  const newIdx = (swarLesson.index < 0 ? 0 : swarLesson.index + delta);
  highlightSwar(newIdx);
}

if (swarLesson.startBtn) swarLesson.startBtn.addEventListener('click', () => { highlightSwar(0); });
if (swarLesson.prevBtn) swarLesson.prevBtn.addEventListener('click', () => nextSwar(-1));
if (swarLesson.nextBtn) swarLesson.nextBtn.addEventListener('click', () => nextSwar(1));
if (swarLesson.speakBtn) swarLesson.speakBtn.addEventListener('click', () => {
  const items = DATA.nepali.swar || [];
  if (swarLesson.index >= 0 && items[swarLesson.index]) {
    const it = items[swarLesson.index];
    playAudio(it.audio, it.letter || it.latin);
  }
});

// Keyboard shortcuts when in Swar section
document.addEventListener('keydown', (e) => {
  if (!sections.swar.classList.contains('active')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextSwar(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); nextSwar(-1); }
  if (e.code === 'Space') {
    e.preventDefault();
    const items = DATA.nepali.swar || [];
    if (swarLesson.index >= 0 && items[swarLesson.index]) {
      const it = items[swarLesson.index];
      playAudio(it.audio, it.letter || it.latin);
    }
  }
});

// ===== Fullscreen Lesson controls =====
function openLesson(index = 0, mode = 'swar') {
  const items = getLessonItems(mode);
  if (!items.length) return;
  swarLesson.index = index;
  openLesson.mode = mode;
  updateLesson();
  lessonModal.root.classList.add('open');
  lessonModal.root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeLesson() {
  lessonModal.root.classList.remove('open');
  lessonModal.root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function getLessonItems(mode) {
  if (mode === 'swar') return DATA.nepali.swar || [];
  if (mode === 'byanjan') return DATA.nepali.byanjan || [];
  if (mode === 'english') return DATA.english.az || [];
  if (mode === 'barakhari') {
    // Go through all (base consonant, vowel) pairs, excluding unwanted vowels
    const b = DATA.barakhari;
    if (!b || !b.baseConsonants || !b.vowels) return [];
    const filteredVowels = b.vowels.filter(v => v.key !== 'ri' && v.key !== 'anb');
    const items = [];
    b.baseConsonants.forEach(base => {
      filteredVowels.forEach(vowel => {
        items.push({
          letter: combineBarakhari(base.letter, vowel),
          latin: `${base.latin} ${vowel.latin}`,
          audio: barakhariAudioFor(base.id, vowel.key)
        });
      });
    });
    return items;
  }
  if (mode === 'numbers-nepali') return (DATA.numbers?.nepali || []);
  if (mode === 'numbers-english') return (DATA.numbers?.english || []);
  return [];
}

function updateLesson() {
  const items = getLessonItems(openLesson.mode || 'swar');
  const idx = Math.max(0, Math.min(swarLesson.index, items.length - 1));
  swarLesson.index = idx;
  const it = items[idx];
  if (openLesson.mode && openLesson.mode.startsWith('numbers')) {
    lessonModal.letter.textContent = it.digit;
    // Index display for numbers
    if (lessonModal.indexEl) {
      const num = idx + 1;
      const d = ['०','१','२','३','४','५','६','७','८','९'];
      lessonModal.indexEl.textContent = String(num).split('').map(x => d[Number(x)]).join('');
    }
    if (lessonModal.nameEl) {
      lessonModal.nameEl.textContent = it.word || '';
    }
    playAudio(it.audio, it.word);
  } else {
    lessonModal.letter.textContent = it.letter;
    // Index display
    if (lessonModal.indexEl) {
      const num = idx + 1;
      if (openLesson.mode === 'english') {
        lessonModal.indexEl.textContent = String(num);
      } else {
        const d = ['०','१','२','३','४','५','६','७','८','९'];
        lessonModal.indexEl.textContent = String(num).split('').map(x => d[Number(x)]).join('');
      }
    }
    // Name/latin display
    if (lessonModal.nameEl) {
      lessonModal.nameEl.textContent = it.latin || it.sound || '';
    }
    playAudio(it.audio, it.letter || it.latin);
  }
}

if (swarLesson.startBtn) swarLesson.startBtn.addEventListener('click', () => openLesson(0, 'swar'));
if (sectionStartButtons.byanjan) sectionStartButtons.byanjan.addEventListener('click', () => openLesson(0, 'byanjan'));
if (sectionStartButtons.english) sectionStartButtons.english.addEventListener('click', () => openLesson(0, 'english'));
if (sectionStartButtons.barakhari) sectionStartButtons.barakhari.addEventListener('click', () => openLesson(0, 'barakhari'));
if (lessonModal.close) lessonModal.close.addEventListener('click', closeLesson);
if (lessonModal.prev) lessonModal.prev.addEventListener('click', () => { swarLesson.index--; updateLesson(); });
if (lessonModal.next) lessonModal.next.addEventListener('click', () => { swarLesson.index++; updateLesson(); });
if (lessonModal.speak) lessonModal.speak.addEventListener('click', () => { updateLesson(); });

document.addEventListener('keydown', (e) => {
  if (!lessonModal.root.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeLesson(); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); swarLesson.index++; updateLesson(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); swarLesson.index--; updateLesson(); }
  if (e.code === 'Space') { e.preventDefault(); updateLesson(); }
});

// Ensure lesson modal close button always works
window.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('lessonClose');
  if (closeBtn) closeBtn.addEventListener('click', closeLesson);
});
// Fallback: delegate close on any .modal-close inside lessonModal
lessonModal.root.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-close')) closeLesson();
});

// ===== Numbers =====
function renderNumbers(lang) {
  const grid = lang === 'nepali' ? grids.nepaliNumbers : grids.englishNumbers;
  const data = lang === 'nepali' ? (DATA.numbers?.nepali || []) : (DATA.numbers?.english || []);
  grid.innerHTML = '';
  data.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'alphabet-tile';
    btn.innerHTML = `<div class="alphabet-letter">${item.digit}</div><div class="alphabet-sub">${item.word}</div>`;
    btn.onclick = () => playAudio(item.audio, item.word);
    grid.appendChild(btn);
  });
  grids.nepaliNumbers.style.display = lang === 'nepali' ? '' : 'none';
  grids.englishNumbers.style.display = lang === 'english' ? '' : 'none';
}

document.getElementById('btnNumbers').onclick = () => { showSection('numbers'); renderNumbers('nepali'); };
document.getElementById('cardNepaliNumbers').onclick = () => { showSection('numbers'); renderNumbers('nepali'); };
document.getElementById('cardEnglishNumbers').onclick = () => { showSection('numbers'); renderNumbers('english'); };
document.getElementById('numbersStart').onclick = () => {
  // Determine which grid is visible
  const nepaliVisible = grids.nepaliNumbers.style.display !== 'none';
  openLesson(0, nepaliVisible ? 'numbers-nepali' : 'numbers-english');
};