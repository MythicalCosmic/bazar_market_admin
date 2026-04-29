import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

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
    themes: {
      light: {
        colors: {
          primary:    '#16A34A',
          secondary:  '#64748B',
          success:    '#22C55E',
          info:       '#3B82F6',
          warning:    '#F59E0B',
          error:      '#EF4444',
          surface:    '#FFFFFF',
          background: '#F8FAFC',
        },
      },
      dark: {
        colors: {
          primary:    '#22C55E',
          secondary:  '#94A3B8',
          success:    '#22C55E',
          info:       '#60A5FA',
          warning:    '#FBBF24',
          error:      '#F87171',
          surface:    '#1E293B',
          background: '#0F172A',
        },
      },
    },
  },
  defaults: {
    VCard:     { elevation: 0 },
    VTextField:{ variant: 'outlined', density: 'comfortable' },
    VSelect:   { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VBtn:      { style: 'text-transform:none;font-weight:600;letter-spacing:0' },
  },
})
