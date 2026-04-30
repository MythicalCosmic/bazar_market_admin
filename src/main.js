import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import VueApexCharts from 'vue3-apexcharts'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import './styles/main.scss'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .use(MotionPlugin)
  .component('apexchart', VueApexCharts)
  .mount('#app')
