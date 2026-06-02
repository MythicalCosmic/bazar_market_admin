<template>
  <div class="bz-card bz-dt" :class="`bz-dt--${density}`" rounded="lg">
    <!-- Optional toolbar: title slot + density control -->
    <div v-if="$slots.toolbar || title || densityToggle" class="bz-dt-toolbar d-flex align-center ga-3">
      <div v-if="title" class="bz-dt-title">{{ title }}</div>
      <slot name="toolbar" />
      <v-spacer />
      <v-menu v-if="densityToggle" location="bottom end">
        <template #activator="{ props: act }">
          <v-btn v-bind="act" icon variant="text" size="small" title="Zichlik">
            <v-icon size="19">mdi-format-line-spacing</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="180" rounded="lg">
          <v-list-subheader>Jadval zichligi</v-list-subheader>
          <v-list-item
            v-for="opt in densities" :key="opt.v"
            :active="density === opt.v"
            @click="density = opt.v"
          >
            <template #prepend><v-icon size="18">{{ opt.icon }}</v-icon></template>
            <v-list-item-title>{{ opt.t }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <component
      :is="virtual ? VDataTableVirtual : VDataTable"
      :model-value="modelValue"
      :headers="headers"
      :items="items"
      :loading="loading"
      :item-value="itemValue"
      :show-select="showSelect"
      :items-per-page="virtual ? undefined : perPage"
      :height="virtual ? virtualHeight : undefined"
      hide-default-footer
      class="bz-dt-table"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <!-- Forward every slot (item.*, header.*, etc.) to the parent -->
      <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>

      <template #loading>
        <BzSkeleton v-for="n in 6" :key="n" type="row" />
      </template>
      <template v-if="!$slots['no-data']" #no-data>
        <BzEmptyState :icon="emptyIcon" :title="emptyTitle" :subtitle="emptySubtitle" />
      </template>
    </component>

    <!-- Footer: total + pagination + per-page -->
    <template v-if="!virtual && (total || items.length)">
      <v-divider />
      <div class="bz-dt-footer d-flex align-center justify-space-between px-4 py-3 ga-3">
        <div class="bz-dt-count">Jami: <b>{{ total }}</b> ta</div>
        <v-pagination
          v-if="pages > 1"
          :model-value="page"
          :length="pages"
          :total-visible="paginationVisible"
          size="small"
          rounded="lg"
          @update:model-value="v => $emit('update:page', v)"
        />
        <v-select
          :model-value="perPage"
          :items="perPageOptions"
          hide-details
          density="compact"
          variant="outlined"
          class="bz-dt-perpage"
          @update:model-value="v => $emit('update:perPage', v)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useDisplay } from 'vuetify'
import { VDataTable, VDataTableVirtual } from 'vuetify/components'
import BzSkeleton from './BzSkeleton.vue'
import BzEmptyState from './BzEmptyState.vue'

const props = defineProps({
  modelValue:    { type: Array, default: () => [] },   // selection
  headers:       { type: Array, required: true },
  items:         { type: Array, default: () => [] },
  loading:       { type: Boolean, default: false },
  itemValue:     { type: String, default: 'id' },
  showSelect:    { type: Boolean, default: false },
  total:         { type: Number, default: 0 },
  page:          { type: Number, default: 1 },
  perPage:       { type: Number, default: 20 },
  perPageOptions:{ type: Array, default: () => [10, 20, 50, 100] },
  virtual:       { type: Boolean, default: false },
  virtualHeight: { type: [Number, String], default: 600 },
  title:         { type: String, default: '' },
  densityToggle: { type: Boolean, default: true },
  emptyIcon:     { type: String, default: 'mdi-database-off-outline' },
  emptyTitle:    { type: String, default: "Ma'lumot topilmadi" },
  emptySubtitle: { type: String, default: '' },
})
defineEmits(['update:modelValue', 'update:page', 'update:perPage'])

const display = useDisplay()
const paginationVisible = computed(() => display.smAndDown.value ? 3 : 6)

// Comfort-first default, persisted across sessions (UX research: give the
// user density control — Comfortable / Cozy / Compact).
const density = useStorage('bz-table-density', 'comfortable')
const densities = [
  { v: 'comfortable', t: 'Keng (qulay)', icon: 'mdi-arrow-split-horizontal' },
  { v: 'cozy',        t: "O'rtacha",     icon: 'mdi-format-align-justify' },
  { v: 'compact',     t: 'Ixcham',       icon: 'mdi-format-line-spacing' },
]

const pages = computed(() => Math.max(1, Math.ceil((props.total || 0) / props.perPage)))
</script>

<style scoped>
.bz-dt { overflow: hidden; }
.bz-dt-toolbar {
  padding: 14px 16px;
  border-bottom: 1px solid var(--bz-border);
}
.bz-dt-title { font-weight: 700; font-size: 14px; color: var(--bz-text-1); }
.bz-dt-footer { flex-wrap: wrap; }
.bz-dt-count { font-size: 13px; color: var(--bz-text-3); }
.bz-dt-count :deep(b) { color: var(--bz-text-1); }
.bz-dt-perpage { max-width: 92px; }

/* Density variants — adjust vertical rhythm of rows */
.bz-dt--cozy    :deep(.v-data-table__td) { padding-top: 8px !important; padding-bottom: 8px !important; }
.bz-dt--compact :deep(.v-data-table__td) { padding-top: 4px !important; padding-bottom: 4px !important; font-size: 13px; }
.bz-dt--compact :deep(.v-data-table__th) { padding-top: 6px !important; padding-bottom: 6px !important; }
</style>
