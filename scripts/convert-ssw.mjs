import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KANA_MAP = {
  // Youon (digraphs)
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
  'てぃ': 'ti', 'でぃ': 'di', 'どぅ': 'du',
  'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',

  // Monographs
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ゔ': 'vu'
};

function katakanaToHiragana(str) {
  return str.replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function kanaToRomaji(str) {
  const hira = katakanaToHiragana(str);
  let res = '';
  let i = 0;
  while (i < hira.length) {
    // Sokuon (double consonant)
    if (hira[i] === 'っ') {
      if (i + 1 < hira.length) {
        const nextTwo = hira.substring(i + 1, i + 3);
        const nextOne = hira[i + 1];
        const nextRomaji = KANA_MAP[nextTwo] || KANA_MAP[nextOne];
        if (nextRomaji) {
          const firstChar = nextRomaji[0];
          res += (firstChar === 'c' ? 't' : firstChar);
        }
      }
      i++;
      continue;
    }
    // Chouonpu (ー)
    if (hira[i] === 'ー') {
      const lastChar = res.length > 0 ? res[res.length - 1] : '';
      if (['a', 'i', 'u', 'e', 'o'].includes(lastChar)) {
        res += lastChar;
      } else {
        res += '-';
      }
      i++;
      continue;
    }
    // 2-char lookup (youon)
    if (i + 1 < hira.length) {
      const two = hira.substring(i, i + 2);
      if (KANA_MAP[two]) {
        res += KANA_MAP[two];
        i += 2;
        continue;
      }
    }
    // 1-char lookup
    if (KANA_MAP[hira[i]]) {
      res += KANA_MAP[hira[i]];
      i++;
      continue;
    }
    // Other characters (latin, digits, punctuation)
    res += hira[i];
    i++;
  }
  return res.replace(/\s+/g, ' ').trim();
}

const inputPath = path.resolve(__dirname, '../src/data/kanji/ssw.txt');
const outputDir = path.resolve(__dirname, '../src/data/ssw-pm');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const rawText = fs.readFileSync(inputPath, 'utf-8');
const lines = rawText.split('\n');

const chapterMeta = [
  { match: 'Sampul, Pengantar', num: '01', title: 'Sampul & Pengantar' },
  { match: 'Bab 1: Keterampilan Dasar', num: '02', title: 'Keterampilan Dasar Industri' },
  { match: 'Bab 2.1 & 2.2: Kebersihan Pangan', num: '03', title: 'Kebersihan Pangan & Bahaya' },
  { match: 'Bab 2.3: Manajemen Kebersihan Umum', num: '04', title: 'Manajemen Kebersihan Umum' },
  { match: 'Bab 2.4: Manajemen Kebersihan HACCP', num: '05', title: 'Manajemen HACCP' },
  { match: 'Bab 3 & Lampiran: Keselamatan', num: '06', title: 'Keselamatan Kerja & Rambu' },
];

const chapters = chapterMeta.map(m => ({ ...m, items: [] }));
let currentChapter = null;

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  if (line.startsWith('#')) {
    const found = chapterMeta.find(m => line.includes(m.match));
    if (found) {
      currentChapter = chapters.find(c => c.num === found.num);
    }
    continue;
  }
  if (!currentChapter) continue;

  const parts = line.split(';');
  if (parts.length >= 3) {
    const kanji = parts[0].trim();
    const kana = parts[1].trim();
    const meaning = parts.slice(2).join(';').trim();
    const romaji = kanaToRomaji(kana);

    currentChapter.items.push({ kanji, kana, romaji, meaning });
  }
}

for (const ch of chapters) {
  const jsonItems = ch.items.map((item, idx) => ({
    id: `ssw-${ch.num}-${String(idx + 1).padStart(3, '0')}`,
    kanji: item.kanji,
    kana: item.kana,
    romaji: item.romaji,
    meaning: item.meaning,
    level: 'A2',
    isExtra: false,
    priority: 1,
    chapter: `Bab ${ch.num}`,
    type: 'noun',
    transitivity: null,
    semantic: 'abstract'
  }));

  const outFilePath = path.join(outputDir, `bab-${ch.num}.json`);
  fs.writeFileSync(outFilePath, JSON.stringify(jsonItems, null, 2), 'utf-8');
  console.log(`Saved ${outFilePath} with ${jsonItems.length} items (Bab ${ch.num}: ${ch.title})`);
}

// Process Kotoba Ekstra
const extraPath = path.resolve(__dirname, '../src/data/kanji/ssw_extra.txt');
if (fs.existsSync(extraPath)) {
  const extraText = fs.readFileSync(extraPath, 'utf-8');
  const extraLines = extraText.split('\n');
  const extraItems = [];
  for (let line of extraLines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(';');
    if (parts.length >= 3) {
      const kanji = parts[0].trim();
      const kana = parts[1].trim();
      const meaning = parts.slice(2).join(';').trim();
      const romaji = kanaToRomaji(kana);
      extraItems.push({ kanji, kana, romaji, meaning });
    }
  }

  const extraJson = extraItems.map((item, idx) => ({
    id: `ssw-ex-${String(idx + 1).padStart(3, '0')}`,
    kanji: item.kanji,
    kana: item.kana,
    romaji: item.romaji,
    meaning: item.meaning,
    level: 'A2',
    isExtra: true,
    priority: 1,
    chapter: 'Kotoba Ekstra',
    type: 'noun',
    transitivity: null,
    semantic: 'abstract'
  }));

  const extraOutPath = path.join(outputDir, 'extra.json');
  fs.writeFileSync(extraOutPath, JSON.stringify(extraJson, null, 2), 'utf-8');
  console.log(`Saved ${extraOutPath} with ${extraJson.length} items (Kotoba Ekstra)`);
}
