<template>
  <v-app :theme="theme">
    <router-view />
    <!-- Global snackbar -->
    <v-snackbar
      v-model="snack.show"
      :color="snack.color"
      location="bottom right"
      rounded="xl"
      :timeout="3000"
    >
      <div class="d-flex align-center ga-2">
        <v-icon size="18">
          {{ snack.color === 'success' ? 'mdi-check-circle' : snack.color === 'error' ? 'mdi-alert-circle' : 'mdi-information' }}
        </v-icon>
        {{ snack.message }}
      </div>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, provide } from 'vue'
import { useSnackStore } from '@/stores/snack'

const snack = useSnackStore()
const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide('theme', theme)
provide('toggleTheme', toggleTheme)
</script>
