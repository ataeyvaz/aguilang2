import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../../utils/audioManager'

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

const updateWordStats = (wordId, isCorrect) => {
  const ws   = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
  const prev = ws[wordId] || { seen: 0, correct: 0, wrong: 0 }
  ws[wordId] = {
    seen:    prev.seen + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    wrong:   prev.wrong   + (isCorrect ? 0 : 1),
  }
  localStorage.setItem('aguilang_word_stats', JSON.stringify(ws))
  window.dispatchEvent(new Event('wordStatsUpdated'))
}

const buildDeck = (chosen) => shuffle([
  ...chosen.map(w => ({ uid: w.id + '_w', type: 'word',  word: w })),
  ...chosen.map(w => ({ uid: w.id + '_e', type: 'emoji', word: w })),
])

export default function MemoryGame() {
  const navigate = useNavigate()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang')     || '{"id":"en"}')
  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')

  const [cards,    setCards]    = useState([])
  const [flipped,  setFlipped]  = useState([])   // max 2 card indices
  const [matched,  setMatched]  = useState([])   // all matched indices
  const [checking, setChecking] = useState(false)
  const [moves,    setMoves]    = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [elapsed,  setElapsed]  = useState(0)
  const startRef = useRef(Date.now())
  const timerRef = useRef(null)
  const chosenRef = useRef([])   // keeps the 4 chosen words for restart

  /* ── Word loading ── */
  useEffect(() => {
    if (!category.id) { setLoading(false); return }
    const load = async () => {
      try {
        const mod   = await import(`../../data/${category.id}-a1.json`)
        const all   = mod.default.translations?.[lang.id]?.words || []
        const stats = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
        const seen  = all.filter(w => stats[w.id]?.seen >= 1)
        const pool  = seen.length >= 4 ? seen : all
        if (pool.length >= 2) {
          const chosen = shuffle(pool).slice(0, 4)
          chosenRef.current = chosen
          setCards(buildDeck(chosen))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Timer ── */
  useEffect(() => {
    if (gameOver || loading || !cards.length) return
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(timerRef.current)
  }, [gameOver, loading, cards.length])

  const handleCard = (idx) => {
    if (checking) return
    if (matched.includes(idx)) return
    if (flipped.includes(idx)) return
    if (flipped.length === 2) return

    const newFlipped = [...flipped, idx]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setChecking(true)
      const [a, b] = newFlipped
      const cardA  = cards[a]
      const cardB  = cards[b]

      if (cardA.word.id === cardB.word.id) {
        // Eşleşme!
        const newMatched = [...matched, a, b]
        setTimeout(() => {
          setMatched(newMatched)
          speak(cardA.word.id, cardA.word[lang.id] || cardA.word.word, lang.id)
          updateWordStats(cardA.word.id, true)
          setFlipped([])
          setChecking(false)
          if (newMatched.length === cards.length) {
            clearInterval(timerRef.current)
            setGameOver(true)
          }
        }, 300)
      } else {
        // Eşleşmeme
        setTimeout(() => {
          setFlipped([])
          setChecking(false)
        }, 900)
      }
    }
  }

  const handleRestart = () => {
    clearInterval(timerRef.current)
    startRef.current = Date.now()
    setCards(buildDeck(chosenRef.current))
    setFlipped([]); setMatched([]); setMoves(0)
    setGameOver(false); setChecking(false); setElapsed(0)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Yükleniyor...
    </div>
  )

  if (!cards.length) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Yeterli kelime yok</div>
      <button onClick={() => navigate('/categories')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Kategori Seç</button>
    </div>
  )

  if (gameOver) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px' }}>🧠</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: '800', color: '#0F172A' }}>Tebrikler!</div>
      <div style={{ display: 'flex', gap: '28px', fontSize: '16px', color: '#64748B' }}>
        <span>⏱ {fmt(elapsed)}</span>
        <span>🃏 {moves} hamle</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button onClick={handleRestart} style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B' }}>🔄 Tekrar</button>
        <button onClick={() => navigate('/play')} style={{ padding: '12px 24px', background: '#0891B2', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'white' }}>← Oyunlar</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/play')} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>🧠 Hafıza Eşleştir</div>
          <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>{fmt(elapsed)} · {moves} hamle</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', maxWidth: '360px' }}>
          {cards.map((card, idx) => {
            const isFaceUp    = flipped.includes(idx) || matched.includes(idx)
            const isMatchedCard = matched.includes(idx)
            const isClickable = !checking && !matched.includes(idx) && !flipped.includes(idx) && flipped.length < 2
            return (
              <div
                key={card.uid}
                onClick={() => handleCard(idx)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: isMatchedCard ? '#F0FDF4' : isFaceUp ? 'white' : '#0891B2',
                  border: `2px solid ${isMatchedCard ? '#86EFAC' : isFaceUp ? '#E2E8F0' : 'transparent'}`,
                  cursor: isClickable ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s, border 0.2s',
                  boxShadow: isFaceUp ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 6px rgba(8,145,178,0.25)',
                  padding: '6px', overflow: 'hidden',
                }}
              >
                {isFaceUp ? (
                  card.type === 'emoji' ? (
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{card.word.emoji}</span>
                  ) : (
                    <span style={{
                      fontSize: '11px', fontWeight: '700', textAlign: 'center', color: '#0F172A',
                      lineHeight: '1.2', wordBreak: 'break-word',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {card.word[lang.id] || card.word.word}
                    </span>
                  )
                ) : (
                  <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>?</span>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ fontSize: '13px', color: '#94A3B8' }}>
          {matched.length / 2} / {cards.length / 2} çift bulundu
        </div>
      </div>
    </div>
  )
}
