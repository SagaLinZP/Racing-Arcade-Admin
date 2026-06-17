import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { optionGroups } from '@/data/options'
import type { ManagedOption, OptionGroup, OptionCategory } from '@/data/options'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react'

const CATEGORY_ORDER: OptionCategory[] = ['competition', 'result', 'protest', 'user', 'news', 'notification']

export function OptionsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const [groups, setGroups] = useState<OptionGroup[]>(optionGroups)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [newOption, setNewOption] = useState<ManagedOption>({ value: '', label_en: '', label_zh: '' })

  const selectedGroup = groups.find(g => g.key === selectedKey)

  const getGroupName = (g: OptionGroup) => lang === 'zh' ? g.name_zh : g.name_en
  const getCatName = (cat: OptionCategory) => t(`admin.optionCat${cat.charAt(0).toUpperCase()}${cat.slice(1)}`)

  const syncToSource = (updated: OptionGroup[]) => {
    updated.forEach(g => {
      const src = optionGroups.find(s => s.key === g.key)
      if (src) src.options = g.options
    })
  }

  const addOption = () => {
    if (!selectedKey || !newOption.value.trim()) return
    const updated = groups.map(g =>
      g.key === selectedKey
        ? { ...g, options: [...g.options, { ...newOption }] }
        : g,
    )
    setGroups(updated)
    syncToSource(updated)
    setNewOption({ value: '', label_en: '', label_zh: '' })
  }

  const deleteOption = (idx: number) => {
    if (!selectedKey) return
    const updated = groups.map(g =>
      g.key === selectedKey
        ? { ...g, options: g.options.filter((_, i) => i !== idx) }
        : g,
    )
    setGroups(updated)
    syncToSource(updated)
  }

  const updateOption = (idx: number, field: keyof ManagedOption, value: string) => {
    if (!selectedKey) return
    const updated = groups.map(g =>
      g.key === selectedKey
        ? { ...g, options: g.options.map((o, i) => i === idx ? { ...o, [field]: value } : o) }
        : g,
    )
    setGroups(updated)
    syncToSource(updated)
  }

  if (selectedGroup) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedKey(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">{getCatName(selectedGroup.category)}</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-sm font-medium text-gray-900">{getGroupName(selectedGroup)}</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{selectedGroup.key}</span>
          <span className="text-xs text-gray-500">{selectedGroup.options.length} {t('common.total')}</span>
        </div>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium w-40">Value</th>
                  <th className="px-4 py-3 font-medium">Label (EN)</th>
                  <th className="px-4 py-3 font-medium">Label (中文)</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {selectedGroup.options.map((opt, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-4 py-2">
                      <input className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-mono" value={opt.value} onChange={(e) => updateOption(idx, 'value', e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <input className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={opt.label_en} onChange={(e) => updateOption(idx, 'label_en', e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <input className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={opt.label_zh} onChange={(e) => updateOption(idx, 'label_zh', e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => deleteOption(idx)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input label="Value" value={newOption.value} onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))} />
              <Input label="Label (EN)" value={newOption.label_en} onChange={(e) => setNewOption(prev => ({ ...prev, label_en: e.target.value }))} />
              <Input label="Label (中文)" value={newOption.label_zh} onChange={(e) => setNewOption(prev => ({ ...prev, label_zh: e.target.value }))} />
              <Button variant="secondary" onClick={addOption} disabled={!newOption.value.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-sm font-semibold text-gray-700">{t('admin.optionsManagement')}</h1>

      {CATEGORY_ORDER.map(cat => {
        const catGroups = groups.filter(g => g.category === cat)
        if (catGroups.length === 0) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{getCatName(cat)}</h2>
            <Card padding={false}>
              <div className="divide-y divide-gray-100">
                {catGroups.map(g => (
                  <div
                    key={g.key}
                    onClick={() => setSelectedKey(g.key)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{getGroupName(g)}</span>
                      <span className="text-xs font-mono text-gray-400">{g.key}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-gray-500">{g.options.length}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
