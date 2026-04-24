/**
 * AguiLang2 - Dictionary Service
 * MyMemory API + önbellek + fallback stratejisi
 *
 * MyMemory: ücretsiz, 5000 istek/gün (email ile 10000/gün)
 * API: https://api.mymemory.translated.net/get?q=WORD&langpair=en|tr
 */

const CACHE_KEY = 'aguilang2_dict_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 gün
const API_BASE = 'https://api.mymemory.translated.net/get';

// İsteğe bağlı: MyMemory hesap email'i (günlük limit artışı için)
// .env: VITE_MYMEMORY_EMAIL=your@email.com
const USER_EMAIL = import.meta.env?.VITE_MYMEMORY_EMAIL || '';

// ─── CACHE MANAGEMENT ────────────────────────────────────────────────────────
function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // localStorage doluysa eski girdileri temizle
    clearOldCache();
  }
}

function clearOldCache() {
  const cache = getCache();
  const now = Date.now();
  const cleaned = Object.fromEntries(
    Object.entries(cache).filter(([, v]) => now - v.timestamp < CACHE_TTL)
  );
  localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
}

function getCacheKey(word, sourceLang, targetLang) {
  return `${word.toLowerCase().trim()}|${sourceLang}|${targetLang}`;
}

// ─── MYMEMORY API ─────────────────────────────────────────────────────────────
/**
 * MyMemory'den çeviri al
 * @param {string} word
 * @param {string} sourceLang - 'en','de','es'
 * @param {string} targetLang - 'tr'
 */
async function fetchFromMyMemory(word, sourceLang = 'en', targetLang = 'tr') {
  const langpair = `${sourceLang}|${targetLang}`;
  const params = new URLSearchParams({ q: word, langpair });
  if (USER_EMAIL) params.append('de', USER_EMAIL);

  const response = await fetch(`${API_BASE}?${params}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error(`MyMemory API error: ${response.status}`);

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory: ${data.responseDetails}`);
  }

  return {
    translation: data.responseData.translatedText,
    confidence: data.responseData.match,
    alternatives: (data.matches || [])
      .slice(0, 5)
      .filter(m => m.translation !== data.responseData.translatedText)
      .map(m => ({ text: m.translation, source: m.subject })),
    source: 'mymemory',
  };
}

// ─── FALLBACK: WIKTIONARY ─────────────────────────────────────────────────────
async function fetchFromWiktionary(word, sourceLang = 'en') {
  const response = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
    { signal: AbortSignal.timeout(4000) }
  );
  if (!response.ok) throw new Error('Wiktionary error');

  const data = await response.json();
  return {
    translation: null,
    definition: data.extract || null,
    phonetic: data.pronunciation || null,
    source: 'wiktionary',
  };
}

// ─── ANA SÖZLÜK FONKSİYONU ───────────────────────────────────────────────────
/**
 * Kelime sorgula - cache → MyMemory → Wiktionary fallback
 *
 * @param {string} word
 * @param {string} sourceLang - 'en' | 'de' | 'es'
 * @param {string} targetLang - 'tr'
 * @returns {Promise<DictionaryResult>}
 */
export async function lookupWord(word, sourceLang = 'en', targetLang = 'tr') {
  if (!word?.trim()) throw new Error('Kelime boş olamaz');

  const cacheKey = getCacheKey(word, sourceLang, targetLang);
  const cache = getCache();

  // Cache kontrolü
  if (cache[cacheKey]) {
    const entry = cache[cacheKey];
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return { ...entry.data, fromCache: true };
    }
  }

  let result;

  // 1. MyMemory dene
  try {
    const myMemoryResult = await fetchFromMyMemory(word, sourceLang, targetLang);
    result = {
      word: word.trim(),
      translation: myMemoryResult.translation,
      alternatives: myMemoryResult.alternatives || [],
      confidence: myMemoryResult.confidence,
      sourceLang,
      targetLang,
      source: 'mymemory',
      timestamp: Date.now(),
    };
  } catch (myMemoryError) {
    console.warn('MyMemory başarısız, Wiktionary deneniyor...', myMemoryError);

    // 2. Wiktionary fallback
    try {
      const wikiResult = await fetchFromWiktionary(word, sourceLang);
      result = {
        word: word.trim(),
        translation: null,
        definition: wikiResult.definition,
        phonetic: wikiResult.phonetic,
        alternatives: [],
        confidence: 0,
        sourceLang,
        targetLang,
        source: 'wiktionary',
        timestamp: Date.now(),
      };
    } catch {
      throw new Error(`"${word}" için çeviri bulunamadı. İnternet bağlantınızı kontrol edin.`);
    }
  }

  // Cache'e kaydet
  const updatedCache = { ...getCache(), [cacheKey]: { data: result, timestamp: Date.now() } };
  setCache(updatedCache);

  return result;
}

// ─── TOPLU ÇEVIRI ─────────────────────────────────────────────────────────────
/**
 * Birden fazla kelimeyi sırayla çevirir (rate limit'e takılmamak için gecikmeli)
 * @param {string[]} words
 * @param {string} sourceLang
 * @param {number} delayMs - istekler arası bekleme (varsayılan 300ms)
 */
export async function batchLookup(words, sourceLang = 'en', delayMs = 300) {
  const results = [];

  for (let i = 0; i < words.length; i++) {
    try {
      const result = await lookupWord(words[i], sourceLang);
      results.push({ word: words[i], ...result, error: null });
    } catch (err) {
      results.push({ word: words[i], error: err.message });
    }

    // Son kelime değilse bekle
    if (i < words.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

// ─── CACHE STATS ─────────────────────────────────────────────────────────────
export function getCacheStats() {
  const cache = getCache();
  const entries = Object.values(cache);
  const now = Date.now();
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(e => now - e.timestamp < CACHE_TTL).length,
    sizeKB: Math.round(JSON.stringify(cache).length / 1024),
  };
}

export function clearDictionaryCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ─── HOOKS KULLANIMI ─────────────────────────────────────────────────────────
/**
 * React hook olarak kullanmak için:
 *
 * function useDictionary() {
 *   const [result, setResult] = useState(null)
 *   const [loading, setLoading] = useState(false)
 *   const [error, setError] = useState(null)
 *
 *   const lookup = useCallback(async (word, lang) => {
 *     setLoading(true); setError(null)
 *     try {
 *       const data = await lookupWord(word, lang)
 *       setResult(data)
 *     } catch(e) {
 *       setError(e.message)
 *     } finally {
 *       setLoading(false)
 *     }
 *   }, [])
 *
 *   return { result, loading, error, lookup }
 * }
 */
