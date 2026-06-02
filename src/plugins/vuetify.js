import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const lightTheme = {
  dark: false,
  colors: {
    primary:    '#10B981',
    secondary:  '#6366F1',
    success:    '#10B981',
    info:       '#06B6D4',
    warning:    '#F59E0B',
    error:      '#F43F5E',
    surface:    '#FFFFFF',
    background: '#EDF1F8',
    'on-surface': '#0B1220',
    'on-background': '#0B1220',
  },
}

const darkTheme = {
  dark: true,
  colors: {
    primary:    '#34D399',
    secondary:  '#818CF8',
    success:    '#34D399',
    info:       '#22D3EE',
    warning:    '#FBBF24',
    error:      '#FB7185',
    surface:    '#0E1626',
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
    VSelect:    { variant: 'outlined', density: 'comfortable', menuProps: { contentClass: 'bz-menu' } },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', menuProps: { contentClass: 'bz-menu' } },
    VTextarea:  { variant: 'outlined', density: 'comfortable' },
    VChip:      { rounded: 'pill' },
    VSwitch:    { color: 'primary', inset: true, hideDetails: 'auto' },
    VTooltip:   { transition: 'fade-transition', openDelay: 250 },
    VDialog:    { transition: 'dialog-bottom-transition' },
    VMenu:      { transition: 'fade-transition' },
  },
})
