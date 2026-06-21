import { useMemo } from 'react'
import { optionGroups, type ManagedOption } from '@/data/options'

export function useManagedOptions(groupKey: string, lang: 'en' | 'zh', allLabel?: string) {
  return useMemo(() => {
    const group = optionGroups.find(g => g.key === groupKey)
    const options = group
      ? group.options.map((o: ManagedOption) => ({
          value: o.value,
          label: lang === 'zh' ? o.label_zh : o.label_en,
        }))
      : []
    if (allLabel) {
      return [{ value: '', label: allLabel }, ...options]
    }
    return options
  }, [groupKey, lang, allLabel])
}
