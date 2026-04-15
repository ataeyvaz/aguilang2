import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const MAX_TIME = 60

const ALL_CATEGORIES = [
  'animals','colors','numbers','fruits','vegetables','body','family','school',
  'food','greetings','questions','clothing','home','transport','time',
  'jobs','sports','places','adjectives','verbs',
]

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

// One question per word, sorted by wrong count desc so hard words come first
const genQuestions = (pool, stats) => {
  const sorted = [...pool].sort((a, b) => {
    const wa = stats[a.id]?.wrong || 0
    const wb = stats[b.id]?.wrong || 0
    return wb !== wa ? wb - wa : Math.random() - 0.5
  })
  return sorted.map(word => {
    const distractors = shuffle(pool.filter(w => w.id !== word.id)).slice(0, 3)
    return { word, options: shuffle([word, ...distractors]) }
  })
}

export default function SpeedGame() {
  const navigate = useNavigate()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')

  const [questions,  setQuestions]  = useState([])
  const [pool,       setPool]       = useState([])
  const [qIndex,     setQIndex]     = useState(0)
  const [selected,   setSelected]   = useState(null)
  const [timeLeft,   setTimeLeft]   = useState(MAX_TIME)
  const [score,      setScore]      = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [maxStreak,  setMaxStreak]  = useState(0)
  const [gameOver,   setGameOver]   = useState(false)
  const [allDone,    setAllDone]    = useState(false)  // completed full deck
  const [loading,    setLoading]    = useState(true)
  const timerRef = useRef(null)

  /* ── Load ALL categories ── */
  useEffect(() => {
    const load = async () => {
      try {
        const stats   = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
        const results = await Promise.allSettled(
          ALL_CATEGORIES.map(cat => import(`../../data/${cat}-a1.json`))
        )
        const all = results.flatMap(r =>
          r.status === 'fulfilled'
            ? (r.value.default.translations?.[lang.id]?.words || [])
            : []
        )
        const seen = all.filter(w => stats[w.id]?.seen >= 1)
        const p    = seen.length >= 4 ? seen : all
        if (p.length >= 4) {
          setPool(p)
          setQuestions(genQuestions(p, stats))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Timer başlat ── */
  useEffect(() => {
    if (loading || gameOver || !questions.length) return
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [loading, gameOver, questions.length])

  /* ── Süre bitti → oyun bitti ── */
  useEffect(() => {
    if (timeLeft <= 0 && !gameOver && !loading) {
      clearInterval(timerRef.current)
      setGameOver(true)
    }
  }, [timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (i) => {
    if (selected !== null) return
    const q         = questions[qIndex]
    const isCorrect = q.options[i].id === q.word.id
    setSelected(i)

    if (isCorrect) {
      setScore(s => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak(m => Math.max(m, newStreak))
      setTimeLeft(t => Math.min(t + 3, MAX_TIME))
    } else {
      setStreak(0)
      updateWordStats(q.word.id, false)
    }

    const nextIdx = qIndex + 1
    setTimeout(() => {
      setSelected(null)
      if (nextIdx >= questions.length) {
        // Tüm kelimeler tamamlandı
        clearInterval(timerRef.current)
        setAllDone(true)
        setGameOver(true)
      } else {
        setQIndex(nextIdx)
      }
    }, isCorrect ? 380 : 580)
  }

  const handleRestart = () => {
    if (!pool.length) return
    const stats = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
    setQuestions(genQuestions(pool, stats))
    setQIndex(0); setSelected(null); setTimeLeft(MAX_TIME)
    setScore(0); setStreak(0); setMaxStreak(0)
    setGameOver(false); setAllDone(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Yükleniyor...
    </div>
  )

  if (!questions.length) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Yeterli kelime yok</div>
      <div style={{ fontSize: '14px', color: '#64748B' }}>Önce flash kartlarla kelime çalış.</div>
      <button onClick={() => navigate('/categories')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Kategori Seç</button>
    </div>
  )

  /* ── Özet ekranı ── */
  if (gameOver) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px' }}>{allDone ? '🏆' : '⚡'}</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: '800', color: '#0F172A' }}>
        {allDone ? 'Tebrikler!' : `${score} Doğru!`}
      </div>
      {allDone && (
        <div style={{ fontSize: '15px', color: '#0891B2', fontWeight: '600' }}>
          Tüm kelimeleri tamamladın! 🎉
        </div>
      )}
      <div style={{ display: 'flex', gap: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0891B2', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{score}</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Doğru</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{maxStreak}</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>En uzun seri</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{qIndex}</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Toplam soru</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button onClick={handleRestart} style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B' }}>🔄 Tekrar</button>
        <button onClick={() => navigate('/play')} style={{ padding: '12px 24px', background: '#0891B2', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'white' }}>← Oyunlar</button>
      </div>
    </div>
  )

  const q          = questions[qIndex]
  const timePct    = (timeLeft / MAX_TIME) * 100
  const timerColor = timeLeft < 15 ? '#EF4444' : '#0891B2'
  const timerBg    = timeLeft < 15 ? '#FEF2F2' : '#EFF8FF'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { clearInterval(timerRef.current); navigate('/play') }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>⚡ Hız Turu</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#F59E0B' }}>🔥 {streak}</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0891B2' }}>{score} puan</div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ maxWidth: '480px', margin: '10px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#94A3B8' }}>Süre · {qIndex + 1}/{questions.length}</span>
            <span style={{ fontWeight: '700', color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${timePct}%`,
              background: timerColor,
              borderRadius: '4px',
              transition: 'width 0.9s linear, background 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '28px' }}>

        {/* Kelime kartı */}
        <div style={{
          background: timerBg,
          border: `2px solid ${timeLeft < 15 ? '#FECACA' : '#BAE6FD'}`,
          borderRadius: '20px', padding: '32px 40px',
          textAlign: 'center', transition: 'all 0.3s',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '12px', lineHeight: 1 }}>{q.word.emoji}</div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '28px', fontWeight: '800', color: '#0F172A',
          }}>{q.word[lang.id] || q.word.word}</div>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px' }}>
            Türkçe karşılığını seç
          </div>
        </div>

        {/* Seçenekler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '380px' }}>
          {q.options.map((opt, i) => {
            const isAnswer = opt.id === q.word.id
            const isChosen = selected === i
            let bg = 'white', border = '#E2E8F0', color = '#0F172A'
            if (isChosen && isAnswer)             { bg = '#F0FDF4'; border = '#86EFAC'; color = '#15803D' }
            else if (isChosen && !isAnswer)        { bg = '#FEF2F2'; border = '#FCA5A5'; color = '#DC2626' }
            else if (selected !== null && isAnswer) { bg = '#F0FDF4'; border = '#86EFAC'; color = '#15803D' }
            return (
              <button
                key={opt.id + i}
                onClick={() => handleSelect(i)}
                style={{
                  background: bg, border: `2px solid ${border}`, borderRadius: '14px',
                  padding: '16px 12px', fontSize: '15px', fontWeight: '700',
                  cursor: selected !== null ? 'default' : 'pointer',
                  color, transition: 'all 0.2s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {opt.tr}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
