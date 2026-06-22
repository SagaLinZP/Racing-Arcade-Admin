import { createContext, useContext } from 'react'
import { getStoredLang } from '@/lib/lang'

export interface AppState {
  isLoggedIn: boolean
  currentUser: { id: string; nickname: string; role: string } | null
  language: 'en' | 'zh'
  sidebarCollapsed: boolean
}

export const defaultState: AppState = {
  isLoggedIn: true,
  currentUser: { id: 'admin1', nickname: 'Admin', role: 'admin' },
  language: getStoredLang(),
  sidebarCollapsed: false,
}

export const AppContext = createContext<{
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}>({
  state: defaultState,
  setState: () => {},
})

export function useApp() {
  return useContext(AppContext)
}
