<template>
  <div class="dx">
    <!-- ── Header ──────────────────────────────────────────────── -->
    <header class="dx-head bz-rise">
      <div class="dx-head-titles">
        <div class="eyebrow">Moliyaviy ko'rsatkichlar</div>
        <div class="page-title">Boshqaruv paneli</div>
        <div class="page-subtitle">{{ welcome }} · {{ rangeLabel }} · sof foyda real vaqtda hisoblanadi</div>
      </div>

      <div class="dx-head-ctrls">
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

    <!-- ── Data-quality banner ─────────────────────────────────── -->
    <div v-if="!loading && coverageNote" class="dx-note bz-rise" :class="coverageNote.tone">
      <v-icon size="18">{{ coverageNote.icon }}</v-icon>
      <span>{{ coverageNote.text }}</span>
    </div>

    <!-- ── KPI rail ────────────────────────────────────────────── -->
    <div class="dx-kpis">
      <div
        v-for="(k, i) in kpis" :key="k.key"
        class="dx-kpi bz-card bz-rise" :class="{ 'is-hero': k.hero }"
        :style="`animation-delay:${i * 55}ms`"
      >
        <div class="dx-kpi-top">
          <span class="dx-kpi-ico" :style="`color:${k.color};background:${k.color}22`">
            <v-icon :color="k.color" size="17">{{ k.icon }}</v-icon>
          </span>
          <span class="dx-kpi-label">{{ k.label }}</span>
          <span v-if="showDeltas && k.delta != null" class="dx-delta" :class="k.delta >= 0 ? 'up' : 'down'">
            <v-icon size="11">{{ k.delta >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>{{ Math.abs(k.delta).toFixed(1) }}%
          </span>
        </div>
        <div class="dx-kpi-val num">
          <template v-if="loading"><span class="bz-skeleton dx-sk" /></template>
          <template v-else>{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></template>
        </div>
        <div v-if="k.sub" class="dx-kpi-sub">{{ k.sub }}</div>
        <div v-if="k.series" class="dx-kpi-spark">
          <Sparkline v-if="!loading && k.series.length" :series="k.series" :color="k.color" />
        </div>
      </div>
    </div>

    <!-- ── Stat tiles strip (6 animated metrics) ───────────────── -->
    <div class="dx-tiles">
      <div
        v-for="(t, i) in statTiles" :key="t.label"
        class="dx-tile bz-card bz-rise" :style="`animation-delay:${i * 40}ms`"
      >
        <div class="dx-tile-l"><span class="dx-tile-ic" :style="`color:${cssColor(t.color)};background:${cssColor(t.color)}1f`"><v-icon size="14">{{ t.icon }}</v-icon></span>{{ t.label }}</div>
        <div class="dx-tile-v num">
          <span v-if="loading" class="bz-skeleton" style="display:block;width:55%;height:22px;border-radius:7px;margin-top:8px" />
          <template v-else>{{ t.value }}</template>
        </div>
        <div v-if="!loading && t.spark.length" class="dx-tile-spark">
          <Sparkline :series="t.spark" :color="cssColor(t.color)" />
        </div>
      </div>
    </div>

    <!-- ── Main bento ──────────────────────────────────────────── -->
    <div class="dx-grid">
      <!-- Trend: revenue vs profit -->
      <section class="bz-card dx-pad dx-c-trend">
        <header class="dx-wh">
          <div>
            <div class="dx-wt">Sotuv va sof foyda dinamikasi</div>
            <div class="dx-ws">Kunlik · {{ rangeLabel }}</div>
          </div>
          <v-btn-toggle v-model="visibleSeries" multiple density="comfortable" variant="outlined" rounded="lg" color="primary">
            <v-btn value="revenue" size="x-small">Sotuv</v-btn>
            <v-btn value="cost" size="x-small">Tannarx</v-btn>
            <v-btn value="profit" size="x-small">Foyda</v-btn>
          </v-btn-toggle>
        </header>
        <BzSkeleton v-if="loading" type="chart" :height="300" />
        <LineChart
          v-else-if="trendSeries.length && axis.cats.length"
          :series="trendSeries" :categories="axis.cats"
          :colors="trendColors" :format-y="v => fmt.compact(v)" :height="300"
        />
        <BzEmptyState v-else icon="mdi-chart-areaspline" title="Ma'lumot yo'q" subtitle="Bu oraliqda buyurtma topilmadi" />
      </section>

      <!-- Profit quality -->
      <section class="bz-card dx-pad dx-c-quality">
        <header class="dx-wh"><div class="dx-wt">Foyda sifati</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="200" />
        <template v-else>
          <RadialChart :value="totals.margin" label="Marja" :color="marginColor" :height="190" />
          <div class="dx-q-rows">
            <div class="dx-q-row">
              <span class="dx-q-k"><span class="dx-dot" style="background:#6366F1" />Sotuv</span>
              <span class="num dx-q-v">{{ fmt.price(totals.revenue) }}</span>
            </div>
            <div class="dx-q-row">
              <span class="dx-q-k"><span class="dx-dot" style="background:#F59E0B" />Tannarx</span>
              <span class="num dx-q-v">−{{ fmt.price(totals.cost) }}</span>
            </div>
            <div class="dx-q-row dx-q-row--strong">
              <span class="dx-q-k"><span class="dx-dot" style="background:#10B981" />Sof foyda</span>
              <span class="num dx-q-v" :style="`color:${marginColor}`">{{ fmt.price(totals.profit) }}</span>
            </div>
            <div class="dx-q-row">
              <span class="dx-q-k"><v-icon size="14" color="success">mdi-check-decagram-outline</v-icon>To'langan tushum</span>
              <span class="num dx-q-v">{{ fmt.price(totals.realized) }}</span>
            </div>
          </div>
        </template>
      </section>

      <!-- Top products by profit -->
      <section class="bz-card dx-pad dx-c-top">
        <header class="dx-wh">
          <div class="dx-wt">Eng foydali mahsulotlar</div>
          <v-icon size="17" color="success">mdi-trophy-outline</v-icon>
        </header>
        <template v-if="loading"><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template v-else-if="topProducts.length">
          <div v-for="(p, i) in topProducts" :key="p.key" class="dx-prow">
            <span class="dx-rank">{{ i + 1 }}</span>
            <div class="dx-pmid">
              <div class="dx-pname">{{ p.name }}</div>
              <div class="dx-pbar"><span :style="`width:${maxProductProfit ? Math.max(4, p.profit / maxProductProfit * 100) : 0}%`" /></div>
            </div>
            <div class="dx-pmeta">
              <span class="num dx-pprofit">{{ fmt.compact(p.profit) }}</span>
              <span class="dx-pmargin">{{ p.margin.toFixed(0) }}% · {{ fmt.compact(p.qty) }} dona</span>
            </div>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-cube-outline" title="Ma'lumot yo'q" />
      </section>

      <!-- By category -->
      <section class="bz-card dx-pad dx-c-cat">
        <header class="dx-wh">
          <div class="dx-wt">Kategoriya bo'yicha foyda</div>
          <v-icon size="17" color="primary">mdi-tag-multiple-outline</v-icon>
        </header>
        <template v-if="loading"><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template v-else-if="categoryAgg.length">
          <div v-for="c in categoryAgg" :key="c.name" class="dx-crow">
            <span class="dx-cname">{{ c.name }}</span>
            <div class="dx-cbar"><span :style="`width:${maxCatRevenue ? c.revenue / maxCatRevenue * 100 : 0}%`" /></div>
            <span class="num dx-cval">{{ fmt.compact(c.profit) }}</span>
            <span class="dx-cmargin">{{ c.margin.toFixed(0) }}%</span>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-tag-off-outline" title="Ma'lumot yo'q" />
      </section>

      <!-- Payment methods -->
      <section class="bz-card dx-pad dx-c-pay">
        <header class="dx-wh"><div class="dx-wt">To'lov usullari</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="220" />
        <DonutChart
          v-else-if="paymentChart.values.length"
          :series="paymentChart.values" :labels="paymentChart.labels"
          :total="totals.revenue" total-label="Sotuv" :height="240"
          :colors="['#10B981','#6366F1','#F59E0B','#06B6D4','#F43F5E','#A855F7']"
        />
        <BzEmptyState v-else icon="mdi-credit-card-outline" title="Ma'lumot yo'q" />
      </section>

      <!-- Status -->
      <section class="bz-card dx-pad dx-c-status">
        <header class="dx-wh"><div class="dx-wt">Buyurtma holatlari</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="220" />
        <DonutChart
          v-else-if="statusChart.values.length"
          :series="statusChart.values" :labels="statusChart.labels"
          :total="totals.count" total-label="Jami" :height="240"
          :colors="statusChart.colors"
        />
        <BzEmptyState v-else icon="mdi-chart-donut" title="Ma'lumot yo'q" />
      </section>

      <!-- Staff leaderboard -->
      <section class="bz-card dx-pad dx-c-staff">
        <header class="dx-wh">
          <div>
            <div class="dx-wt">Xodimlar reytingi</div>
            <div class="dx-ws">Sotuv → haqiqiy foyda</div>
          </div>
          <v-icon size="17" color="info">mdi-shield-account-outline</v-icon>
        </header>
        <template v-if="loading"><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template v-else-if="staffAgg.length">
          <div v-for="(s, i) in staffAgg.slice(0, 6)" :key="s.id" class="dx-srow">
            <v-avatar size="34" color="info" variant="tonal" class="dx-savatar">{{ initials(s.name) }}</v-avatar>
            <div class="dx-smid">
              <div class="dx-sname">{{ s.name }}</div>
              <div class="dx-ssub">{{ s.orders }} buyurtma · {{ s.margin.toFixed(0) }}% marja</div>
            </div>
            <div class="dx-smeta">
              <span class="num dx-srev">{{ fmt.compact(s.revenue) }}</span>
              <span class="num dx-sprofit">+{{ fmt.compact(s.profit) }}</span>
            </div>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-account-off-outline" title="Xodim biriktirilmagan" subtitle="Buyurtmalarda kuryer/xodim ma'lumoti yo'q" />
      </section>

      <!-- Weekday profit -->
      <section class="bz-card dx-pad dx-c-weekday">
        <header class="dx-wh"><div class="dx-wt">Hafta kunlari bo'yicha foyda</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="200" />
        <BarChart
          v-else :series="[{ name: 'Foyda', data: weekdayProfit }]" :categories="WEEKDAYS"
          :colors="[accentHex]" :format-y="v => fmt.compact(v)" :height="210"
        />
      </section>

      <!-- Hourly revenue -->
      <section class="bz-card dx-pad dx-c-hour">
        <header class="dx-wh"><div class="dx-wt">Soatlar bo'yicha sotuv</div></header>
        <BzSkeleton v-if="loading" type="chart" :height="200" />
        <BarChart
          v-else :series="[{ name: 'Sotuv', data: hourlyRevenue }]" :categories="HOUR_CATS"
          :colors="[infoHex]" :format-y="v => fmt.compact(v)" :height="210"
        />
      </section>

      <!-- Activity heatmap -->
      <section class="bz-card dx-pad dx-c-heat">
        <header class="dx-wh"><div class="dx-wt">Faollik xaritasi</div><div class="dx-ws">Kun × soat · sotuv</div></header>
        <div class="dx-heat">
          <div v-for="(row, ri) in heatData.rows" :key="ri" class="dx-heat-row">
            <span class="dx-heat-lbl">{{ WEEKDAYS[ri] }}</span>
            <span
              v-for="(v, ci) in row" :key="ci" class="dx-heat-cell"
              :style="`background:color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--surface-3))`"
              :title="`${WEEKDAYS[ri]} ${heatData.cols[ci]}`"
            />
          </div>
          <div class="dx-heat-cols">
            <span />
            <span v-for="(c, ci) in heatData.cols" :key="ci" class="dx-heat-col">{{ c }}</span>
          </div>
        </div>
      </section>

      <!-- Live orders feed -->
      <section class="bz-card dx-pad dx-c-feed">
        <header class="dx-wh"><div class="dx-wt" style="display:flex;align-items:center;gap:9px"><span class="dx-live-dot" />Jonli buyurtmalar</div></header>
        <template v-if="loading"><BzSkeleton v-for="n in 6" :key="n" type="row" /></template>
        <template v-else-if="recentOrders.length">
          <div v-for="(o, i) in recentOrders" :key="o.id" class="dx-feed-item bz-rise" :style="`animation-delay:${i * 60}ms`">
            <span class="dx-feed-dot" :style="`background:${statusColor(o.status)}`" />
            <span class="dx-feed-id"><span class="hash">#</span>{{ o.order_number }}</span>
            <span class="dx-feed-name">{{ custName(o) }}</span>
            <span class="num dx-feed-amt">{{ fmt.compact(o._p.revenue) }}</span>
            <span class="dx-feed-time">{{ fmt.relativeTime(o.created_at) }}</span>
          </div>
        </template>
        <BzEmptyState v-else icon="mdi-bell-outline" title="Buyurtma yo'q" />
      </section>

      <!-- Monthly targets -->
      <section class="bz-card dx-pad dx-c-targets">
        <header class="dx-wh"><div class="dx-wt">Oylik maqsadlar</div></header>
        <div v-for="g in targets" :key="g.label" class="dx-target">
          <div class="dx-target-head">
            <span>{{ g.label }}</span>
            <span><b>{{ g.money ? fmt.compact(g.cur) : g.cur }}</b> <span style="color:var(--muted)">/ {{ g.money ? fmt.compact(g.target) : g.target }}</span></span>
          </div>
          <div class="dx-mbar"><i :style="`width:${g.pct}%;background:${g.pct > 80 ? accentHex : g.pct > 50 ? infoHex : warnHex}`" /></div>
        </div>
      </section>

      <!-- Operational health gauges -->
      <section class="bz-card dx-pad dx-c-gauges">
        <header class="dx-wh"><div class="dx-wt">Operatsion holat</div></header>
        <div class="dx-gauges">
          <div><RadialChart :value="gauge.fulfillment" label="Yetkazildi" :color="accentHex" :height="150" /></div>
          <div><RadialChart :value="gauge.paidPct" label="To'langan" :color="infoHex" :height="150" /></div>
          <div class="dx-gauge-metrics">
            <div class="dx-gmetric"><span>Bekor</span><span class="pill" :class="gauge.cancelRate < 10 ? 'good' : 'warn'">{{ gauge.cancelRate }}%</span></div>
            <div class="dx-gmetric"><span>Qaytarish</span><span class="pill" :class="gauge.refundRate < 8 ? 'good' : 'bad'">{{ gauge.refundRate }}%</span></div>
            <div class="dx-gmetric"><span>Marja</span><span class="pill good">{{ gauge.margin }}%</span></div>
            <div class="dx-gmetric"><span>Buyurtma</span><span class="pill info">{{ totals.count }}</span></div>
          </div>
        </div>
      </section>

      <!-- ── The admin table ─────────────────────────────────────── -->
      <section class="bz-card dx-c-table">
        <div class="dx-tbar">
          <div class="dx-wt">Buyurtmalar — foyda tahlili</div>
          <v-spacer />
          <v-text-field
            v-model="q" placeholder="Raqam, mijoz, telefon…" density="compact" hide-details
            variant="outlined" prepend-inner-icon="mdi-magnify" class="dx-search"
          />
          <v-select
            v-model="fStatus" :items="statusOptions" item-title="t" item-value="v"
            placeholder="Holat" clearable hide-details density="compact" variant="outlined" class="dx-flt"
          />
          <v-select
            v-model="fPay" :items="paymentOptions" item-title="t" item-value="v"
            placeholder="To'lov" clearable hide-details density="compact" variant="outlined" class="dx-flt"
          />
          <v-select
            v-if="staffOptions.length"
            v-model="fStaff" :items="staffOptions" item-title="t" item-value="v"
            placeholder="Xodim" clearable hide-details density="compact" variant="outlined" class="dx-flt"
          />
          <v-switch v-model="paidOnly" label="Faqat to'langan" color="success" density="compact" hide-details class="dx-switch" />
          <v-btn variant="tonal" color="primary" size="small" rounded="lg" :disabled="!tableRows.length" @click="exportCsv">
            <v-icon start size="16">mdi-download-outline</v-icon>CSV
          </v-btn>
        </div>

        <v-data-table
          :headers="headers" :items="tableRows" :loading="loading"
          :sort-by="sortBy" :items-per-page="perPage" item-value="id"
          class="dx-table" density="comfortable"
        >
          <template #item.order_number="{ item }">
            <router-link :to="`/orders/${item.id}`" class="dx-onum">#{{ item.order_number }}</router-link>
          </template>
          <template #item.customer="{ item }">
            <div class="dx-cust">
              <div class="dx-cust-n">{{ custName(item) }}</div>
              <div class="dx-cust-p">{{ item.user?.phone || item.customer_phone || '—' }}</div>
            </div>
          </template>
          <template #item.created_at="{ item }">
            <span class="dx-date">{{ fmt.date(item.created_at) }}</span>
          </template>
          <template #item.status="{ item }">
            <BzStatusChip :status="item.status" :icon="true" />
          </template>
          <template #item.payment="{ item }">
            <span class="dx-pay-cell">{{ payLabel(item.payment_method) }}</span>
            <BzStatusChip :status="item.payment_status" type="payment" />
          </template>
          <template #item.revenue="{ item }">
            <span class="num dx-money">{{ fmt.price(item._p.revenue) }}</span>
          </template>
          <template #item.cost="{ item }">
            <span class="num dx-money dx-muted">{{ fmt.price(item._p.cost) }}</span>
          </template>
          <template #item.profit="{ item }">
            <span class="num dx-money" :class="item._p.profit >= 0 ? 'dx-pos' : 'dx-neg'">
              {{ item._p.profit >= 0 ? '+' : '' }}{{ fmt.price(item._p.profit) }}
            </span>
          </template>
          <template #item.margin="{ item }">
            <span class="dx-marginchip" :style="marginChipStyle(item._p.margin)">
              {{ item._p.margin.toFixed(0) }}%
              <v-icon v-if="item._p.estimated" size="11" title="Taxminiy (tannarx to'liq emas)">mdi-approximately-equal</v-icon>
            </span>
          </template>
          <template #item.staff_name="{ item }">
            <span class="dx-staff">{{ item._p.staff.name || '—' }}</span>
          </template>
          <template #loading><BzSkeleton v-for="n in 8" :key="n" type="row" /></template>
          <template #no-data><BzEmptyState icon="mdi-package-variant-closed" title="Buyurtma topilmadi" /></template>
        </v-data-table>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from 'vue'
import { useProfitAnalytics } from '@/composables/useProfitAnalytics'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'
import { useThemeStore } from '@/stores/theme'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzSkeleton   from '@/components/common/BzSkeleton.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import LineChart    from '@/components/common/charts/LineChart.vue'
import BarChart     from '@/components/common/charts/BarChart.vue'
import DonutChart   from '@/components/common/charts/DonutChart.vue'
import RadialChart  from '@/components/common/charts/RadialChart.vue'
import Sparkline    from '@/components/common/charts/Sparkline.vue'

const fmt   = useFormat()
const auth  = useAuthStore()
const snack = useSnackStore()
const theme = inject('theme', null)
const isDark = computed(() => theme?.value === 'dark')
const themeStore = useThemeStore()

const { loading, orders, prevTotals, ratio, coverage, load } = useProfitAnalytics()

// ── Date range ──────────────────────────────────────────────────────────
const preset    = ref('30')
const dateMenu  = ref(false)
const custom    = reactive({ on: false, from: '', to: '' })
const appliedRange = ref({ date_from: '', date_to: '' })

const PAY_LABELS = { cash: 'Naqd', click: 'Click', payme: 'Payme', card: 'Karta', uzum: 'Uzum', terminal: 'Terminal' }
const payLabel = m => PAY_LABELS[(m || '').toLowerCase()] || (m ? m[0].toUpperCase() + m.slice(1) : '—')

function rangeFor() {
  if (custom.on && custom.from && custom.to) return { date_from: custom.from, date_to: custom.to }
  const to = new Date()
  const from = new Date()
  if (preset.value !== 'today') from.setDate(from.getDate() - (Number(preset.value) - 1))
  return { date_from: fmt.dayKey(from), date_to: fmt.dayKey(to) }
}

function reload() {
  appliedRange.value = rangeFor()
  load(appliedRange.value)
}
function setPreset(v) { if (!v) return; preset.value = v; custom.on = false; reload() }
function applyCustom() { if (!custom.from || !custom.to) return; custom.on = true; dateMenu.value = false; reload() }
function clearCustom() { custom.on = false; custom.from = ''; custom.to = ''; dateMenu.value = false; reload() }

const rangeLabel = computed(() => {
  if (custom.on && custom.from && custom.to) return `${custom.from} → ${custom.to}`
  return preset.value === 'today' ? 'bugun' : `oxirgi ${preset.value} kun`
})

const welcome = computed(() => {
  const h = new Date().getHours()
  const g = h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'
  const n = auth.user?.first_name || auth.user?.username
  return n ? `${g}, ${n}` : g
})

// ── Client-side filters (instant, no refetch) ───────────────────────────
const paidOnly = ref(false)
const fStatus  = ref(null)
const fPay     = ref(null)
const fStaff   = ref(null)
const q        = ref('')

const isPaid = o => ['paid', 'completed'].includes(o.payment_status)

const filtered = computed(() => orders.value.filter(o => {
  if (paidOnly.value && !isPaid(o)) return false
  if (fStatus.value && o.status !== fStatus.value) return false
  if (fPay.value && (o.payment_method || '').toLowerCase() !== fPay.value) return false
  if (fStaff.value && String(o._p.staff.id) !== String(fStaff.value)) return false
  return true
}))

const showDeltas = computed(() => !paidOnly.value && !fStatus.value && !fPay.value && !fStaff.value)

// ── Totals ──────────────────────────────────────────────────────────────
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

const deltas = computed(() => {
  const pt = prevTotals.value
  const d = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)
  return {
    revenue: d(totals.value.revenue, pt.revenue),
    profit:  d(totals.value.profit, pt.profit),
    orders:  d(totals.value.count, pt.orders),
  }
})

// ── Daily axis + series ─────────────────────────────────────────────────
const axis = computed(() => {
  const { date_from, date_to } = appliedRange.value
  const days = []
  if (date_from && date_to) {
    const cur = new Date(`${date_from}T00:00:00`); const end = new Date(`${date_to}T00:00:00`)
    let guard = 0
    while (cur <= end && guard++ < 400) { days.push(fmt.dayKey(cur)); cur.setDate(cur.getDate() + 1) }
  }
  const buckets = new Map(days.map(d => [d, { revenue: 0, cost: 0, profit: 0, orders: 0 }]))
  for (const o of filtered.value) {
    const day = fmt.dayKey(o.created_at)
    const b = buckets.get(day)
    if (!b) continue
    b.revenue += o._p.revenue; b.cost += o._p.cost; b.profit += o._p.profit; b.orders++
  }
  return {
    cats: days.map(d => new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })),
    revenue: days.map(d => Math.round(buckets.get(d).revenue)),
    cost:    days.map(d => Math.round(buckets.get(d).cost)),
    profit:  days.map(d => Math.round(buckets.get(d).profit)),
    orders:  days.map(d => buckets.get(d).orders),
  }
})

const visibleSeries = ref(['revenue', 'profit'])
const SERIES_DEF = {
  revenue: { name: 'Sotuv',   color: '#6366F1' },
  cost:    { name: 'Tannarx', color: '#F59E0B' },
  profit:  { name: 'Foyda',   color: '#10B981' },
}
const trendSeries = computed(() =>
  ['revenue', 'cost', 'profit']
    .filter(k => visibleSeries.value.includes(k))
    .map(k => ({ name: SERIES_DEF[k].name, data: axis.value[k] }))
)
const trendColors = computed(() =>
  ['revenue', 'cost', 'profit'].filter(k => visibleSeries.value.includes(k)).map(k => SERIES_DEF[k].color)
)

// ── Aggregations for widgets ────────────────────────────────────────────
const productAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) for (const b of o._p.breakdown) {
    const key = b.productId ?? b.name
    const e = m.get(key) || { key, name: b.name, revenue: 0, profit: 0, qty: 0 }
    e.revenue += b.revenue; e.profit += b.profit; e.qty += b.qty
    m.set(key, e)
  }
  return [...m.values()].map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 }))
})
const topProducts = computed(() => [...productAgg.value].sort((a, b) => b.profit - a.profit).slice(0, 8))
const maxProductProfit = computed(() => topProducts.value.reduce((m, p) => Math.max(m, p.profit), 0))

const categoryAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) for (const b of o._p.breakdown) {
    const name = b.categoryName || 'Boshqa'
    const e = m.get(name) || { name, revenue: 0, profit: 0 }
    e.revenue += b.revenue; e.profit += b.profit
    m.set(name, e)
  }
  return [...m.values()]
    .map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 7)
})
const maxCatRevenue = computed(() => categoryAgg.value.reduce((m, c) => Math.max(m, c.revenue), 0))

const staffAgg = computed(() => {
  const m = new Map()
  for (const o of filtered.value) {
    const s = o._p.staff
    if (s.id == null) continue
    const e = m.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, orders: 0 }
    e.revenue += o._p.revenue; e.profit += o._p.profit; e.orders++
    m.set(s.id, e)
  }
  return [...m.values()]
    .map(e => ({ ...e, margin: e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit)
})

// Donut charts
const paymentChart = computed(() => {
  const m = new Map()
  for (const o of filtered.value) {
    const k = payLabel(o.payment_method)
    m.set(k, (m.get(k) || 0) + o._p.revenue)
  }
  const entries = [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  return { labels: entries.map(e => e[0]), values: entries.map(e => Math.round(e[1])) }
})
const statusChart = computed(() => {
  const m = new Map()
  for (const o of filtered.value) m.set(o.status, (m.get(o.status) || 0) + 1)
  const palette = { pending: '#F59E0B', confirmed: '#06B6D4', preparing: '#6366F1', delivering: '#A855F7', delivered: '#10B981', completed: '#059669', cancelled: '#F43F5E' }
  const entries = [...m.entries()].filter(([, v]) => v > 0)
  return {
    labels: entries.map(([k]) => ORDER_STATUS[k]?.label || k),
    values: entries.map(([, v]) => v),
    colors: entries.map(([k]) => palette[k] || '#8A97AB'),
  }
})

// ── KPI tiles ───────────────────────────────────────────────────────────
const kpis = computed(() => [
  { key: 'profit', hero: true, label: 'Sof foyda', value: fmt.compact(totals.value.profit), unit: ' UZS', color: '#10B981', icon: 'mdi-trending-up', delta: deltas.value.profit, series: axis.value.profit, sub: `Marja ${totals.value.margin.toFixed(1)}%` },
  { key: 'rev',    label: 'Sotuv (tushum)', value: fmt.compact(totals.value.revenue), unit: ' UZS', color: '#6366F1', icon: 'mdi-cash-multiple', delta: deltas.value.revenue, series: axis.value.revenue, sub: `Tannarx ${fmt.compact(totals.value.cost)}` },
  { key: 'ord',    label: 'Buyurtmalar', value: totals.value.count.toLocaleString('ru-RU'), unit: '', color: '#A855F7', icon: 'mdi-package-variant-closed', delta: deltas.value.orders, series: axis.value.orders, sub: `${fmt.compact(totals.value.units)} dona sotildi` },
  { key: 'avg',    label: "O'rtacha foyda", value: fmt.compact(totals.value.avgProfit), unit: ' UZS', color: '#06B6D4', icon: 'mdi-chart-bell-curve-cumulative', delta: null, series: null, sub: `Buyurtma o'rt. ${fmt.compact(totals.value.avgOrder)}` },
  { key: 'paid',   label: "To'langan tushum", value: fmt.compact(totals.value.realized), unit: ' UZS', color: '#F59E0B', icon: 'mdi-check-decagram-outline', delta: null, series: null, sub: `${totals.value.revenue > 0 ? Math.round(totals.value.realized / totals.value.revenue * 100) : 0}% qoplangan` },
])

const marginColor = computed(() => {
  const m = totals.value.margin
  return m >= 25 ? '#10B981' : m >= 12 ? '#F59E0B' : '#F43F5E'
})

// ── Theme-aware colour resolution (recomputes on theme/accent change) ────
function readVar(name) {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
const accentHex = computed(() => { void themeStore.accent; void themeStore.themeId; return readVar('--accent') || '#2f6df0' })
const infoHex   = computed(() => { void themeStore.themeId; void themeStore.accent; return readVar('--info') || '#2f6df0' })
const warnHex   = computed(() => { void themeStore.themeId; return readVar('--warn') || '#c07c1b' })
function cssColor(token) {
  const m = /var\((--[\w-]+)\)/.exec(token || '')
  if (m) { void themeStore.accent; void themeStore.themeId; return readVar(m[1]) || '#2f6df0' }
  return token
}
const STATUS_VAR = { pending: '--warn', confirmed: '--info', preparing: '--info', delivering: '--info', delivered: '--accent', completed: '--accent', cancelled: '--bad' }
function statusColor(s) { void themeStore.themeId; void themeStore.accent; return readVar(STATUS_VAR[s] || '--muted') || '#79818f' }

// ── New design widgets: weekday/hour/heatmap/feed/targets/gauges ─────────
const WEEKDAYS  = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
const HOUR_CATS = ['8', '10', '12', '14', '16', '18', '20', '22']

const weekdayProfit = computed(() => {
  const wd = [0, 0, 0, 0, 0, 0, 0]
  for (const o of filtered.value) { const dd = (new Date(o.created_at).getDay() + 6) % 7; wd[dd] += o._p.profit }
  return wd.map(v => Math.round(v))
})
const hourlyRevenue = computed(() => {
  const hr = new Array(24).fill(0)
  for (const o of filtered.value) hr[new Date(o.created_at).getHours()] += o._p.revenue
  const out = []; for (let h = 8; h <= 22; h += 2) out.push(Math.round(hr[h] + (hr[h + 1] || 0)))
  return out
})
const heatData = computed(() => {
  const buckets = [8, 10, 12, 14, 16, 18, 20]
  const heat = Array.from({ length: 7 }, () => new Array(buckets.length).fill(0))
  for (const o of filtered.value) {
    const dt = new Date(o.created_at); const wd = (dt.getDay() + 6) % 7; const h = dt.getHours()
    let bi = buckets.findIndex((hb, i) => h >= hb && h < (buckets[i + 1] || 24)); if (bi < 0) bi = h < 8 ? 0 : buckets.length - 1
    heat[wd][bi] += o._p.revenue
  }
  const max = Math.max(1, ...heat.flat())
  return { rows: heat.map(r => r.map(v => v / max)), cols: buckets.map(h => h + ':00') }
})
const recentOrders = computed(() =>
  [...filtered.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 7)
)
const statTiles = computed(() => {
  const t = totals.value
  const refunded = filtered.value.filter(o => o.payment_status === 'refunded').length
  const refundRate = t.count ? Math.round(refunded / t.count * 100) : 0
  const m = {}
  for (const o of filtered.value) { const id = o.user?.id ?? o.customer_id ?? o.customer_phone; if (id != null) m[id] = (m[id] || 0) + 1 }
  const ids = Object.keys(m); const repeats = ids.filter(k => m[k] > 1).length
  const repeatPct = ids.length ? Math.round(repeats / ids.length * 100) : 0
  const fulfilled = filtered.value.filter(o => ['completed', 'delivered'].includes(o.status)).length
  const fulfillment = t.count ? Math.round(fulfilled / t.count * 100) : 0
  const paidPct = t.revenue > 0 ? Math.round(t.realized / t.revenue * 100) : 0
  const avgItems = t.count ? +(t.units / t.count).toFixed(1) : 0
  return [
    { label: "O'rtacha buyurtma", value: fmt.compact(t.avgOrder), icon: 'mdi-wallet-outline', spark: axis.value.revenue.slice(-14), color: 'var(--accent)' },
    { label: 'Mahsulot / buyurtma', value: avgItems, icon: 'mdi-package-variant-closed', spark: axis.value.orders.slice(-14), color: 'var(--info)' },
    { label: 'Yetkazildi', value: fulfillment + '%', icon: 'mdi-check-circle-outline', spark: axis.value.profit.slice(-14), color: 'var(--good)' },
    { label: "To'langan", value: paidPct + '%', icon: 'mdi-cash-check', spark: axis.value.revenue.slice(-14), color: 'var(--accent)' },
    { label: 'Qaytarish', value: refundRate + '%', icon: 'mdi-backup-restore', spark: axis.value.cost.slice(-14), color: 'var(--bad)' },
    { label: 'Takroriy mijoz', value: repeatPct + '%', icon: 'mdi-account-heart-outline', spark: axis.value.orders.slice(-14), color: 'var(--accent)' },
  ]
})
const targets = computed(() => {
  const t = totals.value
  const targetRev = Math.max(50e6, Math.round((t.revenue * 1.25) / 1e6) * 1e6)
  return [
    { label: 'Sotuv maqsadi', cur: t.revenue, target: targetRev, money: true },
    { label: 'Foyda maqsadi', cur: t.profit, target: Math.round(targetRev * 0.35), money: true },
    { label: 'Buyurtma maqsadi', cur: t.count, target: Math.max(t.count + 40, 200), money: false },
  ].map(g => ({ ...g, pct: Math.min(100, g.target ? Math.round(g.cur / g.target * 100) : 0) }))
})
const gauge = computed(() => {
  const t = totals.value
  const fulfilled = filtered.value.filter(o => ['completed', 'delivered'].includes(o.status)).length
  const cancelled = filtered.value.filter(o => o.status === 'cancelled').length
  const refunded = filtered.value.filter(o => o.payment_status === 'refunded').length
  return {
    fulfillment: t.count ? Math.round(fulfilled / t.count * 100) : 0,
    paidPct: t.revenue > 0 ? Math.round(t.realized / t.revenue * 100) : 0,
    cancelRate: t.count ? Math.round(cancelled / t.count * 100) : 0,
    refundRate: t.count ? Math.round(refunded / t.count * 100) : 0,
    margin: Math.round(t.margin),
  }
})

// ── Data-quality note ───────────────────────────────────────────────────
const coverageNote = computed(() => {
  if (ratio.value == null && !coverage.value.exact) {
    return { tone: 'warn', icon: 'mdi-alert-outline', text: "Tannarx (cost_price) ma'lumotlari topilmadi — foyda hisoblanmadi. Mahsulotlarga tannarx kiriting." }
  }
  const est = coverage.value.estimated
  const total = est + coverage.value.exact
  if (est && total) {
    const pct = Math.round(est / total * 100)
    return { tone: 'info', icon: 'mdi-approximately-equal', text: `${total} ta buyurtmaning ${pct}% uchun tannarx to'liq emas — bu qism katalog o'rtacha marjasi bo'yicha taxminlandi.` }
  }
  return null
})

// ── Filter option lists (from the full range, unfiltered) ───────────────
const statusOptions = computed(() => {
  const set = new Set(orders.value.map(o => o.status).filter(Boolean))
  return [...set].map(s => ({ v: s, t: ORDER_STATUS[s]?.label || s }))
})
const paymentOptions = computed(() => {
  const set = new Set(orders.value.map(o => (o.payment_method || '').toLowerCase()).filter(Boolean))
  return [...set].map(s => ({ v: s, t: payLabel(s) }))
})
const staffOptions = computed(() =>
  staffAgg.value.map(s => ({ v: String(s.id), t: s.name }))
)

// ── Table ───────────────────────────────────────────────────────────────
const perPage = ref(15)
const sortBy  = ref([{ key: 'created_at', order: 'desc' }])
const headers = [
  { title: 'Raqam',   key: 'order_number', sortable: true },
  { title: 'Mijoz',   key: 'customer',     sortable: false },
  { title: 'Sana',    key: 'created_at',   sortable: true },
  { title: 'Holat',   key: 'status',       sortable: true },
  { title: "To'lov",  key: 'payment',      sortable: false },
  { title: 'Sotuv',   key: 'revenue',      align: 'end', sortable: true },
  { title: 'Tannarx', key: 'cost',         align: 'end', sortable: true },
  { title: 'Foyda',   key: 'profit',       align: 'end', sortable: true },
  { title: 'Marja',   key: 'margin',       align: 'end', sortable: true },
  { title: 'Xodim',   key: 'staff_name',   sortable: true },
]

function custName(o) {
  return [o.user?.first_name || o.customer_name, o.user?.last_name].filter(Boolean).join(' ') || 'Mijoz'
}

const tableRows = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return filtered.value
  return filtered.value.filter(o => {
    const hay = `${o.order_number} ${custName(o)} ${o.user?.phone || o.customer_phone || ''}`.toLowerCase()
    return hay.includes(term)
  })
})

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}
function marginChipStyle(m) {
  const c = m >= 25 ? '#10B981' : m >= 12 ? '#F59E0B' : '#F43F5E'
  return `color:${c};background:${c}1f`
}

function exportCsv() {
  const cols = ['Raqam', 'Mijoz', 'Telefon', 'Sana', 'Holat', "To'lov", 'Sotuv', 'Tannarx', 'Foyda', 'Marja%', 'Taxminiy', 'Xodim']
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.join(',')]
  for (const o of tableRows.value) {
    lines.push([
      o.order_number, custName(o), o.user?.phone || o.customer_phone || '',
      fmt.date(o.created_at), ORDER_STATUS[o.status]?.label || o.status,
      `${payLabel(o.payment_method)} / ${o.payment_status || ''}`,
      Math.round(o._p.revenue), Math.round(o._p.cost), Math.round(o._p.profit),
      o._p.margin.toFixed(1), o._p.estimated ? 'ha' : "yo'q", o._p.staff.name || '',
    ].map(esc).join(','))
  }
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `foyda_${appliedRange.value.date_from}_${appliedRange.value.date_to}.csv`
  a.click()
  URL.revokeObjectURL(url)
  snack.success(`${tableRows.value.length} ta qator eksport qilindi`)
}

onMounted(reload)
</script>

<style scoped>
.dx { display: flex; flex-direction: column; gap: 14px; }

/* Header */
.dx-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.dx-head-ctrls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.is-dark :deep(input) { color-scheme: dark; }

/* Data note */
.dx-note { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: var(--bz-radius-md); font-size: 13px; font-weight: 600; border: 1px solid; }
.dx-note.info { background: var(--bz-info-soft); border-color: var(--bz-info); color: var(--bz-info); }
.dx-note.warn { background: var(--bz-warn-soft); border-color: var(--bz-warn); color: var(--bz-warn); }

/* KPI rail */
.dx-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.dx-kpi { position: relative; padding: 16px 18px 0; min-height: 120px; overflow: hidden; }
.dx-kpi.is-hero { background:
  linear-gradient(135deg, rgba(16,185,129,0.16), rgba(16,185,129,0.02)),
  var(--bz-glass-bg); border-color: var(--bz-primary-glow); }
.dx-kpi-top { display: flex; align-items: center; gap: 8px; }
.dx-kpi-ico { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dx-kpi-label { font-size: 12px; font-weight: 600; color: var(--bz-text-3); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-delta { display: inline-flex; align-items: center; gap: 1px; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: var(--bz-radius-pill); }
.dx-delta.up { color: var(--bz-primary-strong); background: var(--bz-primary-soft); }
.dx-delta.down { color: var(--bz-danger); background: var(--bz-danger-soft); }
.v-theme--dark .dx-delta.up { color: var(--bz-primary); }
.dx-kpi-val { font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-top: 12px; }
.dx-kpi-val small { font-size: 12px; font-weight: 700; color: var(--bz-text-3); margin-left: 4px; }
.dx-kpi-sub { font-size: 11.5px; color: var(--bz-text-3); font-weight: 600; margin-top: 6px; position: relative; z-index: 2; }
.dx-kpi-spark { position: absolute; left: 0; right: 0; bottom: 0; height: 36px; opacity: 0.55; pointer-events: none; }
.dx-sk { width: 70%; height: 26px; display: block; border-radius: 8px; margin-top: 4px; }

/* Bento grid */
.dx-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
.dx-pad { padding: 18px 20px; }
.dx-c-trend   { grid-column: span 8; }
.dx-c-quality { grid-column: span 4; }
.dx-c-top     { grid-column: span 6; }
.dx-c-cat     { grid-column: span 6; }
.dx-c-pay     { grid-column: span 4; }
.dx-c-status  { grid-column: span 4; }
.dx-c-staff   { grid-column: span 4; }
.dx-c-weekday { grid-column: span 6; }
.dx-c-hour    { grid-column: span 6; }
.dx-c-heat    { grid-column: span 7; }
.dx-c-feed    { grid-column: span 5; }
.dx-c-targets { grid-column: span 6; }
.dx-c-gauges  { grid-column: span 6; }
.dx-c-table   { grid-column: span 12; overflow: hidden; }

/* Stat tiles strip */
.dx-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 12px; }
.dx-tile { position: relative; padding: 15px 16px 13px; overflow: hidden; min-height: 86px; }
.dx-tile-l { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 7px; }
.dx-tile-ic { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; }
.dx-tile-v { font-family: var(--font-display); font-weight: var(--display-weight); font-size: 24px; margin-top: 9px; line-height: 1; letter-spacing: -0.5px; }
.dx-tile-spark { position: absolute; right: 10px; bottom: 9px; width: 58px; height: 24px; opacity: 0.85; pointer-events: none; }

/* Heatmap */
.dx-heat { display: grid; gap: 4px; }
.dx-heat-row { display: grid; grid-template-columns: 38px repeat(7, 1fr); gap: 4px; align-items: center; }
.dx-heat-lbl { font-size: 10.5px; color: var(--muted); font-weight: 600; }
.dx-heat-cell { aspect-ratio: 1; border-radius: 5px; min-height: 16px; transition: transform 0.15s var(--ease); }
.dx-heat-cell:hover { transform: scale(1.12); }
.dx-heat-cols { display: grid; grid-template-columns: 38px repeat(7, 1fr); gap: 4px; margin-top: 6px; }
.dx-heat-col { font-size: 9.5px; color: var(--faint); text-align: center; font-weight: 600; }

/* Live feed */
.dx-feed-item { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid var(--bz-border); }
.dx-feed-item:last-child { border-bottom: 0; }
.dx-feed-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dx-feed-id { font-weight: 700; font-size: 13px; font-variant-numeric: tabular-nums; }
.dx-feed-id .hash { color: var(--muted); }
.dx-feed-name { flex: 1; min-width: 0; font-size: 13px; color: var(--bz-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-feed-amt { font-weight: 800; font-size: 13.5px; }
.dx-feed-time { font-size: 11px; color: var(--muted); white-space: nowrap; }
.dx-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--good); position: relative; }
.dx-live-dot::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--good); animation: dxLive 1.8s var(--ease) infinite; }
@keyframes dxLive { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(3.4); opacity: 0; } }

/* Targets */
.dx-target { margin-bottom: 14px; }
.dx-target:last-child { margin-bottom: 0; }
.dx-target-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.dx-target-head b { font-variant-numeric: tabular-nums; font-weight: 800; }
.dx-mbar { height: 8px; border-radius: 99px; background: var(--surface-3); overflow: hidden; }
.dx-mbar > i { display: block; height: 100%; border-radius: 99px; transition: width 0.8s var(--ease-out); }

/* Gauges */
.dx-gauges { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center; }
.dx-gauge-metrics { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
.dx-gmetric { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; background: var(--surface-2); border-radius: 10px; }
.dx-gmetric > span:first-child { font-size: 12.5px; color: var(--muted); }

.dx-wh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.dx-wt { font-weight: 800; font-size: 15px; letter-spacing: -0.2px; }
.dx-ws { font-size: 12px; color: var(--bz-text-3); margin-top: 2px; }

/* Profit quality */
.dx-q-rows { margin-top: 8px; }
.dx-q-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed var(--bz-border); }
.dx-q-row:last-child { border-bottom: 0; }
.dx-q-row--strong { font-weight: 800; }
.dx-q-k { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--bz-text-2); }
.dx-q-v { font-weight: 800; font-size: 14px; }
.dx-dot { width: 9px; height: 9px; border-radius: 50%; }

/* Top products */
.dx-prow { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.dx-rank { width: 20px; text-align: center; font-weight: 800; font-size: 12px; color: var(--bz-text-3); }
.dx-pmid { flex: 1; min-width: 0; }
.dx-pname { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-pbar { height: 6px; border-radius: 4px; background: var(--bz-surface-3); margin-top: 5px; overflow: hidden; }
.dx-pbar > span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--bz-primary-strong), var(--bz-primary)); }
.dx-pmeta { text-align: right; flex-shrink: 0; }
.dx-pprofit { display: block; font-weight: 800; font-size: 13.5px; color: var(--bz-primary-strong); }
.v-theme--dark .dx-pprofit { color: var(--bz-primary); }
.dx-pmargin { font-size: 10.5px; color: var(--bz-text-3); font-weight: 600; }

/* Category */
.dx-crow { display: grid; grid-template-columns: 1fr 90px auto 42px; align-items: center; gap: 10px; padding: 7px 0; }
.dx-cname { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-cbar { height: 7px; border-radius: 4px; background: var(--bz-surface-3); overflow: hidden; }
.dx-cbar > span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #6366F1, #818CF8); }
.dx-cval { font-weight: 800; font-size: 13px; text-align: right; }
.dx-cmargin { font-size: 11px; color: var(--bz-text-3); text-align: right; font-weight: 700; }

/* Staff */
.dx-srow { display: flex; align-items: center; gap: 11px; padding: 7px 0; border-bottom: 1px solid var(--bz-border); }
.dx-srow:last-child { border-bottom: 0; }
.dx-savatar { font-size: 12px; font-weight: 800; }
.dx-smid { flex: 1; min-width: 0; }
.dx-sname { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-ssub { font-size: 11px; color: var(--bz-text-3); margin-top: 1px; }
.dx-smeta { text-align: right; }
.dx-srev { display: block; font-size: 11px; color: var(--bz-text-3); font-weight: 600; }
.dx-sprofit { font-weight: 800; font-size: 13.5px; color: var(--bz-primary-strong); }
.v-theme--dark .dx-sprofit { color: var(--bz-primary); }

/* Table */
.dx-tbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 16px 18px; border-bottom: 1px solid var(--bz-border); }
.dx-search { max-width: 230px; min-width: 160px; }
.dx-flt { max-width: 150px; min-width: 120px; }
.dx-switch { flex: 0 0 auto; }
.dx-table :deep(th) { font-weight: 700 !important; font-size: 12px !important; color: var(--bz-text-3) !important; white-space: nowrap; }
.dx-onum { font-weight: 800; font-size: 13px; color: var(--bz-primary-strong); font-family: ui-monospace, monospace; text-decoration: none; }
.v-theme--dark .dx-onum { color: var(--bz-primary); }
.dx-cust-n { font-weight: 700; font-size: 13px; }
.dx-cust-p { font-size: 11px; color: var(--bz-text-3); }
.dx-date { font-size: 12px; color: var(--bz-text-2); white-space: nowrap; }
.dx-pay-cell { display: block; font-size: 11px; color: var(--bz-text-3); font-weight: 600; margin-bottom: 2px; }
.dx-money { font-weight: 700; font-size: 13px; white-space: nowrap; }
.dx-muted { color: var(--bz-text-3); }
.dx-pos { color: var(--bz-primary-strong); }
.v-theme--dark .dx-pos { color: var(--bz-primary); }
.dx-neg { color: var(--bz-danger); }
.dx-marginchip { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: var(--bz-radius-pill); }
.dx-staff { font-size: 12.5px; color: var(--bz-text-2); }

@media (max-width: 1240px) {
  .dx-c-trend, .dx-c-quality, .dx-c-top, .dx-c-cat,
  .dx-c-pay, .dx-c-status, .dx-c-staff,
  .dx-c-weekday, .dx-c-hour, .dx-c-heat, .dx-c-feed,
  .dx-c-targets, .dx-c-gauges { grid-column: span 12; }
}
@media (max-width: 760px) {
  .dx-kpis { grid-template-columns: 1fr 1fr; }
  .dx-search, .dx-flt { max-width: none; flex: 1 1 140px; }
}
</style>
