<template>
  <v-chip
    :color="meta.color"
    variant="tonal"
    :size="size"
    class="chip-sm"
  >
    <v-icon v-if="icon" start :size="11">{{ meta.icon }}</v-icon>
    {{ meta.label }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/composables/useFormat'

const props = defineProps({
  status: { type: String, default: '' },
  type:   { type: String, default: 'order' },
  icon:   { type: Boolean, default: false },
  size:   { type: String, default: 'x-small' },
})

const meta = computed(() => {
  if (props.type === 'payment') {
    const m = PAYMENT_STATUS[props.status]
    return m ? { ...m, icon: 'mdi-credit-card-outline' } : { label: props.status, color: 'grey', icon: 'mdi-help' }
  }
  return ORDER_STATUS[props.status] || { label: props.status, color: 'grey', icon: 'mdi-help' }
})
</script>
