# AguiLang2 — Proje İlerleme Durumu

_Son güncelleme: 2026-04-15_

---

## Genel Durum

Proje aktif geliştirme aşamasında. Temel iskelet, tüm öğrenme akışı, ebeveyn kontrol sistemi ve sesli özellikler tamamlandı. Build temiz çıkıyor, bilinen hata yok.

**Stack:** React 19 · Vite 8 · React Router v7 · TailwindCSS 3 · localStorage (backend yok)

---

## Tamamlanan Sayfalar

### Öğrenci Akışı
| Sayfa | Route | Durum | Notlar |
|---|---|---|---|
| Profil Seçimi | `/` | ✅ Tamamlandı | Çocuk / yetişkin profil tipi |
| Dil Seçimi | `/language` | ✅ Tamamlandı | Ebeveyn kısıtlaması aktif |
| Kategori Seçimi | `/categories` | ✅ Tamamlandı | Ebeveyn izin filtresi, Diyaloglar kartı |
| Flash Kartlar | `/learn` | ✅ Tamamlandı | Günlük stat, gramer notu, STT, ← Önceki, 📋 gezilen kelimeler |
| Quiz Ekranı | `/quiz` | ✅ Tamamlandı | Yanlış-retry, çapraz kategori, sesli telaffuz sorusu (her 5'te 1) |
| Diyaloglar | `/dialogue` | ✅ Tamamlandı | 6 senaryo, TTS otomatik, Türkçe hint her iki rol için |
| Dashboard | `/dashboard` | ✅ Tamamlandı | Gerçek veriler, 7 günlük chart, zorlanılan kelimeler |
| Öğrendiklerim | `/learned` | ✅ Tamamlandı | Tüm 20 kategori, seviye grupları, arama |
| İstatistikler | `/stats` | ✅ Tamamlandı | Bar chart, kategori ilerleme, en uzun seri |
| Profil | `/profile` | ✅ Tamamlandı | Rozet sistemi, TTS ayarları, sıfırlama (profil korunuyor) |
| Oyna | `/play` | 🔲 Placeholder | "Yakında eklenecek" |

### Ebeveyn Sistemi
| Sayfa | Route | Durum | Notlar |
|---|---|---|---|
| Ebeveyn Kapısı | `/parent` | ✅ Tamamlandı | PIN ekranı, shake animasyonu, default "1234" |
| Ebeveyn Paneli | `/parent/panel` | ✅ Tamamlandı | 6 sekme (aşağıya bak) |

**ParentPanel sekmeleri:**
- **İstatistik (1)** — Çocuğun genel quiz ve kelime istatistikleri
- **Kontrol (2)** — Kategori açma/kapama, dil kısıtlaması
- **Plan (3)** — Günlük hedef, oturum süresi planlaması
- **Oturum (4)** — Sesli quiz toggle (`aguilang_speech_quiz`)
- **Sıfırla (5)** — word_stats, daily_stats, kategori bazlı veya tam sıfırlama (profil korunuyor)

### Layout / Navigasyon
| Bileşen | Durum | Notlar |
|---|---|---|
| AppLayout | ✅ Tamamlandı | Sidebar (web) + BottomNav (mobil) |
| Sidebar | ✅ Tamamlandı | 6 nav linki, aktif vurgu `/dialogue` dahil |
| BottomNav | ✅ Tamamlandı | 4 tab, aktif vurgu `/dialogue` dahil |
| AppRouter | ✅ Tamamlandı | Standalone + AppLayout rotaları, `/dialogue` + `/profile` |

---

## Tamamlanan Hook'lar

| Hook | Dosya | Açıklama |
|---|---|---|
| `useSession` | `hooks/useSession.js` | Quiz oturumu, `aguilang_word_stats` yazımı |
| `useDailyStats` | `hooks/useDailyStats.js` | `recordDaily`, `getTodayStats`, `getDailyStats(n)` |
| `useParentControls` | `hooks/useParentControls.js` | Ebeveyn ayarları + `readSpeechQuiz()` export |
| `useDailyPlan` | `hooks/useDailyPlan.js` | Günlük plan |
| `useProfile` | `hooks/useProfile.js` | Profil yönetimi |
| `useProgress` | `hooks/useProgress.js` | İlerleme takibi + `BADGE_DEFS` (10 rozet) |
| `useSettings` | `hooks/useSettings.js` | `ttsEnabled`, `ttsRate`, `dailyCardGoal` |
| `useSpeech` | `hooks/useSpeech.js` | TTS (`speak`, `isSpeaking`) + STT (`startListening`, `checkAnswer`, `transcript`) |

---

## localStorage Şeması

| Anahtar | Tip | İçerik |
|---|---|---|
| `aguilang_active_profile` | object | `{name, type, points, level, streak, initial}` |
| `aguilang_active_lang` | object | `{id, name}` |
| `aguilang_active_category` | object | `{id, name, emoji}` |
| `aguilang_active_categories` | string[] | Ebeveyn kategori izin listesi (null = hepsi açık) |
| `aguilang_word_stats` | object | `{wordId: {correct, wrong, seen}}` |
| `aguilang_daily_stats` | object | `{"2026-04-15": {seen, correct, wrong}}` |
| `aguilang_parent_pin` | string | PIN kodu (default: "1234") |
| `aguilang_parent_controls` | object | Dil ayarları, oturum limiti vb. |
| `aguilang_speech_quiz` | boolean | Sesli telaffuz sorusu aktif/pasif (default: true) |
| `aguilang_last_reset` | string | Son sıfırlama kaydı |

---

## Veri Dosyaları

- **20 kelime kategorisi:** `src/data/{cat}-a1.json` (animals, colors, numbers, fruits, vegetables, body, family, school, food, greetings, questions, clothing, home, transport, time, jobs, sports, places, adjectives, verbs)
- **Gramer notları:** `src/data/categories.js` içinde her kategoride `grammarNote: { sentences[], tip }` — A1 seviyesi
- **6 diyalog seti:** `src/data/dialogues/{scene}-a1.json` (home, market, park, restaurant, school, travel)

---

## Alınan Mimari Kararlar

| Karar | Gerekçe |
|---|---|
| Backend yok, sadece localStorage | Çocuk hedef kitlesi için kurulum kolaylığı, offline kullanım |
| Modal yerine ayrı sayfalar (`/learned`, `/stats`, `/profile`) | URL paylaşılabilirliği, back button davranışı |
| `window` custom event (`wordStatsUpdated`) | Bileşenler arası reaktivite, context/global state olmadan |
| `useRef` ile veri yükleme kilidi | Strict Mode çift mount'unda çift yüklemeyi önlemek için |
| Quiz: `startSession` useEffect deps'ten çıkarıldı | `startSession` her render'da yeniden oluşturulduğundan sonsuz döngüyü önler |
| STT alias: `checkAnswer: sttCheck` in QuizScreen | Local `checkAnswer` fonksiyonuyla isim çakışmasını önlemek için |
| "Her şeyi sıfırla" sadece 3 anahtarı siler | Profil, dil, PIN, ebeveyn kontrolleri korunmalı — kullanıcı oturumu bozulmasın |
| `isSpeechQ` computed at render | `speechQuizEnabled && sttSupported && current % 5 === 4 && q?.word != null` |
| `didSpeakRef` pattern (DialogueScreen) | `isSpeaking` false→true→false geçişini yakalamak için; initial false'tan korunmak |

---

## Bekleyen Görevler

### Yüksek Öncelik
- [ ] **Bahrom Hoca metodolojisi** — formül kartı güçlendirme (pattern drilling), hata dostu mesajlar (yanlış cevapta "Neredeyse! Doğrusu: X" tarzı geri bildirim)
- [ ] **Deploy** — Vercel/Netlify yayın + çocuk test kullanıcısıyla canlı test

### Orta Öncelik
- [ ] **Oyun sistemi** — 6 oyun + akıllı yönlendirme (araştırma aşamasında); `/play` route'u placeholder
- [ ] **Quiz sonuç ekranı** — oturum özeti, doğru/yanlış dökümü
- [ ] **Profil puanlama / level-up** — şu an statik değerler, gerçek mantık bağlanacak
- [ ] **Streak sıfırlama mantığı** — gerçek tarihe göre otomatik sıfırlama

### Düşük Öncelik
- [ ] ParentPanel İstatistik sekmesi verilerinin gerçek `aguilang_word_stats`'a bağlanması
- [ ] BottomNav'a `/learned` veya `/stats` tab'ı eklenecek mi? (şu an 4 tab)
- [ ] Zorlanılan kelimeler için "Tekrar Et" butonu doğrudan quiz'e filtreli yönlendirme

---

## Git Geçmişi

```
ea7405d  Günlük istatistik + öğrenilen kelimeler + quiz iyileştirmeleri
2c9eb75  Ebeveyn kategori kontrolu + ParentPanel tamamlandi
fc29696  Sidebar ve BottomNav aktif rota vurgusu eklendi
9ce4188  Quiz wordStats kaydı + Dashboard zorlanılan kelimeler
7976567  Cümle verileri eklendi - EN/DE/ES
76e167b  QuizScreen + profil ekleme tamamlandi
9083478  Büyük veri dosyaları gitignore eklendi
67cac4c  AguiLang v2 - temel sayfalar tamamlandi
```

> **Not:** `ea7405d` sonrası tüm değişiklikler henüz commit edilmedi.
> Commit edilecekler: gramer notu, STT (FlashCards + QuizScreen), DialogueScreen, ProfilePage,
> ParentPanel (ses quiz + sıfırla sekmesi), CategorySelect (Diyaloglar kartı), AppRouter güncellemesi.
