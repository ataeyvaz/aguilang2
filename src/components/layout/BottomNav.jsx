import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/dashboard',  label: 'Anasayfa', icon: '🏠', match: ['/dashboard'] },
  { to: '/learn-hub',  label: 'Öğren',    icon: '📚', match: ['/learn-hub', '/categories', '/learn', '/quiz', '/dialogue', '/grammar'] },
  { to: '/play',       label: 'Oyna',     icon: '🎮', match: ['/play', '/games'] },
  { to: '/profile',    label: 'Profil',   icon: '👤', match: ['/profile'] },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  const isActive = (match) => match.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <nav
      className="md:hidden flex items-center justify-around"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        height: '60px',
        flexShrink: 0,
      }}
    >
      {tabs.map(({ to, label, icon, match }) => {
        const active = isActive(match)
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px',
              padding: '4px 12px',
              fontSize: '11px', fontWeight: active ? '700' : '500',
              textDecoration: 'none',
              color: active ? '#0891B2' : '#94A3B8',
              position: 'relative',
              transition: 'color 0.15s',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '20%',
                width: '60%', height: '2px',
                background: '#0891B2', borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
