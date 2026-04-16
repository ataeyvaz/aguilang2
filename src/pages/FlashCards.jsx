import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/audioManager'
import { recordDaily } from '../hooks/useDailyStats'
import { CATEGORIES } from '../data/categories'
import { useSpeech } from '../hooks/useSpeech'

export default function FlashCards() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)
  const [showWordList, setShowWordList] = useState(false)
  const [toastType, setToastType] = useState(null) // null | 'correct' | 'wrong'
  const sttTimerRef = useRef(null)

  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')
  const lang = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{ "id": "en" }')

  const {
    startListening, stopListening, isListening,
    transcript, sttSupported, checkAnswer,
  } = useSpeech(lang.id)

  // STT sonucu gelince kelimeyi kontrol et
  useEffect(() => {
    if (!transcript) return
    clearTimeout(sttTimerRef.current)
    stopListening()
    if (checkAnswer(current?.word ?? '')) {
      setToastType('correct')
    } else {
      setToastType('wrong')
      speak(current?.id, current?.word, lang.id)
    }
    setTimeout(() => setToastType(null), 2000)
  }, [transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearTimeout(sttTimerRef.current)
  }, [])

  const handleStt = (e) => {
    e.stopPropagation()
    if (isListening) return
    startListening()
    sttTimerRef.current = setTimeout(() => stopListening(), 3000)
  }

  useEffect(() => {
    if (!category.id) return

    const saved = localStorage.getItem('aguilang_active_categories')
    if (saved) {
      try {
        const allowed = JSON.parse(saved)
        if (!allowed.includes(category.id)) {
          navigate('/categories')
          return
        }
      } catch { /* geçersiz JSON — devam et */ }
    }

    const loadWords = async () => {
      try {
        const module = await import(`../data/${category.id}-a1.json`)
        const data = module.default
        const langData = data.translations?.[lang.id]
        if (langData?.words) setWords(langData.words)
      } catch {
        setWords([])
      }
    }
    loadWords()
  }, [category.id, lang.id, navigate])

  const current = words[index]
  const progress = showGrammar ? 100 : words.length ? Math.round(((index + 1) / words.length) * 100) : 0
  const catMeta = CATEGORIES.find(c => c.id === category.id)
  const grammarNote = catMeta?.grammarNote

  const handlePrev = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    setFlipped(false)
    setIndex(i => i - 1)
  }

  const handleNext = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    setFlipped(false)
    recordDaily(true)
    setTimeout(() => {
      if (index < words.length - 1) {
        setIndex(index + 1)
      } else {
        setShowGrammar(true)
      }
    }, 200)
  }

  if (!words.length) return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontSize: '16px', color: '#64748B' }}>
        Bu kategori için kelime bulunamadı
      </div>
      <button
        onClick={() => navigate('/categories')}
        style={{
          background: '#0891B2', color: 'white', border: 'none',
          borderRadius: '10px', padding: '10px 24px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        }}
      >
        Geri Dön
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Toast */}
      {toastType && (
        <div style={{
          position: 'fixed', bottom: '100px', left: '50%',
          transform: 'translateX(-50%)',
          background: toastType === 'correct' ? '#10B981' : '#F59E0B',
          color: 'white',
          borderRadius: '24px', padding: '12px 28px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '15px', fontWeight: '700',
          boxShadow: toastType === 'correct'
            ? '0 4px 16px rgba(16,185,129,0.35)'
            : '0 4px 16px rgba(245,158,11,0.35)',
          zIndex: 100, whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {toastType === 'correct' ? 'Harika! 🌟' : 'Tekrar dene! 🎤'}
        </div>
      )}
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px',
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => showGrammar ? setShowGrammar(false) : navigate('/categories')}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px', fontWeight: '700', color: '#0F172A',
            }}>
              {category.emoji} {category.name}
            </div>
          </div>
          {!showGrammar && (
            <button
              onClick={() => speak(current?.id, current?.word, lang.id)}
              style={{
                background: '#EFF8FF', border: '1px solid #BAE6FD',
                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                fontSize: '13px', color: '#0891B2', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              🔊 Dinle
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{ maxWidth: '520px', margin: '10px auto 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '12px', color: '#94A3B8', marginBottom: '6px',
          }}>
            <span>{showGrammar ? 'Bitti! 🎉' : 'İlerleme'}</span>
            <span>{showGrammar ? `${words.length} / ${words.length}` : `${index + 1} / ${words.length}`}</span>
          </div>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: '#0891B2', borderRadius: '3px', transition: 'width 0.4s',
            }} />
          </div>
        </div>
      </div>

      {/* Kart */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        {showGrammar ? (
          /* ── Gramer Notu Kartı ── */
          <div style={{
            width: '100%', maxWidth: '420px',
            background: '#FFFBEB', borderRadius: '20px',
            border: '2px solid #FDE68A',
            boxShadow: '0 4px 24px rgba(251,191,36,0.15)',
            padding: '36px 32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '20px',
          }}>
            {/* Rozet */}
            <div style={{
              background: '#FEF3C7', border: '1px solid #FDE68A',
              borderRadius: '20px', padding: '6px 16px',
              fontSize: '13px', fontWeight: '700', color: '#92400E',
              letterSpacing: '0.5px',
            }}>
              📝 Gramer Notu
            </div>

            {/* Cümleler */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {grammarNote?.sentences.map((sentence, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', borderRadius: '12px',
                    border: '1px solid #FDE68A', padding: '14px 16px', gap: '12px',
                  }}
                >
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '17px', fontWeight: '700', color: '#0F172A', flex: 1,
                  }}>
                    {sentence}
                  </div>
                  <button
                    onClick={() => speak('grammar', sentence, lang.id)}
                    style={{
                      background: '#FEF3C7', border: '1px solid #FDE68A',
                      borderRadius: '8px', width: '34px', height: '34px',
                      cursor: 'pointer', fontSize: '16px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Dinle"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>

            {/* İpucu */}
            {grammarNote?.tip && (
              <div style={{
                background: '#FEF9C3', borderRadius: '10px', padding: '12px 16px',
                fontSize: '13px', color: '#78350F', lineHeight: '1.6', width: '100%',
                textAlign: 'center',
              }}>
                💡 {grammarNote.tip}
              </div>
            )}
          </div>
        ) : (
          /* ── Normal Flash Kart ── */
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              width: '100%', maxWidth: '420px', background: 'white',
              borderRadius: '20px', border: '1px solid #E2E8F0',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              padding: '48px 32px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '16px', cursor: 'pointer',
              transition: 'transform 0.15s', minHeight: '300px', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#EFF8FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '52px',
            }}>
              {current?.emoji}
            </div>

            {!flipped ? (
              <>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '36px', fontWeight: '800', color: '#0F172A',
                }}>
                  {current?.word}
                </div>
                <div style={{ fontSize: '16px', color: '#94A3B8' }}>
                  /{current?.pron}/
                </div>
                <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
                  👆 Anlamı görmek için dokun
                </div>
                {sttSupported && (
                  <button
                    onClick={handleStt}
                    style={{
                      marginTop: '8px',
                      padding: '8px 20px',
                      background: isListening ? '#FEE2E2' : '#F1F5F9',
                      border: `1.5px solid ${isListening ? '#FCA5A5' : '#E2E8F0'}`,
                      borderRadius: '20px',
                      fontSize: '13px', fontWeight: '600',
                      color: isListening ? '#DC2626' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isListening ? '🔴 Dinleniyor...' : '🎤 Sen de söyle'}
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '36px', fontWeight: '800', color: '#0F172A',
                }}>
                  {current?.word}
                </div>
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: '12px', padding: '12px 28px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '11px', color: '#86EFAC', fontWeight: '700',
                    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px',
                  }}>
                    Türkçe
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '28px', fontWeight: '800', color: '#15803D',
                  }}>
                    {current?.tr}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Gezilen Kelimeler Linki */}
      {!showGrammar && (
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <button
            onClick={() => setShowWordList(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, sans-serif',
              padding: '4px 8px',
            }}
          >
            📋 Gezilen kelimeleri gör ({index + 1}/{words.length})
          </button>
        </div>
      )}

      {/* Gezilen Kelimeler Modal */}
      {showWordList && (
        <div
          onClick={() => setShowWordList(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '20px',
              width: '100%', maxWidth: '400px',
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '15px', fontWeight: '800', color: '#0F172A',
              }}>
                Bu Oturumda Gezilen Kelimeler
              </div>
              <button
                onClick={() => setShowWordList(false)}
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', fontWeight: '700',
                }}
              >✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 14px', flex: 1 }}>
              {words.slice(0, index + 1).map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', marginBottom: '3px',
                    borderLeft: `3px solid ${i === index ? '#0891B2' : 'transparent'}`,
                    background: i === index ? '#EFF8FF' : 'transparent',
                    display: 'flex', gap: '8px', alignItems: 'center',
                    fontSize: '14px',
                  }}
                >
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: '700', color: '#0F172A',
                  }}>{w[lang.id] || w.word}</span>
                  <span style={{ color: '#CBD5E1' }}>—</span>
                  <span style={{ color: '#64748B' }}>{w.tr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Butonlar */}
      <div style={{
        padding: '16px 24px 32px', display: 'flex', gap: '12px',
        maxWidth: '420px', width: '100%', margin: '0 auto',
      }}>
        {showGrammar ? (
          <button
            onClick={() => navigate('/quiz')}
            style={{
              flex: 1, height: '52px', background: '#0891B2', border: 'none',
              borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              color: 'white', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Quiz'e Geç →
          </button>
        ) : (
          <>
            <button
              onClick={handlePrev}
              disabled={index === 0}
              style={{
                flex: 1, height: '52px', background: 'white',
                border: '1.5px solid #E2E8F0', borderRadius: '12px',
                fontSize: '15px', fontWeight: '600',
                color: index === 0 ? '#CBD5E1' : '#64748B',
                cursor: index === 0 ? 'default' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                opacity: index === 0 ? 0.5 : 1,
              }}
            >
              ← Önceki
            </button>
            <button
              onClick={() => handleNext()}
              style={{
                flex: 1, height: '52px', background: '#0891B2', border: 'none',
                borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                color: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Anladım ✓
            </button>
          </>
        )}
      </div>
    </div>
  )
}