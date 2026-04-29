import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useSnackStore = defineStore('snack', () => {
  const snack = reactive({ show: false, message: '', color: 'success' })

  function show(message, color = 'success') {
    snack.message = message
    snack.color   = color
    snack.show    = true
  }

  return {
    ...snack,
    get show() { return snack.show },
    set show(v) { snack.show = v },
    get message() { return snack.message },
    get color() { return snack.color },
    success: m => show(m, 'success'),
    error:   m => show(m, 'error'),
    info:    m => show(m, 'info'),
  }
})
