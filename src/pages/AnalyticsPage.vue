<template>
  <div>
    <BzPageHeader title="Tahlil" subtitle="Barcha metrikalarning chuqurroq ko'rinishi">
      <template #actions>
        <v-btn-toggle v-model="period" mandatory density="comfortable" color="primary" variant="outlined" rounded="lg">
          <v-btn value="7"  size="small">7</v-btn>
          <v-btn value="30" size="small">30</v-btn>
          <v-btn value="90" size="small">90</v-btn>
        </v-btn-toggle>
      </template>
    </BzPageHeader>

    <v-tabs v-model="tab" color="primary" density="comfortable" show-arrows class="mb-4" style="border-bottom:1px solid var(--bz-border)">
      <v-tab v-for="t in tabs" :key="t.v" :value="t.v"><v-icon start size="16">{{ t.icon }}</v-icon> {{ t.label }}</v-tab>
    </v-tabs>

    <BzPageLoader v-if="loading" :size="40" />

    <div v-else>
      <v-row dense>
        <v-col v-for="card in kpiCards" :key="card.label" cols="6" sm="4" md="3" lg="2">
          <v-card rounded="xl" class="bz-card pa-4">
            <div class="section-label" style="font-size:10.5px">{{ card.label }}</div>
            <div class="num" style="font-weight:800;font-size:20px;margin-top:4px">{{ card.value }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-1">
        <v-col v-if="primaryChart" cols="12" lg="7">
          <v-card rounded="xl" class="bz-card pa-5">
            <div style="font-weight:800;font-size:15px;margin-bottom:8px">{{ primaryChart.title }}</div>
            <BarChart v-if="primaryChart.kind === 'bar'"
              :series="[{ name: primaryChart.title, data: primaryChart.values }]"
              :categories="primaryChart.categories" :height="300"
            />
            <DonutChart v-else
              :series="primaryChart.values"
              :labels="primaryChart.categories" :height="300"
            />
          </v-card>
        </v-col>
        <v-col v-if="secondaryChart" cols="12" lg="5">
          <v-card rounded="xl" class="bz-card pa-5">
            <div style="font-weight:800;font-size:15px;margin-bottom:8px">{{ secondaryChart.title }}</div>
            <DonutChart v-if="secondaryChart.kind === 'donut'"
              :series="secondaryChart.values" :labels="secondaryChart.categories" :height="300"
            />
            <BarChart v-else
              :series="[{ name: secondaryChart.title, data: secondaryChart.values }]"
              :categories="secondaryChart.categories" :height="300"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-card v-if="rawData && Object.keys(rawData).length" rounded="xl" class="bz-card pa-5 mt-4">
        <div style="font-weight:800;font-size:15px;margin-bottom:12px">Xom ma'lumot</div>
        <pre style="font-size:11.5px;color:var(--bz-text-2);overflow:auto;max-height:300px;background:var(--bz-surface-2);padding:12px;border-radius:10px;font-family:ui-monospace,monospace">{{ JSON.stringify(rawData, null, 2) }}</pre>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BarChart    from '@/components/common/charts/BarChart.vue'
import DonutChart  from '@/components/common/charts/DonutChart.vue'

const fmt = useFormat()

const period = ref('30')
const tab = ref('overview')
const loading = ref(false)
const rawData = ref(null)

const tabs = [
  { v:'overview',     label:'Umumiy',       icon:'mdi-view-dashboard-outline',    fn: 'overview' },
  { v:'orders',       label:'Buyurtmalar',  icon:'mdi-package-variant-closed',    fn: 'orders' },
  { v:'payments',     label:"To'lovlar",    icon:'mdi-credit-card-outline',       fn: 'payments' },
  { v:'customers',    label:'Mijozlar',     icon:'mdi-account-group-outline',     fn: 'customers' },
  { v:'products',     label:'Mahsulotlar',  icon:'mdi-cube-outline',              fn: 'products' },
  { v:'categories',   label:'Kategoriyalar',icon:'mdi-tag-multiple-outline',      fn: 'categories' },
  { v:'reviews',      label:'Sharhlar',     icon:'mdi-comment-quote-outline',     fn: 'reviews' },
  { v:'banners',      label:'Bannerlar',    icon:'mdi-image-outline',             fn: 'banners' },
  { v:'coupons',      label:'Kuponlar',     icon:'mdi-ticket-percent-outline',    fn: 'coupons' },
  { v:'discounts',    label:'Chegirmalar',  icon:'mdi-sale',                      fn: 'discounts' },
  { v:'zones',        label:'Zonalar',      icon:'mdi-map-marker-radius-outline', fn: 'zones' },
  { v:'favorites',    label:'Sevimli',      icon:'mdi-heart-outline',             fn: 'favorites' },
  { v:'staff',        label:'Xodimlar',     icon:'mdi-shield-account-outline',    fn: 'staff' },
  { v:'notifications',label:'Bildirishnomalar',icon:'mdi-bell-outline',           fn: 'notifications' },
]

const kpiCards = computed(() => {
  const d = rawData.value || {}
  const flat = []
  Object.entries(d).forEach(([k, v]) => {
    if (typeof v === 'number' || typeof v === 'string') {
      flat.push({ label: humanize(k), value: typeof v === 'number' ? formatNum(v, k) : v })
    }
  })
  return flat.slice(0, 12)
})

function humanize(k) { return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function formatNum(v, k) {
  if (/amount|revenue|price/i.test(k)) return fmt.compact(v)
  if (/rating/i.test(k)) return Number(v).toFixed(1)
  return Number(v).toLocaleString('ru-RU')
}

const primaryChart = computed(() => {
  const d = rawData.value || {}
  // Find largest dict-of-counts: by_status, by_method, by_rating, by_moderation_status
  for (const k of ['by_status','by_method','by_rating','by_moderation_status','by_type','by_channel']) {
    if (d[k] && typeof d[k] === 'object') {
      const entries = Object.entries(d[k])
      return { title: humanize(k), kind: entries.length > 6 ? 'bar' : 'donut',
               categories: entries.map(([k]) => k), values: entries.map(([,v]) => Number(v) || 0) }
    }
  }
  return null
})

const secondaryChart = computed(() => {
  const d = rawData.value || {}
  const keys = Object.keys(d).filter(k => typeof d[k] === 'object' && d[k] !== null && !Array.isArray(d[k]))
  if (keys.length < 2) return null
  for (const k of keys) {
    if (k === primaryChart.value?.title.toLowerCase().replace(/ /g, '_')) continue
    const entries = Object.entries(d[k])
    if (!entries.length) continue
    return { title: humanize(k), kind: 'donut', categories: entries.map(([k]) => k), values: entries.map(([,v]) => Number(v) || 0) }
  }
  return null
})

function range() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - Number(period.value))
  return { date_from: from.toISOString().slice(0,10), date_to: to.toISOString().slice(0,10) }
}

async function load() {
  const t = tabs.find(x => x.v === tab.value)
  if (!t) return
  loading.value = true
  try {
    const { data } = await statsApi[t.fn](range())
    rawData.value = data.data || {}
  } catch { rawData.value = {} } finally { loading.value = false }
}

watch([tab, period], load)
onMounted(load)
</script>
