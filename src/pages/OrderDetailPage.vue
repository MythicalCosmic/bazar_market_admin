<template>
  <div>
    <!-- Breadcrumb -->
    <div class="d-flex align-center mb-5 ga-2">
      <v-btn icon variant="text" size="small" to="/orders">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <div class="page-title">Buyurtma #{{ order?.order_number }}</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:1px">{{ fmt.datetime(order?.created_at) }}</div>
      </div>
      <v-spacer />
      <template v-if="order">
        <StatusChip :status="order.status" size="default" :icon="true" />
        <StatusChip :status="order.payment_status" type="payment" size="default" />
      </template>
    </div>

    <PageLoader v-if="loading" />

    <v-row v-else-if="order">

      <!-- ── Left column ── -->
      <v-col cols="12" lg="8">

        <!-- Items -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="mb-4">
          <div class="pa-5 pb-3 d-flex align-center justify-space-between">
            <span style="font-weight:700;font-size:15px">
              Buyurtma tarkibi
              <v-chip size="x-small" variant="tonal" color="primary" class="ml-2">{{ order.items?.length || 0 }} ta</v-chip>
            </span>
          </div>
          <v-divider />
          <v-list class="pa-2">
            <v-list-item
              v-for="item in (order.items || [])"
              :key="item.id"
              rounded="lg"
              class="mb-1"
            >
              <template #prepend>
                <v-img
                  :src="item.image || 'https://placehold.co/52x52/e2e8f0/94a3b8?text=?'"
                  width="52" height="52" rounded="lg" cover class="mr-3 flex-shrink-0"
                />
              </template>
              <template #title>
                <span style="font-size:14px;font-weight:600">
                  {{ item.name_uz || item.name || item.product_name || 'Mahsulot' }}
                </span>
              </template>
              <template #subtitle>
                <span style="font-size:12px;color:#64748B">
                  {{ item.qty || item.quantity }} {{ item.unit || 'ta' }}
                  × {{ fmt.price(item.price) }}
                </span>
              </template>
              <template #append>
                <span class="num font-weight-bold" style="font-size:14px">
                  {{ fmt.price((item.qty || item.quantity || 1) * item.price) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
          <v-divider />
          <!-- Totals -->
          <div class="pa-5">
            <div class="d-flex justify-space-between mb-2" style="font-size:13px;color:#64748B">
              <span>Mahsulotlar</span>
              <span class="num">{{ fmt.price(order.subtotal || order.total_price) }}</span>
            </div>
            <div v-if="order.delivery_fee" class="d-flex justify-space-between mb-2" style="font-size:13px;color:#64748B">
              <span>Yetkazib berish</span>
              <span class="num">{{ fmt.price(order.delivery_fee) }}</span>
            </div>
            <div v-if="order.discount_amount" class="d-flex justify-space-between mb-2" style="font-size:13px;color:#16A34A">
              <span>Chegirma</span>
              <span class="num">−{{ fmt.price(order.discount_amount) }}</span>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between font-weight-bold" style="font-size:16px">
              <span>Jami</span>
              <span class="num" style="color:rgb(var(--v-theme-primary))">
                {{ fmt.price(order.total_price || order.total) }}
              </span>
            </div>
          </div>
        </v-card>

        <!-- Status change -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5 mb-4">
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">Holatni o'zgartirish</div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              v-for="s in Object.entries(ORDER_STATUS)"
              :key="s[0]"
              :color="s[0] === order.status ? statusColor(s[0]) : undefined"
              :variant="s[0] === order.status ? 'flat' : 'tonal'"
              size="small"
              rounded="lg"
              :loading="statusLoading === s[0]"
              :disabled="s[0] === order.status"
              @click="changeStatus(s[0])"
            >
              <v-icon start size="14">{{ s[1].icon }}</v-icon>
              {{ s[1].label }}
            </v-btn>
          </div>
        </v-card>

        <!-- Payment status -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5 mb-4">
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">To'lov holati</div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              v-for="p in ['unpaid','pending','paid','refunded']"
              :key="p"
              :color="order.payment_status === p ? 'primary' : undefined"
              :variant="order.payment_status === p ? 'flat' : 'tonal'"
              size="small"
              rounded="lg"
              :loading="paymentLoading"
              :disabled="order.payment_status === p"
              @click="changePayment(p)"
            >
              {{ PAYMENT_STATUS[p]?.label || p }}
            </v-btn>
          </div>
        </v-card>

        <!-- Admin note -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5">
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">Admin izohi</div>
          <v-textarea
            v-model="noteText"
            placeholder="Buyurtma haqida izoh qo'shish..."
            rows="3"
            no-resize
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="mt-3"
            :loading="noteLoading"
            @click="saveNote"
          >
            <v-icon start>mdi-send</v-icon> Izoh saqlash
          </v-btn>
        </v-card>
      </v-col>

      <!-- ── Right column ── -->
      <v-col cols="12" lg="4">

        <!-- Customer info -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5 mb-4">
          <div style="font-weight:700;font-size:15px;margin-bottom:16px">Mijoz ma'lumotlari</div>
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar size="46" color="primary" variant="tonal">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
            <div>
              <div style="font-weight:700;font-size:15px">{{ order.customer_name || '—' }}</div>
              <div style="font-size:13px;color:#64748B">{{ order.customer_phone || '' }}</div>
            </div>
          </div>
          <v-divider class="mb-4" />
          <div class="d-flex flex-column" style="gap:10px">
            <div class="d-flex align-start ga-2" style="font-size:13px">
              <v-icon size="16" color="grey-lighten-1" class="mt-0">mdi-map-marker-outline</v-icon>
              <span style="color:#64748B;line-height:1.4">{{ order.delivery_address || '—' }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey-lighten-1">mdi-credit-card-outline</v-icon>
              <span style="color:#64748B">{{ order.payment_method || '—' }}</span>
            </div>
          </div>
        </v-card>

        <!-- Courier assign -->
        <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5 mb-4">
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">Kuryer</div>
          <div v-if="order.courier_name" class="d-flex align-center ga-3 mb-3">
            <v-avatar size="38" color="info" variant="tonal">
              <v-icon size="18">mdi-moped-outline</v-icon>
            </v-avatar>
            <div>
              <div style="font-weight:600;font-size:14px">{{ order.courier_name }}</div>
              <div style="font-size:12px;color:#94A3B8">Tayinlangan</div>
            </div>
            <v-spacer />
            <v-btn icon variant="text" size="small" color="error" :loading="courierLoading" @click="unassignCourier">
              <v-icon size="17">mdi-close</v-icon>
            </v-btn>
          </div>
          <div v-else style="font-size:13px;color:#94A3B8;margin-bottom:12px">Kuryer tayinlanmagan</div>
          <v-select
            v-model="selectedCourier"
            :items="couriers"
            item-title="name"
            item-value="id"
            placeholder="Kuryer tanlang..."
            hide-details
            clearable
            class="mb-3"
          />
          <v-btn
            color="info"
            variant="tonal"
            block
            :loading="courierLoading"
            :disabled="!selectedCourier"
            @click="assignCourier"
          >
            <v-icon start>mdi-account-check</v-icon> Tayinlash
          </v-btn>
        </v-card>

        <!-- Customer note -->
        <v-card v-if="order.note" rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5">
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">
            <v-icon size="16" color="warning" class="mr-1">mdi-comment-text-outline</v-icon>
            Mijoz izohi
          </div>
          <div style="font-size:14px;color:#64748B;line-height:1.6">{{ order.note }}</div>
        </v-card>
      </v-col>
    </v-row>

    <EmptyState v-else icon="mdi-alert-circle-outline" title="Buyurtma topilmadi" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi, usersApi } from '@/api'
import { useFormat, ORDER_STATUS, PAYMENT_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import StatusChip from '@/components/common/StatusChip.vue'
import PageLoader from '@/components/common/PageLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route     = useRoute()
const snack     = useSnackStore()
const fmt       = useFormat()
const order     = ref(null)
const loading   = ref(true)
const noteText  = ref('')
const noteLoading   = ref(false)
const paymentLoading= ref(false)
const statusLoading = ref(null)
const courierLoading= ref(false)
const selectedCourier = ref(null)
const couriers  = ref([])

const STATUS_COLORS = {
  pending:'warning', confirmed:'info', preparing:'info',
  delivering:'purple', delivered:'success', completed:'success', cancelled:'error',
}
function statusColor(s) { return STATUS_COLORS[s] || 'grey' }

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await ordersApi.get(route.params.id)
    order.value   = data.data
    noteText.value= data.data?.admin_note || ''
  } catch {}
  finally { loading.value = false }
}

async function fetchCouriers() {
  try {
    const { data } = await usersApi.list({ role: 'courier', is_active: true, per_page: 100 })
    couriers.value = (data.data?.items || data.data || []).map(u => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
    }))
  } catch {}
}

async function changeStatus(status) {
  statusLoading.value = status
  try {
    await ordersApi.updateStatus(order.value.id, { status })
    order.value.status = status
    snack.success('Holat yangilandi')
  } catch { snack.error('Xatolik yuz berdi') }
  finally { statusLoading.value = null }
}

async function changePayment(payment_status) {
  paymentLoading.value = true
  try {
    await ordersApi.updatePayment(order.value.id, payment_status)
    order.value.payment_status = payment_status
    snack.success("To'lov holati yangilandi")
  } catch { snack.error('Xatolik yuz berdi') }
  finally { paymentLoading.value = false }
}

async function saveNote() {
  noteLoading.value = true
  try {
    await ordersApi.addNote(order.value.id, noteText.value)
    snack.success('Izoh saqlandi')
  } catch { snack.error('Xatolik yuz berdi') }
  finally { noteLoading.value = false }
}

async function assignCourier() {
  if (!selectedCourier.value) return
  courierLoading.value = true
  try {
    await ordersApi.assignCourier(order.value.id, selectedCourier.value)
    const c = couriers.value.find(x => x.id === selectedCourier.value)
    order.value.courier_name = c?.name || 'Kuryer'
    snack.success('Kuryer tayinlandi')
  } catch { snack.error('Xatolik yuz berdi') }
  finally { courierLoading.value = false }
}

async function unassignCourier() {
  courierLoading.value = true
  try {
    await ordersApi.unassignCourier(order.value.id)
    order.value.courier_name = null
    selectedCourier.value    = null
    snack.success('Kuryer olib tashlandi')
  } catch { snack.error('Xatolik yuz berdi') }
  finally { courierLoading.value = false }
}

onMounted(() => { fetchOrder(); fetchCouriers() })
</script>
