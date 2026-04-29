<template>
  <div>
    <!-- Stat cards -->
    <v-row class="mb-5" dense>
      <v-col v-for="s in stats" :key="s.key" cols="12" sm="6" xl="3">
        <v-card class="stat-card pa-5" height="124">
          <div class="d-flex align-start justify-space-between">
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#64748B;letter-spacing:0.3px;margin-bottom:8px">{{ s.title }}</div>
              <div class="num" style="font-size:28px;font-weight:800;letter-spacing:-1px;line-height:1">
                <span v-if="loading">—</span>
                <span v-else>{{ s.display }}</span>
              </div>
              <div style="font-size:12px;color:#94A3B8;margin-top:4px">{{ s.sub }}</div>
            </div>
            <div
              class="d-flex align-center justify-center flex-shrink-0"
              :style="`width:44px;height:44px;border-radius:12px;background:${s.bg}`"
            >
              <v-icon :color="s.color" size="22">{{ s.icon }}</v-icon>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Recent orders -->
      <v-col cols="12" lg="8">
        <v-card style="border:1px solid rgba(0,0,0,0.07)" rounded="xl">
          <div class="d-flex align-center justify-space-between pa-5 pb-4">
            <div>
              <div style="font-weight:700;font-size:15px">So'nggi buyurtmalar</div>
              <div style="font-size:12px;color:#94A3B8;margin-top:2px">Oxirgi {{ recentOrders.length }} ta</div>
            </div>
            <v-btn variant="tonal" color="primary" size="small" to="/orders" rounded="lg">
              Barchasini ko'rish
              <v-icon end size="15">mdi-arrow-right</v-icon>
            </v-btn>
          </div>
          <v-divider />

          <PageLoader v-if="ordersLoading" :size="36" />

          <v-list v-else lines="two" class="pa-2">
            <v-list-item
              v-for="o in recentOrders"
              :key="o.id"
              :to="`/orders/${o.id}`"
              rounded="lg"
              class="mb-1"
              style="min-height:60px"
            >
              <template #prepend>
                <v-avatar size="38" :color="getStatus(o.status).color" variant="tonal" class="mr-3">
                  <v-icon size="17">{{ getStatus(o.status).icon }}</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span style="font-weight:700;font-size:14px">#{{ o.order_number }}</span>
                <StatusChip :status="o.status" class="ml-2" />
              </template>
              <template #subtitle>
                <span style="font-size:12px;color:#64748B">
                  {{ o.customer_name || 'Mijoz' }}
                  · {{ fmt.date(o.created_at) }}
                </span>
              </template>
              <template #append>
                <span class="num font-weight-bold" style="font-size:14px">
                  {{ fmt.price(o.total_price || o.total) }}
                </span>
              </template>
            </v-list-item>

            <EmptyState
              v-if="!recentOrders.length"
              icon="mdi-package-variant-closed"
              title="Buyurtmalar yo'q"
            />
          </v-list>
        </v-card>
      </v-col>

      <!-- Right panel -->
      <v-col cols="12" lg="4">
        <!-- Order status breakdown -->
        <v-card style="border:1px solid rgba(0,0,0,0.07)" rounded="xl" class="pa-5 mb-4">
          <div style="font-weight:700;font-size:15px;margin-bottom:16px">Buyurtma holatlari</div>
          <div class="d-flex flex-column" style="gap:10px">
            <div v-for="s in statusBreakdown" :key="s.status" class="d-flex align-center ga-3">
              <div
                class="flex-shrink-0"
                :style="`width:10px;height:10px;border-radius:50%;background:${s.bg}`"
              />
              <span style="font-size:13px;color:#64748B;flex:1">{{ s.label }}</span>
              <span class="num font-weight-bold" style="font-size:14px">{{ s.count }}</span>
              <div style="width:80px">
                <v-progress-linear
                  :model-value="s.pct"
                  :color="s.color"
                  height="4"
                  rounded
                  bg-color="grey-lighten-3"
                />
              </div>
            </div>
          </div>
        </v-card>

        <!-- Quick links -->
        <v-card style="border:1px solid rgba(0,0,0,0.07)" rounded="xl" class="pa-5">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px">Tezkor harakatlar</div>
          <div class="d-flex flex-column" style="gap:8px">
            <v-btn
              v-for="q in quickActions"
              :key="q.to"
              :to="q.to"
              :color="q.color"
              variant="tonal"
              block
              class="justify-start"
              rounded="lg"
              style="font-weight:600"
            >
              <v-icon start size="17">{{ q.icon }}</v-icon>
              {{ q.label }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ordersApi, customersApi, productsApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import StatusChip  from '@/components/common/StatusChip.vue'
import EmptyState  from '@/components/common/EmptyState.vue'
import PageLoader  from '@/components/common/PageLoader.vue'

const fmt = useFormat()
const loading      = ref(true)
const ordersLoading= ref(true)
const recentOrders = ref([])

const stats = ref([
  { key:'orders',    title: 'Jami buyurtmalar',  display: '—', sub: 'Barcha vaqt', icon: 'mdi-package-variant',    color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
  { key:'revenue',   title: 'Bugungi tushum',    display: '—', sub: 'UZS',         icon: 'mdi-cash-multiple',      color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  { key:'customers', title: 'Jami mijozlar',     display: '—', sub: 'Ro\'yxatdan', icon: 'mdi-account-group',      color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  { key:'products',  title: 'Mahsulotlar',       display: '—', sub: 'Katalogda',   icon: 'mdi-cube-outline',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
])

const statusCounts = ref({})

const STATUS_COLORS = {
  pending:   { color: 'warning', bg: '#F59E0B' },
  confirmed: { color: 'info',    bg: '#3B82F6' },
  preparing: { color: 'info',    bg: '#60A5FA' },
  delivering:{ color: 'purple',  bg: '#8B5CF6' },
  delivered: { color: 'success', bg: '#16A34A' },
  completed: { color: 'success', bg: '#22C55E' },
  cancelled: { color: 'error',   bg: '#EF4444' },
}

const statusBreakdown = computed(() => {
  const total = Object.values(statusCounts.value).reduce((a, b) => a + b, 0) || 1
  return Object.entries(ORDER_STATUS).map(([key, meta]) => ({
    status: key,
    label:  meta.label,
    color:  STATUS_COLORS[key]?.color || 'grey',
    bg:     STATUS_COLORS[key]?.bg    || '#94A3B8',
    count:  statusCounts.value[key]   || 0,
    pct:    Math.round(((statusCounts.value[key] || 0) / total) * 100),
  }))
})

function getStatus(s) {
  return { ...ORDER_STATUS[s], color: STATUS_COLORS[s]?.color || 'grey' } || { label: s, color: 'grey', icon: 'mdi-help' }
}

const quickActions = [
  { to: '/orders',    icon: 'mdi-package-variant-closed', label: "Yangi buyurtmalar", color: 'primary' },
  { to: '/products',  icon: 'mdi-plus-box-outline',       label: "Mahsulot qo'shish", color: 'info' },
  { to: '/discounts', icon: 'mdi-sale',                   label: "Chegirma yaratish", color: 'warning' },
  { to: '/coupons',   icon: 'mdi-ticket-percent-outline',  label: "Kupon yaratish",   color: 'success' },
]

onMounted(async () => {
  const [oRes, cRes, pRes] = await Promise.allSettled([
    ordersApi.list({ per_page: 10, order_by: '-created_at' }),
    customersApi.list({ per_page: 1 }),
    productsApi.list({ per_page: 1 }),
  ])

  if (oRes.status === 'fulfilled') {
    const d = oRes.value.data
    recentOrders.value = d.data?.items || d.data || []
    const tot = d.data?.total || recentOrders.value.length
    stats.value[0].display = tot.toLocaleString() + ' ta'
    // count statuses
    recentOrders.value.forEach(o => {
      statusCounts.value[o.status] = (statusCounts.value[o.status] || 0) + 1
    })
  }
  if (cRes.status === 'fulfilled') {
    const tot = cRes.value.data.data?.total
    stats.value[2].display = tot ? tot.toLocaleString() + ' ta' : '—'
  }
  if (pRes.status === 'fulfilled') {
    const tot = pRes.value.data.data?.total
    stats.value[3].display = tot ? tot.toLocaleString() + ' ta' : '—'
  }

  loading.value       = false
  ordersLoading.value = false
})
</script>
