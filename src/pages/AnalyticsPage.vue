<template>
  <div>
    <BzPageHeader title="Tahlil" subtitle="Biznesingiz ko'rsatkichlarini kuzating">
      <template #actions>
        <v-btn-toggle v-model="period" mandatory density="comfortable" color="primary" variant="outlined" rounded="lg">
          <v-btn value="7"  size="small">7 kun</v-btn>
          <v-btn value="30" size="small">30 kun</v-btn>
          <v-btn value="90" size="small">90 kun</v-btn>
        </v-btn-toggle>
      </template>
    </BzPageHeader>

    <v-row>
      <!-- Vertical sidebar nav -->
      <v-col cols="12" md="3" lg="2">
        <v-card rounded="xl" class="bz-card pa-2" style="position:sticky;top:80px">
          <v-list density="compact" class="pa-0" rounded="lg" nav>
            <v-list-item
              v-for="t in tabs" :key="t.v"
              :active="tab === t.v"
              active-class="bz-tab-active"
              rounded="lg"
              class="mb-1"
              style="min-height:40px"
              @click="tab = t.v"
            >
              <template #prepend><v-icon size="18">{{ t.icon }}</v-icon></template>
              <v-list-item-title style="font-weight:600;font-size:13px">{{ t.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Main content -->
      <v-col cols="12" md="9" lg="10">

    <!-- Loading -->
    <template v-if="loading">
      <v-row dense class="mb-4">
        <v-col v-for="n in 4" :key="n" cols="6" sm="3">
          <v-card rounded="xl" class="bz-card pa-5" height="110"><div class="bz-skeleton mb-2" style="width:50%;height:12px" /><div class="bz-skeleton" style="width:70%;height:28px" /></v-card>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12" lg="7"><v-card rounded="xl" class="bz-card"><div class="bz-skeleton" style="width:100%;height:340px;border-radius:16px" /></v-card></v-col>
        <v-col cols="12" lg="5"><v-card rounded="xl" class="bz-card"><div class="bz-skeleton" style="width:100%;height:340px;border-radius:16px" /></v-card></v-col>
      </v-row>
    </template>

    <!-- Data -->
    <template v-else>
      <!-- KPI cards -->
      <v-row v-if="kpiCards.length" dense class="mb-4">
        <v-col v-for="card in kpiCards" :key="card.label" cols="6" :sm="kpiCards.length <= 4 ? 3 : 4" :lg="kpiCards.length <= 6 ? 2 : 3">
          <v-card rounded="xl" class="stat-card pa-5" height="110">
            <div class="d-flex align-start justify-space-between">
              <div>
                <div class="section-label" style="font-size:10px;margin-bottom:6px">{{ card.label }}</div>
                <div class="num" style="font-weight:800;font-size:24px;letter-spacing:-0.5px">{{ card.value }}</div>
              </div>
              <div
                class="d-flex align-center justify-center flex-shrink-0"
                :style="`width:38px;height:38px;border-radius:12px;background:${card.bg}`"
              >
                <v-icon :color="card.color" size="20">{{ card.icon }}</v-icon>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts row -->
      <v-row v-if="charts.length" dense class="mb-4">
        <v-col v-for="(chart, i) in charts" :key="i" cols="12" :lg="charts.length === 1 ? 12 : i === 0 ? 7 : 5">
          <v-card rounded="xl" class="bz-card pa-5">
            <div class="d-flex align-center justify-space-between mb-2">
              <div style="font-weight:800;font-size:15px">{{ chart.title }}</div>
              <v-chip variant="tonal" size="x-small" class="chip-sm">{{ chart.kind === 'donut' ? 'Taqsimot' : 'Grafik' }}</v-chip>
            </div>
            <BarChart v-if="chart.kind === 'bar'"
              :series="[{ name: chart.title, data: chart.values }]"
              :categories="chart.categories"
              :height="300"
              :format-y="chart.formatY"
            />
            <DonutChart v-else
              :series="chart.values"
              :labels="chart.categories"
              :height="300"
              :total="chart.total"
              :total-label="chart.totalLabel || 'Jami'"
            />
          </v-card>
        </v-col>
      </v-row>

      <!-- Detail table for dict entries that aren't charts -->
      <v-row v-if="detailSections.length" dense>
        <v-col v-for="section in detailSections" :key="section.title" cols="12" :md="detailSections.length > 1 ? 6 : 12">
          <v-card rounded="xl" class="bz-card pa-5 mb-4">
            <div style="font-weight:800;font-size:15px;margin-bottom:14px">{{ section.title }}</div>
            <div class="d-flex flex-column ga-2">
              <div v-for="row in section.rows" :key="row.key" class="d-flex align-center justify-space-between pa-3" style="border-radius:10px;border:1px solid var(--bz-border)">
                <span style="font-weight:600;font-size:13px;color:var(--bz-text-2);text-transform:capitalize">{{ row.label }}</span>
                <span class="num" style="font-weight:800;font-size:14px">{{ row.value }}</span>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- No data -->
      <BzEmptyState v-if="!kpiCards.length && !charts.length && !detailSections.length" icon="mdi-chart-box-off-outline" title="Ma'lumot yo'q" subtitle="Tanlangan davr uchun statistika topilmadi" />
    </template>

      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BarChart    from '@/components/common/charts/BarChart.vue'
import DonutChart  from '@/components/common/charts/DonutChart.vue'

const fmt = useFormat()
const period = ref('30')
const tab = ref('overview')
const loading = ref(false)
const rawData = ref(null)

const tabs = [
  { v:'overview',     label:'Umumiy',          icon:'mdi-view-dashboard-outline',    fn:'overview' },
  { v:'orders',       label:'Buyurtmalar',     icon:'mdi-package-variant-closed',    fn:'orders' },
  { v:'payments',     label:"To'lovlar",       icon:'mdi-credit-card-outline',       fn:'payments' },
  { v:'customers',    label:'Mijozlar',        icon:'mdi-account-group-outline',     fn:'customers' },
  { v:'products',     label:'Mahsulotlar',     icon:'mdi-cube-outline',              fn:'products' },
  { v:'categories',   label:'Kategoriyalar',   icon:'mdi-tag-multiple-outline',      fn:'categories' },
  { v:'reviews',      label:'Sharhlar',        icon:'mdi-comment-quote-outline',     fn:'reviews' },
  { v:'coupons',      label:'Kuponlar',        icon:'mdi-ticket-percent-outline',    fn:'coupons' },
  { v:'discounts',    label:'Chegirmalar',     icon:'mdi-sale',                      fn:'discounts' },
  { v:'zones',        label:'Zonalar',         icon:'mdi-map-marker-radius-outline', fn:'zones' },
  { v:'favorites',    label:'Sevimli',         icon:'mdi-heart-outline',             fn:'favorites' },
  { v:'staff',        label:'Xodimlar',        icon:'mdi-shield-account-outline',    fn:'staff' },
]

// Friendly labels for known keys
const KEY_LABELS = {
  total:'Jami', count:'Soni', revenue:'Tushum', avg_payment:'O\'rtacha to\'lov', avg:'O\'rtacha',
  completed_count:'Tugallangan', failed_count:'Xato', refund_count:'Qaytarilgan', pending:'Kutilmoqda',
  approved:'Tasdiqlangan', rejected:'Rad etilgan', refunded_amount:'Qaytarilgan summa',
  pending_amount:'Kutilmoqda summa', average_rating:'O\'rtacha reyting', with_comment:'Sharhli',
  with_reply:'Javobli', new:'Yangi', new_count:'Yangi soni', active:'Faol', active_count:'Faol',
  total_orders:'Jami buyurtmalar', total_revenue:'Jami tushum', total_products:'Jami mahsulotlar',
  total_customers:'Jami mijozlar', total_categories:'Jami kategoriyalar',
  orders:'Buyurtmalar', pending_orders:'Kutilmoqda', completed_orders:'Tugallangan',
  cancelled_orders:'Bekor qilingan', products:'Mahsulotlar', customers:'Mijozlar',
  categories:'Kategoriyalar', coupons:'Kuponlar', discounts:'Chegirmalar',
  completed_amount:'Tugatilgan summa', avg_order:'O\'rtacha buyurtma',
  with_telegram:'Telegramda', inactive:'Nofaol',
}

// Fields to skip — dates, internal keys, non-metric values
const SKIP_KEYS = new Set([
  'date_from', 'date_to', 'period', 'from', 'to', 'start', 'end',
  'created_at', 'updated_at', 'date', 'timestamp',
])

function shouldSkip(k, v) {
  if (SKIP_KEYS.has(k)) return true
  // Skip ISO date strings
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return true
  return false
}

const KEY_ICONS = {
  total:['mdi-sigma','#16A34A','rgba(22,163,74,0.10)'], revenue:['mdi-cash-multiple','#3B82F6','rgba(59,130,246,0.10)'],
  avg_payment:['mdi-chart-line','#8B5CF6','rgba(139,92,246,0.10)'], pending:['mdi-clock-outline','#F59E0B','rgba(245,158,11,0.10)'],
  approved:['mdi-check-circle','#22C55E','rgba(34,197,94,0.10)'], rejected:['mdi-close-circle','#EF4444','rgba(239,68,68,0.10)'],
  average_rating:['mdi-star','#F59E0B','rgba(245,158,11,0.10)'], new:['mdi-account-plus','#3B82F6','rgba(59,130,246,0.10)'],
  active:['mdi-check-circle','#22C55E','rgba(34,197,94,0.10)'], count:['mdi-counter','#64748B','rgba(100,116,139,0.10)'],
}

function humanize(k) { return KEY_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function formatVal(v, k) {
  if (typeof v === 'string') return v
  if (/amount|revenue|price|avg_payment|total_revenue/i.test(k)) return fmt.compact(v)
  if (/rating/i.test(k)) return Number(v).toFixed(1)
  return Number(v).toLocaleString('ru-RU')
}
function iconFor(k) {
  for (const [match, data] of Object.entries(KEY_ICONS)) {
    if (k.includes(match)) return data
  }
  return ['mdi-chart-bar', '#64748B', 'rgba(100,116,139,0.10)']
}

// ── Derived display data ──

const kpiCards = computed(() => {
  const d = rawData.value || {}
  const cards = []
  for (const [k, v] of Object.entries(d)) {
    if (shouldSkip(k, v)) continue
    if (typeof v !== 'number' && typeof v !== 'string') continue
    const [icon, color, bg] = iconFor(k)
    cards.push({ label: humanize(k), value: formatVal(v, k), icon, color, bg })
  }
  return cards.slice(0, 8)
})

const charts = computed(() => {
  const d = rawData.value || {}
  const result = []
  const chartKeys = ['by_status','by_method','by_rating','by_moderation_status','by_type','by_channel']
  for (const k of chartKeys) {
    if (!d[k] || typeof d[k] !== 'object') continue
    const entries = Object.entries(d[k]).filter(([, v]) => Number(v) > 0)
    if (!entries.length) continue
    const total = entries.reduce((s, [, v]) => s + Number(v), 0)
    result.push({
      title: humanize(k),
      kind: entries.length > 6 ? 'bar' : 'donut',
      categories: entries.map(([k]) => humanize(k)),
      values: entries.map(([, v]) => Number(v) || 0),
      total,
      totalLabel: 'Jami',
      formatY: /amount|revenue|price/i.test(k) ? v => fmt.compact(v) : undefined,
    })
  }
  return result.slice(0, 2)
})

const detailSections = computed(() => {
  const d = rawData.value || {}
  const result = []
  const chartKeys = new Set(['by_status','by_method','by_rating','by_moderation_status','by_type','by_channel'])
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) continue
    if (chartKeys.has(k)) continue
    const rows = Object.entries(v)
      .filter(([, val]) => typeof val === 'number' || typeof val === 'string')
      .map(([key, val]) => ({ key, label: humanize(key), value: typeof val === 'number' ? formatVal(val, key) : val }))
    if (rows.length) result.push({ title: humanize(k), rows })
  }
  return result
})

// ── Load ──

function range() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(period.value))
  return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) }
}

async function load() {
  const t = tabs.find(x => x.v === tab.value)
  if (!t) return
  loading.value = true
  try {
    const { data } = await statsApi[t.fn](range())
    rawData.value = data.data || {}
  } catch { rawData.value = {} }
  finally { loading.value = false }
}

watch([tab, period], load)
onMounted(load)
</script>

<style scoped>
.bz-tab-active {
  background: var(--bz-primary-soft) !important;
  color: var(--bz-primary) !important;
}
.bz-tab-active .v-icon { color: var(--bz-primary) !important; }
</style>
