import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProfileSelect from '../pages/ProfileSelect'
import LanguageSelect from '../pages/LanguageSelect'
import CategorySelect from '../pages/CategorySelect'
import FlashCards from '../pages/FlashCards'
import Dashboard from '../pages/Dashboard'
import QuizScreen from '../pages/QuizScreen'
import ParentGate from '../pages/parent/ParentGate'
import ParentPanel from '../pages/parent/ParentPanel'
import LearnedWords from '../pages/LearnedWords'
import StatsPage from '../pages/StatsPage'
import DialogueScreen from '../pages/DialogueScreen'

const ProfilePage = () => (
  <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
    <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: '800' }}>
      👤 Profil
    </h1>
    <p style={{ color: '#64748B', marginTop: '8px' }}>Yakında eklenecek...</p>
  </div>
)

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone — layout yok */}
        <Route path="/" element={<ProfileSelect />} />
        <Route path="/language" element={<LanguageSelect />} />
        <Route path="/parent" element={<ParentGate />} />
        <Route path="/parent/panel" element={<ParentPanel />} />

        {/* Layout içinde — sidebar + bottomnav var */}
        <Route element={<AppLayout />}>
          <Route path="/categories" element={<CategorySelect />} />
          <Route path="/learn" element={<FlashCards />} />
          <Route path="/quiz" element={<QuizScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/play" element={<DialogueScreen />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/learned" element={<LearnedWords />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}