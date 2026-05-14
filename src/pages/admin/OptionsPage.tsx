import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { optionGroups, type OptionGroup, type ManagedOption } from '@/data/options'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'

export function OptionsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const [groups, setGroups] = useState<OptionGroup[]>(() =>
    optionGroups.map(g => ({ ...g, options: g.options.map(o => ({ ...o })) }))
  )
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const [editOption, setEditOption] = useState<{ groupKey: string; option: ManagedOption; isNew: boolean } | null>(null)

  const activeGroup = activeGroupKey ? groups.find(g => g.key === activeGroupKey) : null

  const addOption = (groupKey: string) => {
    setEditOption({ groupKey, option: { value: '', label_en: '', label_zh: '' }, isNew: true })
  }

  const saveOption = () => {
    if (!editOption) return
    setGroups(prev =>
      prev.map(g => {
        if (g.key !== editOption.groupKey) return g
        if (editOption.isNew) {
          const exists = g.options.some(o => o.value === editOption.option.value)
          if (exists) return g
          return { ...g, options: [...g.options, editOption.option] }
        }
        return { ...g, options: g.options.map(o => o.value === editOption.option.value ? editOption.option : o) }
      })
    )
    setEditOption(null)
  }

  const removeOption = (groupKey: string, value: string) => {
    setGroups(prev =>
      prev.map(g => g.key === groupKey ? { ...g, options: g.options.filter(o => o.value !== value) } : g)
    )
  }

  if (!activeGroup) {
    const groupColumns = [
      {
        key: 'name',
        header: lang === 'zh' ? '选项组名称' : 'Option Group',
        render: (g: OptionGroup) => (
          <div>
            <div className="font-medium text-gray-900">{lang === 'zh' ? g.name_zh : g.name_en}</div>
            <div className="text-xs text-gray-500">{g.key}</div>
          </div>
        ),
      },
      {
        key: 'count',
        header: lang === 'zh' ? '选项数量' : 'Options',
        render: (g: OptionGroup) => <span className="text-sm text-gray-600">{g.options.length}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (g: OptionGroup) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setActiveGroupKey(g.key)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ]

    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{lang === 'zh' ? '下拉选项管理' : 'Dropdown Options Management'}</h1>
        <Card padding={false}>
          <DataTable
            columns={groupColumns}
            data={groups}
            keyExtractor={(g) => g.key}
            onRowClick={(g) => setActiveGroupKey(g.key)}
          />
        </Card>
      </div>
    )
  }

  const detailColumns = [
    {
      key: 'value',
      header: 'Value',
      render: (o: ManagedOption) => <span className="font-mono text-sm">{o.value}</span>,
    },
    {
      key: 'label_en',
      header: 'English',
      render: (o: ManagedOption) => o.label_en,
    },
    {
      key: 'label_zh',
      header: '中文',
      render: (o: ManagedOption) => o.label_zh,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (o: ManagedOption) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditOption({ groupKey: activeGroup!.key, option: { ...o }, isNew: false })}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeOption(activeGroup!.key, o.value)}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setActiveGroupKey(null)}>
          {lang === 'zh' ? '← 返回选项列表' : '← Back to list'}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === 'zh' ? activeGroup.name_zh : activeGroup.name_en}
          <span className="text-sm font-normal text-gray-500 ml-2">{activeGroup.options.length} {lang === 'zh' ? '个选项' : 'options'}</span>
        </h1>
        <Button size="sm" variant="secondary" onClick={() => addOption(activeGroup.key)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('common.add')}
        </Button>
      </div>
      <Card padding={false}>
        <DataTable
          columns={detailColumns}
          data={activeGroup.options}
          keyExtractor={(o) => o.value}
        />
      </Card>

      <Modal
        isOpen={!!editOption}
        onClose={() => setEditOption(null)}
        title={editOption?.isNew ? (lang === 'zh' ? '添加选项' : 'Add Option') : (lang === 'zh' ? '编辑选项' : 'Edit Option')}
        size="md"
      >
        {editOption && (
          <div className="space-y-4">
            <Input
              label="Value (key)"
              value={editOption.option.value}
              onChange={(e) => setEditOption({ ...editOption, option: { ...editOption.option, value: e.target.value } })}
              disabled={!editOption.isNew}
            />
            <Input
              label="English Label"
              value={editOption.option.label_en}
              onChange={(e) => setEditOption({ ...editOption, option: { ...editOption.option, label_en: e.target.value } })}
            />
            <Input
              label="中文标签"
              value={editOption.option.label_zh}
              onChange={(e) => setEditOption({ ...editOption, option: { ...editOption.option, label_zh: e.target.value } })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditOption(null)}>{t('common.cancel')}</Button>
              <Button onClick={saveOption}>{t('common.save')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
