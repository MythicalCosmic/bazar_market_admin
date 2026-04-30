<template>
  <div class="d-flex align-center mb-5 ga-3" style="flex-wrap:wrap">
    <v-btn v-if="back" icon variant="text" size="small" :to="back">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <div style="flex:1;min-width:200px">
      <div class="page-title">{{ title }}</div>
      <div v-if="subtitle" class="page-subtitle">{{ subtitle }}</div>
    </div>
    <div class="d-flex align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  back:     { type: [String, Object], default: null },
})
</script>
