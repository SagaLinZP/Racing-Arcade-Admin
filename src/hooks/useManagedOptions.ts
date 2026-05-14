import { useMemo } from 'react'
import { optionGroups, type ManagedOption } from '@/data/options'

export function useManagedOptions(groupKey: string, lang: 'en' | 'zh') {
  return useMemo(() => {
    const group = optionGroups.find(g => g.key === groupKey)
    if (!group) return []
    return group.options.map((o: ManagedOption) => ({
      value: o.value,
      label: lang === 'zh' ? `${o.label_zh} / ${o.label_en}` : o.label_en,
    }))
  }, [groupKey, lang])
}
