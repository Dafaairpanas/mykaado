/**
 * japanese-search.ts
 * Utilitas komprehensif untuk pencarian kosakata bahasa Jepang (Romaji, Hiragana, Katakana, Kanji, dan Arti).
 * Mendukung konversi Romaji <-> Kana, variasi ejaan Hepburn/Kunrei, bentuk kamus/masu, dan pembersihan simbol.
 */

const ROMAJI_TABLE: Record<string, string> = {
  // 3-chars (komposisi yoon)
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ', 'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ', 'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ', 'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ', 'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  // 2-chars
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ',
  // 1-char
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'
};

const KANA_TO_ROMAJI_TABLE: Record<string, string> = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'chi': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'na': 'na', 'ni': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'mi': 'mi', 'む': 'mu', 'め': 'me', 'mo': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'go': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'bi': 'bi', 'bu': 'bu', 'be': 'be', 'bo': 'bo',
  'ぱ': 'pa', 'pi': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
};

/**
 * Konversi teks romaji ke hiragana
 */
export function romajiToHiragana(str: string): string {
  const s = str.toLowerCase()
    .replace(/ō/g, 'ou').replace(/ū/g, 'uu').replace(/ē/g, 'ee').replace(/ā/g, 'aa').replace(/ī/g, 'ii')
    .replace(/konnichiwa/g, 'konnichiha')
    .replace(/konbanwa/g, 'konbanha');

  let res = '';
  let i = 0;
  while (i < s.length) {
    // Handle double 'n' before vowel or 'y' (e.g., konnichi -> ko - n - ni - chi)
    if (s[i] === 'n' && i + 1 < s.length && s[i + 1] === 'n') {
      if (i + 2 < s.length && /[aeiouy]/.test(s[i + 2])) {
        res += 'ん';
        i++;
        continue;
      } else {
        res += 'ん';
        i += 2;
        continue;
      }
    }
    // Handle standalone 'n' before consonant (except y) or at end of string
    if (s[i] === 'n') {
      if (i + 1 === s.length || (/[b-df-hj-np-tv-z]/.test(s[i + 1]) && s[i + 1] !== 'y')) {
        res += 'ん';
        i++;
        continue;
      }
      if (s[i + 1] === "'" || s[i + 1] === '’') {
        res += 'ん';
        i += 2;
        continue;
      }
    }
    // Handle sokuon (double consonants: kk, ss, tt, pp, etc.)
    if (i + 1 < s.length && s[i] === s[i + 1] && /[b-df-hj-np-tv-z]/.test(s[i]) && s[i] !== 'n') {
      res += 'っ';
      i++;
      continue;
    }
    // Handle 'tch' -> っ + ch
    if (i + 2 < s.length && s.substring(i, i + 2) === 'tc' && s[i + 2] === 'h') {
      res += 'っ';
      i++;
      continue;
    }
    // Match 3, 2, 1
    let matched = false;
    for (const len of [3, 2, 1]) {
      if (i + len <= s.length) {
        const sub = s.substring(i, i + len);
        if (ROMAJI_TABLE[sub]) {
          res += ROMAJI_TABLE[sub];
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      res += s[i];
      i++;
    }
  }
  return res;
}

/**
 * Konversi hiragana ke katakana
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

/**
 * Konversi katakana ke hiragana
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/**
 * Konversi kana ke romaji standar
 */
export function kanaToRomaji(str: string): string {
  const s = katakanaToHiragana(str);
  let res = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === 'っ') {
      if (i + 1 < s.length) {
        const nextSub2 = s.substring(i + 1, i + 3);
        const nextSub1 = s[i + 1];
        const nextRomaji = KANA_TO_ROMAJI_TABLE[nextSub2] || KANA_TO_ROMAJI_TABLE[nextSub1];
        if (nextRomaji && nextRomaji.length > 0) {
          const firstChar = nextRomaji[0];
          res += (firstChar === 'c' ? 't' : firstChar);
        }
      }
      i++;
      continue;
    }
    if (i + 2 <= s.length && KANA_TO_ROMAJI_TABLE[s.substring(i, i + 2)]) {
      res += KANA_TO_ROMAJI_TABLE[s.substring(i, i + 2)];
      i += 2;
      continue;
    }
    if (KANA_TO_ROMAJI_TABLE[s[i]]) {
      res += KANA_TO_ROMAJI_TABLE[s[i]];
      i++;
      continue;
    }
    res += s[i];
    i++;
  }
  return res;
}

/**
 * Hapus spasi, simbol, tanda baca (~, -, /, (), dll.)
 */
export function cleanStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[~～\-ー/／()（）=＝.・…\s!?,]/g, '');
}

/**
 * Normalisasi romaji untuk pencarian fleksibel (vokal panjang, partikel wa/ha, dsb.)
 */
export function fuzzyNormalizeRomaji(str: string): string {
  return cleanStr(str)
    .replace(/ou/g, 'o')
    .replace(/oo/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/ee/g, 'e')
    .replace(/ei/g, 'e')
    .replace(/ii/g, 'i')
    .replace(/aa/g, 'a')
    .replace(/konnichiwa/g, 'konnichiha')
    .replace(/konbanwa/g, 'konbanha')
    .replace(/wo/g, 'o')
    .replace(/si/g, 'shi')
    .replace(/ti/g, 'chi')
    .replace(/tu/g, 'tsu')
    .replace(/hu/g, 'fu')
    .replace(/zi/g, 'ji');
}

/**
 * Dapatkan kemungkinan bentuk kata kerja (Kamus <-> Masu)
 */
export function getVerbVariants(q: string): string[] {
  const forms = new Set<string>([q]);

  // Dictionary form -> Masu form
  if (q.endsWith('eru') || q.endsWith('iru')) {
    forms.add(q.slice(0, -2) + 'masu');
  }
  if (q.endsWith('suru')) {
    forms.add(q.slice(0, -4) + 'shimasu');
  } else if (q.endsWith('kuru')) {
    forms.add(q.slice(0, -4) + 'kimasu');
  } else if (q.endsWith('u') && !q.endsWith('masu') && q.length > 2) {
    const stem = q.slice(0, -1);
    let masuStem = stem;
    if (stem.endsWith('k')) masuStem = stem.slice(0, -1) + 'ki';
    else if (stem.endsWith('g')) masuStem = stem.slice(0, -1) + 'gi';
    else if (stem.endsWith('s')) masuStem = stem.slice(0, -1) + 'shi';
    else if (stem.endsWith('t')) masuStem = stem.slice(0, -1) + 'chi';
    else if (stem.endsWith('m')) masuStem = stem.slice(0, -1) + 'mi';
    else if (stem.endsWith('b')) masuStem = stem.slice(0, -1) + 'bi';
    else if (stem.endsWith('r')) masuStem = stem.slice(0, -1) + 'ri';
    else masuStem = stem + 'i';
    forms.add(masuStem + 'masu');
  }

  // Masu form -> Dictionary form
  if (q.endsWith('masu') && q.length > 4) {
    const stem = q.slice(0, -4);
    forms.add(stem + 'ru'); // Ichidan
    if (stem.endsWith('shi')) {
      forms.add(stem.slice(0, -3) + 'su');
      forms.add(stem.slice(0, -3) + 'suru');
    } else if (stem.endsWith('chi')) {
      forms.add(stem.slice(0, -3) + 'tsu');
    } else if (stem.endsWith('ki')) {
      forms.add(stem.slice(0, -2) + 'ku');
      forms.add(stem.slice(0, -2) + 'kuru');
    } else if (stem.endsWith('gi')) {
      forms.add(stem.slice(0, -2) + 'gu');
    } else if (stem.endsWith('mi')) {
      forms.add(stem.slice(0, -2) + 'mu');
    } else if (stem.endsWith('bi')) {
      forms.add(stem.slice(0, -2) + 'bu');
    } else if (stem.endsWith('ri')) {
      forms.add(stem.slice(0, -2) + 'ru');
    } else if (stem.endsWith('i')) {
      forms.add(stem.slice(0, -1) + 'u');
    }
  }

  return Array.from(forms);
}

export interface SearchableItem {
  kanji?: string;
  kana?: string;
  romaji?: string;
  meaning?: string;
  chapter?: string;
  chapterLabel?: string;
  title?: string;
  formula_template?: string;
}

/**
 * Fungsi utama: Memeriksa apakah suatu item cocok dengan query pencarian (Romaji/Kana/Kanji/Arti)
 */
export function matchesJapaneseSearch(item: SearchableItem, rawQuery: string): boolean {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return true;

  // 1. Arti Bahasa Indonesia
  const meaning = (item.meaning || '').toLowerCase();
  if (meaning.includes(q)) return true;

  // 2. Bab / Label
  const chapter = (item.chapterLabel || item.chapter || '').toLowerCase();
  if (chapter.includes(q)) return true;

  // 3. Judul / Formula (untuk bunpou)
  const title = (item.title || '').toLowerCase();
  if (title.includes(q)) return true;
  const formula = (item.formula_template || '').toLowerCase();
  if (formula.includes(q)) return true;

  const qClean = cleanStr(q);
  const qFuzzy = fuzzyNormalizeRomaji(q);

  // 4. Kanji Match (termasuk query langsung)
  const kanji = item.kanji || '';
  if (kanji && kanji.includes(q)) return true;

  // 5. Romaji Item (langsung, clean, fuzzy)
  const itemRomaji = item.romaji || '';
  if (itemRomaji) {
    const romajiClean = cleanStr(itemRomaji);
    const romajiFuzzy = fuzzyNormalizeRomaji(itemRomaji);
    if (romajiClean.includes(qClean) || romajiFuzzy.includes(qFuzzy)) return true;
  }

  // 6. Kana Item (langsung, clean, serta kanaToRomaji)
  const kana = item.kana || '';
  if (kana) {
    const kanaClean = cleanStr(kana);
    if (kana.includes(q) || kanaClean.includes(qClean)) return true;

    // Turunkan romaji dari kana kartu
    const derivedRomaji = kanaToRomaji(kana);
    const derivedClean = cleanStr(derivedRomaji);
    const derivedFuzzy = fuzzyNormalizeRomaji(derivedRomaji);
    if (derivedClean.includes(qClean) || derivedFuzzy.includes(qFuzzy)) return true;
  }

  // 7. Konversi Query Romaji -> Hiragana & Katakana
  const qHira = romajiToHiragana(qClean);
  const qKata = hiraganaToKatakana(qHira);

  if (kana) {
    const kanaClean = cleanStr(kana);
    if (kanaClean.includes(qHira) || kanaClean.includes(qKata)) return true;
  }
  if (kanji) {
    const kanjiClean = cleanStr(kanji);
    if (kanjiClean.includes(qHira) || kanjiClean.includes(qKata)) return true;
  }
  if (title) {
    const titleClean = cleanStr(title);
    if (titleClean.includes(qHira) || titleClean.includes(qKata)) return true;
  }

  // 8. Pencocokan Kata Kerja (Dictionary <-> Masu)
  // Misalnya user mengetik 'taberu', cocokkan juga variasi 'tabemasu'
  const verbVariants = getVerbVariants(qClean);
  if (verbVariants.length > 1) {
    for (const v of verbVariants) {
      if (v === qClean) continue;
      const vFuzzy = fuzzyNormalizeRomaji(v);
      const vHira = romajiToHiragana(v);
      const vKata = hiraganaToKatakana(vHira);

      if (itemRomaji) {
        const rClean = cleanStr(itemRomaji);
        const rFuzzy = fuzzyNormalizeRomaji(itemRomaji);
        if (rClean.includes(v) || rFuzzy.includes(vFuzzy)) return true;
      }
      if (kana) {
        const kClean = cleanStr(kana);
        if (kClean.includes(vHira) || kClean.includes(vKata)) return true;
      }
      if (kanji) {
        const kjClean = cleanStr(kanji);
        if (kjClean.includes(vHira) || kjClean.includes(vKata)) return true;
      }
    }
  }

  return false;
}

/**
 * Skor relevansi untuk pengurutan hasil pencarian:
 * - Match persis / di awal kartu mendapat prioritas tertinggi
 * - Kartu kata tunggal pendek mendahului kalimat panjang
 */
export function getSearchRelevanceScore(item: SearchableItem, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;
  const qClean = cleanStr(q);
  const qHira = romajiToHiragana(qClean);

  const kanji = cleanStr(item.kanji || '');
  const kana = cleanStr(item.kana || '');
  const romaji = cleanStr(item.romaji || '');
  const meaning = (item.meaning || '').toLowerCase();

  let score = 0;

  // Exact match
  if (kanji === q || kana === q || romaji === q || kana === qHira) score += 100;
  else if (meaning === q) score += 90;

  // Starts with
  if (kanji.startsWith(q) || kana.startsWith(q) || romaji.startsWith(q) || kana.startsWith(qHira)) score += 50;
  if (meaning.startsWith(q)) score += 40;

  // Shorter headwords are preferred over long example sentences
  const lengthPenalty = Math.min(30, (kana.length || kanji.length || 10));
  score -= lengthPenalty;

  return score;
}
