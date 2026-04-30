import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSnackStore = defineStore('snack', () => {
  const show    = ref(false)
  const message = ref('')
  const color   = ref('success')

  function open(msg, c = 'success') {
    message.value = msg
    color.value   = c
    show.value    = true
  }

  return {
    show, message, color,
    success: m => open(m, 'success'),
    error:   m => open(m, 'error'),
    info:    m => open(m, 'info'),
  }
})
