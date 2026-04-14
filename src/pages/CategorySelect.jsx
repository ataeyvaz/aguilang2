import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'animals',    name: 'Hayvanlar',   emoji: '🐾', count: 45, bg: '#F0FDF4', color: '#16A34A' },
  { id: 'colors',     name: 'Renkler',     emoji: '🎨', count: 36, bg: '#FDF4FF', color: '#9333EA' },
  { id: 'numbers',    name: 'Sayılar',     emoji: '🔢', count: 29, bg: '#EFF6FF', color: '#2563EB' },
  { id: 'fruits',     name: 'Meyveler',    emoji: '🍎', count: 36, bg: '#FFF7ED', color: '#EA580C' },
  { id: 'vegetables', name: 'Sebzeler',    emoji: '🥕', count: 11, bg: '#F0FDF4', color: '#15803D' },
  { id: 'body',       name: 'Vücut',       emoji: '🫀', count: 18, bg: '#FDF2F8', color: '#DB2777' },
  { id: 'family',     name: 'Aile',        emoji: '👨‍👩‍👧', count: 17, bg: '#FFF7ED', color: '#C2410C' },
  { id: 'school',     name: 'Okul',        emoji: '🏫', count: 18, bg: '#EFF6FF', color: '#1D4ED8' },
  { id: 'food',       name: 'Yiyecekler',  emoji: '🍕', count: 22, bg: '#FEF9C3', color: '#A16207' },
  { id: 'greetings',  name: 'Selamlama',   emoji: '👋', count: 15, bg: '#F0FDFA', color: '#0F766E' },
  { id: 'questions',  name: 'Sorular',     emoji: '❓', count: 10, bg: '#F5F3FF', color: '#7C3AED' },
  { id: 'clothing',   name: 'Kıyafetler',  emoji: '👗', count: 27, bg: '#FDF2F8', color: '#BE185D' },
  { id: 'home',       name: 'Ev',          emoji: '🏠', count: 36, bg: '#F0FDF4', color: '#166534' },
  { id: 'transport',  name: 'Ulaşım',      emoji: '🚗', count: 16, bg: '#EFF6FF', color: '#1E40AF' },
  { id: 'time',       name: 'Zaman',       emoji: '⏰', count: 37, bg: '#FFFBEB', color: '#B45309' },
  { id: 'jobs',       name: 'Meslekler',   emoji: '👷', count: 21, bg: '#F8FAFC', color: '#475569' },
  { id: 'sports',     name: 'Sporlar',     emoji: '⚽', count: 15, bg: '#F0FDF4', color: '#15803D' },
  { id: 'places',     name: 'Yerler',      emoji: '📍', count: 29, bg: '#FEF2F2', color: '#DC2626' },
  { id: 'adjectives', name: 'Sıfatlar',    emoji: '✨', count: 50, bg: '#F5F3FF', color: '#6D28D9' },
  { id: 'verbs',      name: 'Fiiller',     emoji: '🏃', count: 65, bg: '#FFF7ED', color: '#C2410C' },
]

export default function CategorySelect() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)

  const profile = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  const lang = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{}')

  const savedCats = localStorage.getItem('aguilang_active_categories')
  const activeCats = savedCats ? JSON.parse(savedCats) : null

  const filtered = CATEGORIES
    .filter(c => activeCats === null || activeCats.includes(c.id))
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (cat) => {
    localStorage.setItem('aguilang_active_category', JSON.stringify(cat))
    navigate('/learn')
  }

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
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={() => navigate('/language')}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                {lang.name || 'İngilizce'} · {profile.name || 'Kartal'}
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px',
                fontWeight: '800',
                color: '#0F172A',
              }}>
                Kategori Seç
              </div>
            </div>
          </div>

          {/* Arama */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Kategori ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                background: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px 24px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat)}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === cat.id ? cat.bg : 'white',
                border: `1.5px solid ${hovered === cat.id ? cat.color + '44' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                transform: hovered === cat.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered === cat.id
                  ? `0 4px 12px ${cat.color}22`
                  : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '32px', lineHeight: 1 }}>{cat.emoji}</span>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '700',
                color: '#0F172A',
                textAlign: 'center',
              }}>
                {cat.name}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#94A3B8',
                background: '#F1F5F9',
                borderRadius: '6px',
                padding: '2px 8px',
              }}>
                {cat.count} kelime
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#94A3B8',
            fontSize: '15px',
          }}>
            "{search}" için kategori bulunamadı
          </div>
        )}
      </div>
    </div>
  )
}