<template>
  <div>
    <BzPageHeader title="To'lovlar" :subtitle="total ? `${total} ta jami` : ''" />

    <div class="bz-kpi-rail">
      <BzKpiTile label="Tushum" :value="fmt.compact(stats.revenue)" icon="mdi-cash-multiple" color="#10B981" bg="rgba(16,185,129,0.10)" />
      <BzKpiTile label="O'rtacha" :value="fmt.compact(stats.avg_payment)" icon="mdi-chart-line" color="#3B82F6" bg="rgba(59,130,246,0.10)" />
      <BzKpiTile label="Kutilmoqda" :value="fmt.compact(stats.pending_amount)" icon="mdi-clock-outline" color="#F59E0B" bg="rgba(245,158,11,0.10)" />
      <BzKpiTile label="Qaytarilgan" :value="fmt.compact(stats.refunded_amount)" icon="mdi-cash-refund" color="#EF4444" bg="rgba(239,68,68,0.10)" />
    </div>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Buyurtma raqami, mijoz…" @search="onSearch">
      <v-select v-model="f.status" :items="statuses" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:160px" @update:model-value="load" />
      <v-select v-model="f.method" :items="methods" item-title="t" item-value="v" placeholder="Usul" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
      <v-text-field v-model="f.date_from" type="date" label="Dan"  hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
      <v-text-field v-model="f.date_to"   type="date" label="Gacha" hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
    </BzFilterBar>

    <BzDataTable
      v-model:page="f.page"
      v-model:per-page="f.per_page"
      :headers="headers"
      :items="payments"
      :loading="loading"
      :total="total"
      item-value="id"
      empty-icon="mdi-credit-card-off-outline"
      empty-title="To'lovlar topilmadi"
      @update:page="load"
      @update:per-page="load"
    >
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
    </BzDataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { paymentsApi, statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzKpiTile    from '@/components/common/BzKpiTile.vue'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzDataTable  from '@/components/common/BzDataTable.vue'

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
