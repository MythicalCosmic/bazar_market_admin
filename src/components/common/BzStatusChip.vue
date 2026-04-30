<template>
  <v-chip
    :color="meta.color"
    variant="tonal"
    :size="size"
    class="chip-sm"
  >
    <v-icon v-if="icon && meta.icon" start :size="11">{{ meta.icon }}</v-icon>
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
