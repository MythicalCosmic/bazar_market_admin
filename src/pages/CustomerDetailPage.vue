<template>
  <div>
    <div class="d-flex align-center mb-5 ga-2">
      <v-btn icon variant="text" size="small" to="/customers">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="page-title">Mijoz tafsilotlari</div>
    </div>

    <PageLoader v-if="loading" />

    <v-row v-else-if="customer">
      <!-- Profile card -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-6 text-center mb-4">
          <v-avatar size="72" color="primary" variant="tonal" class="mb-4">
            <span style="font-size:26px;font-weight:800">{{ fmt.initials(customer.first_name, customer.last_name) }}</span>
          </v-avatar>
          <div style="font-weight:700;font-size:18px">
            {{ [customer.first_name, customer.last_name].filter(Boolean).join(' ') || '—' }}
          </div>
          <div style="font-size:13px;color:#94A3B8;margin-top:2px">@{{ customer.username }}</div>

          <v-chip
            :color="customer.is_active ? 'success' : 'error'"
            variant="tonal" class="mt-3 chip-sm"
          >{{ customer.is_active ? 'Faol' : 'Bloklangan' }}</v-chip>

          <v-divider class="my-4" />

          <div class="d-flex flex-column" style="gap:10px;text-align:left">
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-phone-outline</v-icon>
              <span style="color:#374151">{{ customer.phone || '—' }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-calendar-outline</v-icon>
              <span style="color:#374151">{{ fmt.date(customer.created_at) }}</span>
            </div>
          </div>

          <div class="d-flex ga-2 mt-5">
            <v-btn
              v-if="customer.is_active"
              color="warning" variant="tonal" size="small" block
              :loading="toggling"
              @click="toggleActive"
            >Bloklash</v-btn>
            <v-btn
              v-else
              color="success" variant="tonal" size="small" block
              :loading="toggling"
              @click="toggleActive"
            >Faollashtirish</v-btn>
          </div>
        </v-card>

        <!-- Addresses -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5">
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">Manzillar</div>
          <div v-if="!addresses.length" style="font-size:13px;color:#94A3B8">Manzillar yo'q</div>
          <div v-else class="d-flex flex-column" style="gap:8px">
            <div
              v-for="a in addresses"
              :key="a.id"
              class="pa-3 rounded-lg"
              style="background:#F8FAFC;border:1px solid #E2E8F0"
            >
              <div style="font-weight:600;font-size:13px">{{ a.name || a.title || 'Manzil' }}</div>
              <div style="font-size:12px;color:#64748B;margin-top:2px">{{ a.address || a.full_address }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Orders -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
          <div class="pa-5 pb-3" style="font-weight:700;font-size:15px">Buyurtmalar tarixi</div>
          <v-divider />
          <PageLoader v-if="ordersLoading" :size="32" />
          <v-list v-else class="pa-2">
            <v-list-item
              v-for="o in orders"
              :key="o.id"
              :to="`/orders/${o.id}`"
              rounded="lg"
              class="mb-1"
            >
              <template #prepend>
                <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                  <v-icon size="16">mdi-package-variant-closed</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span style="font-weight:700;font-size:13px">#{{ o.order_number }}</span>
                <StatusChip :status="o.status" class="ml-2" />
              </template>
              <template #subtitle>
                <span style="font-size:12px;color:#64748B">{{ fmt.datetime(o.created_at) }}</span>
              </template>
              <template #append>
                <span class="num font-weight-bold" style="font-size:13px">
                  {{ fmt.price(o.total_price || o.total) }}
                </span>
              </template>
            </v-list-item>
            <EmptyState v-if="!orders.length" icon="mdi-package-variant-closed" title="Buyurtmalar yo'q" />
          </v-list>
          <v-divider v-if="orderTotal > orders.length" />
          <div v-if="orderTotal > orders.length" class="text-center pa-3">
            <v-btn variant="tonal" size="small" @click="loadMoreOrders">
              Ko'proq yuklash ({{ orderTotal - orders.length }} ta qoldi)
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <EmptyState v-else icon="mdi-account-off-outline" title="Mijoz topilmadi" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customersApi, ordersApi, addressesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import StatusChip from '@/components/common/StatusChip.vue'
import PageLoader from '@/components/common/PageLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route     = useRoute()
const fmt       = useFormat()
const snack     = useSnackStore()
const customer  = ref(null)
const addresses = ref([])
const orders    = ref([])
const loading   = ref(true)
const ordersLoading = ref(true)
const toggling  = ref(false)
const orderTotal= ref(0)
const orderPage = ref(1)

async function toggleActive() {
  toggling.value = true
  try {
    if (customer.value.is_active) { await customersApi.deactivate(customer.value.id) }
    else                          { await customersApi.activate(customer.value.id) }
    customer.value.is_active = !customer.value.is_active
    snack.success(customer.value.is_active ? 'Faollashtirildi' : 'Bloklandi')
  } catch { snack.error('Xatolik') }
  finally { toggling.value = false }
}

async function loadMoreOrders() {
  orderPage.value++
  try {
    const { data } = await ordersApi.list({ user_id: route.params.id, page: orderPage.value, per_page: 10 })
    orders.value.push(...(data.data?.items || data.data || []))
  } catch {}
}

onMounted(async () => {
  const id = route.params.id
  const [cRes, aRes, oRes] = await Promise.allSettled([
    customersApi.get(id),
    addressesApi.byUser(id),
    ordersApi.list({ user_id: id, per_page: 10, order_by: '-created_at' }),
  ])
  if (cRes.status === 'fulfilled') customer.value  = cRes.value.data.data
  if (aRes.status === 'fulfilled') addresses.value = aRes.value.data.data || []
  if (oRes.status === 'fulfilled') {
    orders.value     = oRes.value.data.data?.items || oRes.value.data.data || []
    orderTotal.value = oRes.value.data.data?.total || 0
  }
  loading.value       = false
  ordersLoading.value = false
})
</script>
