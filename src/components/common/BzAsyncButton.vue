<template>
  <v-btn v-bind="$attrs" :loading="loading" :disabled="disabled" @click="run">
    <slot />
  </v-btn>
</template>

<script setup>
import { ref } from 'vue'
import { useSnackStore } from '@/stores/snack'

const props = defineProps({
  action:       { type: Function, required: true },
  successMsg:   { type: String, default: '' },
  errorMsg:     { type: String, default: '' },
  disabled:     Boolean,
})
const emit = defineEmits(['done', 'error'])
const snack = useSnackStore()
const loading = ref(false)

async function run() {
  if (loading.value) return
  loading.value = true
  try {
    const result = await props.action()
    if (props.successMsg) snack.success(props.successMsg)
    emit('done', result)
  } catch (e) {
    if (props.errorMsg) snack.error(e.response?.data?.message || props.errorMsg)
    emit('error', e)
  } finally {
    loading.value = false
  }
}
</script>
