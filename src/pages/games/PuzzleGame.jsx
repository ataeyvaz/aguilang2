import { useNavigate } from 'react-router-dom'
export default function PuzzleGame() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>🧩</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>Senaryo Puzzle</div>
      <div style={{ fontSize: '15px', color: '#64748B' }}>Yakında eklenecek...</div>
      <button onClick={() => navigate('/play')} style={{ padding: '11px 28px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>← Oyunlar</button>
    </div>
  )
}
