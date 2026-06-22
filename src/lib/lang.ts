export type Lang = 'en' | 'zh'

const LANG_KEY = 'racing-arcade-lang'

export function getStoredLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'en' || v === 'zh') return v
  } catch {
    /* ignore */
  }
  return 'zh'
}

export function setStoredLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}
