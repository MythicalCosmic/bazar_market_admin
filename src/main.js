import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import './styles/main.scss'

// NOTE: ApexCharts is intentionally NOT registered globally here — it is
// imported locally inside each chart wrapper (charts/*.vue) so it only
// ends up in the on-demand "charts" chunk, keeping the initial load light.

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .use(MotionPlugin)
  .mount('#app')
