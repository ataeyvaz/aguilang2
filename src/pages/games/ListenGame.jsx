import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../../utils/audioManager'

const QUESTION_COUNT = 10

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
  const shuffled = shuffle(pool)
  return Array.from({ length: count }, (_, i) => {
    const answer      = shuffled[i % shuffled.length]
    const distractors = shuffle(pool.filter(w => w.id !== answer.id)).slice(0, 3)
    return { answer, options: shuffle([answer, ...distractors]) }
  })
}

export default function ListenGame() {
  const navigate = useNavigate()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang')     || '{"id":"en"}')
  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')

  const [words,        setWords]        = useState([])
  const [questions,    setQuestions]    = useState([])
  const [qIndex,       setQIndex]       = useState(0)
  const [selected,     setSelected]     = useState(null)
  const [score,        setScore]        = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [gameOver,     setGameOver]     = useState(false)
  const [loading,      setLoading]      = useState(true)

  /* ── Word loading ── */
  useEffect(() => {
    if (!category.id) { setLoading(false); return }
    const load = async () => {
      try {
        const mod  = await import(`../../data/${category.id}-a1.json`)
        const all  = mod.default.translations?.[lang.id]?.words || []
        const stats = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
        const seen  = all.filter(w => stats[w.id]?.seen >= 1)
        const pool  = seen.length >= 4 ? seen : all
        setWords(pool)
        if (pool.length >= 4) setQuestions(genQuestions(pool, QUESTION_COUNT))
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── TTS autoplay on new question ── */
  useEffect(() => {
    if (!questions.length || gameOver || selected !== null) return
    const q = questions[qIndex]
    if (!q) return
    const t = setTimeout(() =>
      speak(q.answer.id, q.answer[lang.id] || q.answer.word, lang.id), 400)
    return () => clearTimeout(t)
  }, [qIndex, questions.length, gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (i) => {
    if (selected !== null) return
    const q       = questions[qIndex]
    const correct = q.options[i].id === q.answer.id
    setSelected(i)
    if (correct) {
      setScore(s => s + 10)
      setCorrectCount(c => c + 1)
    } else {
      updateWordStats(q.answer.id, false)
    }
    setTimeout(() => {
      if (qIndex + 1 >= QUESTION_COUNT) { setGameOver(true) }
      else { setQIndex(idx => idx + 1); setSelected(null) }
    }, 1000)
  }

  const handleRestart = () => {
    setQuestions(genQuestions(words, QUESTION_COUNT))
    setQIndex(0); setSelected(null); setScore(0); setCorrectCount(0); setGameOver(false)
  }

  const replay = () => {
    const q = questions[qIndex]
    if (q) speak(q.answer.id, q.answer[lang.id] || q.answer.word, lang.id)
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Yükleniyor...
    </div>
  )

  /* ── Yeterli kelime yok ── */
  if (!words.length || words.length < 4) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Yeterli kelime yok</div>
      <div style={{ fontSize: '14px', color: '#64748B' }}>Bu oyun için en az 4 kelimeli bir kategori seç.</div>
      <button onClick={() => navigate('/categories')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Kategori Seç</button>
    </div>
  )

  /* ── Özet ekranı ── */
  if (gameOver) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '64px' }}>🎉</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: '800', color: '#0F172A' }}>{score} Puan!</div>
      <div style={{ fontSize: '16px', color: '#64748B' }}>{correctCount} / {QUESTION_COUNT} doğru</div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button onClick={handleRestart} style={{ padding: '12px 24px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>🔄 Tekrar Oyna</button>
        <button onClick={() => navigate('/play')} style={{ padding: '12px 24px', background: '#0891B2', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>← Oyunlar</button>
      </div>
    </div>
  )

  const q = questions[qIndex]
  if (!q) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/play')} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>🎧 Dinle & Seç</div>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '10px' }}>🎧</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>
            Hangi kelimeyi duydun?
          </div>
          <button
            onClick={replay}
            style={{ marginTop: '12px', padding: '8px 20px', background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#0891B2', cursor: 'pointer' }}
          >🔊 Tekrar dinle</button>
        </div>

        {/* Seçenekler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '380px' }}>
          {q.options.map((opt, i) => {
            const isAnswer = opt.id === q.answer.id
            const isChosen = selected === i
            let bg = 'white', border = '#E2E8F0'
            if (isChosen && isAnswer)           { bg = '#F0FDF4'; border = '#86EFAC' }
            else if (isChosen && !isAnswer)      { bg = '#FEF2F2'; border = '#FCA5A5' }
            else if (selected !== null && isAnswer) { bg = '#F0FDF4'; border = '#86EFAC' }
            return (
              <button
                key={opt.id + i}
                onClick={() => handleSelect(i)}
                style={{
                  background: bg, border: `2px solid ${border}`, borderRadius: '16px',
                  padding: '20px 12px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '8px',
                  cursor: selected !== null ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '40px', lineHeight: 1 }}>{opt.emoji}</span>
                <span style={{
                  fontSize: '14px', fontWeight: '700', color: '#0F172A',
                  textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {opt[lang.id] || opt.word}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
