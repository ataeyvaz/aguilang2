/**
 * AguiLang2 - Migration Utility
 * AguiLang1 Tatoeba verilerini AguiLang2 formatına dönüştürür
 *
 * KULLANIM:
 *   import { migrateAguiLang1Data } from './migrationHelper'
 *   const result = await migrateAguiLang1Data()
 */

// ─── AguiLang1 JSON FORMATINI ALGILAMA ──────────────────────────────────────
// AguiLang1 Tatoeba formatı (olası yapılar):
// Format A: { sentences: [{id, text, translation, tags}] }
// Format B: { words: [{word, meaning, example, level}] }
// Format C: [{en: "...", tr: "...", level: "A1", category: "..."}]

/**
 * AguiLang1 dosya adından dil ve seviye bilgisi çıkarır
 * Örnek dosya adları: "en-tr-a1.json", "de-tr-b1.json", "es-a2.json"
 */
export function parseFilename(filename) {
  const base = filename.replace('.json', '').toLowerCase();
  const parts = base.split(/[-_]/);

  const levelMatch = base.match(/\b(a1|a2|b1|b2|b3|c1)\b/i);
  const level = levelMatch ? levelMatch[1].toUpperCase() : 'A1';

  const langCodes = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh'];
  const foundLangs = parts.filter(p => langCodes.includes(p));
  const sourceLanguage = foundLangs[0] || 'en';
  const targetLanguage = foundLangs[1] || null;

  return { language: sourceLanguage, level, sourceLanguage, targetLanguage };
}

/**
 * AguiLang1 tek bir JSON dosyasını AguiLang2 WordEntry[] formatına dönüştürür
 */
export function convertAguiLang1File(rawData, filename) {
  const { sourceLanguage, targetLanguage, level } = parseFilename(filename);
  const entries = [];
  const rawItems = normalizeRawData(rawData);

  rawItems.forEach((item, index) => {
    let word, translation, language, id;

    if (targetLanguage && targetLanguage !== 'tr' && item[targetLanguage]) {
      // e.g. en-de-a1.json: word=German, translation=English, language='de'
      word = item[targetLanguage];
      translation = item[sourceLanguage] || '';
      language = targetLanguage;
      id = `${targetLanguage}_${level}_general_${index}`;
    } else {
      // en-tr-a1.json or default: source word + Turkish translation
      word = extractWord(item, sourceLanguage);
      translation = extractTranslation(item);
      language = sourceLanguage;
      id = `${sourceLanguage}_${level}_general_${index}`;
    }

    if (!word || !translation) return;

    const category = guessCategory(word, translation);

    entries.push({
      id: `${language}_${level}_${category}_${index}`,
      word: word.trim(),
      translation: translation.trim(),
      language,
      level,
      category,
      examples: extractExamples(item),
      partOfSpeech: item.pos || item.part_of_speech || null,
      source: 'tatoeba',
      frequency: null,
      phonetic: item.phonetic || item.ipa || null,
    });
  });

  console.log(`✅ ${filename}: ${entries.length} kelime dönüştürüldü`);
  return entries;
}

// ─── NORMALIZE RAW DATA ──────────────────────────────────────────────────────
function normalizeRawData(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw.sentences) return raw.sentences;
  if (raw.words) return raw.words;
  if (raw.data) return raw.data;
  if (raw.entries) return raw.entries;
  // object map formatı: { "hello": { tr: "merhaba", ... } }
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([key, val]) => ({
      word: key, ...(typeof val === 'string' ? { translation: val } : val)
    }));
  }
  return [];
}

function extractWord(item, language) {
  return item.word || item[language] || item.text ||
         item.source || item.target_word || item.term || '';
}

function extractTranslation(item) {
  return item.translation || item.tr || item.meaning ||
         item.turkish || item.translate || item.definition || '';
}

function extractExamples(item) {
  const ex = item.example || item.examples || item.sentence || item.sentences;
  if (!ex) return [];
  if (Array.isArray(ex)) return ex.slice(0, 3);
  if (typeof ex === 'string') return [ex];
  return [];
}

// ─── KATEGORI TAHMINI ────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  'greetings':      ['hello','hi','bye','goodbye','welcome','thank','please','sorry','merhaba','güle güle'],
  'numbers':        ['one','two','three','number','count','bir','iki','üç','sayı'],
  'colors':         ['red','blue','green','color','colour','kırmızı','mavi','yeşil','renk'],
  'family':         ['mother','father','sister','brother','family','anne','baba','kardeş','aile'],
  'food-drinks':    ['eat','food','drink','bread','water','coffee','yemek','içmek','ekmek','su','kahve'],
  'animals':        ['dog','cat','bird','animal','köpek','kedi','kuş','hayvan'],
  'body-parts':     ['head','hand','eye','body','baş','el','göz','vücut'],
  'clothing':       ['shirt','dress','clothes','wear','gömlek','elbise','giysi'],
  'transportation': ['car','bus','train','travel','araba','otobüs','tren','seyahat'],
  'weather':        ['rain','sun','cloud','weather','yağmur','güneş','bulut','hava'],
  'home':           ['house','room','door','home','ev','oda','kapı'],
  'school':         ['school','learn','study','teacher','okul','öğren','öğretmen'],
  'sports':         ['sport','play','game','ball','spor','oyna','top'],
  'time':           ['time','day','week','month','year','zaman','gün','hafta'],
  'professions':    ['work','job','doctor','teacher','iş','doktor','çalışmak'],
  'health':         ['sick','doctor','medicine','hospital','hasta','ilaç','hastane'],
  'travel':         ['travel','trip','hotel','airport','seyahat','otel','havalimanı'],
  'shopping':       ['buy','shop','price','money','almak','dükkan','fiyat','para'],
  'technology':     ['computer','phone','internet','digital','bilgisayar','telefon'],
  'business':       ['business','company','office','meeting','şirket','ofis','toplantı'],
};

function guessCategory(word, translation) {
  const combined = `${word} ${translation}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) return cat;
  }
  return 'general';
}

// ─── BATCH MIGRATION ─────────────────────────────────────────────────────────
/**
 * Birden fazla AguiLang1 dosyasını toplu migrate eder
 * @param {Object[]} files - [{ name: 'en-tr-a1.json', data: {...} }]
 * @returns {{ entries: WordEntry[], stats: Object }}
 */
export function batchMigrate(files) {
  const allEntries = [];
  const stats = { total: 0, byLanguage: {}, byLevel: {}, duplicates: 0 };
  const seenIds = new Set();

  for (const { name, data } of files) {
    const entries = convertAguiLang1File(data, name);

    entries.forEach(entry => {
      if (seenIds.has(entry.id)) {
        stats.duplicates++;
        return;
      }
      seenIds.add(entry.id);
      allEntries.push(entry);

      stats.byLanguage[entry.language] = (stats.byLanguage[entry.language] || 0) + 1;
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
    });
  }

  stats.total = allEntries.length;
  console.log('📊 Migration Stats:', stats);
  return { entries: allEntries, stats };
}

// ─── KULLANIM ÖRNEĞİ ─────────────────────────────────────────────────────────
/**
 * React component içinde kullanım:
 *
 * import { batchMigrate } from './migrationHelper'
 * import en_a1 from '../../aguilang1/en-tr-a1.json'
 * import de_b1 from '../../aguilang1/de-tr-b1.json'
 *
 * const { entries, stats } = batchMigrate([
 *   { name: 'en-tr-a1.json', data: en_a1 },
 *   { name: 'de-tr-b1.json', data: de_b1 },
 * ])
 *
 * // localStorage'a kaydet
 * localStorage.setItem('aguilang2_migrated_words', JSON.stringify(entries))
 */
