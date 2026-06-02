<template>
  <v-app :theme="theme">
    <router-view />

    <!-- Global snackbar -->
    <v-snackbar
      v-model="snack.show"
      location="bottom right"
      rounded="pill"
      :timeout="3500"
      transition="bz-slide-up-transition"
      class="bz-toast"
      :class="`bz-toast--${snack.color}`"
    >
      <div class="d-flex align-center ga-2">
        <v-icon size="18" :color="snack.color">
          {{ snack.color === 'success' ? 'mdi-check-circle'
           : snack.color === 'error'   ? 'mdi-alert-circle'
           : 'mdi-information' }}
        </v-icon>
        <span style="font-weight:600">{{ snack.message }}</span>
      </div>
    </v-snackbar>

    <!-- Command palette (mounted globally so ⌘K works anywhere) -->
    <BzCommandPalette v-if="auth.isLoggedIn" />
  </v-app>
</template>

<script setup>
import { computed, provide, watchEffect } from 'vue'
import { useStorage, useMagicKeys, whenever } from '@vueuse/core'
import { useSnackStore } from '@/stores/snack'
import { useAuthStore } from '@/stores/auth'
import { usePaletteStore } from '@/stores/palette'
import BzCommandPalette from '@/components/common/BzCommandPalette.vue'

const snack   = useSnackStore()
const auth    = useAuthStore()
const palette = usePaletteStore()

const themeRaw = useStorage('bz-theme', 'dark')
const theme    = computed(() => themeRaw.value === 'dark' ? 'dark' : 'light')

function toggleTheme() {
  themeRaw.value = themeRaw.value === 'dark' ? 'light' : 'dark'
}

// "Reduce effects" — disables live blur + animation globally via [data-bz-lite].
const lite = useStorage('bz-lite', false)
function toggleLite() { lite.value = !lite.value }
watchEffect(() => {
  if (typeof document === 'undefined') return
  if (lite.value) document.documentElement.setAttribute('data-bz-lite', '')
  else document.documentElement.removeAttribute('data-bz-lite')
})

provide('theme', theme)
provide('toggleTheme', toggleTheme)
provide('lite', lite)
provide('toggleLite', toggleLite)

// Cmd/Ctrl + K → command palette
const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && e.type === 'keydown') {
      e.preventDefault()
    }
  },
})
whenever(keys['Meta+K'],    () => auth.isLoggedIn && palette.toggle())
whenever(keys['Control+K'], () => auth.isLoggedIn && palette.toggle())
</script>

<style>
.bz-toast .v-snackbar__wrapper {
  background: var(--bz-glass-bg-strong) !important;
  -webkit-backdrop-filter: blur(var(--bz-glass-blur-lg)) saturate(160%);
  backdrop-filter: blur(var(--bz-glass-blur-lg)) saturate(160%);
  border: 1px solid var(--bz-glass-border);
  box-shadow: var(--bz-shadow-lg), inset 0 1px 0 var(--bz-glass-highlight);
  color: var(--bz-text-1) !important;
}
.bz-toast--success .v-snackbar__wrapper { box-shadow: var(--bz-glow-soft), var(--bz-shadow-lg); }
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .bz-toast .v-snackbar__wrapper { background: var(--bz-glass-bg-solid) !important; }
}
</style>
