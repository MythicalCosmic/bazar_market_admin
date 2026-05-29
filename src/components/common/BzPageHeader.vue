<template>
  <div class="bz-page-header">
    <v-btn v-if="back" icon variant="text" size="small" :to="back" class="bz-page-header-back">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <div class="bz-page-header-text">
      <div class="page-title">{{ title }}</div>
      <div v-if="subtitle" class="page-subtitle">{{ subtitle }}</div>
    </div>
    <div class="bz-page-header-actions d-flex align-center ga-2">
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

<style scoped>
.bz-page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}
.bz-page-header-text {
  flex: 1;
  min-width: 0;
}
.bz-page-header-actions {
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .bz-page-header {
    margin-bottom: 14px;
    gap: 8px;
  }
  .bz-page-header-actions {
    width: 100%;
  }
  .bz-page-header-actions :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>
