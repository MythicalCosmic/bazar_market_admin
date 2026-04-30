<template>
  <div class="d-flex flex-column align-center justify-center pa-12 ga-3">
    <div class="bz-spinner" :style="`width:${size}px;height:${size}px`">
      <v-icon :size="size * 0.55" color="white">mdi-storefront</v-icon>
    </div>
    <div v-if="label" style="font-size:12px;color:var(--bz-text-3);font-weight:600">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  size:  { type: Number, default: 48 },
  label: { type: String, default: '' },
})
</script>

<style scoped>
.bz-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #16A34A, #22C55E);
  box-shadow: 0 6px 20px rgba(22,163,74,0.32);
  animation: bz-bounce 1.2s var(--bz-ease-spring) infinite;
}
@keyframes bz-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-8px) scale(1.04); }
}
</style>
