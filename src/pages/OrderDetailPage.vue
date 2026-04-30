<template>
  <div>
    <BzPageHeader
      :title="order ? `Buyurtma #${order.order_number}` : 'Buyurtma'"
      :subtitle="order ? fmt.datetime(order.created_at) : ''"
      back="/orders"
    >
      <template #actions>
        <template v-if="order">
          <BzStatusChip :status="order.status" size="default" :icon="true" />
          <BzStatusChip :status="order.payment_status" type="payment" size="default" />
          <v-menu>
            <template #activator="{ props: a }">
              <v-btn v-bind="a" variant="tonal" rounded="lg" prepend-icon="mdi-dots-horizontal">Amallar</v-btn>
            </template>
            <v-list density="compact" rounded="lg" min-width="220">
              <v-list-item prepend-icon="mdi-printer-outline" title="Chop etish" @click="doPrint" />
              <v-list-item prepend-icon="mdi-printer-check-outline" title="Tasdiqlash + chop" @click="doAcceptPrint" />
              <v-divider />
              <v-list-item prepend-icon="mdi-close-circle-outline" base-color="error" title="Bekor qilish" @click="cancelDialog = true" />
            </v-list>
          </v-menu>
        </template>
      </template>
    </BzPageHeader>

    <BzPageLoader v-if="loading" label="Yuklanmoqda…" />

    <v-row v-else-if="order">

      <!-- LEFT COLUMN -->
      <v-col cols="12" lg="8">
        <v-tabs v-model="tab" color="primary" density="comfortable" class="mb-4" style="border-bottom:1px solid var(--bz-border)">
          <v-tab value="items"><v-icon start size="16">mdi-package-variant-closed</v-icon> Tarkib</v-tab>
          <v-tab value="timeline"><v-icon start size="16">mdi-timeline-clock-outline</v-icon> Tarix</v-tab>
          <v-tab value="payments"><v-icon start size="16">mdi-credit-card-outline</v-icon> To'lovlar
            <v-chip v-if="payments.length" size="x-small" class="ml-2 chip-sm" color="primary" variant="tonal">{{ payments.length }}</v-chip>
          </v-tab>
        </v-tabs>

        <!-- Items -->
        <div v-if="tab === 'items'">
          <v-card rounded="xl" class="bz-card mb-4">
            <v-list class="pa-2">
              <v-list-item v-for="item in (order.items || [])" :key="item.id" rounded="lg" class="mb-1">
                <template #prepend>
                  <v-img
                    :src="item.image || 'https://placehold.co/52x52/e2e8f0/94a3b8?text=?'"
                    width="52" height="52" rounded="lg" cover class="mr-3"
                  />
                </template>
                <template #title>
                  <span style="font-size:14px;font-weight:700">{{ item.product_name || item.name_uz || 'Mahsulot' }}</span>
                </template>
                <template #subtitle>
                  <span style="font-size:12px;color:var(--bz-text-3)">
                    {{ item.quantity }} {{ item.unit || 'ta' }} × {{ fmt.price(item.unit_price || item.price) }}
                  </span>
                </template>
                <template #append>
                  <span class="num font-weight-bold" style="font-size:14px">{{ fmt.price(item.total || ((item.quantity || 1) * (item.unit_price || item.price || 0))) }}</span>
                </template>
              </v-list-item>
            </v-list>
            <v-divider />
            <div class="pa-5">
              <div v-if="order.subtotal" class="d-flex justify-space-between mb-2" style="font-size:13px;color:var(--bz-text-3)">
                <span>Mahsulotlar</span>
                <span class="num">{{ fmt.price(order.subtotal) }}</span>
              </div>
              <div v-if="order.delivery_fee" class="d-flex justify-space-between mb-2" style="font-size:13px;color:var(--bz-text-3)">
                <span>Yetkazib berish</span>
                <span class="num">{{ fmt.price(order.delivery_fee) }}</span>
              </div>
              <div v-if="order.discount" class="d-flex justify-space-between mb-2" style="font-size:13px;color:var(--bz-primary)">
                <span>Chegirma</span>
                <span class="num">−{{ fmt.price(order.discount) }}</span>
              </div>
              <v-divider class="my-3" />
              <div class="d-flex justify-space-between font-weight-bold" style="font-size:16px">
                <span>Jami</span>
                <span class="num" style="color:rgb(var(--v-theme-primary))">{{ fmt.price(order.total) }}</span>
              </div>
            </div>
          </v-card>

          <!-- Status change -->
          <v-card rounded="xl" class="bz-card pa-5 mb-4">
            <div style="font-weight:800;font-size:15px;margin-bottom:14px">Holatni o'zgartirish</div>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="s in Object.entries(ORDER_STATUS)"
                :key="s[0]"
                :color="s[0] === order.status ? s[1].color : undefined"
                :variant="s[0] === order.status ? 'flat' : 'tonal'"
                size="small"
                rounded="lg"
                :loading="statusLoading === s[0]"
                :disabled="s[0] === order.status || s[0] === 'cancelled'"
                @click="changeStatus(s[0])"
              >
                <v-icon start size="14">{{ s[1].icon }}</v-icon>
                {{ s[1].label }}
              </v-btn>
            </div>
          </v-card>

          <!-- Payment status -->
          <v-card rounded="xl" class="bz-card pa-5 mb-4">
            <div style="font-weight:800;font-size:15px;margin-bottom:14px">To'lov holati</div>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="p in ['unpaid','pending','paid','refunded']"
                :key="p"
                :color="order.payment_status === p ? 'primary' : undefined"
                :variant="order.payment_status === p ? 'flat' : 'tonal'"
                size="small" rounded="lg"
                :loading="paymentLoading"
                :disabled="order.payment_status === p"
                @click="changePayment(p)"
              >
                {{ PAYMENT_STATUS[p]?.label || p }}
              </v-btn>
            </div>
          </v-card>

          <!-- Admin note -->
          <v-card rounded="xl" class="bz-card pa-5">
            <div style="font-weight:800;font-size:15px;margin-bottom:14px">Admin izohi</div>
            <v-textarea v-model="noteText" placeholder="Buyurtma haqida izoh…" rows="3" no-resize hide-details />
            <v-btn color="primary" variant="tonal" class="mt-3" :loading="noteLoading" @click="saveNote">
              <v-icon start>mdi-content-save-outline</v-icon> Izoh saqlash
            </v-btn>
          </v-card>
        </div>

        <!-- Timeline -->
        <v-card v-if="tab === 'timeline'" rounded="xl" class="bz-card pa-5">
          <div style="font-weight:800;font-size:15px;margin-bottom:18px">Holatlar tarixi</div>
          <BzEmptyState v-if="!(order.status_log || []).length" icon="mdi-timeline-clock-outline" title="Tarix yo'q" />
          <div v-else class="bz-timeline">
            <div v-for="(log, i) in (order.status_log || []).slice().reverse()" :key="i" class="bz-timeline-item">
              <div class="bz-timeline-dot" :style="`background:${statusBg(log.to_status)}`">
                <v-icon size="12" color="white">{{ ORDER_STATUS[log.to_status]?.icon || 'mdi-arrow-right' }}</v-icon>
              </div>
              <div class="bz-timeline-content">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <BzStatusChip v-if="log.from_status" :status="log.from_status" size="x-small" />
                  <v-icon size="12" color="grey">mdi-arrow-right</v-icon>
                  <BzStatusChip :status="log.to_status" :icon="true" size="x-small" />
                  <span style="font-size:11px;color:var(--bz-text-3)">{{ fmt.datetime(log.created_at) }}</span>
                </div>
                <div v-if="log.changed_by" style="font-size:12px;color:var(--bz-text-2);margin-top:4px">
                  <v-icon size="12">mdi-account-circle-outline</v-icon>
                  {{ log.changed_by_name || log.changed_by }}
                </div>
                <div v-if="log.note" style="font-size:13px;color:var(--bz-text-2);margin-top:4px">{{ log.note }}</div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Payments -->
        <v-card v-if="tab === 'payments'" rounded="xl" class="bz-card pa-5">
          <div class="d-flex align-center justify-space-between mb-3">
            <div style="font-weight:800;font-size:15px">To'lovlar</div>
            <v-btn variant="tonal" size="small" rounded="lg" :loading="paymentsLoading" @click="loadPayments">Yangilash</v-btn>
          </div>
          <BzSkeleton v-if="paymentsLoading" v-for="n in 3" :key="n" type="row" />
          <BzEmptyState v-else-if="!payments.length" icon="mdi-credit-card-off-outline" title="To'lovlar yo'q" />
          <v-list v-else class="pa-0">
            <v-list-item v-for="p in payments" :key="p.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
              <template #prepend>
                <v-avatar :color="PAYMENT_STATUS[p.status]?.color || 'grey'" variant="tonal" size="38" class="mr-3">
                  <v-icon size="18">{{ p.method === 'cash' ? 'mdi-cash' : p.method === 'click' ? 'mdi-credit-card' : 'mdi-credit-card-outline' }}</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <div class="d-flex align-center ga-2">
                  <span style="font-weight:800">{{ fmt.price(p.amount) }}</span>
                  <BzStatusChip :status="p.status" type="payment" />
                </div>
              </template>
              <template #subtitle>
                <span style="font-size:12px;color:var(--bz-text-3)">{{ p.method }} · {{ fmt.datetime(p.paid_at || p.created_at) }}</span>
              </template>
              <template #append>
                <v-btn v-if="p.status === 'completed'" variant="tonal" color="warning" size="small" rounded="lg" @click="openRefund(p)">
                  Qaytarish
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- RIGHT COLUMN -->
      <v-col cols="12" lg="4">
        <!-- Customer -->
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div style="font-weight:800;font-size:15px;margin-bottom:14px">Mijoz</div>
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar size="46" color="primary" variant="tonal">
              <span style="font-weight:800;font-size:14px">{{ fmt.initials(order.user?.first_name, order.user?.last_name) }}</span>
            </v-avatar>
            <div>
              <router-link v-if="order.user?.id" :to="`/customers/${order.user.id}`" style="font-weight:700;font-size:14.5px;color:var(--bz-text-1);text-decoration:none">
                {{ fmt.fullName(order.user) }}
              </router-link>
              <div v-else style="font-weight:700;font-size:14.5px">{{ order.customer_name || '—' }}</div>
              <div style="font-size:12px;color:var(--bz-text-3)">{{ order.user?.phone || order.customer_phone || '' }}</div>
            </div>
          </div>
          <v-divider class="mb-3" />
          <div class="d-flex flex-column ga-2">
            <div class="d-flex align-start ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-map-marker-outline</v-icon>
              <span style="color:var(--bz-text-2);line-height:1.5">{{ order.address?.address_text || order.delivery_address_text || order.delivery_address || '—' }}</span>
            </div>
            <div class="d-flex align-center ga-2" style="font-size:13px">
              <v-icon size="16" color="grey">mdi-credit-card-outline</v-icon>
              <span style="color:var(--bz-text-2)">{{ order.payment_method || '—' }}</span>
            </div>
          </div>
          <div v-if="hasGeo" class="mt-3" style="height:200px">
            <ZoneMap :marker="{ lat: Number(order.address.latitude), lng: Number(order.address.longitude), label: order.address.address_text }" readonly :zoom="14" />
          </div>
        </v-card>

        <!-- Courier -->
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div style="font-weight:800;font-size:15px;margin-bottom:14px">Kuryer</div>
          <div v-if="order.courier" class="d-flex align-center ga-3 mb-3">
            <v-avatar size="38" color="info" variant="tonal">
              <v-icon size="18">mdi-moped-outline</v-icon>
            </v-avatar>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">{{ fmt.fullName(order.courier) }}</div>
              <div style="font-size:12px;color:var(--bz-text-3)">Tayinlangan</div>
            </div>
            <v-btn icon variant="text" size="small" color="error" :loading="courierLoading" @click="unassignCourier">
              <v-icon size="17">mdi-close</v-icon>
            </v-btn>
          </div>
          <div v-else style="font-size:13px;color:var(--bz-text-3);margin-bottom:12px">Tayinlanmagan</div>
          <v-select
            v-model="selectedCourier"
            :items="couriers"
            item-title="name" item-value="id"
            placeholder="Kuryer tanlang…"
            hide-details clearable density="comfortable"
            class="mb-3"
            :loading="couriersLoading"
            @click="ensureCouriers"
          />
          <v-btn color="info" variant="tonal" block rounded="lg" :loading="courierLoading" :disabled="!selectedCourier" @click="assignCourier">
            <v-icon start>mdi-account-check</v-icon> Tayinlash
          </v-btn>
        </v-card>

        <!-- Customer note -->
        <v-card v-if="order.user_note || order.note" rounded="xl" class="bz-card pa-5">
          <div style="font-weight:800;font-size:15px;margin-bottom:10px">
            <v-icon size="16" color="warning" class="mr-1">mdi-comment-text-outline</v-icon>
            Mijoz izohi
          </div>
          <div style="font-size:13.5px;color:var(--bz-text-2);line-height:1.6">{{ order.user_note || order.note }}</div>
        </v-card>
      </v-col>
    </v-row>

    <BzEmptyState v-else icon="mdi-alert-circle-outline" title="Buyurtma topilmadi" />

    <!-- Cancel order dialog -->
    <BzConfirmDialog
      v-model="cancelDialog"
      title="Buyurtmani bekor qilish"
      text="Bu amalni qaytarib bo'lmaydi. Mijozga bildirishnoma yuboriladi."
      variant="danger"
      confirm-label="Bekor qilish"
      reason
      v-model:reason-value="cancelReason"
      reason-placeholder="Bekor qilish sababi…"
      :loading="cancelLoading"
      @confirm="doCancel"
    />

    <!-- Refund dialog -->
    <BzConfirmDialog
      v-model="refundDialog"
      title="To'lovni qaytarish"
      text="To'lov mijozga qaytariladi va buyurtma holati 'qaytarildi' bo'ladi."
      variant="warning"
      confirm-label="Qaytarish"
      reason
      v-model:reason-value="refundReason"
      reason-placeholder="Qaytarish sababi…"
      :loading="refundLoading"
      @confirm="doRefund"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi, usersApi, paymentsApi } from '@/api'
import { useFormat, ORDER_STATUS, PAYMENT_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader   from '@/components/common/BzPageHeader.vue'
import BzPageLoader   from '@/components/common/BzPageLoader.vue'
import BzEmptyState   from '@/components/common/BzEmptyState.vue'
import BzStatusChip   from '@/components/common/BzStatusChip.vue'
import BzSkeleton     from '@/components/common/BzSkeleton.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'
import ZoneMap        from '@/components/zones/ZoneMap.vue'

const route = useRoute()
const snack = useSnackStore()
const fmt   = useFormat()

const order   = ref(null)
const tab     = ref('items')
const loading = ref(true)
const noteText      = ref('')
const noteLoading   = ref(false)
const paymentLoading= ref(false)
const statusLoading = ref(null)
const courierLoading= ref(false)
const couriersLoading = ref(false)
const selectedCourier = ref(null)
const couriers = ref([])
const couriersLoaded = ref(false)

const payments = ref([])
const paymentsLoading = ref(false)

const cancelDialog = ref(false)
const cancelReason = ref('')
const cancelLoading = ref(false)

const refundDialog = ref(false)
const refundReason = ref('')
const refundTarget = ref(null)
const refundLoading = ref(false)

const STATUS_BG = { pending:'#F59E0B', confirmed:'#3B82F6', preparing:'#60A5FA', delivering:'#8B5CF6', delivered:'#16A34A', completed:'#22C55E', cancelled:'#EF4444' }
function statusBg(s) { return STATUS_BG[s] || '#94A3B8' }

const hasGeo = computed(() => order.value?.address?.latitude && order.value?.address?.longitude)

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await ordersApi.get(route.params.id)
    order.value    = data.data
    noteText.value = data.data?.admin_note || ''
  } catch {} finally { loading.value = false }
}

async function ensureCouriers() {
  if (couriersLoaded.value) return
  couriersLoading.value = true
  try {
    const { data } = await usersApi.list({ role: 'courier', is_active: 'true', per_page: 100 })
    couriers.value = (data.data?.items || []).map(u => ({ id: u.id, name: fmt.fullName(u) }))
    couriersLoaded.value = true
  } catch {} finally { couriersLoading.value = false }
}

async function changeStatus(status) {
  statusLoading.value = status
  try {
    await ordersApi.updateStatus(order.value.id, { status })
    order.value.status = status
    snack.success('Holat yangilandi')
    fetchOrder()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { statusLoading.value = null }
}

async function changePayment(payment_status) {
  paymentLoading.value = true
  try {
    await ordersApi.updatePayment(order.value.id, payment_status)
    order.value.payment_status = payment_status
    snack.success("To'lov holati yangilandi")
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { paymentLoading.value = false }
}

async function saveNote() {
  noteLoading.value = true
  try {
    await ordersApi.addNote(order.value.id, noteText.value)
    snack.success('Izoh saqlandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { noteLoading.value = false }
}

async function assignCourier() {
  if (!selectedCourier.value) return
  courierLoading.value = true
  try {
    await ordersApi.assignCourier(order.value.id, selectedCourier.value)
    snack.success('Kuryer tayinlandi')
    fetchOrder()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { courierLoading.value = false }
}

async function unassignCourier() {
  courierLoading.value = true
  try {
    await ordersApi.unassignCourier(order.value.id)
    snack.success('Kuryer olib tashlandi')
    fetchOrder()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { courierLoading.value = false }
}

async function loadPayments() {
  paymentsLoading.value = true
  try {
    const { data } = await paymentsApi.byOrder(route.params.id)
    payments.value = data.data || []
  } catch {} finally { paymentsLoading.value = false }
}

async function doPrint() {
  try { await ordersApi.print(order.value.id); snack.success('Chop etish navbatga qo\'yildi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}
async function doAcceptPrint() {
  try { await ordersApi.acceptPrint(order.value.id); snack.success('Tasdiqlandi va chop navbatga qo\'yildi'); fetchOrder() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function doCancel() {
  cancelLoading.value = true
  try {
    await ordersApi.cancel(order.value.id, cancelReason.value || 'Bekor qilindi')
    snack.success('Buyurtma bekor qilindi')
    cancelDialog.value = false
    cancelReason.value = ''
    fetchOrder()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { cancelLoading.value = false }
}

function openRefund(p) {
  refundTarget.value = p
  refundReason.value = ''
  refundDialog.value = true
}

async function doRefund() {
  if (!refundTarget.value) return
  refundLoading.value = true
  try {
    await paymentsApi.refund(refundTarget.value.id, refundReason.value || 'Mijoz iltimosiga binoan')
    snack.success("To'lov qaytarildi")
    refundDialog.value = false
    loadPayments()
    fetchOrder()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { refundLoading.value = false }
}

onMounted(() => { fetchOrder(); loadPayments() })
</script>

<style scoped>
.bz-timeline { position: relative; padding-left: 24px; }
.bz-timeline::before {
  content: '';
  position: absolute;
  left: 11px; top: 6px; bottom: 6px;
  width: 2px;
  background: var(--bz-border-strong);
  border-radius: 2px;
}
.bz-timeline-item { position: relative; padding-bottom: 18px; }
.bz-timeline-item:last-child { padding-bottom: 0; }
.bz-timeline-dot {
  position: absolute;
  left: -23px;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px var(--bz-surface-1);
}
.bz-timeline-content { padding: 2px 0; }
</style>
