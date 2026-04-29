<template>
  <div class="d-flex align-center justify-center pa-12">
    <v-progress-circular :size="size" :width="3" color="primary" indeterminate />
  </div>
</template>

<script setup>
defineProps({ size: { type: Number, default: 48 } })
</script>
