<template>
  <v-chip
    :color="meta.color"
    variant="tonal"
    :size="size"
    class="chip-sm bz-status-chip"
  >
    <v-icon v-if="icon && meta.icon" start :size="11">{{ meta.icon }}</v-icon>
    <span v-else class="bz-status-dot" />
    {{ meta.label }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STATUS, PAYMENT_STATUS, MODERATION_STATUS } from '@/composables/useFormat'

const props = defineProps({
  status: { type: String, default: '' },
  type:   { type: String, default: 'order' },
  icon:   { type: Boolean, default: false },
  size:   { type: String, default: 'x-small' },
})

const dicts = {
  order:      ORDER_STATUS,
  payment:    PAYMENT_STATUS,
  moderation: MODERATION_STATUS,
}

const meta = computed(() => {
  const dict = dicts[props.type] || ORDER_STATUS
  return dict[props.status] || { label: props.status || '—', color: 'grey', icon: 'mdi-help' }
})
</script>

<style scoped>
.bz-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  margin-right: 6px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 22%, transparent);
}
</style>
