import { useApp } from '@/hooks/useAppStore'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { ChevronRight, ListChecks } from 'lucide-react'

export function SettingsPage() {
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()

  const sections = [
    {
      title: lang === 'zh' ? '下拉选项管理' : 'Dropdown Options',
      desc: lang === 'zh' ? '管理天气、车型组等下拉选项' : 'Manage weather, car class and other dropdown options',
      icon: ListChecks,
      onClick: () => navigate('/settings/options'),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{lang === 'zh' ? '其他设置' : 'Settings'}</h1>
      <div className="space-y-3">
        {sections.map(s => (
          <div key={s.title} className="cursor-pointer" onClick={s.onClick}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
