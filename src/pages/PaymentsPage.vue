<template>
  <div>
    <BzPageHeader title="To'lovlar" :subtitle="total ? `${total} ta jami` : ''" />

    <v-row class="mb-4" dense>
      <v-col cols="12" sm="6" lg="3"><v-card rounded="xl" class="bz-card pa-4"><div class="section-label">Tushum</div><div class="num" style="font-weight:800;font-size:22px">{{ fmt.compact(stats.revenue) }}</div></v-card></v-col>
      <v-col cols="12" sm="6" lg="3"><v-card rounded="xl" class="bz-card pa-4"><div class="section-label">O'rtacha</div><div class="num" style="font-weight:800;font-size:22px">{{ fmt.compact(stats.avg_payment) }}</div></v-card></v-col>
      <v-col cols="12" sm="6" lg="3"><v-card rounded="xl" class="bz-card pa-4" style="background:rgba(245,158,11,0.06)"><div class="section-label" style="color:var(--bz-warn)">Kutilmoqda</div><div class="num" style="font-weight:800;font-size:22px;color:var(--bz-warn)">{{ fmt.compact(stats.pending_amount) }}</div></v-card></v-col>
      <v-col cols="12" sm="6" lg="3"><v-card rounded="xl" class="bz-card pa-4" style="background:rgba(239,68,68,0.06)"><div class="section-label" style="color:var(--bz-danger)">Qaytarilgan</div><div class="num" style="font-weight:800;font-size:22px;color:var(--bz-danger)">{{ fmt.compact(stats.refunded_amount) }}</div></v-card></v-col>
    </v-row>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Buyurtma raqami, mijoz…" @search="onSearch">
      <v-select v-model="f.status" :items="statuses" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:160px" @update:model-value="load" />
      <v-select v-model="f.method" :items="methods" item-title="t" item-value="v" placeholder="Usul" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
      <v-text-field v-model="f.date_from" type="date" label="Dan"  hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
      <v-text-field v-model="f.date_to"   type="date" label="Gacha" hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
    </BzFilterBar>

    <v-card rounded="xl" class="bz-card">
      <v-data-table :headers="headers" :items="payments" :loading="loading" hide-default-footer :items-per-page="f.per_page">
        <template #item.order="{ item }">
          <router-link v-if="item.order?.id" :to="`/orders/${item.order.id}`" style="font-weight:800;color:rgb(var(--v-theme-primary));text-decoration:none;font-size:13.5px">
            #{{ item.order.order_number }}
          </router-link>
        </template>
        <template #item.customer="{ item }">
          <div>
            <div style="font-weight:700;font-size:13px">{{ fmt.fullName(item.order?.user) }}</div>
            <div style="font-size:11px;color:var(--bz-text-3)">{{ item.order?.user?.phone || '' }}</div>
          </div>
        </template>
        <template #item.method="{ item }">
          <v-chip variant="tonal" size="x-small" class="chip-sm">
            <v-icon start size="11">{{ methodIcon(item.method) }}</v-icon>
            {{ item.method }}
          </v-chip>
        </template>
        <template #item.amount="{ item }">
          <span class="num font-weight-bold">{{ fmt.price(item.amount) }}</span>
        </template>
        <template #item.status="{ item }">
          <BzStatusChip :status="item.status" type="payment" :icon="true" />
        </template>
        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.relativeTime(item.created_at) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" :to="`/payments/${item.id}`"><v-icon size="17">mdi-eye-outline</v-icon></v-btn>
        </template>

        <template #loading><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template #no-data><BzEmptyState icon="mdi-credit-card-off-outline" title="To'lovlar topilmadi" /></template>
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
import { paymentsApi, statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'

const fmt = useFormat()
const payments = ref([])
const loading  = ref(false)
const total    = ref(0)
const stats    = ref({})

const f = ref({ q:'', status:null, method:null, date_from:'', date_to:'', page:1, per_page:20, order_by:'-created_at' })
const pages = computed(() => Math.ceil(total.value / f.value.per_page))

const headers = [
  { title: 'Buyurtma', key: 'order',      sortable: false, width: 130 },
  { title: 'Mijoz',    key: 'customer',   sortable: false },
  { title: 'Usul',     key: 'method',     width: 110 },
  { title: 'Summa',    key: 'amount',     width: 160 },
  { title: 'Holat',    key: 'status',     width: 140 },
  { title: 'Sana',     key: 'created_at', width: 130 },
  { title: '',         key: 'actions',    width: 50, sortable: false },
]
const statuses = [
  { t:'Kutilmoqda', v:'pending' },{ t:'Jarayonda', v:'processing' },
  { t:'Tugatildi', v:'completed' },{ t:'Xato', v:'failed' },{ t:'Qaytarildi', v:'refunded' },
]
const methods = [{ t:'Naqd', v:'cash' },{ t:'Click', v:'click' },{ t:'Payme', v:'payme' }]

function methodIcon(m) { return m === 'cash' ? 'mdi-cash' : m === 'click' ? 'mdi-credit-card' : 'mdi-credit-card-outline' }

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await paymentsApi.list(fmt.cleanParams({ ...f.value }))
    payments.value = data.data?.items || data.data || []
    total.value    = data.data?.total || 0
  } catch {} finally { loading.value = false }
}
async function loadStats() {
  try { const { data } = await statsApi.payments(); stats.value = data.data || {} } catch {}
}

onMounted(() => { load(); loadStats() })
</script>
