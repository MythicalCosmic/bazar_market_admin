<template>
  <div>
    <BzPageHeader title="Dashboard" :subtitle="welcomeText">
      <template #actions>
        <v-btn-toggle v-model="period" mandatory density="comfortable" color="primary" variant="outlined" rounded="lg">
          <v-btn value="7"  size="small">7 kun</v-btn>
          <v-btn value="30" size="small">30 kun</v-btn>
          <v-btn value="90" size="small">90 kun</v-btn>
        </v-btn-toggle>
      </template>
    </BzPageHeader>

    <!-- KPIs -->
    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" lg="3">
        <BzStatCard
          title="Bugungi buyurtmalar"
          :value="kpis.ordersToday"
          :delta="kpis.ordersDelta"
          icon="mdi-package-variant-closed"
          color="#16A34A" bg-color="rgba(22,163,74,0.10)"
          :series="ordersSeries" :loading="loading"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <BzStatCard
          title="Bugungi tushum"
          :value="kpis.revenueToday" suffix="UZS"
          :delta="kpis.revenueDelta"
          icon="mdi-cash-multiple"
          color="#3B82F6" bg-color="rgba(59,130,246,0.10)"
          :series="revenueSeries" :loading="loading"
          :format="v => fmt.compact(v)"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <BzStatCard
          title="Yangi mijozlar"
          :value="kpis.newCustomers"
          :delta="kpis.customersDelta"
          icon="mdi-account-plus-outline"
          color="#F59E0B" bg-color="rgba(245,158,11,0.10)"
          :series="customersSeries" :loading="loading"
          sub="Bu davrda"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <BzStatCard
          title="O'rtacha buyurtma"
          :value="kpis.avgOrder" suffix="UZS"
          icon="mdi-chart-line"
          color="#8B5CF6" bg-color="rgba(139,92,246,0.10)"
          :loading="loading"
          :format="v => fmt.compact(v)"
        />
      </v-col>
    </v-row>

    <v-row>
      <!-- Revenue chart -->
      <v-col cols="12" lg="8">
        <v-card rounded="xl" class="bz-card pa-5">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div style="font-weight:800;font-size:15px">Tushum dinamikasi</div>
              <div style="font-size:12px;color:var(--bz-text-3);margin-top:2px">Oxirgi {{ period }} kun</div>
            </div>
            <v-chip color="primary" variant="tonal" size="small" class="chip-sm">
              <v-icon start size="12">mdi-cash</v-icon>
              {{ fmt.price(periodRevenue) }}
            </v-chip>
          </div>
          <BzSkeleton v-if="loading" type="chart" :height="280" />
          <LineChart
            v-else-if="revenueChart.categories.length"
            :series="[{ name: 'Tushum', data: revenueChart.values }]"
            :categories="revenueChart.categories"
            :format-y="v => fmt.compact(v)"
            :height="280"
          />
          <BzEmptyState v-else icon="mdi-chart-line" title="Ma'lumot yo'q" subtitle="Bu davrga tushum qayd etilmagan" />
        </v-card>

        <v-card rounded="xl" class="bz-card pa-5 mt-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div style="font-weight:800;font-size:15px">So'nggi buyurtmalar</div>
              <div style="font-size:12px;color:var(--bz-text-3);margin-top:2px">Yangi {{ recentOrders.length }} ta</div>
            </div>
            <v-btn variant="tonal" color="primary" size="small" to="/orders" rounded="lg">
              Hammasi
              <v-icon end size="14">mdi-arrow-right</v-icon>
            </v-btn>
          </div>
          <template v-if="ordersLoading">
            <BzSkeleton v-for="n in 5" :key="n" type="row" />
          </template>
          <template v-else-if="recentOrders.length">
            <v-list class="pa-0" rounded="lg" lines="two">
              <v-list-item
                v-for="o in recentOrders"
                :key="o.id"
                :to="`/orders/${o.id}`"
                rounded="lg"
                class="mb-1"
                style="min-height:60px"
              >
                <template #prepend>
                  <v-avatar size="38" :color="orderStatusColor(o.status)" variant="tonal" class="mr-3">
                    <v-icon size="17">{{ orderStatusIcon(o.status) }}</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span style="font-weight:700;font-size:13.5px">#{{ o.order_number }}</span>
                  <BzStatusChip :status="o.status" class="ml-2" />
                </template>
                <template #subtitle>
                  <span style="font-size:11.5px;color:var(--bz-text-3)">
                    {{ o.user?.first_name || o.customer_name || 'Mijoz' }} · {{ fmt.relativeTime(o.created_at) }}
                  </span>
                </template>
                <template #append>
                  <span class="num font-weight-bold" style="font-size:13.5px">{{ fmt.price(o.total_price || o.total) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </template>
          <BzEmptyState v-else icon="mdi-package-variant-closed" title="Buyurtmalar yo'q" />
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" lg="4">
        <!-- Orders donut -->
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div style="font-weight:800;font-size:15px;margin-bottom:8px">Buyurtmalar holati</div>
          <BzSkeleton v-if="loading" type="chart" :height="260" />
          <DonutChart
            v-else-if="orderStatusChart.labels.length"
            :series="orderStatusChart.values"
            :labels="orderStatusChart.labels"
            :total="kpis.totalOrders"
            total-label="Jami"
            :height="260"
          />
          <BzEmptyState v-else icon="mdi-chart-donut" title="Ma'lumot yo'q" />
        </v-card>

        <!-- Top products -->
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div style="font-weight:800;font-size:15px">Eng ko'p sevilganlar</div>
            <v-icon size="18" color="warning">mdi-heart</v-icon>
          </div>
          <template v-if="favoritesLoading">
            <BzSkeleton v-for="n in 5" :key="n" type="row" />
          </template>
          <template v-else-if="topFavorites.length">
            <div v-for="(p, i) in topFavorites" :key="p.product_id" class="d-flex align-center ga-3 py-2">
              <div style="width:24px;text-align:center;font-weight:800;color:var(--bz-text-3);font-size:12px">{{ i + 1 }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px">{{ p.name }}</div>
                <div style="font-size:11.5px;color:var(--bz-text-3)">{{ fmt.price(p.price) }}</div>
              </div>
              <v-chip color="warning" variant="tonal" size="x-small" class="chip-sm">
                <v-icon start size="11">mdi-heart</v-icon>
                {{ p.favorite_count }}
              </v-chip>
            </div>
          </template>
          <BzEmptyState v-else icon="mdi-heart-off-outline" title="Ma'lumot yo'q" />
        </v-card>

        <!-- Quick actions -->
        <v-card rounded="xl" class="bz-card pa-5">
          <div style="font-weight:800;font-size:15px;margin-bottom:12px">Tezkor harakatlar</div>
          <div class="d-flex flex-column ga-2">
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
import { ref, computed, onMounted, watch } from 'vue'
import { ordersApi, statsApi, favoritesApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useAuthStore } from '@/stores/auth'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzStatCard   from '@/components/common/BzStatCard.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import LineChart    from '@/components/common/charts/LineChart.vue'
import DonutChart   from '@/components/common/charts/DonutChart.vue'

const fmt  = useFormat()
const auth = useAuthStore()

const period      = ref('30')
const loading     = ref(true)
const ordersLoading   = ref(true)
const favoritesLoading = ref(true)

const kpis = ref({
  ordersToday: 0, ordersDelta: null,
  revenueToday: 0, revenueDelta: null,
  newCustomers: 0, customersDelta: null,
  avgOrder: 0,
  totalOrders: 0,
})

const recentOrders = ref([])
const topFavorites = ref([])

// Time-series buckets
const ordersSeries   = ref([])
const revenueSeries  = ref([])
const customersSeries = ref([])
const revenueChart   = ref({ categories: [], values: [] })
const orderStatusChart = ref({ labels: [], values: [] })
const periodRevenue  = ref(0)

const welcomeText = computed(() => {
  const h = new Date().getHours()
  const greet = h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'
  const name = auth.user?.first_name || auth.user?.username
  return name ? `${greet}, ${name} 👋` : greet
})

const STATUS_BG = {
  pending:'#F59E0B', confirmed:'#3B82F6', preparing:'#60A5FA',
  delivering:'#8B5CF6', delivered:'#16A34A', completed:'#22C55E', cancelled:'#EF4444',
}

function orderStatusColor(s) { return ORDER_STATUS[s]?.color || 'grey' }
function orderStatusIcon(s)  { return ORDER_STATUS[s]?.icon  || 'mdi-help' }

const quickActions = [
  { to: '/orders?status=pending',     icon: 'mdi-package-variant-closed', label: "Yangi buyurtmalar",   color: 'primary' },
  { to: '/products',  icon: 'mdi-plus-box-outline',       label: "Mahsulot qo'shish",      color: 'info' },
  { to: '/discounts', icon: 'mdi-sale',                   label: "Chegirma yaratish",      color: 'warning' },
  { to: '/notifications', icon: 'mdi-bell-plus-outline',  label: "Bildirishnoma yuborish", color: 'success' },
]

function dateRange(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) }
}

function safeArray(v) { return Array.isArray(v) ? v : [] }

async function loadStats() {
  loading.value = true
  const range = dateRange(period.value)
  const [oRes, pRes, cRes] = await Promise.allSettled([
    statsApi.orders(range),
    statsApi.payments(range),
    statsApi.customers(range),
  ])

  // Orders stats
  if (oRes.status === 'fulfilled') {
    const d = oRes.value.data.data || {}
    kpis.value.totalOrders = Number(d.total || 0)
    const series = safeArray(d.timeseries || d.series || d.daily || [])
    ordersSeries.value = series.map(x => Number(x.count ?? x.value ?? x.orders ?? 0))
    kpis.value.ordersToday = ordersSeries.value.at(-1) || Number(d.today || 0)
    if (ordersSeries.value.length >= 2) {
      const last = ordersSeries.value.at(-1)
      const prev = ordersSeries.value.at(-2)
      if (prev > 0) kpis.value.ordersDelta = ((last - prev) / prev) * 100
    }
    const byStatus = d.by_status || {}
    const labels = []
    const values = []
    Object.entries(byStatus).forEach(([k, v]) => {
      labels.push(ORDER_STATUS[k]?.label || k)
      values.push(Number(v) || 0)
    })
    orderStatusChart.value = { labels, values }
  }

  // Payment stats
  if (pRes.status === 'fulfilled') {
    const d = pRes.value.data.data || {}
    kpis.value.avgOrder    = Number(d.avg_payment || d.avg || 0)
    periodRevenue.value    = Number(d.revenue || d.completed_amount || 0)
    const ts = safeArray(d.timeseries || d.daily || d.series || [])
    const cats = []
    const vals = []
    ts.forEach(p => {
      cats.push((p.date || p.day || '').slice(5)) // MM-DD
      vals.push(Number(p.amount ?? p.revenue ?? p.value ?? 0))
    })
    revenueChart.value = { categories: cats, values: vals }
    revenueSeries.value = vals.slice(-12)
    kpis.value.revenueToday = vals.at(-1) || 0
    if (vals.length >= 2 && vals.at(-2) > 0) {
      kpis.value.revenueDelta = ((vals.at(-1) - vals.at(-2)) / vals.at(-2)) * 100
    }
  }

  // Customer stats
  if (cRes.status === 'fulfilled') {
    const d = cRes.value.data.data || {}
    kpis.value.newCustomers = Number(d.new || d.new_count || d.total || 0)
    const ts = safeArray(d.timeseries || d.daily || [])
    customersSeries.value = ts.map(x => Number(x.count ?? x.new ?? x.value ?? 0))
    if (customersSeries.value.length >= 2 && customersSeries.value.at(-2) > 0) {
      kpis.value.customersDelta = ((customersSeries.value.at(-1) - customersSeries.value.at(-2)) / customersSeries.value.at(-2)) * 100
    }
  }

  loading.value = false
}

async function loadRecentOrders() {
  ordersLoading.value = true
  try {
    const { data } = await ordersApi.list({ per_page: 8, order_by: '-created_at' })
    recentOrders.value = data.data?.items || data.data || []
  } catch {} finally { ordersLoading.value = false }
}

async function loadFavorites() {
  favoritesLoading.value = true
  try {
    const { data } = await favoritesApi.most(5)
    topFavorites.value = data.data || []
  } catch {} finally { favoritesLoading.value = false }
}

watch(period, loadStats)
onMounted(() => { loadStats(); loadRecentOrders(); loadFavorites() })
</script>
