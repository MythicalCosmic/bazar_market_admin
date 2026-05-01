<template>
  <div>
    <BzPageHeader :title="customer ? fmt.fullName(customer) : 'Mijoz'" back="/customers">
      <template #actions>
        <template v-if="customer">
          <v-chip :color="customer.is_active ? 'success' : 'error'" variant="tonal" class="chip-sm">
            {{ customer.is_active ? 'Faol' : 'Bloklangan' }}
          </v-chip>
          <v-btn v-if="customer.is_active" color="warning" variant="tonal" rounded="lg" size="small" :loading="toggling" @click="toggleActive">
            <v-icon start size="16">mdi-account-cancel-outline</v-icon> Bloklash
          </v-btn>
          <v-btn v-else color="success" variant="tonal" rounded="lg" size="small" :loading="toggling" @click="toggleActive">
            <v-icon start size="16">mdi-account-check-outline</v-icon> Faollashtirish
          </v-btn>
        </template>
      </template>
    </BzPageHeader>

    <BzPageLoader v-if="loading" />

    <template v-else-if="customer">
      <v-row>
        <!-- ── LEFT: Profile hero card ──────────────────── -->
        <v-col cols="12" md="4">
          <v-card rounded="xl" class="bz-card bz-profile-hero mb-4" style="overflow:hidden">
            <!-- Gradient header -->
            <div class="bz-profile-header">
              <div class="bz-profile-pattern" />
              <v-avatar size="90" :color="customer.is_active ? 'white' : 'grey-lighten-2'" class="bz-profile-avatar">
                <span :style="`font-size:34px;font-weight:800;color:${customer.is_active ? 'var(--bz-primary)' : '#94A3B8'}`">
                  {{ fmt.initials(customer.first_name, customer.last_name) }}
                </span>
              </v-avatar>
            </div>

            <div class="px-5 pb-5 text-center" style="margin-top:-20px;position:relative;z-index:2">
              <div style="font-weight:800;font-size:20px;margin-top:28px">{{ fmt.fullName(customer) }}</div>
              <div style="font-size:13px;color:var(--bz-text-3);margin-top:2px">ID: {{ customer.id }}</div>

              <!-- Quick stats row -->
              <div class="d-flex justify-center ga-4 mt-4 mb-3">
                <div class="text-center">
                  <div class="num" style="font-weight:800;font-size:22px">{{ analytics.totalOrders }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">Buyurtma</div>
                </div>
                <v-divider vertical />
                <div class="text-center">
                  <div class="num" style="font-weight:800;font-size:22px;color:var(--bz-primary)">{{ fmt.compact(analytics.totalSpent) }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">Sarflagan</div>
                </div>
                <v-divider vertical />
                <div class="text-center">
                  <div style="font-weight:800;font-size:22px">{{ customer.favorites?.length || 0 }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">Sevimli</div>
                </div>
              </div>

              <v-divider class="mb-4" />

              <!-- Contact info -->
              <div class="d-flex flex-column ga-3" style="text-align:left">
                <div class="bz-info-row">
                  <v-icon size="16" color="grey">mdi-phone-outline</v-icon>
                  <span style="flex:1">{{ customer.phone || '—' }}</span>
                  <v-chip v-if="customer.phone" size="x-small" variant="tonal" class="chip-sm">Telefon</v-chip>
                </div>
                <div v-if="customer.telegram_id" class="bz-info-row">
                  <v-icon size="16" color="info">mdi-telegram</v-icon>
                  <span style="flex:1;font-family:monospace;font-size:12px">{{ customer.telegram_id }}</span>
                  <v-chip size="x-small" color="info" variant="tonal" class="chip-sm">Telegram</v-chip>
                </div>
                <div class="bz-info-row">
                  <v-icon size="16" color="grey">mdi-translate</v-icon>
                  <span style="flex:1">{{ customer.language === 'ru' ? 'Ruscha' : "O'zbekcha" }}</span>
                </div>
                <div class="bz-info-row">
                  <v-icon size="16" color="grey">mdi-calendar-plus-outline</v-icon>
                  <span style="flex:1">{{ fmt.date(customer.created_at) }}</span>
                  <span style="font-size:11px;color:var(--bz-text-3)">Ro'yxatdan</span>
                </div>
                <div class="bz-info-row">
                  <v-icon size="16" color="grey">mdi-clock-outline</v-icon>
                  <span style="flex:1;font-weight:600">{{ fmt.relativeTime(customer.last_seen_at) }}</span>
                  <span style="font-size:11px;color:var(--bz-text-3)">Oxirgi</span>
                </div>
              </div>
            </div>
          </v-card>

          <!-- Insights cards (only show if there ARE orders) -->
          <template v-if="analytics.totalOrders > 0">
            <!-- Frequency + avg -->
            <v-card rounded="xl" class="bz-card pa-5 mb-4">
              <div class="d-flex ga-4">
                <div class="bz-mini-stat">
                  <v-icon size="20" color="info" class="mb-1">mdi-calendar-clock</v-icon>
                  <div style="font-weight:800;font-size:18px">{{ analytics.frequencyLabel }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">{{ analytics.frequencySub }}</div>
                </div>
                <v-divider vertical />
                <div class="bz-mini-stat">
                  <v-icon size="20" color="warning" class="mb-1">mdi-cash</v-icon>
                  <div class="num" style="font-weight:800;font-size:18px">{{ fmt.compact(analytics.avgOrder) }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">O'rtacha buyurtma</div>
                </div>
                <v-divider vertical />
                <div class="bz-mini-stat">
                  <v-icon size="20" :color="analytics.usesDiscounts ? 'success' : 'grey'" class="mb-1">
                    {{ analytics.usesDiscounts ? 'mdi-tag-check' : 'mdi-tag-off-outline' }}
                  </v-icon>
                  <div style="font-weight:800;font-size:18px">{{ analytics.usesDiscounts ? 'Ha' : "Yo'q" }}</div>
                  <div style="font-size:10.5px;color:var(--bz-text-3);font-weight:600">Chegirma</div>
                </div>
              </div>
            </v-card>

            <!-- Top products -->
            <v-card v-if="analytics.topProducts.length" rounded="xl" class="bz-card pa-5 mb-4">
              <div class="d-flex align-center ga-2 mb-3">
                <v-icon size="18" color="warning">mdi-trophy-outline</v-icon>
                <div style="font-weight:800;font-size:14px">Eng ko'p buyurtma</div>
              </div>
              <div class="d-flex flex-column ga-2">
                <div v-for="(p, i) in analytics.topProducts" :key="p.name" class="d-flex align-center ga-3 pa-2 bz-top-item">
                  <div class="bz-rank" :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }">{{ i + 1 }}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.name }}</div>
                    <div style="font-size:11px;color:var(--bz-text-3)">{{ p.count }} marta</div>
                  </div>
                  <span class="num" style="font-weight:800;font-size:12px;color:var(--bz-text-2)">{{ p.count }}×</span>
                </div>
              </div>
            </v-card>

            <!-- Status + payment breakdown -->
            <v-row dense>
              <v-col cols="12" :sm="analytics.paymentMethods.length ? 6 : 12">
                <v-card rounded="xl" class="bz-card pa-5 mb-4">
                  <div style="font-weight:800;font-size:14px;margin-bottom:12px">Buyurtma holatlari</div>
                  <div class="d-flex flex-column ga-2">
                    <div v-for="s in analytics.statusBreakdown" :key="s.status" class="d-flex align-center ga-2">
                      <BzStatusChip :status="s.status" :icon="true" />
                      <v-spacer />
                      <span class="num" style="font-weight:800;font-size:13px">{{ s.count }}</span>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col v-if="analytics.paymentMethods.length" cols="12" sm="6">
                <v-card rounded="xl" class="bz-card pa-5 mb-4">
                  <div style="font-weight:800;font-size:14px;margin-bottom:12px">To'lov usullari</div>
                  <div class="d-flex flex-column ga-2">
                    <div v-for="pm in analytics.paymentMethods" :key="pm.method" class="d-flex align-center ga-2">
                      <v-icon size="16" :color="pm.method === 'cash' ? 'success' : 'info'">
                        {{ pm.method === 'cash' ? 'mdi-cash' : 'mdi-credit-card' }}
                      </v-icon>
                      <span style="font-weight:600;font-size:13px;text-transform:capitalize;flex:1">{{ pm.method }}</span>
                      <span class="num" style="font-weight:800;font-size:13px">{{ pm.pct }}%</span>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <!-- No orders placeholder -->
          <v-card v-else rounded="xl" class="bz-card pa-5 mb-4">
            <div class="d-flex flex-column align-center py-4" style="color:var(--bz-text-3)">
              <div style="width:56px;height:56px;border-radius:16px;background:var(--bz-surface-3);display:flex;align-items:center;justify-content:center;margin-bottom:12px">
                <v-icon size="28" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
              </div>
              <div style="font-weight:700;font-size:14px;color:var(--bz-text-2)">Buyurtmalar yo'q</div>
              <div style="font-size:12.5px;margin-top:4px;text-align:center">Bu mijoz hali hech qanday buyurtma bermagan</div>
            </div>
          </v-card>
        </v-col>

        <!-- ── RIGHT: Tabs ─────────────────────────────── -->
        <v-col cols="12" md="8">
          <v-card rounded="xl" class="bz-card" style="overflow:hidden">
            <v-tabs v-model="tab" color="primary" density="comfortable" style="border-bottom:1px solid var(--bz-border)">
              <v-tab value="orders"><v-icon start size="16">mdi-package-variant-closed</v-icon> Buyurtmalar
                <v-chip v-if="analytics.totalOrders" size="x-small" class="ml-2 chip-sm" color="primary" variant="tonal">{{ analytics.totalOrders }}</v-chip>
              </v-tab>
              <v-tab value="addresses"><v-icon start size="16">mdi-map-marker-outline</v-icon> Manzillar
                <v-chip v-if="addresses.length" size="x-small" class="ml-2 chip-sm" color="primary" variant="tonal">{{ addresses.length }}</v-chip>
              </v-tab>
              <v-tab value="favorites"><v-icon start size="16">mdi-heart-outline</v-icon> Sevimli
                <v-chip v-if="customer.favorites?.length" size="x-small" class="ml-2 chip-sm" color="warning" variant="tonal">{{ customer.favorites.length }}</v-chip>
              </v-tab>
              <v-tab value="reviews"><v-icon start size="16">mdi-comment-quote-outline</v-icon> Sharhlar
                <v-chip v-if="customer.reviews?.length" size="x-small" class="ml-2 chip-sm" color="info" variant="tonal">{{ customer.reviews.length }}</v-chip>
              </v-tab>
            </v-tabs>

            <div class="pa-4">
              <!-- ── Orders ── -->
              <div v-if="tab === 'orders'">
                <BzEmptyState v-if="!orders.length" icon="mdi-package-variant-closed" title="Buyurtmalar yo'q" subtitle="Hali hech qanday buyurtma bermagan" />
                <div v-else class="d-flex flex-column ga-2">
                  <v-card
                    v-for="o in orders" :key="o.id"
                    rounded="lg" variant="outlined"
                    class="bz-order-row pa-4 cursor-pointer"
                    @click="$router.push(`/orders/${o.id}`)"
                  >
                    <div class="d-flex align-center ga-3" style="flex-wrap:wrap">
                      <v-avatar size="40" :color="ORDER_STATUS[o.status]?.color || 'grey'" variant="tonal">
                        <v-icon size="18">{{ ORDER_STATUS[o.status]?.icon || 'mdi-package-variant' }}</v-icon>
                      </v-avatar>
                      <div style="flex:1;min-width:140px">
                        <div class="d-flex align-center ga-2 flex-wrap">
                          <span style="font-weight:800;font-size:13.5px;font-family:ui-monospace,monospace">#{{ o.order_number }}</span>
                          <BzStatusChip :status="o.status" />
                          <BzStatusChip :status="o.payment_status" type="payment" />
                        </div>
                        <div style="font-size:11.5px;color:var(--bz-text-3);margin-top:3px">
                          {{ fmt.datetime(o.created_at) }}
                          <span v-if="o.payment_method"> · {{ o.payment_method }}</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="num" style="font-weight:800;font-size:15px">{{ fmt.price(o.total) }}</div>
                        <div v-if="Number(o.discount || 0) > 0" style="font-size:11px;color:var(--bz-danger);font-weight:600">
                          <v-icon size="11">mdi-tag-outline</v-icon> -{{ fmt.price(o.discount) }}
                        </div>
                      </div>
                      <v-icon size="18" color="grey">mdi-chevron-right</v-icon>
                    </div>
                  </v-card>
                </div>
              </div>

              <!-- ── Addresses ── -->
              <div v-if="tab === 'addresses'">
                <BzEmptyState v-if="!addresses.length" icon="mdi-map-marker-off-outline" title="Manzillar yo'q" />
                <v-row v-else dense>
                  <v-col v-for="a in addresses" :key="a.id" cols="12" sm="6">
                    <v-card rounded="lg" variant="outlined" class="pa-4" style="height:100%">
                      <div class="d-flex align-center ga-2 mb-2">
                        <v-icon size="18" color="info">mdi-map-marker</v-icon>
                        <span style="font-weight:700;font-size:14px">{{ a.label || 'Manzil' }}</span>
                        <v-chip v-if="a.is_default" size="x-small" color="success" variant="tonal" class="chip-sm">Asosiy</v-chip>
                      </div>
                      <div style="font-size:13px;color:var(--bz-text-2);line-height:1.5">{{ a.address_text || a.full_address || '—' }}</div>
                    </v-card>
                  </v-col>
                </v-row>
                <div v-if="hasGeoAddress" class="mt-3" style="height:300px;border-radius:16px;overflow:hidden">
                  <ZoneMap :marker="firstGeoMarker" readonly :zoom="13" />
                </div>
              </div>

              <!-- ── Favorites ── -->
              <div v-if="tab === 'favorites'">
                <BzEmptyState v-if="!customer.favorites?.length" icon="mdi-heart-off-outline" title="Sevimlilar yo'q" subtitle="Hali hech qanday mahsulotni sevimliga qo'shmagan" />
                <v-row v-else dense>
                  <v-col v-for="fav in customer.favorites" :key="fav.id" cols="12" sm="6" md="4">
                    <v-card rounded="lg" variant="outlined" class="pa-3 d-flex align-center ga-3">
                      <v-avatar size="38" color="warning" variant="tonal">
                        <v-icon size="16">mdi-heart</v-icon>
                      </v-avatar>
                      <div style="flex:1;min-width:0">
                        <div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ fav.product_name }}</div>
                        <div v-if="fav.product_id" style="font-size:11px;color:var(--bz-text-3)">ID: {{ fav.product_id }}</div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- ── Reviews ── -->
              <div v-if="tab === 'reviews'">
                <BzEmptyState v-if="!customer.reviews?.length" icon="mdi-comment-off-outline" title="Sharhlar yo'q" subtitle="Hali hech qanday sharh qoldirmagan" />
                <div v-else class="d-flex flex-column ga-2">
                  <v-card v-for="r in customer.reviews" :key="r.id" rounded="lg" variant="outlined" class="pa-4">
                    <div class="d-flex align-center ga-2 mb-2 flex-wrap">
                      <router-link v-if="r.order_id" :to="`/orders/${r.order_id}`" style="font-weight:800;font-size:13px;color:var(--bz-primary);text-decoration:none;font-family:monospace">
                        #{{ r.order_number }}
                      </router-link>
                      <div class="d-flex">
                        <v-icon v-for="n in 5" :key="n" size="15" :color="n <= r.rating ? 'warning' : 'grey-lighten-2'">mdi-star</v-icon>
                      </div>
                      <span style="font-size:11px;color:var(--bz-text-3)">{{ fmt.relativeTime(r.created_at) }}</span>
                    </div>
                    <div v-if="r.comment" style="font-size:13.5px;color:var(--bz-text-2);line-height:1.55">{{ r.comment }}</div>
                  </v-card>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <BzEmptyState v-else icon="mdi-account-off-outline" title="Mijoz topilmadi" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customersApi, addressesApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import ZoneMap      from '@/components/zones/ZoneMap.vue'

const route = useRoute()
const fmt   = useFormat()
const snack = useSnackStore()

const customer  = ref(null)
const addresses = ref([])
const orders    = ref([])
const loading   = ref(true)
const toggling  = ref(false)
const tab       = ref('orders')

const analytics = reactive({
  totalOrders: 0,
  totalSpent: 0,
  avgOrder: 0,
  frequencyLabel: '—',
  frequencySub: '',
  discountOrders: 0,
  usesDiscounts: false,
  topProducts: [],
  itemsUnavailable: false,
  statusBreakdown: [],
  paymentMethods: [],
})

const hasGeoAddress = computed(() => addresses.value.some(a => a.latitude && a.longitude))
const firstGeoMarker = computed(() => {
  const a = addresses.value.find(a => a.latitude && a.longitude)
  if (!a) return null
  return { lat: Number(a.latitude), lng: Number(a.longitude), label: a.address_text }
})

function computeAnalytics() {
  const o = orders.value
  if (!o.length) return

  analytics.totalOrders = o.length
  analytics.totalSpent  = o.reduce((s, x) => s + Number(x.total || 0), 0)
  analytics.avgOrder    = Math.round(analytics.totalSpent / o.length)

  // Frequency
  if (o.length >= 2) {
    const sorted = [...o].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const first = new Date(sorted[0].created_at).getTime()
    const last  = new Date(sorted.at(-1).created_at).getTime()
    const daySpan = (last - first) / (1000 * 60 * 60 * 24)
    const freq = daySpan > 0 ? Math.round(daySpan / (o.length - 1)) : 0
    if (freq <= 0) { analytics.frequencyLabel = 'Har kuni'; analytics.frequencySub = 'Juda faol' }
    else if (freq <= 3) { analytics.frequencyLabel = `${freq} kun`; analytics.frequencySub = 'Yuqori' }
    else if (freq <= 14) { analytics.frequencyLabel = `${freq} kun`; analytics.frequencySub = "O'rtacha" }
    else { analytics.frequencyLabel = `${freq} kun`; analytics.frequencySub = 'Past' }
  } else {
    analytics.frequencyLabel = '1 marta'
    analytics.frequencySub = 'Bitta buyurtma'
  }

  // Discounts
  analytics.discountOrders = o.filter(x => Number(x.discount || x.discount_amount || 0) > 0 || x.coupon_code || x.coupon).length
  analytics.usesDiscounts = analytics.discountOrders > 0

  // Top products
  const productMap = {}
  let hasItems = false
  o.forEach(order => {
    const items = order.items || []
    if (items.length) hasItems = true
    items.forEach(item => {
      const name = item.product_name || item.name_uz || item.name || "Noma'lum"
      if (!productMap[name]) productMap[name] = { name, count: 0, totalPrice: 0 }
      productMap[name].count += Number(item.quantity || 1)
      productMap[name].totalPrice += Number(item.total || item.unit_price || item.price || 0)
    })
  })
  if (hasItems) {
    analytics.topProducts = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ ...p, avgPrice: p.count > 0 ? Math.round(p.totalPrice / p.count) : 0 }))
  }

  // Status breakdown
  const statusMap = {}
  o.forEach(x => { statusMap[x.status] = (statusMap[x.status] || 0) + 1 })
  analytics.statusBreakdown = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count, color: ORDER_STATUS[status]?.color || 'grey' }))
    .sort((a, b) => b.count - a.count)

  // Payment methods
  const pmMap = {}
  o.forEach(x => { if (x.payment_method) pmMap[x.payment_method] = (pmMap[x.payment_method] || 0) + 1 })
  analytics.paymentMethods = Object.entries(pmMap)
    .map(([method, count]) => ({ method, count, pct: Math.round(count / o.length * 100) }))
    .sort((a, b) => b.count - a.count)
}

async function toggleActive() {
  toggling.value = true
  try {
    if (customer.value.is_active) await customersApi.deactivate(customer.value.id)
    else                          await customersApi.activate(customer.value.id)
    customer.value.is_active = !customer.value.is_active
    snack.success(customer.value.is_active ? 'Faollashtirildi' : 'Bloklandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { toggling.value = false }
}

onMounted(async () => {
  const id = route.params.id
  const [cRes, aRes] = await Promise.allSettled([
    customersApi.get(id),
    addressesApi.byUser(id),
  ])
  if (cRes.status === 'fulfilled') {
    customer.value = cRes.value.data.data
    orders.value   = customer.value?.orders || []
  }
  if (aRes.status === 'fulfilled') {
    addresses.value = aRes.value.data.data || []
  }
  if (!addresses.value.length && customer.value?.addresses?.length) {
    addresses.value = customer.value.addresses
  }
  computeAnalytics()
  loading.value = false
})
</script>

<style scoped>
.bz-profile-header {
  position: relative;
  height: 100px;
  background: linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #3B82F6 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bz-profile-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                    radial-gradient(circle at 80% 30%, white 1px, transparent 1px),
                    radial-gradient(circle at 50% 80%, white 1.5px, transparent 1.5px);
  background-size: 40px 40px, 60px 60px, 50px 50px;
}
.bz-profile-avatar {
  position: relative;
  bottom: -24px;
  border: 4px solid var(--bz-surface-1);
  box-shadow: var(--bz-shadow-md);
  z-index: 2;
}

.bz-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--bz-text-2);
  padding: 6px 0;
}

.bz-mini-stat {
  flex: 1;
  text-align: center;
}

.bz-top-item {
  border-radius: 10px;
  background: var(--bz-surface-2);
  transition: background var(--bz-dur-fast) var(--bz-ease);
}
.bz-top-item:hover { background: var(--bz-surface-3); }

.bz-rank {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
  background: var(--bz-surface-3);
  color: var(--bz-text-3);
}
.bz-rank.gold   { background: rgba(245,158,11,0.15); color: #F59E0B; }
.bz-rank.silver { background: rgba(148,163,184,0.15); color: #64748B; }
.bz-rank.bronze { background: rgba(217,119,6,0.12); color: #D97706; }

.bz-order-row {
  transition: border-color var(--bz-dur-fast) var(--bz-ease), background var(--bz-dur-fast) var(--bz-ease);
}
.bz-order-row:hover {
  border-color: var(--bz-primary) !important;
  background: var(--bz-primary-soft);
}
</style>
