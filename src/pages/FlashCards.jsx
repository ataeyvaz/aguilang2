import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/audioManager'

export default function FlashCards() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')
  const lang = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{ "id": "en" }')

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
  const progress = words.length ? Math.round(((index + 1) / words.length) * 100) : 0

  const handleNext = () => {
    setFlipped(false)
    setTimeout(() => {
      if (index < words.length - 1) {
        setIndex(index + 1)
      } else {
        navigate('/quiz')
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
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px',
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/categories')}
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
        </div>

        {/* Progress */}
        <div style={{ maxWidth: '520px', margin: '10px auto 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '12px', color: '#94A3B8', marginBottom: '6px',
          }}>
            <span>İlerleme</span>
            <span>{index + 1} / {words.length}</span>
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
              <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '8px' }}>
                👆 Anlamı görmek için dokun
              </div>
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
      </div>

      {/* Butonlar */}
      <div style={{
        padding: '16px 24px 32px', display: 'flex', gap: '12px',
        maxWidth: '420px', width: '100%', margin: '0 auto',
      }}>
        <button
          onClick={() => handleNext()}
          style={{
            flex: 1, height: '52px', background: 'white',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '15px', fontWeight: '600', color: '#64748B',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          🔄 Tekrar
        </button>
        <button
          onClick={() => handleNext()}
          style={{
            flex: 1, height: '52px', background: '#0891B2', border: 'none',
            borderRadius: '12px', fontSize: '15px', fontWeight: '600',
            color: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          ✓ Bildim
        </button>
      </div>
    </div>
  )
}