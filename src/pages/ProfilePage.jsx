import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress, BADGE_DEFS } from '../hooks/useProgress'
import { useSettings } from '../hooks/useSettings'

const TTS_RATES = [
  { label: 'Yavaş',  value: 0.6 },
  { label: 'Normal', value: 0.9 },
  { label: 'Hızlı',  value: 1.2 },
]

const Divider = () => (
  <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }} />
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const profile   = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  const profileId = profile.id || profile.name || 'default'
  const isChild   = profile.type === 'child'

  const { earnedBadges, allBadges } = useProgress(profileId)
  const { settings, save }          = useSettings()

  const earnedIds = new Set(earnedBadges.map(b => b.id))

  const [resetMsg, setResetMsg] = useState('')

  const confirmReset = (msg, fn) => {
    if (window.confirm(msg)) {
      fn()
      setResetMsg('Sıfırlandı ✓')
      setTimeout(() => setResetMsg(''), 2500)
      window.dispatchEvent(new Event('wordStatsUpdated'))
    }
  }

  const resetWords = () => confirmReset(
    'Tüm kelime istatistikleri silinecek. Emin misin?',
    () => localStorage.setItem('aguilang_word_stats', '{}')
  )

  const resetDaily = () => confirmReset(
    'Tüm günlük veriler silinecek. Emin misin?',
    () => localStorage.setItem('aguilang_daily_stats', '{}')
  )

  const resetAll = () => {
    if (!window.confirm('Tüm kelime istatistikleri ve günlük veriler silinecek. Profilin korunacak. Emin misin?')) return
    if (!window.confirm('Son kez onaylıyor musun? Bu işlem geri alınamaz.')) return
    const RESET_KEYS = ['aguilang_word_stats', 'aguilang_daily_stats', 'aguilang_last_reset']
    RESET_KEYS.forEach(k => localStorage.removeItem(k))
    window.dispatchEvent(new Event('wordStatsUpdated'))
    setResetMsg('Sıfırlandı ✓')
    setTimeout(() => setResetMsg(''), 2500)
  }

  // ── Stil sabitleri ────────────────────────────────────────────
  const card = {
    background: 'white', borderRadius: '16px',
    border: '1px solid #E2E8F0', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '12px',
  }

  const sectionTitle = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>
            👤 Profil
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* ── 1. Profil Kartı ───────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891B2, #0E7490)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              {profile.initial || (profile.name?.[0]?.toUpperCase()) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px', fontWeight: '800', color: '#0F172A',
              }}>
                {profile.name || 'İsimsiz'}
              </div>
              <div style={{
                display: 'inline-block', marginTop: '4px',
                background: isChild ? '#EFF8FF' : '#F0FDF4',
                border: `1px solid ${isChild ? '#BAE6FD' : '#BBF7D0'}`,
                borderRadius: '20px', padding: '2px 10px',
                fontSize: '12px', fontWeight: '700',
                color: isChild ? '#0891B2' : '#15803D',
              }}>
                {isChild ? '🧒 Çocuk' : '👤 Yetişkin'}
              </div>
            </div>
          </div>

          <Divider />

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            {[
              { icon: '⭐', label: 'Puan',   value: profile.points || 0 },
              { icon: '🏆', label: 'Seviye', value: profile.level  || 1 },
              { icon: '🔥', label: 'Seri',   value: `${profile.streak || 0} gün` },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '12px', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px', fontWeight: '800', color: '#0F172A',
                }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', marginTop: '16px', padding: '11px',
              background: 'white', border: '1.5px solid #E2E8F0',
              borderRadius: '10px', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', fontWeight: '600', color: '#64748B',
            }}
          >
            🔄 Profili Değiştir
          </button>
        </div>

        {/* ── 2. Rozetler ───────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>🏅 Rozetler</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: '10px',
          }}>
            {BADGE_DEFS.map(badge => {
              const earned = earnedIds.has(badge.id)
              return (
                <div
                  key={badge.id}
                  title={badge.desc}
                  style={{
                    background: earned ? '#EFF8FF' : '#F8FAFC',
                    border: `1.5px solid ${earned ? '#BAE6FD' : '#E2E8F0'}`,
                    borderRadius: '12px', padding: '12px 8px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '6px',
                    opacity: earned ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontSize: '24px', position: 'relative' }}>
                    {badge.icon}
                    {!earned && (
                      <span style={{
                        position: 'absolute', bottom: -4, right: -6,
                        fontSize: '12px',
                      }}>🔒</span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '11px', fontWeight: '700',
                    color: earned ? '#0F172A' : '#94A3B8',
                    textAlign: 'center', lineHeight: '1.3',
                  }}>
                    {badge.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. Ayarlar ────────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>⚙️ Ayarlar</div>

          {/* TTS Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>Sesli Okuma (TTS)</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Kelimeler otomatik seslendirilir</div>
            </div>
            <div
              onClick={() => save({ ttsEnabled: !settings.ttsEnabled })}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                background: settings.ttsEnabled ? '#0891B2' : '#E2E8F0',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px',
                left: settings.ttsEnabled ? '23px' : '3px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          <Divider />

          {/* TTS Hızı */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px', marginBottom: '10px' }}>
              Okuma Hızı
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {TTS_RATES.map(r => {
                const active = Math.abs(settings.ttsRate - r.value) < 0.15
                return (
                  <button
                    key={r.label}
                    onClick={() => save({ ttsRate: r.value })}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: active ? '#0891B2' : 'white',
                      border: `1.5px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px', fontWeight: '700',
                      color: active ? 'white' : '#64748B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sıfırlama — sadece yetişkin */}
          {!isChild && (
            <>
              <Divider />
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: '700', color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>
                  Veri Sıfırlama
                </div>
                {resetMsg && (
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: '8px', padding: '8px 14px',
                    fontSize: '13px', color: '#15803D', fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    ✅ {resetMsg}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={resetWords}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FFF7ED', border: '1.5px solid #FED7AA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                      color: '#9C4600', textAlign: 'left',
                    }}
                  >
                    📊 Kelime istatistiklerini sıfırla
                  </button>
                  <button
                    onClick={resetDaily}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FFF7ED', border: '1.5px solid #FED7AA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                      color: '#9C4600', textAlign: 'left',
                    }}
                  >
                    📅 Günlük verileri sıfırla
                  </button>
                  <button
                    onClick={resetAll}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FEF2F2', border: '1.5px solid #FECACA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                      color: '#DC2626', textAlign: 'left',
                    }}
                  >
                    🗑️ Tüm Öğrenme Verilerini Sıfırla
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
