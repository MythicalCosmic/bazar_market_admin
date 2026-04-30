import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const lightTheme = {
  dark: false,
  colors: {
    primary:    '#16A34A',
    secondary:  '#64748B',
    success:    '#22C55E',
    info:       '#3B82F6',
    warning:    '#F59E0B',
    error:      '#EF4444',
    surface:    '#FFFFFF',
    background: '#F8FAFC',
    'on-surface': '#0F172A',
    'on-background': '#0F172A',
  },
}

const darkTheme = {
  dark: true,
  colors: {
    primary:    '#22C55E',
    secondary:  '#94A3B8',
    success:    '#22C55E',
    info:       '#60A5FA',
    warning:    '#FBBF24',
    error:      '#F87171',
    surface:    '#0F172A',
    background: '#0B1220',
    'on-surface': '#F1F5F9',
    'on-background': '#F1F5F9',
  },
}

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: { light: lightTheme, dark: darkTheme },
  },
  defaults: {
    VCard:      { rounded: 'lg', elevation: 0 },
    VBtn:       { rounded: 'lg', style: 'text-transform:none;font-weight:600;letter-spacing:0' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect:    { variant: 'outlined', density: 'comfortable' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable' },
    VTextarea:  { variant: 'outlined', density: 'comfortable' },
    VChip:      { rounded: 'pill' },
    VSwitch:    { color: 'primary', inset: true, hideDetails: 'auto' },
    VTooltip:   { transition: 'fade-transition', openDelay: 250 },
  },
})
