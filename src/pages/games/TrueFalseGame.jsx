import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const QUESTION_COUNT = 10

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

const genQuestions = (pool, count) => {
  const targets = shuffle(pool).slice(0, count)
  return targets.map(word => {
    const isTrue = Math.random() > 0.5
    const others     = shuffle(pool.filter(w => w.id !== word.id && w.emoji !== word.emoji))
    const distractor = isTrue ? null : (others[0] || pool.find(w => w.id !== word.id) || null)
    const displayEmoji  = isTrue ? word.emoji : (distractor?.emoji || word.emoji)
    const effectiveTrue = isTrue || !distractor
    return { word, isTrue: effectiveTrue, displayEmoji, distractor }
  })
}

export default function TrueFalseGame() {
  const navigate = useNavigate()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')

  const [words,     setWords]     = useState([])
  const [questions, setQuestions] = useState([])
  const [qIndex,    setQIndex]    = useState(0)
  const [answer,    setAnswer]    = useState(null)   // 'true' | 'false' | null
  const [score,     setScore]     = useState(0)
  const [correct,   setCorrect]   = useState(0)
  const [gameOver,  setGameOver]  = useState(false)
  const [loading,   setLoading]   = useState(true)

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
        const pool = seen.length >= 2 ? seen : all
        setWords(pool)
        if (pool.length >= 2) setQuestions(genQuestions(pool, QUESTION_COUNT))
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (userSaysTrue) => {
    if (answer !== null) return
    const q         = questions[qIndex]
    const isCorrect = userSaysTrue === q.isTrue
    setAnswer(userSaysTrue ? 'true' : 'false')
    if (isCorrect) {
      setScore(s => s + 10)
      setCorrect(c => c + 1)
    }
    updateWordStats(q.word.id, isCorrect)
    setTimeout(() => {
      if (qIndex + 1 >= QUESTION_COUNT) { setGameOver(true) }
      else { setQIndex(i => i + 1); setAnswer(null) }
    }, 1200)
  }

  const handleRestart = () => {
    setQuestions(genQuestions(words, QUESTION_COUNT))
    setQIndex(0); setAnswer(null); setScore(0); setCorrect(0); setGameOver(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Yükleniyor...
    </div>
  )

  if (!words.length || words.length < 2) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Yeterli kelime yok</div>
      <button onClick={() => navigate('/categories')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Kategori Seç</button>
    </div>
  )

  if (gameOver) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px' }}>✅</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: '800', color: '#0F172A' }}>{score} Puan!</div>
      <div style={{ fontSize: '16px', color: '#64748B' }}>{correct} / {QUESTION_COUNT} doğru</div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button onClick={handleRestart} style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B' }}>🔄 Tekrar</button>
        <button onClick={() => navigate('/play')} style={{ padding: '12px 24px', background: '#0891B2', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'white' }}>← Oyunlar</button>
      </div>
    </div>
  )

  const q = questions[qIndex]
  if (!q) return null

  const wordText    = q.word[lang.id] || q.word.word
  const isAnswered  = answer !== null
  const userCorrect = isAnswered && ((answer === 'true') === q.isTrue)

  const feedbackText = () => {
    if (!isAnswered) return ''
    if (userCorrect) return `Evet! ${q.word.emoji} = ${wordText}`
    if (q.isTrue)    return `Aslında doğruydu! ${q.word.emoji} = ${wordText}`
    const dis = q.distractor
    return `Hayır, bu bir ${dis?.[lang.id] || dis?.word || '?'} ${dis?.emoji || ''}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/play')} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>✅ Doğru / Yanlış</div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0891B2' }}>{score} puan</div>
        </div>
        <div style={{ maxWidth: '480px', margin: '10px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
            <span>Soru {qIndex + 1} / {QUESTION_COUNT}</span>
          </div>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((qIndex + 1) / QUESTION_COUNT) * 100}%`, background: '#0891B2', borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px' }}>

        {/* Soru kartı */}
        <div style={{
          background: isAnswered ? (userCorrect ? '#F0FDF4' : '#FFF7ED') : 'white',
          border: `2px solid ${isAnswered ? (userCorrect ? '#86EFAC' : '#FDE68A') : '#E2E8F0'}`,
          borderRadius: '20px', padding: '36px 28px',
          width: '100%', maxWidth: '380px', textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 0.3s',
        }}>
          <div style={{ fontSize: '72px', marginBottom: '16px', lineHeight: 1 }}>{q.displayEmoji}</div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '24px', fontWeight: '800', color: '#0F172A',
          }}>{wordText}</div>

          {isAnswered && (
            <div style={{
              marginTop: '14px', fontSize: '14px', fontWeight: '600', lineHeight: '1.5',
              color: userCorrect ? '#15803D' : '#92400E',
            }}>
              {feedbackText()}
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '380px' }}>
          <button
            onClick={() => handleAnswer(false)}
            disabled={isAnswered}
            style={{
              flex: 1, height: '56px',
              background: isAnswered && answer === 'false'
                ? (userCorrect ? '#F0FDF4' : '#FEF2F2') : 'white',
              border: `2px solid ${isAnswered && answer === 'false'
                ? (userCorrect ? '#86EFAC' : '#FCA5A5') : '#E2E8F0'}`,
              borderRadius: '14px', fontSize: '16px', fontWeight: '700',
              cursor: isAnswered ? 'default' : 'pointer',
              color: '#DC2626', transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >❌ Yanlış</button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={isAnswered}
            style={{
              flex: 1, height: '56px',
              background: isAnswered && answer === 'true'
                ? (userCorrect ? '#F0FDF4' : '#FEF2F2') : 'white',
              border: `2px solid ${isAnswered && answer === 'true'
                ? (userCorrect ? '#86EFAC' : '#FCA5A5') : '#E2E8F0'}`,
              borderRadius: '14px', fontSize: '16px', fontWeight: '700',
              cursor: isAnswered ? 'default' : 'pointer',
              color: '#15803D', transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >✅ Doğru</button>
        </div>
      </div>
    </div>
  )
}
