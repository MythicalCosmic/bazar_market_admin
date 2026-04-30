<template>
  <div>
    <div class="d-flex align-center ga-3 px-3 py-3" :style="`padding-left:${level * 28 + 12}px;border-radius:12px;background:${level === 0 ? 'transparent' : 'var(--bz-surface-2)'};margin-bottom:4px;border:1px solid ${level === 0 ? 'var(--bz-border)' : 'transparent'}`">
      <v-icon size="18" color="grey">mdi-drag</v-icon>
      <v-btn v-if="cat.children?.length" icon variant="text" size="x-small" @click="open = !open">
        <v-icon size="16">{{ open ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>
      <v-img :src="cat.image || 'https://placehold.co/40x40/f1f5f9/94a3b8?text=?'" width="40" height="40" rounded="lg" cover />
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">{{ cat.name_uz || cat.name }}</div>
        <div style="font-size:11.5px;color:var(--bz-text-3)">
          {{ cat.products_count ?? 0 }} mahsulot
          <template v-if="cat.children?.length">· {{ cat.children.length }} subkategoriya</template>
        </div>
      </div>
      <v-chip :color="cat.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">{{ cat.is_active ? 'Faol' : 'Nofaol' }}</v-chip>
      <v-btn icon variant="text" size="small" title="Subkategoriya qo'shish" @click="$emit('add-child', cat)"><v-icon size="17">mdi-plus</v-icon></v-btn>
      <v-btn icon variant="text" size="small" :color="cat.is_active ? 'warning' : 'success'" @click="$emit('toggle', cat)"><v-icon size="17">{{ cat.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon></v-btn>
      <v-btn icon variant="text" size="small" @click="$emit('edit', cat)"><v-icon size="17">mdi-pencil-outline</v-icon></v-btn>
      <v-btn icon variant="text" size="small" color="error" @click="$emit('del', cat)"><v-icon size="17">mdi-delete-outline</v-icon></v-btn>
    </div>

    <transition name="fade">
      <div v-if="open && cat.children?.length">
        <CategoryRow
          v-for="child in cat.children"
          :key="child.id"
          :cat="child"
          :level="level + 1"
          @add-child="$emit('add-child', $event)"
          @edit="$emit('edit', $event)"
          @toggle="$emit('toggle', $event)"
          @del="$emit('del', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ name: 'CategoryRow' })

defineProps({
  cat:   { type: Object, required: true },
  level: { type: Number, default: 0 },
})
defineEmits(['add-child', 'edit', 'toggle', 'del'])
const open = ref(true)
</script>
