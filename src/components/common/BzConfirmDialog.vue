<template>
  <v-dialog :model-value="modelValue" max-width="460" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <div class="pa-5 pb-3 d-flex align-start ga-3">
        <div
          class="d-flex align-center justify-center flex-shrink-0"
          :style="`width:42px;height:42px;border-radius:14px;background:${variantBg}`"
        >
          <v-icon :color="variantColor" size="22">{{ variantIcon }}</v-icon>
        </div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:16px">{{ title }}</div>
          <div style="font-size:13.5px;color:var(--bz-text-2);margin-top:6px;line-height:1.5">{{ text }}</div>
        </div>
      </div>

      <div v-if="reason" class="px-5 pb-2">
        <v-textarea
          :model-value="reasonValue"
          :placeholder="reasonPlaceholder"
          rows="3"
          density="compact"
          hide-details
          @update:model-value="$emit('update:reasonValue', $event)"
        />
      </div>

      <v-card-actions class="pa-4 pt-3">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">{{ cancelLabel }}</v-btn>
        <v-btn :color="variantColor" variant="flat" :loading="loading" @click="$emit('confirm')">
          <v-icon v-if="confirmIcon" start>{{ confirmIcon }}</v-icon>
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:        Boolean,
  title:             { type: String, default: 'Tasdiqlash' },
  text:              { type: String, default: 'Davom etmoqchimisiz?' },
  variant:           { type: String, default: 'danger' },
  confirmLabel:      { type: String, default: '' },
  cancelLabel:       { type: String, default: 'Bekor' },
  confirmIcon:       { type: String, default: '' },
  reason:            { type: Boolean, default: false },
  reasonValue:       { type: String, default: '' },
  reasonPlaceholder: { type: String, default: 'Sababini yozing (ixtiyoriy)…' },
  loading:           Boolean,
})

defineEmits(['update:modelValue', 'update:reasonValue', 'confirm'])

const variants = {
  danger:  { color: 'error',   bg: 'var(--bz-danger-soft)',  icon: 'mdi-alert-circle-outline', label: "O'chirish" },
  warning: { color: 'warning', bg: 'var(--bz-warn-soft)',    icon: 'mdi-alert-outline',         label: 'Davom etish' },
  info:    { color: 'info',    bg: 'var(--bz-accent-soft)',  icon: 'mdi-information-outline',   label: 'Tasdiqlash' },
  success: { color: 'success', bg: 'var(--bz-primary-soft)', icon: 'mdi-check-circle-outline',  label: 'Tasdiqlash' },
}

const v = computed(() => variants[props.variant] || variants.danger)
const variantColor = computed(() => v.value.color)
const variantBg    = computed(() => v.value.bg)
const variantIcon  = computed(() => v.value.icon)
const confirmLabel = computed(() => props.confirmLabel || v.value.label)
</script>
