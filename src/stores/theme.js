import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { useStorage } from '@vueuse/core'

// ── The redesign's 6 themes + 8 accents + Modern/Editorial type ──
// Dark themes flip Vuetify to its dark base and set data-dark="1".
export const THEMES = [
  { id: 'light',    label: 'Yorug\'',  dark: false, swatch: ['#ffffff', '#eceef3', '#2f6df0'] },
  { id: 'slate',    label: 'Slate',    dark: false, swatch: ['#fafbfc', '#e7e9ee', '#2f6df0'] },
  { id: 'sand',     label: 'Sand',     dark: false, swatch: ['#fbfaf5', '#f1efe7', '#c07c1b'] },
  { id: 'dark',     label: 'Qorong\'u', dark: true,  swatch: ['#161a22', '#0d0f15', '#5c8df8'] },
  { id: 'midnight', label: 'Midnight', dark: true,  swatch: ['#121733', '#0a0e22', '#888df3'] },
  { id: 'forest',   label: 'Forest',   dark: true,  swatch: ['#11201a', '#0a1410', '#27c79a'] },
]

export const ACCENTS = [
  { id: 'cobalt',  color: '#2f6df0' },
  { id: 'emerald', color: '#13936b' },
  { id: 'indigo',  color: '#4b50c4' },
  { id: 'ocean',   color: '#1f88c4' },
  { id: 'plum',    color: '#8a4bc4' },
  { id: 'rose',    color: '#d6325a' },
  { id: 'amber',   color: '#c07c1b' },
  { id: 'coral',   color: '#e2603c' },
]

const DARK_THEMES = new Set(THEMES.filter(t => t.dark).map(t => t.id))

export const useThemeStore = defineStore('theme', () => {
  // Persisted choices (kept under bz-* keys; bz-theme migrated from the
  // old "dark"/"light" string to a theme id on first load).
  const themeId = useStorage('bz-theme-id', 'light')
  const accent  = useStorage('bz-accent', 'cobalt')
  const style   = useStorage('bz-style', 'modern')   // modern | editorial

  // Migrate the legacy bz-theme ("dark"/"light") if a new id isn't set yet.
  const legacy = useStorage('bz-theme', '')
  if (legacy.value && (legacy.value === 'dark' || legacy.value === 'light')) {
    if (!localStorage.getItem('bz-theme-id')) themeId.value = legacy.value
    legacy.value = ''
  }

  const isDark      = computed(() => DARK_THEMES.has(themeId.value))
  const vuetifyName = computed(() => (isDark.value ? 'dark' : 'light'))

  function setTheme(id)  { if (THEMES.some(t => t.id === id)) themeId.value = id }
  function setAccent(id) { if (ACCENTS.some(a => a.id === id)) accent.value = id }
  function setStyle(s)   { style.value = s === 'editorial' ? 'editorial' : 'modern' }
  function toggleStyle() { setStyle(style.value === 'editorial' ? 'modern' : 'editorial') }

  // Quick light/dark switch from the topbar: jump between the last-used
  // light theme and the last-used dark theme.
  const lastLight = useStorage('bz-last-light', 'light')
  const lastDark  = useStorage('bz-last-dark', 'dark')
  function toggleDark() {
    if (isDark.value) { lastDark.value = themeId.value; setTheme(lastLight.value) }
    else              { lastLight.value = themeId.value; setTheme(lastDark.value) }
  }

  // Reflect everything onto <html> as data-* attributes (the CSS reads these).
  watchEffect(() => {
    if (typeof document === 'undefined') return
    const el = document.documentElement
    el.setAttribute('data-theme', themeId.value)
    el.setAttribute('data-accent', accent.value)
    el.setAttribute('data-style', style.value)
    if (isDark.value) el.setAttribute('data-dark', '1')
    else el.removeAttribute('data-dark')
  })

  return {
    themeId, accent, style,
    isDark, vuetifyName,
    THEMES, ACCENTS,
    setTheme, setAccent, setStyle, toggleStyle, toggleDark,
  }
})
