import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { optionGroups } from '@/data/options'
import type { ManagedOption, OptionGroup, OptionCategory } from '@/data/options'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, ChevronRight, Lock, Check, X } from 'lucide-react'

const CATEGORY_ORDER: OptionCategory[] = ['competition', 'result', 'protest', 'user', 'news', 'notification']

export function OptionsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const [groups, setGroups] = useState<OptionGroup[]>(() => optionGroups.map(g => ({ ...g, options: [...g.options] })))
  const [draft, setDraft] = useState<OptionGroup[]>(() => optionGroups.map(g => ({ ...g, options: [...g.options] })))
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [newOption, setNewOption] = useState<ManagedOption>({ value: '', label_en: '', label_zh: '' })
  const [showNewRow, setShowNewRow] = useState(false)
  const [tipIdx, setTipIdx] = useState<number | null>(null)

  const draftGroup = draft.find(g => g.key === selectedKey)
  const isDirty = JSON.stringify(groups) !== JSON.stringify(draft)

  const getGroupName = (g: OptionGroup) => lang === 'zh' ? g.name_zh : g.name_en
  const getCatName = (cat: OptionCategory) => t(`admin.optionCat${cat.charAt(0).toUpperCase()}${cat.slice(1)}`)

  const syncToSource = (updated: OptionGroup[]) => {
    updated.forEach(g => {
      const src = optionGroups.find(s => s.key === g.key)
      if (src) src.options = g.options
    })
  }

  const isValueLocked = (groupKey: string, optValue: string) => {
    const committedGroup = groups.find(g => g.key === groupKey)
    return committedGroup?.options.some(o => o.value === optValue) ?? false
  }

  const addOption = () => {
    if (!selectedKey || !newOption.value.trim()) return
    setDraft(prev => prev.map(g =>
      g.key === selectedKey
        ? { ...g, options: [...g.options, { ...newOption }] }
        : g,
    ))
    setNewOption({ value: '', label_en: '', label_zh: '' })
    setShowNewRow(false)
  }

  const deleteOption = (idx: number) => {
    if (!selectedKey) return
    setDraft(prev => prev.map(g =>
      g.key === selectedKey
        ? { ...g, options: g.options.filter((_, i) => i !== idx) }
        : g,
    ))
  }

  const updateOption = (idx: number, field: keyof ManagedOption, value: string) => {
    if (!selectedKey) return
    setDraft(prev => prev.map(g =>
      g.key === selectedKey
        ? { ...g, options: g.options.map((o, i) => i === idx ? { ...o, [field]: value } : o) }
        : g,
    ))
  }

  const handleSave = () => {
    setGroups(draft)
    syncToSource(draft)
  }

  if (draftGroup) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedKey(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">{getCatName(draftGroup.category)}</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-sm font-medium text-gray-900">{getGroupName(draftGroup)}</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{draftGroup.key}</span>
          <span className="text-xs text-gray-500">{draftGroup.options.length} {t('common.total')}</span>
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty}>
            {t('common.save')}
          </Button>
        </div>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium w-40">Value</th>
                  <th className="px-4 py-3 font-medium">Label (EN)</th>
                  <th className="px-4 py-3 font-medium">Label (中文)</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {draftGroup.options.map((opt, idx) => {
                  const locked = isValueLocked(draftGroup.key, opt.value)
                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-4 py-2">
                        <div className="relative">
                          <input
                            className={`w-full rounded-md border px-2 py-1.5 text-sm font-mono ${locked ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300'}`}
                            value={opt.value}
                            disabled={locked}
                            onChange={(e) => updateOption(idx, 'value', e.target.value)}
                          />
                          {locked && (
                            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={opt.label_en} onChange={(e) => updateOption(idx, 'label_en', e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        <input className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={opt.label_zh} onChange={(e) => updateOption(idx, 'label_zh', e.target.value)} />
                      </td>
                      <td className="px-4 py-2">
                        {locked ? (
                          <div className="relative inline-block">
                            <button
                              onClick={() => { setTipIdx(idx); setTimeout(() => setTipIdx(null), 2500) }}
                              className="text-gray-300 hover:text-gray-400"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            {tipIdx === idx && (
                              <span className="absolute right-0 top-7 z-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg">
                                {t('admin.optionDeleteLocked')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => deleteOption(idx)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {showNewRow && (
                  <tr className="border-b border-gray-100 bg-blue-50/30">
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-md border border-blue-300 px-2 py-1.5 text-sm font-mono"
                        placeholder="value"
                        value={newOption.value}
                        autoFocus
                        onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addOption(); if (e.key === 'Escape') setShowNewRow(false) }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        placeholder="Label (EN)"
                        value={newOption.label_en}
                        onChange={(e) => setNewOption(prev => ({ ...prev, label_en: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addOption(); if (e.key === 'Escape') setShowNewRow(false) }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        placeholder="Label (中文)"
                        value={newOption.label_zh}
                        onChange={(e) => setNewOption(prev => ({ ...prev, label_zh: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addOption(); if (e.key === 'Escape') setShowNewRow(false) }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={addOption} disabled={!newOption.value.trim()} className="text-blue-500 hover:text-blue-700 disabled:text-gray-300">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setShowNewRow(false); setNewOption({ value: '', label_en: '', label_zh: '' }) }} className="text-gray-300 hover:text-gray-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!showNewRow && (
            <div className="p-3 border-t bg-gray-50">
              <Button variant="ghost" size="sm" onClick={() => setShowNewRow(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {t('common.create')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-sm font-semibold text-gray-700">{t('admin.optionsManagement')}</h1>

      {CATEGORY_ORDER.map(cat => {
        const catGroups = draft.filter(g => g.category === cat)
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
