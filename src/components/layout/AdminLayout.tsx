import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import {
  Calendar,
  Trophy,
  ClipboardList,
  AlertTriangle,
  Users,
  Newspaper,
  Shield,
  Bell,
  Monitor,
  FileText,
  Menu,
  ChevronLeft,
  Globe,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setScrollContainer } from '@/lib/scrollContainer'

const navItems = [
  { path: '/championships', icon: Trophy, labelKey: 'admin.championships' },
  { path: '/events', icon: Calendar, labelKey: 'admin.events' },
  { path: '/templates', icon: FileText, labelKey: 'admin.templates' },
  { path: '/results', icon: ClipboardList, labelKey: 'admin.results' },
  { path: '/protests', icon: AlertTriangle, labelKey: 'admin.protests' },
  { path: '/users', icon: Users, labelKey: 'admin.users' },
  { path: '/news', icon: Newspaper, labelKey: 'admin.news' },
  { path: '/teams', icon: Shield, labelKey: 'admin.teams' },
  { path: '/notifications', icon: Bell, labelKey: 'admin.notifications' },
  { path: '/devices', icon: Monitor, labelKey: 'admin.devices' },
]

export function AdminLayout() {
  const { t, i18n } = useTranslation()
  const { state, setState } = useApp()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const toggleLanguage = () => {
    const newLang = state.language === 'en' ? 'zh' : 'en'
    setState({ ...state, language: newLang })
    i18n.changeLanguage(newLang)
  }

  const breadcrumbs = location.pathname.split('/').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1))

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className={cn('flex flex-col bg-white border-r border-gray-200 transition-all duration-200', collapsed ? 'w-16' : 'w-60')}>
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RA</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Racing Arcade</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">RA</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                collapsed && 'justify-center px-0'
              )}
              title={t(item.labelKey)}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setCollapsed(!collapsed)} className="lg:hidden p-1 hover:bg-gray-100 rounded">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-gray-400">Admin</span>
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-gray-300">/</span>
                <span className={i === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>{bc}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <Globe className="w-3.5 h-3.5" />
              {state.language === 'en' ? '中文' : 'EN'}
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-xs font-bold">A</span>
            </div>
            <button onClick={() => setState({ ...state, isLoggedIn: false })} className="text-gray-400 hover:text-gray-600" title={t('admin.logout')}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main ref={setScrollContainer} className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
