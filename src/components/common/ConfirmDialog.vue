<template>
  <v-dialog :model-value="modelValue" max-width="420" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-2 d-flex align-center ga-2">
        <v-icon color="error" size="22">mdi-alert-circle-outline</v-icon>
        <span style="font-weight:700;font-size:16px">{{ title }}</span>
      </v-card-title>
      <v-card-text class="pa-5 pt-2" style="color:#64748B;font-size:14px">{{ text }}</v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Bekor</v-btn>
        <v-btn color="error" variant="flat" rounded="lg" :loading="loading" @click="$emit('confirm')">
          O'chirish
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title:   { type: String, default: "O'chirish" },
  text:    { type: String, default: "Haqiqatan ham o'chirmoqchimisiz?" },
  loading: Boolean,
})
defineEmits(['update:modelValue', 'confirm'])
</script>
