import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParentControls, ENERGY_PRESETS } from '../../hooks/useParentControls'

// ── Sabitler ─────────────────────────────────────────────────────

const WEEKLY_PLAN_KEY = 'aguilang_weekly_plan'

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const ALL_CATS = [
  { id: 'animals',    label: 'Hayvanlar',   emoji: '🐾' },
  { id: 'colors',     label: 'Renkler',     emoji: '🎨' },
  { id: 'numbers',    label: 'Sayılar',     emoji: '🔢' },
  { id: 'fruits',     label: 'Meyveler',    emoji: '🍎' },
  { id: 'vegetables', label: 'Sebzeler',    emoji: '🥦' },
  { id: 'body',       label: 'Vücut',       emoji: '🫀' },
  { id: 'family',     label: 'Aile',        emoji: '👨‍👩‍👧' },
  { id: 'school',     label: 'Okul',        emoji: '🏫' },
  { id: 'food',       label: 'Yiyecekler',  emoji: '🍽️' },
  { id: 'greetings',  label: 'Selamlaşma',  emoji: '👋' },
  { id: 'questions',  label: 'Sorular',     emoji: '❓' },
  { id: 'clothing',   label: 'Giyim',       emoji: '👕' },
  { id: 'home',       label: 'Ev',          emoji: '🏠' },
  { id: 'transport',  label: 'Ulaşım',      emoji: '🚗' },
  { id: 'time',       label: 'Zaman',       emoji: '⏰' },
  { id: 'jobs',       label: 'Meslekler',   emoji: '💼' },
  { id: 'sports',     label: 'Spor',        emoji: '⚽' },
  { id: 'places',     label: 'Yerler',      emoji: '📍' },
  { id: 'adjectives', label: 'Sıfatlar',    emoji: '📝' },
  { id: 'verbs',      label: 'Fiiller',     emoji: '🏃' },
]

const LANG_OPTIONS = [
  { id: 'en', label: 'İngilizce', flag: '🇬🇧' },
  { id: 'de', label: 'Almanca',   flag: '🇩🇪' },
  { id: 'es', label: 'İspanyolca', flag: '🇪🇸' },
]

const ENERGY_OPTIONS = [
  { mode: 'low',    label: 'Düşük',  icon: '🌙', desc: `${ENERGY_PRESETS.low.cardLimit} kart · ${ENERGY_PRESETS.low.durationMinutes} dk` },
  { mode: 'medium', label: 'Orta',   icon: '⚡', desc: `${ENERGY_PRESETS.medium.cardLimit} kart · ${ENERGY_PRESETS.medium.durationMinutes} dk` },
  { mode: 'high',   label: 'Yüksek', icon: '🔥', desc: `${ENERGY_PRESETS.high.cardLimit} kart · ${ENERGY_PRESETS.high.durationMinutes} dk` },
  { mode: 'custom', label: 'Manuel', icon: '⚙️', desc: 'Özelleştir' },
]

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0') }

function loadWeeklyPlan() {
  try {
    const raw = localStorage.getItem(WEEKLY_PLAN_KEY)
    return raw
      ? JSON.parse(raw)
      : DAYS.map(day => ({ day, categoryId: 'animals', energy: 'medium' }))
  } catch {
    return DAYS.map(day => ({ day, categoryId: 'animals', energy: 'medium' }))
  }
}

// ── Stil yardımcıları ─────────────────────────────────────────────

const card = {
  background: 'white',
  borderRadius: '14px',
  border: '1px solid #E2E8F0',
  padding: '20px',
  marginBottom: '14px',
}

const sectionTitle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '14px',
  fontWeight: '700',
  color: '#0F172A',
  marginBottom: '12px',
}

const saveBtn = {
  width: '100%',
  padding: '13px',
  background: '#0891B2',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
}

const Toggle = ({ on, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      width: '44px', height: '24px',
      borderRadius: '12px',
      background: on ? '#0891B2' : '#E2E8F0',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: '18px', height: '18px',
      borderRadius: '50%',
      background: 'white',
      position: 'absolute',
      top: '3px',
      left: on ? '23px' : '3px',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
)

// ── Ana bileşen ───────────────────────────────────────────────────

export default function ParentPanel() {
  const navigate = useNavigate()

  const {
    langSettings,
    energyMode: energyData,
    activeCategories,
    timeSettings,
    vacationMode,
    notifSettings,
  } = useParentControls()

  const [activeTab, setActiveTab] = useState(1)
  const [savedMsg, setSavedMsg] = useState('')

  // Tab 2 — Kontrol
  const [localLangEnabled, setLocalLangEnabled] = useState(langSettings.enabled)
  const [localLangPriority, setLocalLangPriority] = useState(langSettings.priority)
  const [localEnergy, setLocalEnergy] = useState(energyData.mode)
  const [localCats, setLocalCats] = useState(activeCategories)
  const [localVacation, setLocalVacation] = useState(vacationMode.active)

  // Tab 3 — Plan
  const [weeklyPlan, setWeeklyPlan] = useState(loadWeeklyPlan)

  // Tab 4 — Oturum
  const [startTime, setStartTime] = useState(
    `${pad(timeSettings.startHour)}:${pad(timeSettings.startMin)}`
  )
  const [endTime, setEndTime] = useState(
    `${pad(timeSettings.endHour)}:${pad(timeSettings.endMin)}`
  )
  const [weekendOn, setWeekendOn] = useState(timeSettings.weekendEnabled)
  const [localNotifs, setLocalNotifs] = useState(notifSettings)

  // ── Kaydedme ────────────────────────────────────────────────────

  const showSaved = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const saveControls = () => {
    localStorage.setItem('aguilang_lang_settings',
      JSON.stringify({ enabled: localLangEnabled, priority: localLangPriority }))
    localStorage.setItem('aguilang_energy_mode',
      JSON.stringify({ mode: localEnergy, custom: energyData.custom ?? ENERGY_PRESETS.medium }))
    localStorage.setItem('aguilang_active_categories', JSON.stringify(localCats))
    localStorage.setItem('aguilang_vacation_mode', JSON.stringify({ active: localVacation }))
    showSaved('Kontrol ayarları kaydedildi ✓')
  }

  const savePlan = () => {
    localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(weeklyPlan))
    showSaved('Haftalık plan kaydedildi ✓')
  }

  const saveSession = () => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    localStorage.setItem('aguilang_time_settings',
      JSON.stringify({ startHour: sh, startMin: sm, endHour: eh, endMin: em, weekendEnabled: weekendOn }))
    localStorage.setItem('aguilang_notifications', JSON.stringify(localNotifs))
    showSaved('Oturum ayarları kaydedildi ✓')
  }

  // ── Okuma (Tab 1) ────────────────────────────────────────────────

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_active_profile') || 'null') }
    catch { return null }
  })()

  const wordStats = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}') }
    catch { return {} }
  })()

  const hardWords = Object.entries(wordStats)
    .filter(([, s]) => s.wrong >= 2)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 8)

  const totalSeen   = Object.values(wordStats).reduce((s, w) => s + (w.seen || 0), 0)
  const totalCorrect = Object.values(wordStats).reduce((s, w) => s + (w.correct || 0), 0)

  // ── Tab içerikleri ───────────────────────────────────────────────

  const renderStats = () => (
    <div>
      {/* Profil kartı */}
      {profile ? (
        <div style={card}>
          <div style={sectionTitle}>👤 Aktif Profil</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#EFF8FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px', fontWeight: '800', color: '#0891B2',
            }}>
              {profile.initial || profile.name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '16px' }}>
                {profile.name || 'İsimsiz'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                🔥 {profile.streak || 0} gün seri &nbsp;·&nbsp;
                ⭐ {profile.points || 0} puan &nbsp;·&nbsp;
                Seviye {profile.level || 1}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
          Henüz profil oluşturulmamış.
        </div>
      )}

      {/* Kelime istatistikleri */}
      <div style={card}>
        <div style={sectionTitle}>📊 Kelime İstatistikleri</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Toplam Görülen', value: totalSeen },
            { label: 'Doğru Cevap',   value: totalCorrect },
            { label: 'Zorlanılan',     value: hardWords.length },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#F8FAFC', borderRadius: '10px',
              padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '22px', fontWeight: '800', color: '#0F172A',
              }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {hardWords.length > 0 && (
          <>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>
              ⚠️ Zorlanılan kelimeler
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {hardWords.map(([id, s]) => (
                <div key={id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#FFF7ED', borderRadius: '8px', padding: '8px 12px',
                  border: '1px solid #FED7AA',
                }}>
                  <span style={{ fontWeight: '700', color: '#9C4600', fontSize: '14px' }}>{id}</span>
                  <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>
                    ❌ {s.wrong} yanlış
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Haftalık özet — hardcoded */}
      <div style={card}>
        <div style={sectionTitle}>📅 Haftalık Özet</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map((day, i) => {
            const pct = [80, 100, 60, 40, 90][i]
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', width: '28px' }}>{day}</span>
                <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#0891B2', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748B', width: '32px', textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderControls = () => (
    <div>
      {/* Dil kontrolü */}
      <div style={card}>
        <div style={sectionTitle}>🌐 Dil Kontrolü</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {LANG_OPTIONS.map(({ id, label, flag }) => {
            const enabled = localLangEnabled.includes(id)
            return (
              <button
                key={id}
                onClick={() => {
                  if (enabled && localLangEnabled.length <= 1) return
                  setLocalLangEnabled(prev =>
                    enabled ? prev.filter(l => l !== id) : [...prev, id]
                  )
                }}
                style={{
                  flex: 1, padding: '10px 8px',
                  border: `2px solid ${enabled ? '#0891B2' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  background: enabled ? '#EFF8FF' : 'white',
                  color: enabled ? '#0891B2' : '#94A3B8',
                  fontWeight: '700', fontSize: '13px',
                  cursor: localLangEnabled.length === 1 && enabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{flag}</div>
                {label}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>
          Öncelikli dil
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {LANG_OPTIONS.filter(l => localLangEnabled.includes(l.id)).map(({ id, label, flag }) => (
            <label key={id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              border: `1.5px solid ${localLangPriority === id ? '#0891B2' : '#E2E8F0'}`,
              background: localLangPriority === id ? '#EFF8FF' : 'white',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="lang-priority"
                value={id}
                checked={localLangPriority === id}
                onChange={() => setLocalLangPriority(id)}
                style={{ accentColor: '#0891B2' }}
              />
              <span style={{ fontSize: '18px' }}>{flag}</span>
              <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Enerji seviyesi */}
      <div style={card}>
        <div style={sectionTitle}>⚡ Enerji Seviyesi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {ENERGY_OPTIONS.map(({ mode, label, icon, desc }) => {
            const active = localEnergy === mode
            return (
              <button
                key={mode}
                onClick={() => setLocalEnergy(mode)}
                style={{
                  padding: '14px 12px', textAlign: 'left',
                  border: `2px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  background: active ? '#EFF8FF' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px', fontWeight: '700',
                  color: active ? '#0891B2' : '#0F172A',
                }}>{label}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Aktif kategoriler */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={sectionTitle}>📚 Aktif Kategoriler</div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            {localCats.length}/20 seçili
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {ALL_CATS.map(({ id, label, emoji }) => {
            const checked = localCats.includes(id)
            return (
              <label key={id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '8px',
                border: `1px solid ${checked ? '#BAE6FD' : '#E2E8F0'}`,
                background: checked ? '#F0F9FF' : 'white',
                cursor: localCats.length <= 3 && checked ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked && localCats.length <= 3) return
                    setLocalCats(prev =>
                      checked ? prev.filter(c => c !== id) : [...prev, id]
                    )
                  }}
                  style={{ accentColor: '#0891B2', flexShrink: 0 }}
                />
                <span>{emoji}</span>
                <span style={{ fontWeight: checked ? '600' : '400', color: checked ? '#0F172A' : '#64748B' }}>
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Tatil modu */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>🏖️ Tatil Modu</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Açıkken zaman kısıtlaması devre dışı
            </div>
          </div>
          <Toggle on={localVacation} onToggle={() => setLocalVacation(v => !v)} />
        </div>
      </div>

      <button onClick={saveControls} style={saveBtn}>Kaydet</button>
    </div>
  )

  const renderPlan = () => (
    <div>
      <div style={card}>
        <div style={sectionTitle}>📅 Haftalık Öğrenme Planı</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {weeklyPlan.map((entry, i) => (
            <div key={entry.day} style={{
              padding: '12px', borderRadius: '10px',
              border: '1px solid #E2E8F0', background: '#F8FAFC',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                {entry.day}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={entry.categoryId}
                  onChange={e => {
                    const next = [...weeklyPlan]
                    next[i] = { ...next[i], categoryId: e.target.value }
                    setWeeklyPlan(next)
                  }}
                  style={{
                    flex: 2, padding: '8px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '13px',
                    background: 'white', color: '#0F172A',
                  }}
                >
                  {ALL_CATS.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <select
                  value={entry.energy}
                  onChange={e => {
                    const next = [...weeklyPlan]
                    next[i] = { ...next[i], energy: e.target.value }
                    setWeeklyPlan(next)
                  }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '13px',
                    background: 'white', color: '#0F172A',
                  }}
                >
                  <option value="low">🌙 Düşük</option>
                  <option value="medium">⚡ Orta</option>
                  <option value="high">🔥 Yüksek</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={savePlan} style={saveBtn}>Kaydet</button>
    </div>
  )

  const renderSession = () => (
    <div>
      {/* Çalışma saatleri */}
      <div style={card}>
        <div style={sectionTitle}>🕐 Çalışma Saatleri</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: '600' }}>
              Başlangıç
            </div>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600', color: '#0F172A',
                background: 'white', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: '600' }}>
              Bitiş
            </div>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600', color: '#0F172A',
                background: 'white', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>
              Hafta Sonu
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Cumartesi ve Pazar çalışma
            </div>
          </div>
          <Toggle on={weekendOn} onToggle={() => setWeekendOn(v => !v)} />
        </div>
      </div>

      {/* Bildirimler */}
      <div style={card}>
        <div style={sectionTitle}>🔔 Bildirimler</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'onComplete',    label: 'Ders Tamamlandı',   desc: 'Her ders sonunda bildirim' },
            { key: 'streakWarning', label: 'Seri Uyarısı',      desc: 'Seri kırılmak üzereyken' },
            { key: 'weeklyReport',  label: 'Haftalık Rapor',    desc: 'Pazar günü özet raporu' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
              </div>
              <Toggle
                on={localNotifs[key]}
                onToggle={() => setLocalNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
              />
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveSession} style={saveBtn}>Kaydet</button>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────

  const TABS = [
    { id: 1, label: 'İstatistik', icon: '📊' },
    { id: 2, label: 'Kontrol',    icon: '🎛️' },
    { id: 3, label: 'Plan',       icon: '📅' },
    { id: 4, label: 'Oturum',     icon: '🕐' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/parent')}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px',
              flexShrink: 0,
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '17px', fontWeight: '800', color: '#0F172A',
            }}>
              🔒 Ebeveyn Paneli
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: '8px',
              padding: '6px 12px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', color: '#0891B2',
            }}
          >
            Çık
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: '640px', margin: '0 auto',
          display: 'flex', gap: '0',
        }}>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, padding: '12px 4px',
                background: 'none', border: 'none',
                borderBottom: `2.5px solid ${activeTab === id ? '#0891B2' : 'transparent'}`,
                color: activeTab === id ? '#0891B2' : '#94A3B8',
                fontWeight: activeTab === id ? '700' : '500',
                fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Kaydedildi bildirimi */}
      {savedMsg && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          color: '#15803D', padding: '10px 20px',
          textAlign: 'center', fontSize: '13px', fontWeight: '600',
        }}>
          {savedMsg}
        </div>
      )}

      {/* İçerik */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px' }}>
        {activeTab === 1 && renderStats()}
        {activeTab === 2 && renderControls()}
        {activeTab === 3 && renderPlan()}
        {activeTab === 4 && renderSession()}
      </div>
    </div>
  )
}
