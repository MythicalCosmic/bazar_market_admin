<template>
  <div>
    <BzPageHeader title="Mijozlar" :subtitle="total ? `${total} ta ro'yxatdan o'tgan` : ''" />

    <!-- Stats -->
    <div class="bz-kpi-rail mb-4">
      <BzKpiTile
        label="Jami mijozlar"
        :value="locNum(kpi.total)"
        icon="mdi-account-group"
        color="#6366F1"
        bg="rgba(99,102,241,0.12)"
        :loading="statsLoading && !total"
      />
      <BzKpiTile
        label="Yangi"
        :value="locNum(kpi.newCount)"
        icon="mdi-account-plus"
        color="#06B6D4"
        bg="rgba(6,182,212,0.12)"
        :loading="statsLoading && !total"
      />
      <BzKpiTile
        label="Telegram"
        :value="locNum(kpi.telegram)"
        icon="mdi-telegram"
        color="#A855F7"
        bg="rgba(168,85,247,0.12)"
        :loading="statsLoading && !total"
      />
      <BzKpiTile
        label="Faollik"
        :value="activePct"
        suffix="%"
        icon="mdi-pulse"
        color="#10B981"
        bg="rgba(16,185,129,0.12)"
      />
    </div>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Ism, telefon, telegram…" @search="onSearch">
      <v-select v-model="f.is_active" :items="activeOptions" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:170px" @update:model-value="load" />
      <v-select v-model="f.order_by" :items="sortOptions" item-title="t" item-value="v" placeholder="Tartiblash" hide-details density="comfortable" style="max-width:200px" @update:model-value="load" />
    </BzFilterBar>

    <!-- Customer cards grid -->
    <v-row v-if="loading" dense>
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" lg="3">
        <v-card rounded="xl" class="bz-card pa-5">
          <div class="d-flex align-center ga-3 mb-3">
            <div class="bz-skeleton" style="width:46px;height:46px;border-radius:50%" />
            <div style="flex:1"><div class="bz-skeleton mb-2" style="width:70%;height:14px" /><div class="bz-skeleton" style="width:50%;height:11px" /></div>
          </div>
          <div class="bz-skeleton mb-2" style="width:100%;height:1px" />
          <div class="d-flex ga-3"><div class="bz-skeleton" style="width:40%;height:12px" /><div class="bz-skeleton" style="width:30%;height:12px" /></div>
        </v-card>
      </v-col>
    </v-row>

    <BzEmptyState v-else-if="!customers.length" icon="mdi-account-group-outline" title="Mijozlar topilmadi" />

    <v-row v-else dense>
      <v-col v-for="c in customers" :key="c.id" cols="12" sm="6" lg="3">
        <v-card
          rounded="xl"
          class="bz-customer-card bz-card"
          style="height:100%;cursor:pointer"
          @click="$router.push(`/customers/${c.id}`)"
        >
          <div class="pa-5 pb-4">
            <!-- Header: avatar + name -->
            <div class="d-flex align-center ga-3 mb-3">
              <v-avatar size="48" :color="c.is_active ? 'primary' : 'grey'" variant="tonal">
                <span style="font-size:16px;font-weight:800">{{ fmt.initials(c.first_name, c.last_name) }}</span>
              </v-avatar>
              <div style="flex:1;min-width:0">
                <div style="font-weight:800;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  {{ fmt.fullName(c) }}
                </div>
                <div class="d-flex align-center ga-1" style="font-size:12px;color:var(--bz-text-3);margin-top:2px">
                  <v-icon v-if="c.telegram_id" size="13" color="info">mdi-telegram</v-icon>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.phone || '—' }}</span>
                </div>
              </div>
              <v-chip :color="c.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm flex-shrink-0">
                {{ c.is_active ? 'Faol' : 'Blok' }}
              </v-chip>
            </div>

            <v-divider style="opacity:0.5" />

            <!-- Info rows -->
            <div class="d-flex flex-column ga-2 mt-3">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-1" style="font-size:12px;color:var(--bz-text-3)">
                  <v-icon size="13">mdi-clock-outline</v-icon>
                  Oxirgi
                </div>
                <span style="font-size:12px;font-weight:600;color:var(--bz-text-2)">{{ fmt.relativeTime(c.last_seen_at) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-1" style="font-size:12px;color:var(--bz-text-3)">
                  <v-icon size="13">mdi-calendar-outline</v-icon>
                  Ro'yxatdan
                </div>
                <span style="font-size:12px;font-weight:600;color:var(--bz-text-2)">{{ fmt.date(c.created_at) }}</span>
              </div>
              <div v-if="c.language" class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-1" style="font-size:12px;color:var(--bz-text-3)">
                  <v-icon size="13">mdi-translate</v-icon>
                  Til
                </div>
                <span style="font-size:12px;font-weight:600;color:var(--bz-text-2)">{{ c.language === 'ru' ? 'Ruscha' : "O'zbekcha" }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom action bar -->
          <div class="bz-customer-footer d-flex align-center justify-space-between px-4 py-2">
            <span style="font-size:11px;color:var(--bz-text-3);font-weight:600">ID: {{ c.id }}</span>
            <div class="d-flex align-center ga-1">
              <v-icon size="14" color="primary">mdi-arrow-right</v-icon>
              <span style="font-size:11.5px;font-weight:700;color:var(--bz-primary)">Batafsil</span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-card v-if="!loading && customers.length" rounded="xl" class="bz-card mt-4">
      <div class="d-flex align-center justify-space-between px-4 py-3 ga-3" style="flex-wrap:wrap">
        <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b style="color:var(--bz-text-1)">{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[12,24,48]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi, statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzKpiTile    from '@/components/common/BzKpiTile.vue'

const fmt    = useFormat()
const router = useRouter()

const customers    = ref([])
const loading      = ref(false)
const total        = ref(0)
const stats        = ref({})
const statsLoading = ref(true)
const pages        = computed(() => Math.ceil(total.value / f.value.per_page))

function locNum(v) { return v != null ? Number(v).toLocaleString('ru-RU') : '—' }

const kpi = computed(() => {
  const s = stats.value
  const fallbackTotal  = total.value || 0
  const fallbackActive = customers.value.filter(c => c.is_active).length
  const fallbackTg     = customers.value.filter(c => c.telegram_id).length

  const t  = s.total ?? s.count ?? s.total_count ?? fallbackTotal
  const a  = s.active ?? s.active_count ?? s.is_active ?? fallbackActive
  const n  = s.new_count ?? s.new ?? s.new_customers ?? s.recent ?? 0
  const tg = s.with_telegram ?? s.telegram ?? s.telegram_count ?? fallbackTg

  return { total: t, active: a, newCount: n, telegram: tg }
})

const activePct = computed(() => kpi.value.total ? Math.round((kpi.value.active || 0) / kpi.value.total * 100) : 0)

const f = ref({ q: '', is_active: null, page: 1, per_page: 12, order_by: '-created_at' })

const activeOptions = [
  { t: 'Faol',       v: 'true' },
  { t: 'Bloklangan', v: 'false' },
]
const sortOptions = [
  { t: 'Yangi → eski',    v: '-created_at' },
  { t: 'Eski → yangi',    v: 'created_at' },
  { t: 'Ism (A → Z)',     v: 'first_name' },
  { t: 'Ism (Z → A)',     v: '-first_name' },
  { t: 'Oxirgi faol',     v: '-last_seen_at' },
]

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await customersApi.list(fmt.cleanParams({ ...f.value }))
    customers.value = data.data?.items || data.data || []
    total.value     = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const { data } = await statsApi.customers()
    stats.value = data.data || {}
  } catch {} finally { statsLoading.value = false }
}

onMounted(() => { load(); loadStats() })
</script>

<style scoped>
.bz-customer-card {
  overflow: hidden;
  transition: transform var(--bz-dur) var(--bz-ease), box-shadow var(--bz-dur) var(--bz-ease);
  display: flex;
  flex-direction: column;
}
.bz-customer-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--bz-shadow-lg);
}
.bz-customer-card:hover .bz-customer-footer {
  background: var(--bz-primary-soft);
}
.bz-customer-footer {
  margin-top: auto;
  border-top: 1px solid var(--bz-border);
  transition: background var(--bz-dur) var(--bz-ease);
}
</style>
