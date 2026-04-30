<template>
  <div>
    <BzPageHeader title="Mijoz" back="/customers">
      <template #actions>
        <v-btn v-if="customer && customer.is_active" color="warning" variant="tonal" rounded="lg" :loading="toggling" @click="toggleActive">
          <v-icon start>mdi-account-cancel-outline</v-icon> Bloklash
        </v-btn>
        <v-btn v-if="customer && !customer.is_active" color="success" variant="tonal" rounded="lg" :loading="toggling" @click="toggleActive">
          <v-icon start>mdi-account-check-outline</v-icon> Faollashtirish
        </v-btn>
      </template>
    </BzPageHeader>

    <BzPageLoader v-if="loading" />

    <v-row v-else-if="customer">
      <!-- Profile -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="bz-card pa-6 text-center mb-4">
          <v-avatar size="78" color="primary" variant="tonal" class="mb-3">
            <span style="font-size:28px;font-weight:800">{{ fmt.initials(customer.first_name, customer.last_name) }}</span>
          </v-avatar>
          <div style="font-weight:800;font-size:18px">{{ fmt.fullName(customer) }}</div>
          <div style="font-size:13px;color:var(--bz-text-3);margin-top:2px">
            <v-icon v-if="customer.telegram_id" size="14" color="info">mdi-telegram</v-icon>
            ID: {{ customer.id }}
          </div>
          <v-chip :color="customer.is_active ? 'success' : 'error'" variant="tonal" class="mt-3 chip-sm">
            {{ customer.is_active ? 'Faol' : 'Bloklangan' }}
          </v-chip>
          <v-divider class="my-4" />
          <div class="d-flex flex-column ga-3" style="text-align:left">
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-phone-outline</v-icon>
              <span>{{ customer.phone || '—' }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-translate</v-icon>
              <span>{{ customer.language || '—' }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-calendar-outline</v-icon>
              <span>{{ fmt.date(customer.created_at) }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-clock-outline</v-icon>
              <span>{{ fmt.relativeTime(customer.last_seen_at) }}</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Tabs -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="bz-card">
          <v-tabs v-model="tab" color="primary" density="comfortable">
            <v-tab value="orders"><v-icon start size="16">mdi-package-variant-closed</v-icon> Buyurtmalar
              <v-chip v-if="customer.orders?.length" size="x-small" class="ml-2 chip-sm" color="primary" variant="tonal">{{ customer.orders.length }}</v-chip>
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
          <v-divider />

          <div class="pa-2">
            <!-- Orders -->
            <div v-if="tab === 'orders'">
              <BzEmptyState v-if="!customer.orders?.length" icon="mdi-package-variant-closed" title="Buyurtmalar yo'q" />
              <v-list v-else class="pa-0">
                <v-list-item v-for="o in customer.orders" :key="o.id" :to="`/orders/${o.id}`" rounded="lg" class="mb-1">
                  <template #prepend>
                    <v-avatar size="36" color="primary" variant="tonal" class="mr-3"><v-icon size="16">mdi-package-variant-closed</v-icon></v-avatar>
                  </template>
                  <template #title>
                    <span style="font-weight:700;font-size:13px">#{{ o.order_number }}</span>
                    <BzStatusChip :status="o.status" class="ml-2" />
                  </template>
                  <template #subtitle><span style="font-size:11.5px;color:var(--bz-text-3)">{{ fmt.datetime(o.created_at) }}</span></template>
                  <template #append><span class="num font-weight-bold" style="font-size:13px">{{ fmt.price(o.total) }}</span></template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Addresses -->
            <div v-if="tab === 'addresses'">
              <BzEmptyState v-if="!addresses.length" icon="mdi-map-marker-off-outline" title="Manzillar yo'q" />
              <v-list v-else class="pa-0">
                <v-list-item v-for="a in addresses" :key="a.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                  <template #prepend>
                    <v-avatar size="36" color="info" variant="tonal" class="mr-3"><v-icon size="16">mdi-map-marker-outline</v-icon></v-avatar>
                  </template>
                  <template #title>{{ a.label || 'Manzil' }} <v-chip v-if="a.is_default" size="x-small" color="success" variant="tonal" class="ml-2 chip-sm">Asosiy</v-chip></template>
                  <template #subtitle><span style="font-size:12px;color:var(--bz-text-3)">{{ a.address_text || a.full_address }}</span></template>
                </v-list-item>
              </v-list>
              <div v-if="hasGeoAddress" class="pa-3" style="height:280px">
                <ZoneMap :marker="firstGeoMarker" readonly :zoom="13" />
              </div>
            </div>

            <!-- Favorites -->
            <div v-if="tab === 'favorites'">
              <BzEmptyState v-if="!customer.favorites?.length" icon="mdi-heart-off-outline" title="Sevimlilar yo'q" />
              <v-list v-else class="pa-0">
                <v-list-item v-for="f in customer.favorites" :key="f.id" rounded="lg" class="mb-1">
                  <template #prepend><v-avatar size="36" color="warning" variant="tonal" class="mr-3"><v-icon size="16">mdi-heart</v-icon></v-avatar></template>
                  <template #title>{{ f.product_name }}</template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Reviews -->
            <div v-if="tab === 'reviews'">
              <BzEmptyState v-if="!customer.reviews?.length" icon="mdi-comment-off-outline" title="Sharhlar yo'q" />
              <v-list v-else class="pa-0">
                <v-list-item v-for="r in customer.reviews" :key="r.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                  <template #title>
                    <div class="d-flex align-center ga-2">
                      <span style="font-weight:700">#{{ r.order_number }}</span>
                      <span style="color:var(--bz-warn)">
                        <v-icon v-for="n in 5" :key="n" size="14" :color="n <= r.rating ? 'warning' : 'grey-lighten-2'">mdi-star</v-icon>
                      </span>
                    </div>
                  </template>
                  <template #subtitle><span style="font-size:13px;color:var(--bz-text-2)">{{ r.comment }}</span></template>
                </v-list-item>
              </v-list>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <BzEmptyState v-else icon="mdi-account-off-outline" title="Mijoz topilmadi" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customersApi, addressesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
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
const loading   = ref(true)
const toggling  = ref(false)
const tab       = ref('orders')

const hasGeoAddress = computed(() => addresses.value.some(a => a.latitude && a.longitude))
const firstGeoMarker = computed(() => {
  const a = addresses.value.find(a => a.latitude && a.longitude)
  if (!a) return null
  return { lat: Number(a.latitude), lng: Number(a.longitude), label: a.address_text }
})

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
  if (cRes.status === 'fulfilled')  customer.value  = cRes.value.data.data
  if (aRes.status === 'fulfilled')  addresses.value = aRes.value.data.data || []
  loading.value = false
})
</script>
