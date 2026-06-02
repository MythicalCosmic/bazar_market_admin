<template>
  <div class="an">
    <!-- ── Header ──────────────────────────────────────────────── -->
    <header class="an-head bz-rise">
      <div>
        <div class="page-title">Sotuv va foyda tahlili</div>
        <div class="page-subtitle">{{ rangeLabel }} · barcha raqamlar buyurtma va tannarxdan hisoblanadi</div>
      </div>
      <div class="an-ctrls">
        <v-btn-toggle
          :model-value="custom.on ? null : preset" mandatory density="comfortable"
          color="primary" variant="outlined" rounded="lg" @update:model-value="setPreset"
        >
          <v-btn value="today" size="small">Bugun</v-btn>
          <v-btn value="7"  size="small">7 kun</v-btn>
          <v-btn value="30" size="small">30 kun</v-btn>
          <v-btn value="90" size="small">90 kun</v-btn>
        </v-btn-toggle>
        <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: act }">
            <v-btn v-bind="act" :variant="custom.on ? 'flat' : 'outlined'" :color="custom.on ? 'primary' : undefined" rounded="lg" size="small">
              <v-icon start size="16">mdi-calendar-range</v-icon>
              <span v-if="custom.on">{{ custom.from }} → {{ custom.to }}</span>
              <span v-else>Sana</span>
            </v-btn>
          </template>
          <div class="bz-card pa-4" :class="{ 'is-dark': isDark }" style="width:280px">
            <div class="section-label mb-3">Maxsus oraliq</div>
            <v-text-field v-model="custom.from" type="date" label="Dan" density="compact" hide-details class="mb-2" />
            <v-text-field v-model="custom.to" type="date" label="Gacha" density="compact" hide-details class="mb-3" />
            <div class="d-flex ga-2 align-center">
              <v-btn size="small" variant="text" @click="clearCustom">Tozalash</v-btn>
              <v-spacer />
              <v-btn size="small" color="primary" variant="flat" :disabled="!custom.from || !custom.to" @click="applyCustom">Qo'llash</v-btn>
            </div>
          </div>
        </v-menu>
        <v-btn icon variant="outlined" rounded="lg" size="small" :loading="loading" title="Yangilash" @click="reload">
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>
    </header>

    <!-- ── Filter strip ────────────────────────────────────────── -->
    <div class="an-filters bz-card bz-rise">
      <v-select v-model="fStatus" :items="statusOptions" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="compact" variant="outlined" class="an-flt" />
      <v-select v-model="fPay" :items="paymentOptions" item-title="t" item-value="v" placeholder="To'lov" clearable hide-details density="compact" variant="outlined" class="an-flt" />
      <v-select v-if="staffOptions.length" v-model="fStaff" :items="staffOptions" item-title="t" item-value="v" placeholder="Xodim" clearable hide-details density="compact" variant="outlined" class="an-flt" />
      <v-switch v-model="paidOnly" label="Faqat to'langan" color="success" density="compact" hide-details class="ml-1" />
      <v-spacer />
      <v-chip v-if="activeFilters" variant="tonal" color="primary" size="small" @click="resetFilters">
        <v-icon start size="14">mdi-filter-remove-outline</v-icon>Filtrlarni tozalash
      </v-chip>
    </div>

    <!-- ── Data-quality note ───────────────────────────────────── -->
    <div v-if="!loading && coverageNote" class="an-note bz-rise" :class="coverageNote.tone">
      <v-icon size="18">{{ coverageNote.icon }}</v-icon><span>{{ coverageNote.text }}</span>
    </div>

    <!-- ── P&L summary ─────────────────────────────────────────── -->
    <div class="an-pnl">
      <div v-for="c in pnl" :key="c.key" class="an-pnl-cell bz-card bz-rise" :class="c.accent ? 'is-accent' : ''">
        <div class="an-pnl-label">{{ c.label }}</div>
        <div class="an-pnl-val num">
          <span v-if="loading" class="bz-skeleton" style="width:80%;height:24px;display:block;border-radius:8px" />
          <template v-else>{{ c.value }}<small v-if="c.unit">{{ c.unit }}</small></template>
        </div>
        <div v-if="c.hint" class="an-pnl-hint">{{ c.hint }}</div>
      </div>
    </div>

    <!-- ── Trend ───────────────────────────────────────────────── -->
    <section class="bz-card an-pad bz-rise">
      <header class="an-wh">
        <div>
          <div class="an-wt">Sotuv · tannarx · sof foyda dinamikasi</div>
          <div class="an-ws">Kunlik · {{ rangeLabel }}</div>
        </div>
        <v-btn-toggle v-model="visibleSeries" multiple density="comfortable" variant="outlined" rounded="lg" color="primary">
          <v-btn value="revenue" size="x-small">Sotuv</v-btn>
          <v-btn value="cost" size="x-small">Tannarx</v-btn>
          <v-btn value="profit" size="x-small">Foyda</v-btn>
        </v-btn-toggle>
      </header>
      <BzSkeleton v-if="loading" type="chart" :height="320" />
      <LineChart v-else-if="trendSeries.length && axis.cats.length" :series="trendSeries" :categories="axis.cats" :colors="trendColors" :format-y="v => fmt.compact(v)" :height="320" />
      <BzEmptyState v-else icon="mdi-chart-areaspline" title="Ma'lumot yo'q" />
    </section>

    <!-- ── Weekday + hour patterns ─────────────────────────────── -->
    <div class="an-two">
      <section class="bz-card an-pad bz-rise">
        <header class="an-wh"><div><div class="an-wt">Hafta kunlari bo'yicha foyda</div><div class="an-ws">Qaysi kun ko'proq daromad keltiradi</div></div></header>
        <BzSkeleton v-if="loading" type="chart" :height="260" />
        <BarChart v-else :series="[{ name: 'Foyda', data: weekday.values }]" :categories="weekday.labels" :colors="['#10B981']" :format-y="v => fmt.compact(v)" :height="260" />
      </section>
      <section class="bz-card an-pad bz-rise">
        <header class="an-wh"><div><div class="an-wt">Soatlar bo'yicha sotuv</div><div class="an-ws">Eng faol sotuv soatlari</div></div></header>
        <BzSkeleton v-if="loading" type="chart" :height="260" />
        <BarChart v-else :series="[{ name: 'Sotuv', data: hourly.values }]" :categories="hourly.labels" :colors="['#6366F1']" :format-y="v => fmt.compact(v)" :height="260" />
      </section>
    </div>

    <!-- ── Category profit + payment breakdown ─────────────────── -->
    <div class="an-two">
      <section class="bz-card an-pad bz-rise">
        <header class="an-wh"><div class="an-wt">Kategoriya bo'yicha foyda</div><v-icon size="17" color="primary">mdi-tag-multiple-outline</v-icon></header>
        <BzSkeleton v-if="loading" type="chart" :height="320" />
        <BarChart
          v-else-if="categoryAgg.length"
          :series="[{ name: 'Foyda', data: categoryAgg.map(c => Math.round(c.profit)) }]"
          :categories="categoryAgg.map(c => c.name)" horizontal :colors="['#A855F7']"
          :format-y="v => fmt.compact(v)" :height="Math.max(260, categoryAgg.length * 46)"
        />
        <BzEmptyState v-else icon="mdi-tag-off-outline" title="Ma'lumot yo'q" />
      </section>
      <section class="bz-card an-pad bz-rise">
        <header class="an-wh"><div class="an-wt">To'lov usullari</div><v-icon size="17" color="info">mdi-credit-card-outline</v-icon></header>
        <template v-if="loading"><BzSkeleton v-for="n in 4" :key="n" type="row" /></template>
        <template v-else-if="paymentAgg.length">
          <div v-for="p in paymentAgg" :key="p.name" class="an-payrow">
            <span class="an-payname">{{ p.name }}</span>
            <div class="an-paybar"><span :style="`width:${p.share}%`" /></div>
            <span class="num an-payrev">{{ fmt.compact(p.revenue) }}</span>
            <span class="num an-payprofit">+{{ fmt.compact(p.profit) }}</span>
            <span class="an-payshare">{{ p.share.toFixed(0) }}%</span>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-credit-card-off-outline" title="Ma'lumot yo'q" />
      </section>
    </div>

    <!-- ── Top products (full sortable) ────────────────────────── -->
    <section class="bz-card bz-rise an-tablecard">
      <div class="an-tbar">
        <div class="an-wt">Mahsulotlar — foyda reytingi</div>
        <v-spacer />
        <v-text-field v-model="prodQ" placeholder="Mahsulot qidirish…" density="compact" hide-details variant="outlined" prepend-inner-icon="mdi-magnify" class="an-search" />
        <v-btn variant="tonal" color="primary" size="small" rounded="lg" :disabled="!productRows.length" @click="exportProducts">
          <v-icon start size="16">mdi-download-outline</v-icon>CSV
        </v-btn>
      </div>
      <v-data-table
        :headers="productHeaders" :items="productRows" :loading="loading"
        :sort-by="[{ key: 'profit', order: 'desc' }]" :items-per-page="12" item-value="key"
        class="an-table" density="comfortable"
      >
        <template #item.name="{ item }"><span class="an-pname">{{ item.name }}</span></template>
        <template #item.qty="{ item }"><span class="num">{{ fmt.compact(item.qty) }}</span></template>
        <template #item.revenue="{ item }"><span class="num">{{ fmt.price(item.revenue) }}</span></template>
        <template #item.cost="{ item }"><span class="num an-muted">{{ fmt.price(item.cost) }}</span></template>
        <template #item.profit="{ item }"><span class="num" :class="item.profit >= 0 ? 'an-pos' : 'an-neg'">{{ item.profit >= 0 ? '+' : '' }}{{ fmt.price(item.profit) }}</span></template>
        <template #item.margin="{ item }"><span class="an-marginchip" :style="marginChipStyle(item.margin)">{{ item.margin.toFixed(0) }}%</span></template>
        <template #no-data><BzEmptyState icon="mdi-cube-outline" title="Mahsulot topilmadi" /></template>
      </v-data-table>
    </section>

    <!-- ── Staff leaderboard (full) ────────────────────────────── -->
    <section v-if="staffAgg.length || loading" class="bz-card bz-rise an-tablecard">
      <div class="an-tbar"><div class="an-wt">Xodimlar — sotuv va haqiqiy foyda</div></div>
      <v-data-table
        :headers="staffHeaders" :items="staffAgg" :loading="loading"
        :sort-by="[{ key: 'profit', order: 'desc' }]" :items-per-page="10" item-value="id"
        class="an-table" density="comfortable"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <v-avatar size="30" color="info" variant="tonal" style="font-size:11px;font-weight:800">{{ initials(item.name) }}</v-avatar>
            <span class="an-pname">{{ item.name }}</span>
          </div>
        </template>
        <template #item.orders="{ item }"><span class="num">{{ item.orders }}</span></template>
        <template #item.revenue="{ item }"><span class="num">{{ fmt.price(item.revenue) }}</span></template>
        <template #item.profit="{ item }"><span class="num an-pos">+{{ fmt.price(item.profit) }}</span></template>
        <template #item.avg="{ item }"><span class="num an-muted">{{ fmt.compact(item.orders ? item.profit / item.orders : 0) }}</span></template>
        <template #item.margin="{ item }"><span class="an-marginchip" :style="marginChipStyle(item.margin)">{{ item.margin.toFixed(0) }}%</span></template>
      </v-data-table>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from 'vue'
import { useProfitAnalytics } from '@/composables/useProfitAnalytics'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import LineChart    from '@/components/common/charts/LineChart.vue'
import BarChart     from '@/components/common/charts/BarChart.vue'

const fmt   = useFormat()
const snack = useSnackStore()
const theme = inject('theme', null)
const isDark = computed(() => theme?.value === 'dark')

const { loading, orders, ratio, coverage, load } = useProfitAnalytics()

// ── Date range ──────────────────────────────────────────────────────────
const preset   = ref('30')
const dateMenu = ref(false)
const custom   = reactive({ on: false, from: '', to: '' })
const appliedRange = ref({ date_from: '', date_to: '' })

const PAY_LABELS = { cash: 'Naqd', click: 'Click', payme: 'Payme', card: 'Karta', uzum: 'Uzum', terminal: 'Terminal' }
const payLabel = m => PAY_LABELS[(m || '').toLowerCase()] || (m ? m[0].toUpperCase() + m.slice(1) : '—')

function rangeFor() {
  const iso = d => d.toISOString().slice(0, 10)
  if (custom.on && custom.from && custom.to) return { date_from: custom.from, date_to: custom.to }
  const to = new Date(); const from = new Date()
  if (preset.value !== 'today') from.setDate(from.getDate() - (Number(preset.value) - 1))
  return { date_from: iso(from), date_to: iso(to) }
}
function reload() { appliedRange.value = rangeFor(); load(appliedRange.value) }
function setPreset(v) { if (!v) return; preset.value = v; custom.on = false; reload() }
function applyCustom() { if (!custom.from || !custom.to) return; custom.on = true; dateMenu.value = false; reload() }
function clearCustom() { custom.on = false; custom.from = ''; custom.to = ''; dateMenu.value = false; reload() }
const rangeLabel = computed(() => (custom.on && custom.from && custom.to) ? `${custom.from} → ${custom.to}` : (preset.value === 'today' ? 'bugun' : `oxirgi ${preset.value} kun`))

// ── Filters ─────────────────────────────────────────────────────────────
const paidOnly = ref(false)
const fStatus  = ref(null)
const fPay     = ref(null)
const fStaff   = ref(null)
const prodQ    = ref('')

const isPaid = o => ['paid', 'completed'].includes(o.payment_status)
const activeFilters = computed(() => paidOnly.value || fStatus.value || fPay.value || fStaff.value)
function resetFilters() { paidOnly.value = false; fStatus.value = null; fPay.value = null; fStaff.value = null }

const filtered = computed(() => orders.value.filter(o => {
  if (paidOnly.value && !isPaid(o)) return false
  if (fStatus.value && o.status !== fStatus.value) return false
  if (fPay.value && (o.payment_method || '').toLowerCase() !== fPay.value) return false
  if (fStaff.value && String(o._p.staff.id) !== String(fStaff.value)) return false
  return true
}))

// ── Totals / P&L ────────────────────────────────────────────────────────
const totals = computed(() => {
  let revenue = 0, cost = 0, profit = 0, units = 0, realized = 0, count = 0
  for (const o of filtered.value) {
    const p = o._p
    revenue += p.revenue; cost += p.cost; profit += p.profit; units += p.units; count++
    if (isPaid(o)) realized += p.revenue
  }
  return {
    revenue, cost, profit, units, realized, count,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    avgOrder: count ? revenue / count : 0,
    avgProfit: count ? profit / count : 0,
  }
})

const pnl = computed(() => {
  const t = totals.value
  return [
    { key: 'rev',    label: 'Sotuv (tushum)', value: fmt.compact(t.revenue), unit: ' UZS', hint: `${t.count} buyurtma` },
    { key: 'cost',   label: 'Tannarx (COGS)', value: fmt.compact(t.cost), unit: ' UZS', hint: `${t.revenue > 0 ? Math.round(t.cost / t.revenue * 100) : 0}% sotuvdan` },
    { key: 'profit', label: 'Sof foyda', accent: true, value: fmt.compact(t.profit), unit: ' UZS', hint: `Marja ${t.margin.toFixed(1)}%` },
    { key: 'aov',    label: "O'rtacha buyurtma", value: fmt.compact(t.avgOrder), unit: ' UZS', hint: `Foyda ${fmt.compact(t.avgProfit)}` },
    { key: 'items',  label: 'Sotilgan birlik', value: fmt.compact(t.units), unit: '', hint: `${t.count ? (t.units / t.count).toFixed(1) : 0} / buyurtma` },
    { key: 'paid',   label: "To'langan tushum", value: fmt.compact(t.realized), unit: ' UZS', hint: `${t.revenue > 0 ? Math.round(t.realized / t.revenue * 100) : 0}% qoplangan` },
  ]
})

// ── Daily trend ─────────────────────────────────────────────────────────
const axis = computed(() => {
  const { date_from, date_to } = appliedRange.value
  const days = []
  if (date_from && date_to) {
    const cur = new Date(date_from); const end = new Date(date_to); let g = 0
    while (cur <= end && g++ < 400) { days.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1) }
  }
  const b = new Map(days.map(d => [d, { revenue: 0, cost: 0, profit: 0 }]))
  for (const o of filtered.value) {
    const k = (o.created_at || '').slice(0, 10); const e = b.get(k); if (!e) continue
    e.revenue += o._p.revenue; e.cost += o._p.cost; e.profit += o._p.profit
  }
  return {
    cats: days.map(d => new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })),
    revenue: days.map(d => Math.round(b.get(d).revenue)),
    cost: days.map(d => Math.round(b.get(d).cost)),
    profit: days.map(d => Math.round(b.get(d).profit)),
  }
})
const visibleSeries = ref(['revenue', 'profit'])
const SERIES_DEF = { revenue: { name: 'Sotuv', color: '#6366F1' }, cost: { name: 'Tannarx', color: '#F59E0B' }, profit: { name: 'Foyda', color: '#10B981' } }
const trendSeries = computed(() => ['revenue', 'cost', 'profit'].filter(k => visibleSeries.value.includes(k)).map(k => ({ name: SERIES_DEF[k].name, data: axis.value[k] })))
const trendColors = computed(() => ['revenue', 'cost', 'profit'].filter(k => visibleSeries.value.includes(k)).map(k => SERIES_DEF[k].color))

// ── Weekday / hour patterns ─────────────────────────────────────────────
const WD = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
const weekday = computed(() => {
  const sums = Array(7).fill(0)
  for (const o of filtered.value) {
    const d = new Date(o.created_at); if (isNaN(d)) continue
    sums[d.getDay()] += o._p.profit
  }
  // reorder Mon..Sun for readability
  const order = [1, 2, 3, 4, 5, 6, 0]
  return { labels: order.map(i => WD[i]), values: order.map(i => Math.round(sums[i])) }
})
const hourly = computed(() => {
  const sums = Array(24).fill(0)
  for (const o of filtered.value) {
    const d = new Date(o.created_at); if (isNaN(d)) continue
    sums[d.getHours()] += o._p.revenue
  }
  return { labels: sums.map((_, h) => `${h}`), values: sums.map(v => Math.round(v)) }
})

// ── Aggregations ────────────────────────────────────────────────────────
const productAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) for (const b of o._p.breakdown) {
    const key = b.productId ?? b.name
    const e = m.get(key) || { key, name: b.name, revenue: 0, cost: 0, profit: 0, qty: 0 }
    e.revenue += b.revenue; e.cost += b.cost; e.profit += b.profit; e.qty += b.qty
    m.set(key, e)
  }
  return [...m.values()].map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 }))
})
const productRows = computed(() => {
  const t = prodQ.value.trim().toLowerCase()
  return t ? productAgg.value.filter(p => p.name.toLowerCase().includes(t)) : productAgg.value
})

const categoryAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) for (const b of o._p.breakdown) {
    const name = b.categoryName || 'Boshqa'
    const e = m.get(name) || { name, revenue: 0, cost: 0, profit: 0 }
    e.revenue += b.revenue; e.cost += b.cost; e.profit += b.profit
    m.set(name, e)
  }
  return [...m.values()].map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 })).sort((a, b) => b.profit - a.profit).slice(0, 10)
})

const paymentAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) {
    const k = payLabel(o.payment_method)
    const e = m.get(k) || { name: k, revenue: 0, profit: 0 }
    e.revenue += o._p.revenue; e.profit += o._p.profit
    m.set(k, e)
  }
  const total = totals.value.revenue || 1
  return [...m.values()].map(e => ({ ...e, share: e.revenue / total * 100 })).sort((a, b) => b.revenue - a.revenue)
})

const staffAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) {
    const s = o._p.staff; if (s.id == null) continue
    const e = m.get(s.id) || { id: s.id, name: s.name, revenue: 0, cost: 0, profit: 0, orders: 0 }
    e.revenue += o._p.revenue; e.cost += o._p.cost; e.profit += o._p.profit; e.orders++
    m.set(s.id, e)
  }
  return [...m.values()].map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 })).sort((a, b) => b.profit - a.profit)
})

// ── Filter options ──────────────────────────────────────────────────────
const statusOptions = computed(() => [...new Set(orders.value.map(o => o.status).filter(Boolean))].map(s => ({ v: s, t: ORDER_STATUS[s]?.label || s })))
const paymentOptions = computed(() => [...new Set(orders.value.map(o => (o.payment_method || '').toLowerCase()).filter(Boolean))].map(s => ({ v: s, t: payLabel(s) })))
const staffOptions = computed(() => staffAgg.value.map(s => ({ v: String(s.id), t: s.name })))

// ── Coverage note ───────────────────────────────────────────────────────
const coverageNote = computed(() => {
  if (ratio.value == null && !coverage.value.exact) {
    return { tone: 'warn', icon: 'mdi-alert-outline', text: "Tannarx (cost_price) topilmadi — mahsulotlarga tannarx kiriting, aks holda foyda hisoblanmaydi." }
  }
  const est = coverage.value.estimated; const total = est + coverage.value.exact
  if (est && total) return { tone: 'info', icon: 'mdi-approximately-equal', text: `Buyurtmalarning ${Math.round(est / total * 100)}% uchun tannarx to'liq emas — bu qism katalog o'rtacha marjasi bo'yicha taxminlandi.` }
  return null
})

// ── Tables ──────────────────────────────────────────────────────────────
const productHeaders = [
  { title: 'Mahsulot', key: 'name', sortable: true },
  { title: 'Sotildi', key: 'qty', align: 'end', sortable: true },
  { title: 'Sotuv', key: 'revenue', align: 'end', sortable: true },
  { title: 'Tannarx', key: 'cost', align: 'end', sortable: true },
  { title: 'Foyda', key: 'profit', align: 'end', sortable: true },
  { title: 'Marja', key: 'margin', align: 'end', sortable: true },
]
const staffHeaders = [
  { title: 'Xodim', key: 'name', sortable: true },
  { title: 'Buyurtma', key: 'orders', align: 'end', sortable: true },
  { title: 'Sotuv', key: 'revenue', align: 'end', sortable: true },
  { title: 'Foyda', key: 'profit', align: 'end', sortable: true },
  { title: "O'rt. foyda", key: 'avg', align: 'end', sortable: false },
  { title: 'Marja', key: 'margin', align: 'end', sortable: true },
]

function initials(name) { return (name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?' }
function marginChipStyle(m) { const c = m >= 25 ? '#10B981' : m >= 12 ? '#F59E0B' : '#F43F5E'; return `color:${c};background:${c}1f` }

function exportProducts() {
  const cols = ['Mahsulot', 'Sotildi', 'Sotuv', 'Tannarx', 'Foyda', 'Marja%']
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.join(',')]
  for (const p of productRows.value) {
    lines.push([p.name, Math.round(p.qty), Math.round(p.revenue), Math.round(p.cost), Math.round(p.profit), p.margin.toFixed(1)].map(esc).join(','))
  }
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `mahsulot_foyda_${appliedRange.value.date_from}_${appliedRange.value.date_to}.csv`; a.click()
  URL.revokeObjectURL(url); snack.success(`${productRows.value.length} ta qator eksport qilindi`)
}

onMounted(reload)
</script>

<style scoped>
.an { display: flex; flex-direction: column; gap: 14px; }
.an-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.an-ctrls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.is-dark :deep(input) { color-scheme: dark; }

.an-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px; }
.an-flt { max-width: 170px; min-width: 130px; }

.an-note { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: var(--bz-radius-md); font-size: 13px; font-weight: 600; border: 1px solid; }
.an-note.info { background: var(--bz-info-soft); border-color: var(--bz-info); color: var(--bz-info); }
.an-note.warn { background: var(--bz-warn-soft); border-color: var(--bz-warn); color: var(--bz-warn); }

/* P&L strip */
.an-pnl { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 14px; }
.an-pnl-cell { padding: 16px 18px; }
.an-pnl-cell.is-accent { background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(16,185,129,0.02)), var(--bz-glass-bg); border-color: var(--bz-primary-glow); }
.an-pnl-label { font-size: 12px; font-weight: 600; color: var(--bz-text-3); }
.an-pnl-val { font-size: 26px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-top: 10px; }
.an-pnl-val small { font-size: 12px; font-weight: 700; color: var(--bz-text-3); margin-left: 3px; }
.an-pnl-hint { font-size: 11.5px; color: var(--bz-text-3); font-weight: 600; margin-top: 6px; }

.an-pad { padding: 18px 20px; }
.an-wh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.an-wt { font-weight: 800; font-size: 15px; letter-spacing: -0.2px; }
.an-ws { font-size: 12px; color: var(--bz-text-3); margin-top: 2px; }

.an-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* payment rows */
.an-payrow { display: grid; grid-template-columns: 86px 1fr auto auto 38px; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--bz-border); }
.an-payrow:last-child { border-bottom: 0; }
.an-payname { font-weight: 700; font-size: 13px; }
.an-paybar { height: 7px; border-radius: 4px; background: var(--bz-surface-3); overflow: hidden; }
.an-paybar > span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #06B6D4, #22D3EE); }
.an-payrev { font-weight: 700; font-size: 12.5px; }
.an-payprofit { font-weight: 800; font-size: 12.5px; color: var(--bz-primary-strong); }
.v-theme--dark .an-payprofit { color: var(--bz-primary); }
.an-payshare { font-size: 11px; color: var(--bz-text-3); text-align: right; font-weight: 700; }

/* tables */
.an-tablecard { overflow: hidden; }
.an-tbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--bz-border); }
.an-search { max-width: 240px; min-width: 160px; }
.an-table :deep(th) { font-weight: 700 !important; font-size: 12px !important; color: var(--bz-text-3) !important; white-space: nowrap; }
.an-pname { font-weight: 700; font-size: 13px; }
.an-muted { color: var(--bz-text-3); }
.an-pos { color: var(--bz-primary-strong); font-weight: 700; }
.v-theme--dark .an-pos { color: var(--bz-primary); }
.an-neg { color: var(--bz-danger); font-weight: 700; }
.an-marginchip { display: inline-flex; align-items: center; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: var(--bz-radius-pill); }

@media (max-width: 960px) {
  .an-two { grid-template-columns: 1fr; }
}
</style>
