// Shared chart theming so all ApexCharts read one vivid, theme-aware palette.
import { inject, computed } from 'vue'

export const CHART_COLORS = [
  '#10B981', // emerald
  '#6366F1', // indigo
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#F43F5E', // rose
  '#A855F7', // violet
  '#84CC16', // lime
]

// Returns reactive literal colors (ApexCharts can't resolve CSS vars).
export function useChartTheme() {
  const theme = inject('theme', computed(() => 'light'))
  const isDark = computed(() => (theme?.value ?? theme) === 'dark')

  const grid  = computed(() => isDark.value ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)')
  const label = computed(() => isDark.value ? '#6B7890' : '#8A97AB')
  const mode  = computed(() => isDark.value ? 'dark' : 'light')

  return { isDark, grid, label, mode }
}
