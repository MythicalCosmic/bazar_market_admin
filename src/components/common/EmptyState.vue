<template>
  <div class="d-flex flex-column align-center justify-center pa-12" style="color:#94A3B8">
    <v-icon size="64" class="mb-3" :color="color">{{ icon }}</v-icon>
    <div style="font-size:15px;font-weight:600;color:#64748B">{{ title }}</div>
    <div v-if="subtitle" style="font-size:13px;margin-top:4px">{{ subtitle }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon:     { type: String, default: 'mdi-database-off-outline' },
  title:    { type: String, default: 'Ma\'lumot topilmadi' },
  subtitle: { type: String, default: '' },
  color:    { type: String, default: 'grey-lighten-1' },
})
</script>
