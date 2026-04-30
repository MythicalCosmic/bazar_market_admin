<template>
  <v-app :theme="theme">
    <router-view />

    <!-- Global snackbar -->
    <v-snackbar
      v-model="snack.show"
      :color="snack.color"
      location="bottom right"
      rounded="xl"
      :timeout="3500"
      transition="bz-slide-up-transition"
    >
      <div class="d-flex align-center ga-2">
        <v-icon size="18">
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
import { computed, provide } from 'vue'
import { useStorage, useMagicKeys, whenever } from '@vueuse/core'
import { useSnackStore } from '@/stores/snack'
import { useAuthStore } from '@/stores/auth'
import { usePaletteStore } from '@/stores/palette'
import BzCommandPalette from '@/components/common/BzCommandPalette.vue'

const snack   = useSnackStore()
const auth    = useAuthStore()
const palette = usePaletteStore()

const themeRaw = useStorage('bz-theme', 'light')
const theme    = computed(() => themeRaw.value === 'dark' ? 'dark' : 'light')

function toggleTheme() {
  themeRaw.value = themeRaw.value === 'dark' ? 'light' : 'dark'
}

provide('theme', theme)
provide('toggleTheme', toggleTheme)

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
