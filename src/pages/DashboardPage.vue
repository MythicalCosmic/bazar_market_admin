<template>
  <div class="bz-dash">
    <!-- ── Head ───────────────────────────────────────────── -->
    <div class="bz-dash-head bz-rise">
      <div>
        <div class="page-title">Boshqaruv paneli</div>
        <div class="page-subtitle">{{ welcomeText }} · {{ rangeLabel }}</div>
      </div>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-btn-toggle :model-value="useCustom ? null : period" mandatory density="comfortable" color="primary" variant="outlined" rounded="lg" @update:model-value="setPreset">
          <v-btn value="7"  size="small">7 kun</v-btn>
          <v-btn value="30" size="small">30 kun</v-btn>
          <v-btn value="90" size="small">90 kun</v-btn>
        </v-btn-toggle>

        <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: act }">
            <v-btn v-bind="act" :variant="useCustom ? 'flat' : 'outlined'" :color="useCustom ? 'primary' : undefined" rounded="lg" size="small">
              <v-icon start size="16">mdi-calendar-range</v-icon>
              <span v-if="useCustom && customFrom && customTo">{{ customFrom }} → {{ customTo }}</span>
              <span v-else>Sana</span>
            </v-btn>
          </template>
          <div class="bz-datemenu bz-card pa-4" :class="{ 'is-dark': isDarkTheme }">
            <div class="section-label mb-3">Maxsus oraliq</div>
            <v-text-field v-model="customFrom" type="date" label="Dan" density="compact" hide-details class="mb-2" />
            <v-text-field v-model="customTo" type="date" label="Gacha" density="compact" hide-details class="mb-3" />
            <div class="d-flex ga-2 align-center">
              <v-btn size="small" variant="text" @click="clearCustom">Tozalash</v-btn>
              <v-spacer />
              <v-btn size="small" color="primary" variant="flat" :disabled="!customFrom || !customTo" @click="applyCustom">Qo'llash</v-btn>
            </div>
          </div>
        </v-menu>

        <v-btn color="primary" variant="flat" rounded="lg" size="small" to="/analytics" class="d-none d-sm-flex">
          <v-icon start size="16">mdi-chart-box-outline</v-icon>Tahlil
        </v-btn>
      </div>
    </div>

    <!-- ── KPI rail ───────────────────────────────────────── -->
    <div class="bz-kpi-rail">
      <div
        v-for="(t, i) in kpiTiles" :key="t.key"
        class="bz-kpi bz-card bz-rise"
        :style="`animation-delay:${i * 60}ms`"
      >
        <div class="bz-kpi-head">
          <div class="bz-kpi-ico" :style="`color:${t.color};background:${t.color}1f`">
            <v-icon :color="t.color" size="18">{{ t.icon }}</v-icon>
          </div>
          <span class="bz-kpi-label">{{ t.label }}</span>
          <span v-if="t.delta != null" class="bz-kpi-delta" :class="t.delta >= 0 ? 'is-up' : 'is-down'">
            <v-icon size="12">{{ t.delta >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
            {{ Math.abs(t.delta).toFixed(1) }}%
          </span>
        </div>
        <div class="bz-kpi-val num">
          <span v-if="loading" class="bz-skeleton" style="width:70%;height:26px;display:block;border-radius:8px;margin-top:6px" />
          <template v-else>{{ t.value }}<small v-if="t.unit">{{ t.unit }}</small></template>
        </div>
        <div class="bz-kpi-spark">
          <Sparkline v-if="!loading && t.series.length" :series="t.series" :color="t.color" />
        </div>
      </div>
    </div>

    <!-- ── Bento ──────────────────────────────────────────── -->
    <div class="bz-bento">
      <!-- Revenue area -->
      <section class="bz-card bz-pad bz-b-rev">
        <header class="bz-wh">
          <div>
            <div class="bz-wt">Tushum dinamikasi</div>
            <div class="bz-ws">Kunlik tushum · oxirgi {{ period }} kun</div>
          </div>
          <v-chip color="primary" variant="tonal" size="small" class="chip-sm">
            <v-icon start size="12">mdi-cash</v-icon>{{ fmt.price(periodRevenue) }}
          </v-chip>
        </header>
        <BzSkeleton v-if="loading" type="chart" :height="260" />
        <LineChart
          v-else-if="revenueChart.categories.length"
          :series="[{ name: 'Tushum', data: revenueChart.values }]"
          :categories="revenueChart.categories"
          :format-y="v => fmt.compact(v)"
          :height="260"
        />
        <BzEmptyState v-else icon="mdi-chart-line" title="Ma'lumot yo'q" subtitle="Bu davrga tushum qayd etilmagan" />
      </section>

      <!-- Completion gauge -->
      <section class="bz-card bz-pad bz-b-gauge">
        <header class="bz-wh"><div class="bz-wt">Bajarilish</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="200" />
        <template v-else>
          <RadialChart :value="completionPct" label="Yakunlangan" color="#10B981" :height="210" />
          <div class="bz-gauge-foot">
            <div><span class="num bz-gauge-n">{{ kpis.totalOrders }}</span><span class="bz-gauge-l">Jami</span></div>
            <div><span class="num bz-gauge-n">{{ deliveredCount }}</span><span class="bz-gauge-l">Yetkazildi</span></div>
          </div>
        </template>
      </section>

      <!-- Orders per day bars -->
      <section class="bz-card bz-pad bz-b-bars">
        <header class="bz-wh">
          <div><div class="bz-wt">Buyurtmalar oqimi</div><div class="bz-ws">Kunlik soni</div></div>
        </header>
        <BzSkeleton v-if="loading" type="chart" :height="220" />
        <BarChart
          v-else-if="revenueChart.categories.length"
          :series="[{ name: 'Buyurtmalar', data: ordersSeries }]"
          :categories="revenueChart.categories"
          :colors="['#6366F1']"
          :height="220"
        />
        <BzEmptyState v-else icon="mdi-chart-bar" title="Ma'lumot yo'q" />
      </section>

      <!-- Status donut + breakdown -->
      <section class="bz-card bz-pad bz-b-donut">
        <header class="bz-wh"><div class="bz-wt">Buyurtmalar holati</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="200" />
        <template v-else-if="statusList.length">
          <DonutChart
            :series="orderStatusChart.values" :labels="orderStatusChart.labels"
            :total="kpis.totalOrders" total-label="Jami" :height="200"
          />
          <div class="bz-statlist">
            <div v-for="s in statusList" :key="s.label" class="bz-statrow">
              <span class="bz-dot" :style="`background:${s.color}`" />
              <span class="bz-statname">{{ s.label }}</span>
              <span class="num bz-statval">{{ s.value }}</span>
              <span class="bz-statpct">{{ s.pct }}%</span>
            </div>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-chart-donut" title="Ma'lumot yo'q" />
      </section>

      <!-- Top products bar list -->
      <section class="bz-card bz-pad bz-b-top">
        <header class="bz-wh">
          <div class="bz-wt">Eng ko'p sevilganlar</div>
          <v-icon size="17" color="warning">mdi-heart</v-icon>
        </header>
        <template v-if="favoritesLoading">
          <BzSkeleton v-for="n in 5" :key="n" type="row" />
        </template>
        <template v-else-if="topFavorites.length">
          <div v-for="(p, i) in topFavorites" :key="p.product_id" class="bz-toprow">
            <span class="bz-toprank">{{ i + 1 }}</span>
            <div class="bz-topmid">
              <div class="bz-topname">{{ p.name }}</div>
              <div class="bz-topbar"><span :style="`width:${maxFav ? (p.favorite_count / maxFav * 100) : 0}%`" /></div>
            </div>
            <span class="num bz-topval">{{ p.favorite_count }}</span>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-heart-off-outline" title="Ma'lumot yo'q" />
      </section>

      <!-- Payment methods -->
      <section class="bz-card bz-pad bz-b-pay">
        <header class="bz-wh"><div class="bz-wt">To'lov usullari</div></header>
        <BzSkeleton v-if="extraLoading" type="chart" :height="200" />
        <DonutChart
          v-else-if="paymentChart.labels.length"
          :series="paymentChart.values" :labels="paymentChart.labels"
          :total="paymentTotal" total-label="Jami" :height="230"
          :colors="['#10B981','#6366F1','#F59E0B','#06B6D4','#F43F5E']"
        />
        <BzEmptyState v-else icon="mdi-credit-card-outline" title="Ma'lumot yo'q" />
      </section>

      <!-- Review ratings -->
      <section class="bz-card bz-pad bz-b-rate">
        <header class="bz-wh"><div class="bz-wt">Sharhlar reytingi</div><v-icon size="17" color="warning">mdi-star</v-icon></header>
        <BzSkeleton v-if="extraLoading" type="chart" :height="180" />
        <template v-else>
          <div class="bz-rate-big">
            <span class="num bz-rate-avg">{{ reviewStats.avg ? reviewStats.avg.toFixed(1) : '—' }}</span>
            <div>
              <div class="bz-rate-stars">
                <v-icon v-for="n in 5" :key="n" size="15" :color="n <= Math.round(reviewStats.avg) ? 'warning' : 'grey-darken-1'">mdi-star</v-icon>
              </div>
              <span class="bz-rate-total">{{ reviewStats.total }} ta sharh</span>
            </div>
          </div>
          <div v-for="r in reviewStats.byRating" :key="r.label" class="bz-rate-row">
            <span class="bz-rate-k">{{ r.label }}★</span>
            <div class="bz-rate-bar"><span :style="`width:${r.pct}%`" /></div>
            <span class="bz-rate-v num">{{ r.value }}</span>
          </div>
        </template>
      </section>

      <!-- Products health -->
      <section class="bz-card bz-pad bz-b-prod">
        <header class="bz-wh"><div class="bz-wt">Mahsulotlar holati</div><v-icon size="17" color="primary">mdi-cube-outline</v-icon></header>
        <BzSkeleton v-if="extraLoading" type="chart" :height="180" />
        <div v-else class="bz-prodgrid">
          <div class="bz-prodcell"><span class="num bz-prodn">{{ productStats.total }}</span><span class="bz-prodl">Jami</span></div>
          <div class="bz-prodcell"><span class="num bz-prodn" style="color:var(--bz-primary)">{{ productStats.active }}</span><span class="bz-prodl">Faol</span></div>
          <div class="bz-prodcell"><span class="num bz-prodn" style="color:var(--bz-warn)">{{ productStats.low }}</span><span class="bz-prodl">Kam qoldi</span></div>
          <div class="bz-prodcell"><span class="num bz-prodn" style="color:var(--bz-danger)">{{ productStats.out }}</span><span class="bz-prodl">Tugagan</span></div>
        </div>
      </section>

      <!-- Recent orders compact table -->
      <section class="bz-card bz-pad bz-b-recent">
        <header class="bz-wh">
          <div><div class="bz-wt">So'nggi buyurtmalar</div><div class="bz-ws">Yangi {{ recentOrders.length }} ta</div></div>
          <v-btn variant="tonal" color="primary" size="small" to="/orders" rounded="lg">
            Hammasi<v-icon end size="14">mdi-arrow-right</v-icon>
          </v-btn>
        </header>
        <template v-if="ordersLoading">
          <BzSkeleton v-for="n in 6" :key="n" type="row" />
        </template>
        <div v-else-if="recentOrders.length" class="bz-rtable">
          <router-link v-for="o in recentOrders" :key="o.id" :to="`/orders/${o.id}`" class="bz-rrow">
            <v-avatar size="38" :color="orderStatusColor(o.status)" variant="tonal" class="bz-ravatar">
              <v-icon size="17">{{ orderStatusIcon(o.status) }}</v-icon>
            </v-avatar>
            <div class="bz-rmain">
              <div class="bz-rnum">#{{ o.order_number }}</div>
              <div class="bz-rcust">{{ o.user?.first_name || o.customer_name || 'Mijoz' }} · {{ fmt.relativeTime(o.created_at) }}</div>
            </div>
            <BzStatusChip :status="o.status" :icon="true" class="bz-rstatus" />
            <div class="num bz-rtotal">{{ fmt.price(o.total_price || o.total) }}</div>
          </router-link>
        </div>
        <BzEmptyState v-else icon="mdi-package-variant-closed" title="Buyurtmalar yo'q" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { ordersApi, statsApi, favoritesApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useAuthStore } from '@/stores/auth'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import LineChart    from '@/components/common/charts/LineChart.vue'
import BarChart     from '@/components/common/charts/BarChart.vue'
import DonutChart   from '@/components/common/charts/DonutChart.vue'
import RadialChart  from '@/components/common/charts/RadialChart.vue'
import Sparkline    from '@/components/common/charts/Sparkline.vue'

const fmt  = useFormat()
const auth = useAuthStore()
const theme = inject('theme', null)
const isDarkTheme = computed(() => theme?.value === 'dark')

const period      = ref('30')
const loading     = ref(true)
const ordersLoading   = ref(true)
const favoritesLoading = ref(true)
const extraLoading = ref(true)

// Custom date range
const dateMenu   = ref(false)
const useCustom  = ref(false)
const customFrom = ref('')
const customTo   = ref('')

// Extra-widget data
const paymentChart = ref({ labels: [], values: [] })
const paymentTotal = ref(0)
const reviewStats  = ref({ avg: 0, total: 0, byRating: [] })
const productStats = ref({ total: 0, active: 0, low: 0, out: 0 })

const kpis = ref({
  ordersToday: 0, ordersDelta: null,
  revenueToday: 0, revenueDelta: null,
  periodRevenue: 0,
  newCustomers: 0,
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
const byStatusRaw    = ref({})
const periodRevenue  = ref(0)

const welcomeText = computed(() => {
  const h = new Date().getHours()
  const greet = h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'
  const name = auth.user?.first_name || auth.user?.username
  return name ? `${greet}, ${name} 👋` : greet
})

const STATUS_PALETTE = ['#10B981', '#6366F1', '#F59E0B', '#06B6D4', '#F43F5E', '#A855F7', '#84CC16']

const kpiTiles = computed(() => [
  { key: 'rev',  label: 'Tushum',            value: fmt.compact(kpis.value.periodRevenue), unit: ' UZS', delta: kpis.value.revenueDelta, series: revenueSeries.value, color: '#10B981', icon: 'mdi-cash-multiple' },
  { key: 'ord',  label: 'Buyurtmalar',       value: kpis.value.totalOrders.toLocaleString('ru-RU'), unit: '', delta: kpis.value.ordersDelta, series: ordersSeries.value, color: '#6366F1', icon: 'mdi-package-variant-closed' },
  { key: 'avg',  label: "O'rtacha buyurtma", value: fmt.compact(kpis.value.avgOrder), unit: ' UZS', delta: null, series: revenueSeries.value, color: '#A855F7', icon: 'mdi-chart-line' },
  { key: 'cust', label: 'Yangi mijozlar',    value: kpis.value.newCustomers.toLocaleString('ru-RU'), unit: '', delta: null, series: customersSeries.value, color: '#06B6D4', icon: 'mdi-account-plus-outline' },
  { key: 'tord', label: 'Bugungi buyurtma',  value: kpis.value.ordersToday.toLocaleString('ru-RU'), unit: '', delta: null, series: ordersSeries.value, color: '#84CC16', icon: 'mdi-calendar-check-outline' },
  { key: 'trev', label: 'Bugungi tushum',    value: fmt.compact(kpis.value.revenueToday), unit: ' UZS', delta: null, series: revenueSeries.value, color: '#F59E0B', icon: 'mdi-clock-time-four-outline' },
])

const rangeLabel = computed(() => {
  if (useCustom.value && customFrom.value && customTo.value) return `${customFrom.value} → ${customTo.value}`
  return `oxirgi ${period.value} kun`
})

const completionPct = computed(() => {
  const s = byStatusRaw.value || {}
  const total = Object.values(s).reduce((a, b) => a + Number(b || 0), 0)
  if (!total) return 0
  return (deliveredCount.value / total) * 100
})
const deliveredCount = computed(() => {
  const s = byStatusRaw.value || {}
  return Number(s.completed || 0) + Number(s.delivered || 0)
})
const statusList = computed(() => {
  const { labels, values } = orderStatusChart.value
  const total = values.reduce((a, b) => a + b, 0) || 1
  return labels.map((l, i) => ({ label: l, value: values[i], pct: Math.round(values[i] / total * 100), color: STATUS_PALETTE[i % STATUS_PALETTE.length] }))
})
const maxFav = computed(() => topFavorites.value.reduce((m, p) => Math.max(m, Number(p.favorite_count || 0)), 0))

function orderStatusColor(s) { return ORDER_STATUS[s]?.color || 'grey' }
function orderStatusIcon(s)  { return ORDER_STATUS[s]?.icon  || 'mdi-help' }

function dateRange(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))
  return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) }
}

function currentRange() {
  if (useCustom.value && customFrom.value && customTo.value) {
    return { date_from: customFrom.value, date_to: customTo.value }
  }
  return dateRange(period.value)
}

function setPreset(v) {
  if (!v) return
  period.value = v
  useCustom.value = false
  reloadAll()
}
function applyCustom() {
  if (!customFrom.value || !customTo.value) return
  useCustom.value = true
  dateMenu.value = false
  reloadAll()
}
function clearCustom() {
  useCustom.value = false
  customFrom.value = ''
  customTo.value = ''
  dateMenu.value = false
  reloadAll()
}

function safeArray(v) { return Array.isArray(v) ? v : [] }

async function loadStats() {
  loading.value = true
  const range = currentRange()
  const [ovRes, oRes, cRes] = await Promise.allSettled([
    statsApi.overview(range),
    statsApi.orders(range),
    statsApi.customers(range),
  ])

  if (ovRes.status === 'fulfilled') {
    const d = ovRes.value.data.data || {}
    kpis.value.ordersToday  = Number(d.orders_today || 0)
    kpis.value.revenueToday = Number(d.revenue_today || 0)
  }

  if (oRes.status === 'fulfilled') {
    const d = oRes.value.data.data || {}
    kpis.value.totalOrders   = Number(d.total || 0)
    kpis.value.avgOrder      = Number(d.revenue?.avg || 0)
    kpis.value.periodRevenue = Number(d.revenue?.total || 0)
    periodRevenue.value      = kpis.value.periodRevenue

    const byDay = safeArray(d.orders_by_day)
    const cats = []
    const vals = []
    byDay.forEach(p => {
      const dt = new Date(p.date)
      cats.push(!isNaN(dt.getTime())
        ? dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
        : (p.date || '').slice(5))
      vals.push(Number(p.revenue || 0))
    })
    revenueChart.value  = { categories: cats, values: vals }
    revenueSeries.value = vals.slice(-12)
    ordersSeries.value  = byDay.map(x => Number(x.count || 0))

    if (byDay.length >= 2) {
      const last = Number(byDay.at(-1)?.count || 0)
      const prev = Number(byDay.at(-2)?.count || 0)
      if (prev > 0) kpis.value.ordersDelta = ((last - prev) / prev) * 100
    }
    if (vals.length >= 2 && vals.at(-2) > 0) {
      kpis.value.revenueDelta = ((vals.at(-1) - vals.at(-2)) / vals.at(-2)) * 100
    }

    const byStatus = d.by_status || {}
    byStatusRaw.value = byStatus
    const labels = []
    const values = []
    Object.entries(byStatus).forEach(([k, v]) => {
      labels.push(ORDER_STATUS[k]?.label || k)
      values.push(Number(v) || 0)
    })
    orderStatusChart.value = { labels, values }
  }

  if (cRes.status === 'fulfilled') {
    const d = cRes.value.data.data || {}
    kpis.value.newCustomers = Number(d.new_last_7d || d.new_last_30d || d.total_customers || 0)
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
    const { data } = await favoritesApi.most(6)
    topFavorites.value = data.data || []
  } catch {} finally { favoritesLoading.value = false }
}

// Extra widgets: payments by method, review ratings, product health.
// Defensive parsing — endpoints' exact shapes vary, so we probe common keys.
function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0 }

function objToSeries(obj, labelMap = null) {
  const labels = [], values = []
  Object.entries(obj || {}).forEach(([k, v]) => {
    const num = typeof v === 'number' ? v : Number(v?.count ?? v?.total ?? v ?? 0)
    if (!Number.isFinite(num)) return
    labels.push(labelMap ? (labelMap[k] || k) : k)
    values.push(num)
  })
  return { labels, values }
}

async function loadExtra() {
  extraLoading.value = true
  const range = currentRange()
  const [pRes, rRes, prodRes] = await Promise.allSettled([
    statsApi.payments(range),
    statsApi.reviews(range),
    statsApi.products(range),
  ])

  if (pRes.status === 'fulfilled') {
    const d = pRes.value.data.data || {}
    const bm = d.by_method || d.by_payment_method || d.methods || d.by_status || {}
    const { labels, values } = objToSeries(bm, { cash: 'Naqd', click: 'Click', payme: 'Payme', card: 'Karta' })
    paymentChart.value = { labels, values }
    paymentTotal.value = values.reduce((a, b) => a + b, 0)
  }

  if (rRes.status === 'fulfilled') {
    const d = rRes.value.data.data || {}
    const avg = Number(d.average_rating ?? d.avg_rating ?? d.average ?? 0)
    const br = d.by_rating || d.ratings || {}
    const total = Number(d.total ?? d.total_reviews ?? Object.values(br).reduce((a, b) => a + Number(b || 0), 0))
    const maxR = Math.max(1, ...Object.values(br).map(v => Number(v || 0)))
    const byRating = [5, 4, 3, 2, 1].map(k => {
      const v = Number(br[k] ?? br[String(k)] ?? 0)
      return { label: k, value: v, pct: Math.round(v / maxR * 100) }
    })
    reviewStats.value = { avg, total, byRating }
  }

  if (prodRes.status === 'fulfilled') {
    const d = prodRes.value.data.data || {}
    productStats.value = {
      total:  n(d.total ?? d.total_products),
      active: n(d.active ?? d.active_count),
      low:    n(d.low_stock ?? d.low_stock_count ?? d.low),
      out:    n(d.out_of_stock ?? d.out_of_stock_count ?? d.inactive),
    }
  }
  extraLoading.value = false
}

function reloadAll() { loadStats(); loadExtra() }

onMounted(() => { loadStats(); loadExtra(); loadRecentOrders(); loadFavorites() })
</script>

<style scoped>
.bz-dash-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
}

/* ── KPI rail ─────────────────────────────────────────────── */
.bz-kpi-rail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.bz-datemenu { width: 280px; background: var(--bz-glass-bg-solid) !important; }
.bz-datemenu.is-dark :deep(input) { color-scheme: dark; }
.bz-datemenu.is-dark :deep(.v-field) { color: var(--bz-text-1); }
.bz-kpi { position: relative; padding: 16px 18px 0; overflow: hidden; min-height: 116px; }
.bz-kpi-head { display: flex; align-items: center; gap: 8px; }
.bz-kpi-ico { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.bz-kpi-label { font-size: 12px; font-weight: 600; color: var(--bz-text-3); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bz-kpi-delta { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: var(--bz-radius-pill); }
.bz-kpi-delta.is-up { color: var(--bz-primary-strong); background: var(--bz-primary-soft); }
.bz-kpi-delta.is-down { color: var(--bz-danger); background: var(--bz-danger-soft); }
.v-theme--dark .bz-kpi-delta.is-up { color: var(--bz-primary); }
.bz-kpi-val { font-size: 27px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-top: 12px; }
.bz-kpi-val small { font-size: 13px; font-weight: 700; color: var(--bz-text-3); margin-left: 4px; }
.bz-kpi-spark { position: absolute; left: 0; right: 0; bottom: 0; height: 38px; opacity: 0.7; pointer-events: none; }

/* ── Bento grid ───────────────────────────────────────────── */
.bz-bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}
.bz-pad { padding: 18px 20px; }
.bz-b-rev    { grid-column: span 8; }
.bz-b-gauge  { grid-column: span 4; }
.bz-b-bars   { grid-column: span 4; }
.bz-b-donut  { grid-column: span 4; }
.bz-b-top    { grid-column: span 4; }
.bz-b-pay    { grid-column: span 4; }
.bz-b-rate   { grid-column: span 4; }
.bz-b-prod   { grid-column: span 4; }
.bz-b-recent { grid-column: span 12; }

/* review ratings widget */
.bz-rate-big { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.bz-rate-avg { font-size: 38px; font-weight: 800; letter-spacing: -1.5px; line-height: 1; }
.bz-rate-stars { line-height: 1; }
.bz-rate-total { font-size: 12px; color: var(--bz-text-3); }
.bz-rate-row { display: flex; align-items: center; gap: 10px; padding: 3px 0; }
.bz-rate-k { width: 26px; font-size: 12px; font-weight: 700; color: var(--bz-text-3); }
.bz-rate-bar { flex: 1; height: 7px; border-radius: 4px; background: var(--bz-surface-3); overflow: hidden; }
.bz-rate-bar > span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.bz-rate-v { width: 30px; text-align: right; font-size: 12px; font-weight: 700; }

/* products health grid */
.bz-prodgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bz-prodcell {
  display: flex; flex-direction: column; gap: 2px;
  padding: 14px 16px; border-radius: var(--bz-radius-md);
  background: var(--bz-surface-3); border: 1px solid var(--bz-border);
}
.bz-prodn { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
.bz-prodl { font-size: 11.5px; color: var(--bz-text-3); font-weight: 600; }

.bz-wh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.bz-wt { font-weight: 800; font-size: 15px; letter-spacing: -0.2px; }
.bz-ws { font-size: 12px; color: var(--bz-text-3); margin-top: 2px; }

/* gauge footer */
.bz-gauge-foot { display: flex; justify-content: space-around; margin-top: 4px; }
.bz-gauge-foot > div { display: flex; flex-direction: column; align-items: center; }
.bz-gauge-n { font-size: 18px; font-weight: 800; }
.bz-gauge-l { font-size: 11px; color: var(--bz-text-3); }

/* status breakdown */
.bz-statlist { margin-top: 6px; }
.bz-statrow { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 12.5px; }
.bz-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.bz-statname { flex: 1; color: var(--bz-text-2); }
.bz-statval { font-weight: 700; }
.bz-statpct { color: var(--bz-text-3); width: 38px; text-align: right; }

/* top products bar list */
.bz-toprow { display: flex; align-items: center; gap: 12px; padding: 7px 0; }
.bz-toprank { width: 20px; text-align: center; font-weight: 800; font-size: 12px; color: var(--bz-text-3); }
.bz-topmid { flex: 1; min-width: 0; }
.bz-topname { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bz-topbar { height: 6px; border-radius: 4px; background: var(--bz-surface-3); margin-top: 5px; overflow: hidden; }
.bz-topbar > span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--bz-primary-strong), var(--bz-primary)); }
.bz-topval { font-weight: 800; font-size: 13px; color: var(--bz-warn); }

/* recent orders compact table */
.bz-rtable { display: flex; flex-direction: column; }
.bz-rrow {
  display: grid;
  grid-template-columns: 38px 1fr auto auto;
  align-items: center; gap: 14px;
  padding: 10px 10px; border-radius: 12px;
  text-decoration: none; color: inherit;
  border-bottom: 1px solid var(--bz-border);
  transition: background var(--bz-dur-fast) var(--bz-ease);
}
.bz-rrow:last-child { border-bottom: 0; }
.bz-rrow:hover { background: var(--bz-primary-soft); }
.bz-rmain { min-width: 0; }
.bz-rnum { font-weight: 800; font-size: 13.5px; color: var(--bz-primary-strong); font-family: ui-monospace, monospace; }
.v-theme--dark .bz-rnum { color: var(--bz-primary); }
.bz-rcust { font-size: 12px; color: var(--bz-text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.bz-rtotal { font-weight: 800; font-size: 14px; white-space: nowrap; }
@media (max-width: 700px) { .bz-rstatus { display: none; } }

@media (max-width: 1100px) {
  .bz-b-rev, .bz-b-gauge, .bz-b-bars, .bz-b-donut, .bz-b-top,
  .bz-b-pay, .bz-b-rate, .bz-b-prod { grid-column: span 12; }
}
@media (max-width: 700px) {
  .bz-kpi-rail { grid-template-columns: 1fr 1fr; }
  .bz-rrow { grid-template-columns: 38px 1fr auto; }
}
</style>
