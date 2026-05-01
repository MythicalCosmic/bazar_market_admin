<template>
  <v-img v-bind="$attrs" :src="resolvedSrc" />
</template>

<script setup>
import { ref, watch } from 'vue'

const FILE_URL   = import.meta.env.VITE_FILE_SERVICE_URL || 'https://files.bazarmarket.org'
const FILE_TOKEN = import.meta.env.VITE_FILE_API_TOKEN || ''

// Module-level cache shared across all instances
const cache = new Map()

const props = defineProps({ src: String })
const resolvedSrc = ref('')

function needsAuth(url) {
  return url && (url.includes(FILE_URL) || url.includes('files.bazarmarket.org'))
}

async function resolve(url) {
  if (!url) { resolvedSrc.value = ''; return }
  if (!needsAuth(url)) { resolvedSrc.value = url; return }
  if (cache.has(url)) { resolvedSrc.value = cache.get(url); return }

  try {
    const res = await fetch(url, { headers: { 'X-API-TOKEN': FILE_TOKEN } })
    if (!res.ok) { resolvedSrc.value = url; return }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    cache.set(url, objectUrl)
    resolvedSrc.value = objectUrl
  } catch {
    resolvedSrc.value = url
  }
}

watch(() => props.src, resolve, { immediate: true })
</script>
