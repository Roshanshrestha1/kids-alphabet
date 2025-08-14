Kids Alphabet • Nepali & English
================================

Quick start
-----------

1. Open `index.html` in a browser.
2. Tap a section on Home: `Nepali Swar`, `Nepali Byanjan`, or `English A–Z`.
3. Click any letter tile to:
   - Play pronunciation audio
   - See an example word and picture
   - Open a writing guide (SVG)

Project structure
-----------------

```
KA/
├─ index.html            # App shell: sections and modals
├─ style.css             # Kid-friendly UI styles
├─ script.js             # Logic: render, audio, modals
├─ assets/
│  ├─ images/
│  │  ├─ placeholder.svg
│  │  ├─ nepali/        # Put your Nepali example images here
│  │  └─ english/       # Put your English example images here
│  ├─ audio/
│  │  ├─ nepali/        # Put your Nepali letter audio here
│  │  └─ english/       # Put your English letter audio here
│  └─ svg/
│     ├─ write-placeholder.svg
│     ├─ nepali/        # Put your Nepali writing SVGs here
│     └─ english/       # Put your English writing SVGs here
└─ README.md
```

Adding your content
-------------------

- Images: place PNG/JPG in `assets/images/nepali` and `assets/images/english`.
- Audio: place MP3/WAV in `assets/audio/nepali` and `assets/audio/english`.
- Writing SVG: place stroke animations in `assets/svg/nepali` and `assets/svg/english`.

Then update the data items in `script.js`:

```js
{ id: 'ka', letter: 'क', latin: 'ka', sound: 'ka', example: 'कुकुर', image: './assets/images/nepali/ka.png', audio: './assets/audio/nepali/ka.mp3', svg: './assets/svg/nepali/ka.svg' }
```

Barakhari (बारखरी)
-------------------

Prefetch audio with Google Cloud TTS (one-time)
-----------------------------------------------

Requirements:
- Google Cloud project with Text-to-Speech API enabled
- Service Account JSON key file (e.g., `key.json`)

Setup and run:
```bash
cd /home/roshan/Documents/KA
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/key.json"
npm install
npm run fetch:audio
```

What it does:
- Generates MP3 files for Nepali Swar, Nepali Byanjan, English A–Z, and full Barakhari grid
- Saves to `assets/audio/**` and skips files that already exist
- Uses `ne-NP` voice, falling back to `hi-IN` if needed

- All Barakhari data lives in `assets/data/alphabets.json` under `barakhari`.
- File naming for assets per cell:
  - Audio: `assets/audio/nepali/barakhari/{baseId}_{vowelKey}.mp3`
  - Image: `assets/images/nepali/barakhari/{baseId}_{vowelKey}.png`
  - SVG:   `assets/svg/nepali/barakhari/{baseId}_{vowelKey}.svg`
- Example for base `ka` (क): `ka_a.mp3`, `ka_aa.mp3`, `ka_i.mp3`, ..., `ka_ah.mp3`.

Notes and tips
--------------

- Sounds on iOS/Android require a user tap first; this app plays only on click.
- To support offline use, you can later add a service worker (PWA). This prototype is PWA-ready in structure.
- Writing animations work best with SVGs that animate stroke order; static SVGs or PNG sequences also work.

License
-------

MIT (replace or keep as you wish).
