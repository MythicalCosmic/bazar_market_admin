<template>
  <div v-if="type === 'row'" class="d-flex align-center ga-3 py-2">
    <div class="bz-skeleton" style="width:42px;height:42px;border-radius:12px" />
    <div style="flex:1">
      <div class="bz-skeleton mb-2" :style="`width:${60 + Math.random()*30}%;height:12px`" />
      <div class="bz-skeleton" :style="`width:${30 + Math.random()*20}%;height:10px`" />
    </div>
    <div class="bz-skeleton" style="width:80px;height:20px;border-radius:999px" />
  </div>

  <div v-else-if="type === 'card'" class="pa-4">
    <div class="bz-skeleton mb-3" style="width:40%;height:14px" />
    <div class="bz-skeleton mb-2" style="width:60%;height:32px" />
    <div class="bz-skeleton" style="width:30%;height:10px" />
  </div>

  <div v-else-if="type === 'chart'" class="pa-2">
    <div class="bz-skeleton" :style="`width:100%;height:${height}px;border-radius:12px`" />
  </div>

  <div v-else class="bz-skeleton" :style="`width:${width};height:${height}px;border-radius:${radius}px`" />
</template>

<script setup>
defineProps({
  type:   { type: String, default: 'block' },
  width:  { type: String, default: '100%' },
  height: { type: Number, default: 16 },
  radius: { type: Number, default: 8 },
})
</script>
