// Fetch and cache audio files for Nepali + English letters and full Barakhari
// Usage:
//   1) export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
//   2) npm i
//   3) npm run fetch:audio

/* eslint-disable no-console */
const path = require('path');
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'assets', 'data', 'alphabets.json');

const OUT = {
  nepaliRoot: path.join(ROOT, 'assets', 'audio', 'nepali'),
  englishRoot: path.join(ROOT, 'assets', 'audio', 'english'),
  barakhariRoot: path.join(ROOT, 'assets', 'audio', 'nepali', 'barakhari'),
};

const client = new textToSpeech.TextToSpeechClient();

async function synthesizeToFile(text, options) {
  const {
    languageCode = 'ne-NP',
    ssmlGender = 'NEUTRAL',
    outFile,
    fallbackLanguageCode,
  } = options;

  await fs.ensureDir(path.dirname(outFile));
  if (await fs.pathExists(outFile)) {
    console.log(`✔ Exists: ${path.relative(ROOT, outFile)}`);
    return;
  }

  async function request(lang) {
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: lang, ssmlGender },
      audioConfig: { audioEncoding: 'MP3' },
    });
    return response.audioContent;
  }

  let audio;
  try {
    audio = await request(languageCode);
  } catch (err) {
    if (fallbackLanguageCode) {
      console.warn(`⚠ Using fallback ${fallbackLanguageCode} for: ${text}`);
      audio = await request(fallbackLanguageCode);
    } else {
      throw err;
    }
  }
  await fs.outputFile(outFile, audio, 'binary');
  console.log(`🎵 Saved: ${path.relative(ROOT, outFile)}`);
}

function combineBarakhari(baseLetter, vowel) {
  if (!vowel || vowel.matra == null) return baseLetter;
  // Always append matra after base; the renderer orders pre-base matras visually
  return baseLetter + vowel.matra;
}

async function run() {
  const json = await fs.readJson(DATA_FILE);

  // Nepali Swar (letters themselves)
  for (const it of json.nepali.swar || []) {
    const outFile = path.join(OUT.nepaliRoot, `${it.id}.mp3`);
    await synthesizeToFile(it.letter, { languageCode: 'ne-NP', fallbackLanguageCode: 'hi-IN', outFile });
  }

  // Nepali Byanjan (letters themselves)
  for (const it of json.nepali.byanjan || []) {
    const outFile = path.join(OUT.nepaliRoot, `${it.id}.mp3`);
    await synthesizeToFile(it.letter, { languageCode: 'ne-NP', fallbackLanguageCode: 'hi-IN', outFile });
  }

  // English A-Z (speak letter names)
  for (const it of json.english.az || []) {
    const outFile = path.join(OUT.englishRoot, `${it.id}.mp3`);
    await synthesizeToFile(it.letter, { languageCode: 'en-US', outFile });
  }

  // Full Barakhari grid
  const b = json.barakhari;
  if (b && b.baseConsonants && b.vowels) {
    for (const base of b.baseConsonants) {
      for (const vowel of b.vowels) {
        const combined = combineBarakhari(base.letter, vowel);
        const outFile = path.join(OUT.barakhariRoot, `${base.id}_${vowel.key}.mp3`);
        await synthesizeToFile(combined, { languageCode: 'ne-NP', fallbackLanguageCode: 'hi-IN', outFile });
      }
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


