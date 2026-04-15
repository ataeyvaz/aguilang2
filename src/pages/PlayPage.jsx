import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GAMES = [
  { id: 'listen',    emoji: '🎧', name: 'Dinle & Seç',     desc: 'Duyduğun kelimeyi bul',           route: '/games/listen',    mode: 'reinforcement', ready: true  },
  { id: 'memory',    emoji: '🧠', name: 'Hafıza Eşleştir', desc: 'Kelime-emoji çiftlerini eşleştir', route: '/games/memory',    mode: 'reinforcement', ready: true  },
  { id: 'truefalse', emoji: '✅', name: 'Doğru / Yanlış',  desc: 'Cümle + emoji eşleşiyor mu?',      route: '/games/truefalse', mode: 'reinforcement', ready: true  },
  { id: 'speed',     emoji: '⚡', name: 'Hız Turu',         desc: 'Süre bitmeden cevapla',            route: '/games/speed',     mode: 'growth',        ready: true  },
  { id: 'sentence',  emoji: '📝', name: 'Cümle Kur',       desc: 'Kelimeleri doğru sıraya diz',      route: '/games/sentence',  mode: 'growth',        ready: true  },
  { id: 'voice',     emoji: '🎤', name: 'Hazineyi Aç',     desc: 'Söyle, hazineyi kazan',            route: '/games/voice',     mode: 'growth',        ready: true  },
  { id: 'puzzle',    emoji: '🧩', name: 'Senaryo Puzzle',  desc: 'Diyalog boşluklarını doldur',      route: '/games/puzzle',    mode: 'growth',        ready: false },
]

export default function PlayPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState('')

  const stats   = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
  const entries = Object.values(stats).filter(s => s.seen > 0)

  let mode = null
  let correctRate = null

  if (entries.length > 0) {
    const last20   = entries.slice(-20)
    const answered = last20.filter(s => (s.correct + s.wrong) > 0)
    correctRate = answered.length === 0
      ? 0
      : answered.reduce((sum, s) => sum + s.correct / (s.correct + s.wrong), 0) / answered.length
    mode = correctRate < 0.60 ? 'reinforcement' : 'growth'
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const handleClick = (game) => {
    if (!game.ready) { showToast('Yakında eklenecek! 🚀'); return }
    navigate(game.route)
  }

  const modeColor  = mode === 'growth' ? '#F59E0B' : '#0891B2'
  const modeBg     = mode === 'growth' ? '#FFFBEB' : '#EFF8FF'
  const modeBorder = mode === 'growth' ? '#FDE68A' : '#BAE6FD'

  /* ── Önce öğren ekranı ── */
  if (mode === null) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '16px', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '64px' }}>📚</div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '22px', fontWeight: '800', color: '#0F172A',
        }}>Önce biraz öğren!</div>
        <div style={{ fontSize: '15px', color: '#64748B', maxWidth: '280px', lineHeight: '1.6' }}>
          Oyunları açmak için önce flash kartlarla kelime çalış.
        </div>
        <button
          onClick={() => navigate('/categories')}
          style={{
            marginTop: '8px', padding: '13px 32px',
            background: '#0891B2', color: 'white', border: 'none',
            borderRadius: '12px', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >Kelime Çalış →</button>
      </div>
    )
  }

  const modeLabel = mode === 'reinforcement' ? '🔵 Pekiştirici Mod' : '🟡 Gelişim Modu'
  const modeDesc  = mode === 'reinforcement'
    ? 'Kelimeleri pekiştirme zamanı'
    : 'İleri seviye oyunlar seni bekliyor'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: 'white', borderRadius: '24px',
          padding: '12px 24px', fontSize: '14px', fontWeight: '600',
          zIndex: 100, whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>🎮 Oyunlar</div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* Mod göstergesi */}
        <div style={{
          background: modeBg, border: `1.5px solid ${modeBorder}`,
          borderRadius: '14px', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', fontWeight: '800', color: '#0F172A',
            }}>{modeLabel}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{modeDesc}</div>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: modeColor }}>
            {Math.round(correctRate * 100)}%
          </div>
        </div>

        {/* Oyun listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GAMES.map(game => {
            const isActiveMode = game.mode === mode
            // Sadece placeholder'lar kilitli; mod uyuşmayanlar hafif soluk ama tıklanabilir
            const isLocked     = !game.ready
            const opacity      = isLocked ? 0.45 : isActiveMode ? 1 : 0.7
            return (
              <button
                key={game.id}
                onClick={() => handleClick(game)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: isActiveMode && game.ready ? 'white' : '#F8FAFC',
                  border: `1.5px solid ${isActiveMode && game.ready ? modeBorder : '#E2E8F0'}`,
                  borderRadius: '14px', padding: '16px 18px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity,
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                  boxShadow: isActiveMode && game.ready ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: isActiveMode && game.ready ? modeBg : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0,
                }}>{game.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '15px', fontWeight: '800', color: '#0F172A',
                  }}>{game.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{game.desc}</div>
                </div>
                {!game.ready && (
                  <div style={{
                    fontSize: '11px', fontWeight: '700', color: '#94A3B8',
                    background: '#F1F5F9', borderRadius: '8px',
                    padding: '3px 8px', flexShrink: 0,
                  }}>Yakında</div>
                )}
                {game.ready && isActiveMode && (
                  <div style={{ fontSize: '20px', color: modeColor, flexShrink: 0 }}>›</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
