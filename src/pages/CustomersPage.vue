<template>
  <div>
    <v-card rounded="xl" class="pa-4 mb-4" style="border:1px solid rgba(0,0,0,0.07)">
      <v-row dense align="center">
        <v-col cols="12" sm="5">
          <v-text-field
            v-model="f.q"
            placeholder="Ism, telefon, username..."
            prepend-inner-icon="mdi-magnify"
            clearable hide-details
            @update:model-value="debounce"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="f.is_active"
            :items="activeOptions"
            item-title="t" item-value="v"
            placeholder="Holat" clearable hide-details
            @update:model-value="load"
          />
        </v-col>
        <v-col cols="6" sm="4" class="d-flex justify-end">
          <v-chip variant="tonal" color="primary">Jami: {{ total }} ta mijoz</v-chip>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <v-data-table
        :headers="headers"
        :items="customers"
        :loading="loading"
        hide-default-footer
        :items-per-page="f.per_page"
      >
        <template #item.name="{ item }">
          <div>
            <div style="font-weight:700;font-size:13px">
              {{ [item.first_name, item.last_name].filter(Boolean).join(' ') || '—' }}
            </div>
            <div style="font-size:11px;color:#94A3B8">@{{ item.username }}</div>
          </div>
        </template>

        <template #item.phone="{ item }">
          <span style="font-size:13px">{{ item.phone || '—' }}</span>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.is_active ? 'Faol' : 'Bloklangan' }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:#64748B">{{ fmt.date(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" :to="`/customers/${item.id}`">
            <v-icon size="17">mdi-eye-outline</v-icon>
          </v-btn>
        </template>

        <template #loading><PageLoader :size="36" /></template>
        <template #no-data>
          <EmptyState icon="mdi-account-group-outline" title="Mijozlar topilmadi" />
        </template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div style="font-size:13px;color:#64748B">Jami: <b>{{ total }}</b> ta</div>
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
import PageLoader from '@/components/common/PageLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const fmt       = useFormat()
const customers = ref([])
const loading   = ref(false)
const total     = ref(0)
const pages     = computed(() => Math.ceil(total.value / f.value.per_page))

const f = ref({ q: '', is_active: null, page: 1, per_page: 20, order_by: '-created_at' })

const headers = [
  { title: 'Mijoz',    key: 'name',       sortable: false },
  { title: 'Telefon',  key: 'phone',      sortable: false },
  { title: 'Holat',    key: 'is_active',  width: 120 },
  { title: 'Sanasi',   key: 'created_at', width: 140 },
  { title: '',         key: 'actions',    width: 50, sortable: false },
]

const activeOptions = [
  { t: 'Faol',      v: true },
  { t: 'Bloklangan',v: false },
]

let timer
function debounce() {
  clearTimeout(timer)
  timer = setTimeout(() => { f.value.page = 1; load() }, 400)
}

async function load() {
  loading.value = true
  try {
    const { data } = await customersApi.list(fmt.cleanParams({ ...f.value }))
    customers.value = data.data?.items || data.data || []
    total.value     = data.data?.total || 0
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
