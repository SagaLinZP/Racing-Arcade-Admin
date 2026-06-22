import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppContext, defaultState, type AppState } from './hooks/useAppStore'
import { AdminLayout } from './components/layout/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { CompetitionListPage } from './pages/competitions/CompetitionListPage'
import { CompetitionCreatePage } from './pages/competitions/CompetitionCreatePage'
import { CompetitionEditPage } from './pages/competitions/CompetitionEditPage'
import { RegistrationListPage } from './pages/registrations/RegistrationListPage'
import { TemplateListPage } from './pages/templates/TemplateListPage'
import { TemplateEditPage } from './pages/templates/TemplateEditPage'
import { ResultListPage } from './pages/results/ResultListPage'
import { CompetitionResultsPage } from './pages/results/CompetitionResultsPage'
import { ResultEntryPage } from './pages/results/ResultEntryPage'
import { ProtestListPage } from './pages/protests/ProtestListPage'
import { ProtestDetailPage } from './pages/protests/ProtestDetailPage'
import { UserListPage } from './pages/users/UserListPage'
import { UserDetailPage } from './pages/users/UserDetailPage'
import { NewsListPage } from './pages/news/NewsListPage'
import { NewsEditPage } from './pages/news/NewsEditPage'
import { TeamListPage } from './pages/teams/TeamListPage'
import { TeamDetailPage } from './pages/teams/TeamDetailPage'
import { NotificationPage } from './pages/notifications/NotificationPage'
import { OptionsPage } from './pages/admin/OptionsPage'
import './i18n'

import { scrollToTop } from './lib/scrollContainer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    scrollToTop()
  }, [pathname])
  return null
}

export default function App() {
  const [state, setState] = useState<AppState>(defaultState)

  return (
    <AppContext.Provider value={{ state, setState }}>
      <BrowserRouter basename="/Racing-Arcade-Admin">
        <ScrollToTop />
        <Routes>
          {!state.isLoggedIn ? (
            <Route path="*" element={<LoginPage />} />
          ) : (
            <Route element={<AdminLayout />}>
              <Route path="/" element={<CompetitionListPage />} />
              <Route path="/competitions" element={<CompetitionListPage />} />
              <Route path="/competitions/create" element={<CompetitionCreatePage />} />
              <Route path="/competitions/:id/edit" element={<CompetitionEditPage />} />
              <Route path="/registrations" element={<RegistrationListPage />} />
              <Route path="/templates" element={<TemplateListPage />} />
              <Route path="/templates/create" element={<TemplateEditPage />} />
              <Route path="/templates/:id/edit" element={<TemplateEditPage />} />
              <Route path="/results" element={<ResultListPage />} />
              <Route path="/results/competition/:competitionId" element={<CompetitionResultsPage />} />
              <Route path="/results/:id" element={<ResultEntryPage />} />
              <Route path="/protests" element={<ProtestListPage />} />
              <Route path="/protests/:id" element={<ProtestDetailPage />} />
              <Route path="/users" element={<UserListPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/news" element={<NewsListPage />} />
              <Route path="/news/create" element={<NewsEditPage />} />
              <Route path="/news/:id/edit" element={<NewsEditPage />} />
              <Route path="/teams" element={<TeamListPage />} />
              <Route path="/teams/:id" element={<TeamDetailPage />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/settings/options" element={<OptionsPage />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}
