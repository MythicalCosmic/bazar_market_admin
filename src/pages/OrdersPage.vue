<template>
  <div>
    <BzPageHeader title="Buyurtmalar" :subtitle="total ? `${total} ta jami` : ''">
      <template #actions>
        <v-btn color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-refresh" :loading="loading" @click="load">
          Yangilash
        </v-btn>
      </template>
    </BzPageHeader>

    <!-- Filters -->
    <BzFilterBar v-model:search-value="f.q" search-placeholder="Raqam, telefon, mijoz…" @search="onSearch">
      <v-select
        v-model="f.payment_method"
        :items="payMethods" item-title="t" item-value="v"
        placeholder="To'lov turi" clearable hide-details density="comfortable"
        style="max-width:160px"
        @update:model-value="load"
      />
      <v-select
        v-model="f.payment_status"
        :items="payStatuses" item-title="t" item-value="v"
        placeholder="To'lov holati" clearable hide-details density="comfortable"
        style="max-width:170px"
        @update:model-value="load"
      />
      <v-text-field v-model="f.date_from" type="date" label="Dan"  hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
      <v-text-field v-model="f.date_to"   type="date" label="Gacha" hide-details density="comfortable" style="min-width:175px;max-width:175px" @change="load" />
    </BzFilterBar>

    <!-- Status tabs (real counts from /stats/orders) -->
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-chip
        v-for="tab in statusTabs"
        :key="String(tab.v)"
        :color="f.status === tab.v ? (tab.color || 'primary') : undefined"
        :variant="f.status === tab.v ? 'flat' : 'outlined'"
        class="cursor-pointer"
        style="font-weight:700;font-size:12px"
        @click="setTab(tab.v)"
      >
        {{ tab.t }}
        <span v-if="statusCounts[tab.v ?? '__all'] !== undefined" class="ml-1" style="opacity:.7">{{ statusCounts[tab.v ?? '__all'] }}</span>
      </v-chip>
    </div>

    <!-- Bulk action bar -->
    <transition name="bz-slide-up">
      <v-card v-if="selected.length" class="mb-3 pa-3 d-flex align-center ga-3" rounded="lg" style="border:1px solid var(--bz-primary-glow);background:var(--bz-primary-soft)">
        <v-icon color="primary">mdi-checkbox-multiple-marked-outline</v-icon>
        <div style="font-weight:700;font-size:13.5px;color:var(--bz-primary)">{{ selected.length }} ta buyurtma tanlandi</div>
        <v-spacer />
        <v-btn size="small" variant="tonal" color="info" @click="bulkSet('confirmed')">Tasdiqlash</v-btn>
        <v-btn size="small" variant="tonal" color="success" @click="bulkSet('completed')">Yakunlash</v-btn>
        <v-btn size="small" variant="text" @click="selected = []">Bekor</v-btn>
      </v-card>
    </transition>

    <!-- Table -->
    <v-card rounded="xl" class="bz-card">
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="orders"
        :loading="loading"
        item-value="id"
        show-select
        hide-default-footer
        :items-per-page="f.per_page"
      >
        <template #item.order_number="{ item }">
          <router-link
            :to="`/orders/${item.id}`"
            class="bz-order-num"
            :title="item.order_number"
          >#{{ item.order_number }}</router-link>
        </template>

        <template #item.customer="{ item }">
          <div class="bz-customer-cell">
            <div style="font-weight:700;font-size:13px;line-height:1.3">{{ item.user?.first_name || item.customer_name || '—' }} {{ item.user?.last_name || '' }}</div>
            <div style="font-size:11.5px;color:var(--bz-text-3);line-height:1.2;margin-top:2px">{{ item.user?.phone || item.customer_phone || '' }}</div>
          </div>
        </template>

        <template #item.status="{ item }">
          <BzStatusChip :status="item.status" :icon="true" />
        </template>

        <template #item.payment_status="{ item }">
          <BzStatusChip :status="item.payment_status" type="payment" />
        </template>

        <template #item.total="{ item }">
          <span class="num font-weight-bold" style="font-size:13px">
            {{ fmt.price(item.total || item.total_price) }}
          </span>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.relativeTime(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" :to="`/orders/${item.id}`">
            <v-icon size="17">mdi-eye-outline</v-icon>
          </v-btn>
        </template>

        <template #loading>
          <BzSkeleton v-for="n in 5" :key="n" type="row" />
        </template>
        <template #no-data>
          <BzEmptyState icon="mdi-package-variant-closed" title="Buyurtmalar topilmadi" />
        </template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3 ga-3" style="flex-wrap:wrap">
        <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b style="color:var(--bz-text-1)">{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[10,20,50,100]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi, statsApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'

const fmt   = useFormat()
const snack = useSnackStore()
const route = useRoute()

const orders   = ref([])
const loading  = ref(false)
const total    = ref(0)
const selected = ref([])
const statusCounts = reactive({})

const f = ref({
  q: route.query.q || '', status: route.query.status || null,
  payment_method: null, payment_status: null,
  date_from: '', date_to: '',
  page: 1, per_page: 20, order_by: '-created_at',
})

const pages = computed(() => Math.ceil(total.value / f.value.per_page))

const headers = [
  { title: 'Raqam',    key: 'order_number',     width: 200, sortable: false },
  { title: 'Mijoz',    key: 'customer',         sortable: false, minWidth: 200 },
  { title: 'Holat',    key: 'status',           width: 150 },
  { title: "To'lov",   key: 'payment_status',   width: 130 },
  { title: 'Summa',    key: 'total',            width: 140, align: 'end' },
  { title: 'Sana',     key: 'created_at',       width: 110 },
  { title: '',         key: 'actions',          width: 56, sortable: false, align: 'end' },
]

const statusTabs = computed(() => [
  { v: null, t: 'Barchasi', color: 'secondary' },
  ...Object.entries(ORDER_STATUS).map(([v, m]) => ({ v, t: m.label, color: m.color })),
])

const payMethods  = [{ t: 'Naqd', v: 'cash' }, { t: 'Click', v: 'click' }, { t: 'Payme', v: 'payme' }]
const payStatuses = [
  { t: "To'lanmagan", v: 'unpaid' }, { t: 'Kutilmoqda', v: 'pending' },
  { t: "To'langan",  v: 'paid' },    { t: 'Qaytarildi', v: 'refunded' },
]

function setTab(v) { f.value.status = v; f.value.page = 1; selected.value = []; load() }
function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await ordersApi.list(fmt.cleanParams({ ...f.value }))
    orders.value = data.data?.items || data.data || []
    total.value  = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function loadStatusCounts() {
  try {
    const { data } = await statsApi.orders({})
    const by = data.data?.by_status || {}
    Object.assign(statusCounts, by, { __all: data.data?.total || 0 })
  } catch {}
}

async function bulkSet(status) {
  if (!selected.value.length) return
  try {
    await ordersApi.bulkStatus({ order_ids: selected.value, status })
    snack.success(`${selected.value.length} ta buyurtma yangilandi`)
    selected.value = []
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

watch(() => route.query, q => {
  f.value.q = q.q || ''
  f.value.status = q.status || null
  load()
}, { deep: true })

onMounted(() => { load(); loadStatusCounts() })
</script>

<style scoped>
.bz-order-num {
  display: inline-block;
  font-weight: 800;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: -0.2px;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--bz-primary-soft);
  transition: background var(--bz-dur-fast) var(--bz-ease);
}
.bz-order-num:hover { background: var(--bz-primary-glow); }

:deep(.v-data-table__td) { white-space: nowrap; }
:deep(.v-data-table__td:has(.bz-customer-cell)) { white-space: normal; }
</style>
