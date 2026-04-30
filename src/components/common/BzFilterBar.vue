<template>
  <v-card rounded="lg" class="pa-4 mb-4 bz-card">
    <div class="d-flex align-center ga-3" style="flex-wrap:wrap">
      <v-text-field
        v-if="search !== false"
        :model-value="searchValue"
        :placeholder="searchPlaceholder"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        density="comfortable"
        style="min-width:240px;flex:1"
        @update:model-value="onSearch"
      />
      <slot />
      <slot name="actions" />
    </div>
  </v-card>
</template>

<script setup>
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  search:           { type: Boolean, default: true },
  searchValue:      { type: String, default: '' },
  searchPlaceholder:{ type: String, default: 'Qidirish…' },
  debounce:         { type: Number, default: 350 },
})
const emit = defineEmits(['update:searchValue', 'search'])

const onSearch = useDebounceFn(v => {
  emit('update:searchValue', v ?? '')
  emit('search', v ?? '')
}, props.debounce)
</script>
