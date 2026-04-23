import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppContext, defaultState, type AppState } from './hooks/useAppStore'
import { AdminLayout } from './components/layout/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { EventListPage } from './pages/events/EventListPage'
import { EventCreatePage } from './pages/events/EventCreatePage'
import { EventEditPage } from './pages/events/EventEditPage'
import { ChampionshipListPage } from './pages/events/ChampionshipListPage'
import { ChampionshipCreatePage } from './pages/events/ChampionshipCreatePage'
import { ChampionshipEditPage } from './pages/events/ChampionshipEditPage'
import { TemplateListPage } from './pages/events/TemplateListPage'
import { ResultListPage } from './pages/results/ResultListPage'
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
import { DeviceListPage } from './pages/devices/DeviceListPage'
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
              <Route path="/" element={<ChampionshipListPage />} />
              <Route path="/events" element={<EventListPage />} />
              <Route path="/events/create" element={<EventCreatePage />} />
              <Route path="/events/:id/edit" element={<EventEditPage />} />
              <Route path="/championships" element={<ChampionshipListPage />} />
              <Route path="/championships/create" element={<ChampionshipCreatePage />} />
              <Route path="/championships/:id/edit" element={<ChampionshipEditPage />} />
              <Route path="/templates" element={<TemplateListPage />} />
              <Route path="/results" element={<ResultListPage />} />
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
              <Route path="/devices" element={<DeviceListPage />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}
