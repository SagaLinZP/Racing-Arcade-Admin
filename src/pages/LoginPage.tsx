import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const { t } = useTranslation()
  const { state, setState } = useApp()
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setState({ ...state, isLoggedIn: true })
      setLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">RA</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 mb-1">{t('admin.loginTitle')}</h1>
          <p className="text-sm text-center text-gray-500 mb-8">{t('admin.loginSubtitle')}</p>
          <div className="space-y-3">
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? '...' : 'Pit House SSO Login'}
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleLogin} disabled={loading}>
              Admin Quick Login (Demo)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
