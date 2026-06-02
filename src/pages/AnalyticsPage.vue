<template>
  <div class="bz-an">
    <!-- Head -->
    <div class="bz-dash-head">
      <div>
        <div class="page-title">Tahlil</div>
        <div class="page-subtitle">{{ activeTab?.label }} · {{ rangeLabel }}</div>
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
      </div>
    </div>

    <div class="bz-an-body">
      <!-- Tab rail -->
      <aside class="bz-card bz-an-nav">
        <v-list density="compact" class="pa-2" rounded="lg" nav>
          <v-list-item
            v-for="t in tabs" :key="t.v"
            :active="tab === t.v"
            active-class="bz-tab-active"
            rounded="lg" class="mb-1" style="min-height:40px"
            @click="tab = t.v"
          >
            <template #prepend><v-icon size="18">{{ t.icon }}</v-icon></template>
            <v-list-item-title style="font-weight:600;font-size:13px">{{ t.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </aside>

      <!-- Main -->
      <div class="bz-an-main">
        <template v-if="loading">
          <div class="bz-kpi-rail">
            <div v-for="n in 4" :key="n" class="bz-kpi bz-card">
              <div class="bz-skeleton" style="width:50%;height:12px;margin:4px 0 10px" />
              <div class="bz-skeleton" style="width:70%;height:26px" />
            </div>
          </div>
          <div class="bz-card" style="height:360px;margin-top:14px"><div class="bz-skeleton" style="width:100%;height:100%;border-radius:var(--bz-radius-xl)" /></div>
        </template>

        <template v-else>
          <!-- KPI rail -->
          <div v-if="kpiCards.length" class="bz-kpi-rail">
            <div v-for="(card, i) in kpiCards" :key="card.label" class="bz-kpi bz-card bz-rise" :style="`animation-delay:${i * 50}ms`">
              <div class="bz-kpi-head">
                <div class="bz-kpi-ico" :style="`color:${card.color};background:${card.bg}`">
                  <v-icon :color="card.color" size="18">{{ card.icon }}</v-icon>
                </div>
                <span class="bz-kpi-label">{{ card.label }}</span>
              </div>
              <div class="bz-kpi-val num">{{ card.value }}</div>
            </div>
          </div>

          <!-- Time series -->
          <section v-if="timeSeries" class="bz-card bz-pad" style="margin-top:14px">
            <header class="bz-wh"><div><div class="bz-wt">Dinamika</div><div class="bz-ws">{{ rangeLabel }}</div></div></header>
            <LineChart :series="[{ name: activeTab?.label || 'Qiymat', data: timeSeries.values }]" :categories="timeSeries.categories" :format-y="v => fmt.compact(v)" :height="280" />
          </section>

          <!-- Charts -->
          <div v-if="charts.length" class="bz-an-charts">
            <section v-for="(chart, i) in charts" :key="i" class="bz-card bz-pad" :class="charts.length === 1 ? 'span-2' : ''">
              <header class="bz-wh">
                <div class="bz-wt">{{ chart.title }}</div>
                <v-chip variant="tonal" size="x-small" class="chip-sm">{{ chart.kind === 'donut' ? 'Taqsimot' : 'Grafik' }}</v-chip>
              </header>
              <BarChart v-if="chart.kind === 'bar'" :series="[{ name: chart.title, data: chart.values }]" :categories="chart.categories" :height="300" :format-y="chart.formatY" />
              <DonutChart v-else :series="chart.values" :labels="chart.categories" :height="300" :total="chart.total" :total-label="chart.totalLabel || 'Jami'" />
            </section>
          </div>

          <!-- Detail sections -->
          <div v-if="detailSections.length" class="bz-an-details">
            <section v-for="section in detailSections" :key="section.title" class="bz-card bz-pad">
              <div class="bz-wt" style="margin-bottom:12px">{{ section.title }}</div>
              <div class="d-flex flex-column ga-2">
                <div v-for="row in section.rows" :key="row.key" class="bz-detrow">
                  <span class="bz-detlabel">{{ row.label }}</span>
                  <span class="num bz-detval">{{ row.value }}</span>
                </div>
              </div>
            </section>
          </div>

          <BzEmptyState v-if="!kpiCards.length && !charts.length && !detailSections.length && !timeSeries" icon="mdi-chart-box-off-outline" title="Ma'lumot yo'q" subtitle="Tanlangan davr uchun statistika topilmadi" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue'
import { statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import LineChart   from '@/components/common/charts/LineChart.vue'
import BarChart    from '@/components/common/charts/BarChart.vue'
import DonutChart  from '@/components/common/charts/DonutChart.vue'

const fmt = useFormat()
const theme = inject('theme', null)
const isDarkTheme = computed(() => theme?.value === 'dark')

const period = ref('30')
const tab = ref('overview')
const loading = ref(false)
const rawData = ref(null)

// custom range
const dateMenu = ref(false)
const useCustom = ref(false)
const customFrom = ref('')
const customTo = ref('')

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
const activeTab = computed(() => tabs.find(t => t.v === tab.value))

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

const SKIP_KEYS = new Set(['date_from', 'date_to', 'period', 'from', 'to', 'start', 'end', 'created_at', 'updated_at', 'date', 'timestamp'])
function shouldSkip(k, v) {
  if (SKIP_KEYS.has(k)) return true
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return true
  return false
}

const KEY_ICONS = {
  total:['mdi-sigma','#10B981','rgba(16,185,129,0.12)'], revenue:['mdi-cash-multiple','#6366F1','rgba(99,102,241,0.12)'],
  avg_payment:['mdi-chart-line','#A855F7','rgba(168,85,247,0.12)'], pending:['mdi-clock-outline','#F59E0B','rgba(245,158,11,0.12)'],
  approved:['mdi-check-circle','#10B981','rgba(16,185,129,0.12)'], rejected:['mdi-close-circle','#F43F5E','rgba(244,63,94,0.12)'],
  average_rating:['mdi-star','#F59E0B','rgba(245,158,11,0.12)'], new:['mdi-account-plus','#6366F1','rgba(99,102,241,0.12)'],
  active:['mdi-check-circle','#10B981','rgba(16,185,129,0.12)'], count:['mdi-counter','#06B6D4','rgba(6,182,212,0.12)'],
}

function humanize(k) { return KEY_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function formatVal(v, k) {
  if (typeof v === 'string') return v
  if (/amount|revenue|price|avg_payment|total_revenue/i.test(k)) return fmt.compact(v)
  if (/rating/i.test(k)) return Number(v).toFixed(1)
  return Number(v).toLocaleString('ru-RU')
}
function iconFor(k) {
  for (const [match, data] of Object.entries(KEY_ICONS)) if (k.includes(match)) return data
  return ['mdi-chart-bar', '#64748B', 'rgba(100,116,139,0.12)']
}

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

const timeSeries = computed(() => {
  const d = rawData.value || {}
  const key = ['orders_by_day', 'revenue_by_day', 'by_day', 'daily', 'timeline'].find(k => Array.isArray(d[k]) && d[k].length)
  if (!key) return null
  const cats = [], vals = []
  d[key].forEach(p => {
    const dt = new Date(p.date || p.day || p.label)
    cats.push(!isNaN(dt.getTime()) ? dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : (p.date || p.label || ''))
    vals.push(Number(p.revenue ?? p.total ?? p.count ?? p.value ?? 0))
  })
  return { categories: cats, values: vals }
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
      total, totalLabel: 'Jami',
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

function rangeParams() {
  if (useCustom.value && customFrom.value && customTo.value) return { date_from: customFrom.value, date_to: customTo.value }
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(period.value))
  return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) }
}
const rangeLabel = computed(() => (useCustom.value && customFrom.value && customTo.value) ? `${customFrom.value} → ${customTo.value}` : `oxirgi ${period.value} kun`)

function setPreset(v) { if (!v) return; period.value = v; useCustom.value = false; load() }
function applyCustom() { if (!customFrom.value || !customTo.value) return; useCustom.value = true; dateMenu.value = false; load() }
function clearCustom() { useCustom.value = false; customFrom.value = ''; customTo.value = ''; dateMenu.value = false; load() }

async function load() {
  const t = activeTab.value
  if (!t) return
  loading.value = true
  try {
    const { data } = await statsApi[t.fn](rangeParams())
    rawData.value = data.data || {}
  } catch { rawData.value = {} }
  finally { loading.value = false }
}

watch(tab, load)
onMounted(load)
</script>

<style scoped>
.bz-dash-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.bz-datemenu { width: 280px; background: var(--bz-glass-bg-solid) !important; }
.bz-datemenu.is-dark :deep(input) { color-scheme: dark; }

.bz-an-body { display: grid; grid-template-columns: 210px 1fr; gap: 14px; align-items: start; }
.bz-an-nav { padding: 6px; position: sticky; top: 86px; }

.bz-kpi-rail { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
.bz-kpi { padding: 16px 18px; }
.bz-kpi-head { display: flex; align-items: center; gap: 8px; }
.bz-kpi-ico { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.bz-kpi-label { font-size: 12px; font-weight: 600; color: var(--bz-text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bz-kpi-val { font-size: 26px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-top: 12px; }

.bz-pad { padding: 18px 20px; }
.bz-wh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.bz-wt { font-weight: 800; font-size: 15px; letter-spacing: -0.2px; }
.bz-ws { font-size: 12px; color: var(--bz-text-3); margin-top: 2px; }

.bz-an-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
.bz-an-charts .span-2 { grid-column: 1 / -1; }
.bz-an-details { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
.bz-detrow { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--bz-border); }
.bz-detlabel { font-weight: 600; font-size: 13px; color: var(--bz-text-2); text-transform: capitalize; }
.bz-detval { font-weight: 800; font-size: 14px; }

.bz-tab-active { background: var(--bz-primary-soft) !important; color: var(--bz-primary) !important; }
.bz-tab-active .v-icon { color: var(--bz-primary) !important; }

@media (max-width: 960px) {
  .bz-an-body { grid-template-columns: 1fr; }
  .bz-an-nav { position: static; }
  .bz-an-nav :deep(.v-list) { display: flex; flex-wrap: wrap; gap: 4px; }
  .bz-an-charts, .bz-an-details { grid-template-columns: 1fr; }
}
</style>
