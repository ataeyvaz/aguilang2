/**
 * AguiLang2 - Unified Data Schema
 * Tüm veri kaynaklarını (AguiLang1 + Oxford 3000 + kullanıcı verisi) tek formata alır
 */

// ─── LEVEL DEFINITIONS ──────────────────────────────────────────────────────
export const LEVELS = {
  A1: { label: 'A1 Başlangıç',     order: 1, color: '#22c55e', minScore: 0   },
  A2: { label: 'A2 Temel',         order: 2, color: '#84cc16', minScore: 200  },
  B1: { label: 'B1 Orta-Alt',      order: 3, color: '#eab308', minScore: 500  },
  B2: { label: 'B2 Orta',          order: 4, color: '#f97316', minScore: 900  },
  B3: { label: 'B3 Orta-Üst',      order: 5, color: '#ef4444', minScore: 1400 },
  C1: { label: 'C1 İleri',         order: 6, color: '#8b5cf6', minScore: 2000 },
};

// ─── SUPPORTED LANGUAGES ────────────────────────────────────────────────────
export const LANGUAGES = {
  TR: { code: 'tr', label: 'Türkçe',  flag: '🇹🇷', myMemoryCode: 'tr-TR' },
  EN: { code: 'en', label: 'İngilizce', flag: '🇬🇧', myMemoryCode: 'en-GB' },
  DE: { code: 'de', label: 'Almanca',  flag: '🇩🇪', myMemoryCode: 'de-DE' },
  ES: { code: 'es', label: 'İspanyolca', flag: '🇪🇸', myMemoryCode: 'es-ES' },
};

// ─── WORD ENTRY SCHEMA ──────────────────────────────────────────────────────
/**
 * @typedef {Object} WordEntry
 * @property {string}   id          - Unique ID: "{lang}_{level}_{category}_{index}"
 * @property {string}   word        - Hedef dildeki kelime
 * @property {string}   translation - Türkçe karşılık
 * @property {string}   language    - 'en' | 'de' | 'es'
 * @property {string}   level       - 'A1'|'A2'|'B1'|'B2'|'B3'|'C1'
 * @property {string}   category    - Kategori adı (slug formatında)
 * @property {string}   [phonetic]  - IPA fonetik (opsiyonel)
 * @property {string[]} [examples]  - Örnek cümleler
 * @property {string}   [partOfSpeech] - 'noun'|'verb'|'adjective'|'adverb'|'phrase'
 * @property {string}   source      - 'tatoeba'|'oxford3000'|'user'|'manual'
 * @property {number}   [frequency] - Oxford 3000 frekans skoru (1-3000)
 */

// ─── CATEGORY SCHEMA ────────────────────────────────────────────────────────
/**
 * @typedef {Object} Category
 * @property {string}   id       - slug: 'daily-life'
 * @property {string}   label    - 'Günlük Hayat'
 * @property {string}   icon     - emoji
 * @property {string[]} levels   - hangi seviyelerde var
 * @property {string}   [color]  - tema rengi
 */

// AguiLang2 mevcut 20 kategori + yeni eklenenler
export const CATEGORIES = {
  // Mevcut AguiLang2 kategorileri (A1)
  'greetings':        { label: 'Selamlaşma',      icon: '👋', levels: ['A1','A2'] },
  'numbers':          { label: 'Sayılar',          icon: '🔢', levels: ['A1','A2'] },
  'colors':           { label: 'Renkler',          icon: '🎨', levels: ['A1'] },
  'family':           { label: 'Aile',             icon: '👨‍👩‍👧', levels: ['A1','A2'] },
  'food-drinks':      { label: 'Yiyecek & İçecek', icon: '🍎', levels: ['A1','A2','B1'] },
  'animals':          { label: 'Hayvanlar',        icon: '🐾', levels: ['A1','A2'] },
  'body-parts':       { label: 'Vücut Parçaları',  icon: '🫀', levels: ['A1','A2'] },
  'clothing':         { label: 'Giysi',            icon: '👕', levels: ['A1','A2'] },
  'transportation':   { label: 'Ulaşım',           icon: '🚗', levels: ['A1','A2','B1'] },
  'weather':          { label: 'Hava Durumu',      icon: '☀️', levels: ['A1','A2','B1'] },
  'home':             { label: 'Ev & Mobilya',     icon: '🏠', levels: ['A1','A2'] },
  'school':           { label: 'Okul',             icon: '🏫', levels: ['A1','A2'] },
  'sports':           { label: 'Spor',             icon: '⚽', levels: ['A1','A2','B1'] },
  'time':             { label: 'Zaman',            icon: '🕐', levels: ['A1','A2'] },
  'professions':      { label: 'Meslekler',        icon: '👩‍💼', levels: ['A1','A2','B1'] },
  'nature':           { label: 'Doğa',             icon: '🌿', levels: ['A1','A2','B1'] },
  'emotions':         { label: 'Duygular',         icon: '😊', levels: ['A1','A2','B1'] },
  'shopping':         { label: 'Alışveriş',        icon: '🛍️', levels: ['A2','B1'] },
  'health':           { label: 'Sağlık',           icon: '🏥', levels: ['A2','B1','B2'] },
  'travel':           { label: 'Seyahat',          icon: '✈️', levels: ['A2','B1','B2'] },
  // Yeni B1+ kategorileri
  'technology':       { label: 'Teknoloji',        icon: '💻', levels: ['B1','B2','B3'] },
  'business':         { label: 'İş Dünyası',      icon: '💼', levels: ['B1','B2','B3'] },
  'culture':          { label: 'Kültür & Sanat',   icon: '🎭', levels: ['B1','B2','B3'] },
  'science':          { label: 'Bilim',            icon: '🔬', levels: ['B2','B3','C1'] },
  'politics':         { label: 'Politika',         icon: '🏛️', levels: ['B2','B3','C1'] },
  'environment':      { label: 'Çevre',            icon: '🌍', levels: ['B1','B2','B3'] },
  'idioms':           { label: 'Deyimler',         icon: '💬', levels: ['B2','B3','C1'] },
  'academic':         { label: 'Akademik',         icon: '📚', levels: ['B3','C1'] },
};

// ─── USER PROGRESS SCHEMA ───────────────────────────────────────────────────
/**
 * localStorage key: 'aguilang2_progress'
 * @typedef {Object} UserProgress
 * @property {string} userId
 * @property {Object.<string, WordProgress>} words  - wordId → progress
 * @property {Object} stats
 * @property {string} currentLevel
 * @property {string} targetLanguage
 */

/**
 * @typedef {Object} WordProgress
 * @property {number} seen         - kaç kez görüldü
 * @property {number} correct      - doğru sayısı
 * @property {number} incorrect    - yanlış sayısı
 * @property {number} streak       - mevcut seri
 * @property {number} lastSeen     - timestamp
 * @property {boolean} mastered    - öğrenildi mi
 * @property {number} nextReview   - spaced repetition timestamp
 */

export const createWordProgress = () => ({
  seen: 0, correct: 0, incorrect: 0,
  streak: 0, lastSeen: null, mastered: false, nextReview: null,
});

export const createUserProgress = (targetLanguage = 'en') => ({
  userId: `user_${Date.now()}`,
  targetLanguage,
  currentLevel: 'A1',
  words: {},
  stats: {
    totalXP: 0, streak: 0, lastActive: null,
    sessionsCompleted: 0, wordsLearned: 0,
  },
  settings: {
    dailyGoal: 10, notifications: true, darkMode: false,
  },
});
