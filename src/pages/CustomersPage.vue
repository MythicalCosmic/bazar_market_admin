<template>
  <div>
    <BzPageHeader title="Mijozlar" :subtitle="total ? `${total} ta jami` : ''" />

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Ism, telefon, telegram…" @search="onSearch">
      <v-select v-model="f.is_active" :items="activeOptions" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:170px" @update:model-value="load" />
    </BzFilterBar>

    <v-card rounded="xl" class="bz-card">
      <v-data-table :headers="headers" :items="customers" :loading="loading" hide-default-footer :items-per-page="f.per_page">
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="36" color="primary" variant="tonal">
              <span style="font-size:12px;font-weight:800">{{ fmt.initials(item.first_name, item.last_name) }}</span>
            </v-avatar>
            <div>
              <div style="font-weight:700;font-size:13px">{{ fmt.fullName(item) }}</div>
              <div style="font-size:11px;color:var(--bz-text-3)">
                <v-icon v-if="item.telegram_id" size="11" color="info">mdi-telegram</v-icon>
                {{ item.phone || '—' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.is_active ? 'Faol' : 'Bloklangan' }}
          </v-chip>
        </template>

        <template #item.last_seen_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.relativeTime(item.last_seen_at) }}</span>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.date(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" :to="`/customers/${item.id}`">
            <v-icon size="17">mdi-eye-outline</v-icon>
          </v-btn>
        </template>

        <template #loading><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template #no-data><BzEmptyState icon="mdi-account-group-outline" title="Mijozlar topilmadi" /></template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3 ga-3">
        <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b style="color:var(--bz-text-1)">{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[10,20,50]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { customersApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'

const fmt = useFormat()
const customers = ref([])
const loading   = ref(false)
const total     = ref(0)
const pages     = computed(() => Math.ceil(total.value / f.value.per_page))

const f = ref({ q: '', is_active: null, page: 1, per_page: 20, order_by: '-created_at' })

const headers = [
  { title: 'Mijoz',     key: 'name',         sortable: false },
  { title: 'Holat',     key: 'is_active',    width: 120 },
  { title: 'Oxirgi',    key: 'last_seen_at', width: 150 },
  { title: 'Sanasi',    key: 'created_at',   width: 130 },
  { title: '',          key: 'actions',      width: 50, sortable: false },
]

const activeOptions = [
  { t: 'Faol',       v: 'true' },
  { t: 'Bloklangan', v: 'false' },
]

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await customersApi.list(fmt.cleanParams({ ...f.value }))
    customers.value = data.data?.items || data.data || []
    total.value     = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

onMounted(load)
</script>
