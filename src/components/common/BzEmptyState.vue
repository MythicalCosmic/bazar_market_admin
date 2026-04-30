<template>
  <div class="d-flex flex-column align-center justify-center pa-12" style="color:var(--bz-text-3);text-align:center">
    <div
      class="d-flex align-center justify-center mb-4"
      :style="`width:72px;height:72px;border-radius:24px;background:${bgColor || 'var(--bz-surface-3)'}`"
    >
      <v-icon size="36" :color="color">{{ icon }}</v-icon>
    </div>
    <div style="font-size:15px;font-weight:700;color:var(--bz-text-2)">{{ title }}</div>
    <div v-if="subtitle" style="font-size:13px;margin-top:4px;max-width:360px">{{ subtitle }}</div>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:     { type: String, default: 'mdi-database-off-outline' },
  title:    { type: String, default: "Ma'lumot topilmadi" },
  subtitle: { type: String, default: '' },
  color:    { type: String, default: 'grey-lighten-1' },
  bgColor:  { type: String, default: '' },
})
</script>
