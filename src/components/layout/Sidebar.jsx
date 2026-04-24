import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: '🏠', match: ['/dashboard'] },
  { to: '/stats',      label: 'İstatistik',  icon: '📊', match: ['/stats'] },
  { to: '/learned',    label: 'Kelimelerim', icon: '🎯', match: ['/learned'] },
  { to: '/learn-hub',  label: 'Öğren',       icon: '📚', match: ['/learn-hub', '/categories', '/learn', '/quiz', '/dialogue', '/grammar'], sub: [
    { to: '/categories', label: 'Kelimeler', icon: '🔤' },
    { to: '/grammar',    label: 'Gramer',    icon: '📐' },
  ]},
  { to: '/play',       label: 'Oyna',        icon: '🎮', match: ['/play', '/games'] },
  { to: '/dictionary', label: 'Sözlük',      icon: '📖', match: ['/dictionary'] },
  { to: '/levels',     label: 'Seviyeler',   icon: '🏆', match: ['/levels'] },
  { to: '/profile',    label: 'Profil',      icon: '👤', match: ['/profile'] },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const profile = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')

  const isActive = (match) => match.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        width: '220px',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '20px 20px 16px',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <span style={{ fontSize: '24px' }}>🦅</span>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '18px', fontWeight: '800', color: '#0F172A',
        }}>
          AguiLang
        </span>
      </div>

      {/* Profil özeti */}
      {profile.name && (
        <div style={{
          margin: '12px 12px 0',
          padding: '12px 14px',
          background: '#EFF8FF',
          borderRadius: '12px',
          border: '1px solid #BAE6FD',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px', fontWeight: '700', color: '#0F172A',
          }}>
            {profile.name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            ⭐ {profile.points || 0} puan · Seviye {profile.level || 1}
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px', flex: 1 }}>
        {navItems.map(({ to, label, icon, match, sub }) => {
          const active = isActive(match)
          return (
            <div key={to}>
              <NavLink
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: active ? '700' : '500',
                  textDecoration: 'none',
                  background: active ? '#EFF8FF' : 'transparent',
                  color: active ? '#0891B2' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <span>{label}</span>
              </NavLink>
              {/* Sub-links — sadece ana link aktifken göster */}
              {sub && active && (
                <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                  {sub.map(s => {
                    const subActive = pathname === s.to || pathname.startsWith(s.to + '/')
                    return (
                      <NavLink
                        key={s.to}
                        to={s.to}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '7px 12px', borderRadius: '8px',
                          fontSize: '13px', fontWeight: subActive ? '700' : '400',
                          textDecoration: 'none',
                          background: subActive ? '#DBEAFE' : 'transparent',
                          color: subActive ? '#0891B2' : '#64748B',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{s.icon}</span>
                        <span>{s.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Ebeveyn linki */}
      <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0' }}>
        {(() => {
          const active = pathname === '/parent'
          return (
            <NavLink
              to="/parent"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: active ? '700' : '500',
                textDecoration: 'none',
                background: active ? '#EFF8FF' : 'transparent',
                color: active ? '#0891B2' : '#475569',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '18px' }}>🔒</span>
              <span>Ebeveyn Paneli</span>
            </NavLink>
          )
        })()}
      </div>
    </aside>
  )
}
