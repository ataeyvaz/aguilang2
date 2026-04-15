import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../../utils/audioManager'

const GAME_COUNT = 8

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

export default function SentenceGame() {
  const navigate = useNavigate()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang')     || '{"id":"en"}')
  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')

  const [sentences,  setSentences]  = useState([])   // 8 chosen sentences
  const [qIndex,     setQIndex]     = useState(0)
  const [available,  setAvailable]  = useState([])   // word tokens not yet placed
  const [placed,     setPlaced]     = useState([])   // word tokens placed by user
  const [result,     setResult]     = useState(null) // 'correct' | 'wrong' | null
  const [hint,       setHint]       = useState('')   // shown on wrong
  const [score,      setScore]      = useState(0)
  const [correct,    setCorrect]    = useState(0)
  const [gameOver,   setGameOver]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const shakeRef = useRef(null)

  /* ── Load sentences ── */
  useEffect(() => {
    if (!category.id) { setLoading(false); return }
    const load = async () => {
      try {
        const mod  = await import(`../../data/${category.id}-a1.json`)
        const all  = mod.default.translations?.[lang.id]?.words || []
        // Tüm kelimelerin sentences dizilerini topla
        const allSents = all.flatMap(w =>
          (w.sentences || [])
            .filter(s => Array.isArray(s.words) && s.words.length >= 3)
            .map(s => ({ ...s, sourceWord: w }))
        )
        if (allSents.length > 0) {
          const chosen = shuffle(allSents).slice(0, GAME_COUNT)
          setSentences(chosen)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Init question when sentence changes ── */
  useEffect(() => {
    if (!sentences.length || qIndex >= sentences.length) return
    const s      = sentences[qIndex]
    const tokens = s.words.map((w, i) => ({ text: w, idx: i }))
    setAvailable(shuffle(tokens))
    setPlaced([])
    setResult(null)
    setHint('')
  }, [qIndex, sentences])

  const tapAvailable = (token) => {
    if (result === 'correct') return
    setAvailable(av => av.filter(t => t.idx !== token.idx))
    setPlaced(p => [...p, token])
    setResult(null)
    setHint('')
  }

  const tapPlaced = (token) => {
    if (result === 'correct') return
    setPlaced(p => p.filter(t => t.idx !== token.idx))
    setAvailable(av => [...av, token])
    setResult(null)
    setHint('')
  }

  const handleCheck = () => {
    if (!placed.length) return
    const s          = sentences[qIndex]
    const userAnswer = placed.map(t => t.text).join(' ')
    const correct_   = s.words.join(' ')
    if (userAnswer === correct_) {
      setResult('correct')
      setScore(sc => sc + 15)
      setCorrect(c => c + 1)
      // TTS: cümleyi seslendir
      const text = s.text || s.en || s[lang.id] || ''
      if (text) speak('sent_' + qIndex, text, lang.id)
      // 1.5sn sonra sonraki soru
      setTimeout(() => {
        if (qIndex + 1 >= sentences.length) { setGameOver(true) }
        else setQIndex(i => i + 1)
      }, 1500)
    } else {
      setResult('wrong')
      setHint(`İlk kelime: "${s.words[0]}"`)
      // Shake animasyonu: class toggle via ref
      if (shakeRef.current) {
        shakeRef.current.style.animation = 'none'
        void shakeRef.current.offsetHeight // reflow
        shakeRef.current.style.animation = 'sgShake 0.45s ease'
      }
    }
  }

  const handleRestart = () => {
    const allSents = shuffle(sentences)
    setSentences(allSents)
    setQIndex(0); setScore(0); setCorrect(0)
    setGameOver(false); setResult(null); setHint('')
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Yükleniyor...
    </div>
  )

  if (!sentences.length) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Bu kategoride cümle bulunamadı</div>
      <div style={{ fontSize: '14px', color: '#64748B' }}>Önce flash kartlarla kelime çalış.</div>
      <button onClick={() => navigate('/categories')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Kategori Seç</button>
    </div>
  )

  /* ── Özet ── */
  if (gameOver) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px' }}>📝</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: '800', color: '#0F172A' }}>{score} Puan!</div>
      <div style={{ fontSize: '16px', color: '#64748B' }}>{correct} / {sentences.length} doğru</div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button onClick={handleRestart} style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B' }}>🔄 Tekrar</button>
        <button onClick={() => navigate('/play')} style={{ padding: '12px 24px', background: '#0891B2', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'white' }}>← Oyunlar</button>
      </div>
    </div>
  )

  const s = sentences[qIndex]
  if (!s) return null

  const allPlaced = placed.length === s.words.length

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes sgShake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-6px) }
          80%      { transform: translateX(6px) }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/play')} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>📝 Cümle Kur</div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0891B2' }}>{score} puan</div>
        </div>
        <div style={{ maxWidth: '520px', margin: '10px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
            <span>Soru {qIndex + 1} / {sentences.length}</span>
          </div>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((qIndex + 1) / sentences.length) * 100}%`, background: '#0891B2', borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 32px', gap: '16px', maxWidth: '520px', width: '100%', margin: '0 auto' }}>

        {/* Türkçe ipucu */}
        {s.tr && (
          <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>
            💡 {s.tr}
          </div>
        )}

        {/* Yerleştirme alanı */}
        <div
          ref={shakeRef}
          style={{
            minHeight: '72px',
            background: result === 'correct' ? '#F0FDF4' : result === 'wrong' ? '#FEF2F2' : 'white',
            border: `2px solid ${result === 'correct' ? '#86EFAC' : result === 'wrong' ? '#FCA5A5' : '#E2E8F0'}`,
            borderRadius: '16px', padding: '14px 16px',
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          {placed.length === 0 && (
            <span style={{ fontSize: '13px', color: '#CBD5E1', fontStyle: 'italic' }}>
              Kelimelere tıklayarak cümle kur…
            </span>
          )}
          {placed.map(token => (
            <button
              key={token.idx}
              onClick={() => tapPlaced(token)}
              disabled={result === 'correct'}
              style={{
                padding: '6px 14px',
                background: result === 'correct' ? '#DCFCE7' : '#EFF8FF',
                border: `1.5px solid ${result === 'correct' ? '#86EFAC' : '#BAE6FD'}`,
                borderRadius: '20px', fontSize: '14px', fontWeight: '700',
                color: result === 'correct' ? '#15803D' : '#0891B2',
                cursor: result === 'correct' ? 'default' : 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {token.text}
            </button>
          ))}
        </div>

        {/* Hata ipucu */}
        {hint && (
          <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600', textAlign: 'center' }}>
            {hint}
          </div>
        )}

        {/* Mevcut kelimeler */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', minHeight: '48px' }}>
          {available.map(token => (
            <button
              key={token.idx}
              onClick={() => tapAvailable(token)}
              style={{
                padding: '8px 16px',
                background: 'white', border: '1.5px solid #E2E8F0',
                borderRadius: '20px', fontSize: '14px', fontWeight: '600',
                color: '#0F172A', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {token.text}
            </button>
          ))}
        </div>

        {/* Yapı ipucu */}
        <div style={{ fontSize: '12px', color: '#CBD5E1', textAlign: 'center' }}>
          💡 Kim + Ne yapar?
        </div>

        {/* Kontrol Et */}
        <button
          onClick={handleCheck}
          disabled={!placed.length || result === 'correct'}
          style={{
            width: '100%', padding: '15px',
            background: allPlaced && result !== 'correct' ? '#0891B2' : '#E2E8F0',
            color: allPlaced && result !== 'correct' ? 'white' : '#94A3B8',
            border: 'none', borderRadius: '14px',
            fontSize: '15px', fontWeight: '700',
            cursor: placed.length && result !== 'correct' ? 'pointer' : 'default',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'all 0.2s',
            marginTop: 'auto',
          }}
        >
          {result === 'correct' ? '✅ Doğru!' : 'Kontrol Et'}
        </button>
      </div>
    </div>
  )
}
