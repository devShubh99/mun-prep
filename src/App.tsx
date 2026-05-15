import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ConferenceProvider } from './hooks/useConference'
import { AuthGuard } from './components/AuthGuard'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import ConferenceWorkspace from './pages/ConferenceWorkspace'
import Settings from './pages/Settings'
import CheatSheet from './modules/cheat-sheet/CheatSheet'
import ResearchTab from './modules/research/ResearchTab'
import DocumentWorkshop from './modules/documents/DocumentWorkshop'
import DebateSimulator from './modules/debate/DebateSimulator'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<ConferenceProvider><Outlet /></ConferenceProvider>}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="conference/:id" element={<ConferenceWorkspace />}>
              <Route index element={<Navigate to="cheat-sheet" replace />} />
              <Route path="cheat-sheet" element={<CheatSheet />} />
              <Route path="research" element={<ResearchTab />} />
              <Route path="debate" element={<DebateSimulator />} />
              <Route path="documents" element={<DocumentWorkshop />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
