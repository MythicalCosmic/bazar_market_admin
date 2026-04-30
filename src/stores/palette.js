import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

export const usePaletteStore = defineStore('palette', () => {
  const open    = ref(false)
  const recent  = useStorage('bz-palette-recent', [])

  function show()   { open.value = true }
  function hide()   { open.value = false }
  function toggle() { open.value = !open.value }

  function pushRecent(item) {
    if (!item?.to) return
    const filtered = recent.value.filter(x => x.to !== item.to)
    recent.value = [item, ...filtered].slice(0, 8)
  }

  return { open, recent, show, hide, toggle, pushRecent }
})
