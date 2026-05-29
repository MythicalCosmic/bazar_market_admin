<template>
  <div class="courier-page" :class="{ 'sheet-expanded': sheetExpanded }">
    <!-- ── MAP ────────────────────────────────────────────────── -->
    <div class="courier-map-section">
      <CourierMap
        ref="mapRef"
        :destination="destination"
        @route="onRoute"
        @position="onPosition"
      />

      <!-- Top quick header (only when an order is selected) -->
      <transition name="bz-slide-down">
        <div v-if="selected" class="courier-top-card">
          <v-btn icon variant="text" size="small" @click="closeSelection">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <div style="flex:1;min-width:0">
            <div class="courier-top-num">#{{ selected.order_number }}</div>
            <div class="courier-top-sub">
              <BzStatusChip :status="selected.status" :icon="true" size="x-small" />
              <BzStatusChip :status="selected.payment_status" type="payment" size="x-small" />
            </div>
          </div>
          <a
            v-if="selected.user?.phone || selected.customer_phone"
            :href="`tel:${selected.user?.phone || selected.customer_phone}`"
            class="courier-call-btn"
          >
            <v-icon size="20" color="white">mdi-phone</v-icon>
          </a>
        </div>
      </transition>
    </div>

    <!-- ── BOTTOM SHEET ───────────────────────────────────────── -->
    <div
      class="courier-sheet"
      :style="{ height: sheetHeight + 'px' }"
    >
      <!-- Drag handle -->
      <div
        class="courier-sheet-handle"
        @click="toggleSheet"
        @touchstart.passive="onDragStart"
        @touchmove.passive="onDragMove"
        @touchend="onDragEnd"
        @mousedown="onMouseStart"
      >
        <div class="courier-sheet-grip" />
      </div>

      <!-- SELECTED ORDER PANEL -->
      <div v-if="selected" class="courier-sheet-body">
        <!-- Customer + address -->
        <div class="courier-order-card">
          <div class="courier-order-row">
            <v-avatar size="44" color="primary" variant="tonal">
              <span style="font-weight:800;font-size:14px">{{ initials(selected) }}</span>
            </v-avatar>
            <div style="flex:1;min-width:0">
              <div class="courier-customer-name">{{ customerName(selected) }}</div>
              <div class="courier-customer-phone">
                {{ selected.user?.phone || selected.customer_phone || '—' }}
              </div>
            </div>
            <div class="courier-total num">{{ fmt.price(selected.total || selected.total_price) }}</div>
          </div>

          <div class="courier-address">
            <v-icon size="18" color="error">mdi-map-marker</v-icon>
            <span>{{ addressOf(selected) || 'Manzil yo\'q' }}</span>
          </div>

          <div class="courier-meta-row">
            <div class="courier-meta-item">
              <v-icon size="14" color="grey">mdi-package-variant-closed</v-icon>
              <span>{{ (selected.items || []).length || selected.items_count || 0 }} ta mahsulot</span>
            </div>
            <div class="courier-meta-item">
              <v-icon size="14" color="grey">mdi-credit-card-outline</v-icon>
              <span>{{ paymentMethodLabel(selected.payment_method) }}</span>
            </div>
            <div v-if="selected.user_note || selected.note" class="courier-meta-item courier-note">
              <v-icon size="14" color="warning">mdi-comment-text-outline</v-icon>
              <span>{{ selected.user_note || selected.note }}</span>
            </div>
          </div>
        </div>

        <!-- Items expander -->
        <div v-if="(selected.items || []).length" class="courier-items-section">
          <button class="courier-items-toggle" @click="itemsOpen = !itemsOpen">
            <span>Mahsulotlar ({{ selected.items.length }})</span>
            <v-icon size="18">{{ itemsOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </button>
          <transition name="bz-fade">
            <div v-if="itemsOpen" class="courier-items-list">
              <div v-for="item in selected.items" :key="item.id" class="courier-item-row">
                <div class="courier-item-qty num">{{ item.quantity }}×</div>
                <div style="flex:1;min-width:0">
                  <div class="courier-item-name">{{ item.product_name || item.name_uz || 'Mahsulot' }}</div>
                  <div class="courier-item-price num">{{ fmt.price(item.unit_price || item.price) }}</div>
                </div>
                <div class="courier-item-total num">{{ fmt.price(item.total || (item.quantity || 1) * (item.unit_price || item.price || 0)) }}</div>
              </div>
            </div>
          </transition>
        </div>

        <!-- ACTION BUTTONS (big touch targets) -->
        <div class="courier-actions">
          <!-- Claim (if unassigned) -->
          <button
            v-if="!isAssignedToMe(selected) && canClaim(selected)"
            class="courier-btn courier-btn-claim"
            :disabled="busy"
            @click="claimOrder(selected)"
          >
            <v-icon size="22">mdi-hand-back-right</v-icon>
            <span>Olib ketishni boshlash</span>
          </button>

          <!-- Status flow buttons -->
          <template v-if="isAssignedToMe(selected) || isAdmin">
            <button
              v-if="selected.status === 'confirmed' || selected.status === 'preparing'"
              class="courier-btn courier-btn-go"
              :disabled="busy"
              @click="setStatus('delivering')"
            >
              <v-icon size="22">mdi-moped</v-icon>
              <span>Yo'lga chiqdim</span>
            </button>

            <button
              v-if="selected.status === 'delivering'"
              class="courier-btn courier-btn-delivered"
              :disabled="busy"
              @click="setStatus('delivered')"
            >
              <v-icon size="22">mdi-package-check</v-icon>
              <span>Yetkazildi</span>
            </button>

            <button
              v-if="selected.status === 'delivered'"
              class="courier-btn courier-btn-completed"
              :disabled="busy"
              @click="setStatus('completed')"
            >
              <v-icon size="22">mdi-check-all</v-icon>
              <span>Yakunlash</span>
            </button>

            <!-- Payment toggle -->
            <button
              v-if="selected.payment_status !== 'paid' && selected.payment_status !== 'completed'"
              class="courier-btn courier-btn-paid"
              :disabled="busy"
              @click="markPaid()"
            >
              <v-icon size="22">mdi-cash-check</v-icon>
              <span>To'landi</span>
            </button>

            <!-- Cancel -->
            <button
              v-if="selected.status !== 'cancelled' && selected.status !== 'completed' && selected.status !== 'delivered'"
              class="courier-btn courier-btn-cancel"
              :disabled="busy"
              @click="cancelDialog = true"
            >
              <v-icon size="22">mdi-close-circle-outline</v-icon>
              <span>Bekor qilish</span>
            </button>
          </template>
        </div>

        <!-- Back to list -->
        <button class="courier-back-btn" @click="closeSelection">
          <v-icon size="18">mdi-arrow-left</v-icon>
          Boshqa buyurtmalar
        </button>
      </div>

      <!-- LIST PANEL -->
      <div v-else class="courier-sheet-body">
        <!-- Tabs -->
        <div class="courier-tabs">
          <button
            v-for="t in tabs"
            :key="t.v"
            class="courier-tab"
            :class="{ active: tab === t.v }"
            @click="tab = t.v"
          >
            <v-icon size="16">{{ t.icon }}</v-icon>
            <span>{{ t.label }}</span>
            <span v-if="counts[t.v]" class="courier-tab-badge">{{ counts[t.v] }}</span>
          </button>
        </div>

        <!-- Refresh / status row -->
        <div class="courier-list-toolbar">
          <div class="courier-greeting">
            <v-icon size="14" color="grey">mdi-account-circle-outline</v-icon>
            {{ greeting }}
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            :loading="loading"
            @click="loadOrders"
          >
            <v-icon size="20">mdi-refresh</v-icon>
          </v-btn>
        </div>

        <!-- List -->
        <div class="courier-list">
          <template v-if="loading && !filtered.length">
            <div v-for="n in 4" :key="n" class="courier-list-row skeleton">
              <div class="bz-skeleton" style="width:48px;height:48px;border-radius:14px" />
              <div style="flex:1">
                <div class="bz-skeleton mb-2" style="width:50%;height:12px" />
                <div class="bz-skeleton" style="width:80%;height:11px" />
              </div>
            </div>
          </template>

          <template v-else-if="!filtered.length">
            <div class="courier-empty">
              <v-icon size="56" color="grey-lighten-1">{{ tab === 'mine' ? 'mdi-moped-outline' : 'mdi-package-variant-closed' }}</v-icon>
              <div class="courier-empty-title">{{ tab === 'mine' ? 'Sizda faol buyurtma yo\'q' : 'Hozircha buyurtma yo\'q' }}</div>
              <div class="courier-empty-sub">{{ tab === 'mine' ? 'Mavjud buyurtmalardan tanlang' : 'Yangi buyurtmalar tez orada paydo bo\'ladi' }}</div>
              <v-btn v-if="tab === 'mine'" variant="tonal" color="primary" rounded="pill" @click="tab = 'available'">
                <v-icon start>mdi-view-list</v-icon> Mavjud buyurtmalar
              </v-btn>
            </div>
          </template>

          <template v-else>
            <div
              v-for="o in filtered"
              :key="o.id"
              class="courier-list-row"
              :class="{ 'is-mine': isAssignedToMe(o) }"
              @click="selectOrder(o)"
            >
              <div class="courier-list-icon" :style="{ background: bgFor(o.status) }">
                <v-icon size="22" :color="colorFor(o.status)">{{ iconFor(o.status) }}</v-icon>
              </div>
              <div style="flex:1;min-width:0">
                <div class="courier-list-line1">
                  <span class="courier-list-num">#{{ o.order_number }}</span>
                  <BzStatusChip :status="o.status" size="x-small" />
                  <BzStatusChip :status="o.payment_status" type="payment" size="x-small" />
                </div>
                <div class="courier-list-line2">
                  <v-icon size="13" color="grey">mdi-map-marker-outline</v-icon>
                  <span>{{ addressOf(o) || 'Manzil yo\'q' }}</span>
                </div>
                <div class="courier-list-line3">
                  <span class="num">{{ fmt.price(o.total || o.total_price) }}</span>
                  <span v-if="distanceFromMe(o)" class="courier-list-dist">
                    <v-icon size="12" color="primary">mdi-map-marker-distance</v-icon>
                    {{ distanceFromMe(o) }}
                  </span>
                  <span class="courier-list-time">{{ fmt.relativeTime(o.created_at) }}</span>
                </div>
              </div>
              <v-icon size="18" color="grey">mdi-chevron-right</v-icon>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Cancel dialog -->
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card rounded="xl" class="pa-4">
        <div style="font-weight:800;font-size:17px;margin-bottom:6px">Buyurtmani bekor qilish</div>
        <div style="font-size:13px;color:var(--bz-text-3);margin-bottom:14px">Mijozga bildirishnoma yuboriladi</div>
        <v-textarea
          v-model="cancelReason"
          placeholder="Bekor qilish sababi…"
          rows="3"
          variant="outlined"
          hide-details
          autofocus
        />
        <div class="d-flex ga-2 mt-3">
          <v-btn variant="text" block @click="cancelDialog = false">Yopish</v-btn>
          <v-btn color="error" variant="flat" block :loading="busy" @click="doCancel">
            Bekor qilish
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ordersApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'
import CourierMap from '@/components/courier/CourierMap.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'

const fmt = useFormat()
const auth = useAuthStore()
const snack = useSnackStore()

const orders = ref([])
const loading = ref(false)
const tab = ref('mine')
const selected = ref(null)
const itemsOpen = ref(false)
const busy = ref(false)
const cancelDialog = ref(false)
const cancelReason = ref('')
const myPos = ref(null)
const mapRef = ref(null)

const sheetExpanded = ref(false)
const sheetHeight = ref(0)
const collapsedH = 240
const expandedH = computed(() => Math.round(window.innerHeight * 0.7))

const tabs = [
  { v: 'mine',      label: 'Mening',   icon: 'mdi-moped-outline' },
  { v: 'available', label: 'Mavjud',   icon: 'mdi-package-variant-closed' },
  { v: 'done',      label: 'Yakunlangan', icon: 'mdi-check-all' },
]

const isAdmin = computed(() => auth.isAdmin)
const myId = computed(() => auth.user?.id)

const greeting = computed(() => {
  const n = auth.user?.first_name || auth.user?.username || 'Kuryer'
  return `Salom, ${n}`
})

function isAssignedToMe(o) {
  return !!(o.courier?.id && myId.value && o.courier.id === myId.value)
    || !!(o.courier_id && myId.value && o.courier_id === myId.value)
}

function canClaim(o) {
  return !o.courier && !o.courier_id && ['confirmed', 'preparing'].includes(o.status)
}

const filtered = computed(() => {
  const list = orders.value || []
  if (tab.value === 'mine') {
    return list.filter(o => isAssignedToMe(o) && !['completed', 'cancelled'].includes(o.status))
  }
  if (tab.value === 'available') {
    return list.filter(o => canClaim(o))
  }
  if (tab.value === 'done') {
    return list.filter(o => isAssignedToMe(o) && ['completed', 'delivered', 'cancelled'].includes(o.status))
  }
  return list
})

const counts = computed(() => {
  const list = orders.value || []
  return {
    mine:      list.filter(o => isAssignedToMe(o) && !['completed', 'cancelled'].includes(o.status)).length,
    available: list.filter(o => canClaim(o)).length,
    done:      list.filter(o => isAssignedToMe(o) && ['completed', 'delivered', 'cancelled'].includes(o.status)).length,
  }
})

const destination = computed(() => {
  if (!selected.value) return null
  const a = selected.value.address
  const lat = Number(a?.latitude ?? selected.value.delivery_latitude ?? selected.value.latitude)
  const lng = Number(a?.longitude ?? selected.value.delivery_longitude ?? selected.value.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, label: addressOf(selected.value) }
})

function addressOf(o) {
  return o.address?.address_text || o.delivery_address_text || o.delivery_address || ''
}

function customerName(o) {
  return [o.user?.first_name, o.user?.last_name].filter(Boolean).join(' ') || o.customer_name || 'Mijoz'
}

function initials(o) {
  const fn = o.user?.first_name || o.customer_name || ''
  const ln = o.user?.last_name || ''
  return ((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?'
}

function paymentMethodLabel(m) {
  if (!m) return '—'
  if (m === 'cash') return 'Naqd'
  if (m === 'click') return 'Click'
  if (m === 'payme') return 'Payme'
  return m
}

function iconFor(s)  { return ORDER_STATUS[s]?.icon  || 'mdi-package-variant-closed' }
function colorFor(s) { return ORDER_STATUS[s]?.color || 'grey' }
function bgFor(s) {
  const c = ORDER_STATUS[s]?.color
  if (c === 'warning') return 'rgba(245,158,11,0.12)'
  if (c === 'info')    return 'rgba(59,130,246,0.12)'
  if (c === 'success') return 'rgba(22,163,74,0.12)'
  if (c === 'error')   return 'rgba(239,68,68,0.12)'
  if (c === 'purple')  return 'rgba(139,92,246,0.14)'
  return 'rgba(148,163,184,0.14)'
}

function distanceFromMe(o) {
  if (!myPos.value) return null
  const a = o.address
  const lat = Number(a?.latitude ?? o.delivery_latitude ?? o.latitude)
  const lng = Number(a?.longitude ?? o.delivery_longitude ?? o.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const R = 6371000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat - myPos.value.lat)
  const dLng = toRad(lng - myPos.value.lng)
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(myPos.value.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng/2)**2
  const m = 2 * R * Math.asin(Math.sqrt(h))
  return m < 1000 ? Math.round(m) + ' m' : (m/1000).toFixed(m < 10000 ? 1 : 0) + ' km'
}

async function loadOrders() {
  loading.value = true
  try {
    const params = { per_page: 100, order_by: '-created_at' }
    const { data } = await ordersApi.list(params)
    orders.value = data.data?.items || data.data || []
    if (selected.value) {
      const fresh = orders.value.find(o => o.id === selected.value.id)
      if (fresh) selected.value = fresh
    }
  } catch (e) {
    snack.error(e.response?.data?.message || 'Yuklab bo\'lmadi')
  } finally {
    loading.value = false
  }
}

async function selectOrder(o) {
  // Fetch full detail to get items + address
  try {
    const { data } = await ordersApi.get(o.id)
    selected.value = data.data || o
  } catch {
    selected.value = o
  }
  itemsOpen.value = false
  sheetExpanded.value = false
  sheetHeight.value = collapsedH
  await new Promise(r => setTimeout(r, 50))
  mapRef.value?.fitBoth?.()
}

function closeSelection() {
  selected.value = null
  sheetExpanded.value = true
  sheetHeight.value = expandedH.value
}

function vibrate(ms = 30) {
  if ('vibrate' in navigator) try { navigator.vibrate(ms) } catch {}
}

async function setStatus(status) {
  if (!selected.value) return
  busy.value = true
  try {
    await ordersApi.updateStatus(selected.value.id, { status })
    vibrate(40)
    snack.success(ORDER_STATUS[status]?.label || 'Yangilandi')
    await refreshSelected()
  } catch (e) {
    snack.error(e.response?.data?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

async function markPaid() {
  if (!selected.value) return
  busy.value = true
  try {
    await ordersApi.updatePayment(selected.value.id, 'paid')
    vibrate(40)
    snack.success("To'landi deb belgilandi")
    await refreshSelected()
  } catch (e) {
    snack.error(e.response?.data?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

async function claimOrder(o) {
  if (!myId.value) {
    snack.error('Avval profilingiz yuklanmoqda…')
    return
  }
  busy.value = true
  try {
    await ordersApi.assignCourier(o.id, myId.value)
    vibrate(40)
    snack.success('Buyurtma sizga biriktirildi')
    await refreshSelected()
    await loadOrders()
    tab.value = 'mine'
  } catch (e) {
    snack.error(e.response?.data?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

async function doCancel() {
  if (!selected.value) return
  busy.value = true
  try {
    await ordersApi.cancel(selected.value.id, cancelReason.value)
    vibrate(60)
    snack.success('Buyurtma bekor qilindi')
    cancelDialog.value = false
    cancelReason.value = ''
    await refreshSelected()
    await loadOrders()
  } catch (e) {
    snack.error(e.response?.data?.message || 'Xatolik')
  } finally {
    busy.value = false
  }
}

async function refreshSelected() {
  if (!selected.value) return
  try {
    const { data } = await ordersApi.get(selected.value.id)
    selected.value = data.data || selected.value
  } catch {}
}

function onRoute({ meters, seconds }) {
  // Could surface ETA elsewhere
}
function onPosition(pos) {
  myPos.value = pos
}

// ── Bottom sheet drag ──────────────────────────────────────
let dragStartY = 0
let dragStartH = 0
let dragging = false

function toggleSheet() {
  sheetExpanded.value = !sheetExpanded.value
  sheetHeight.value = sheetExpanded.value ? expandedH.value : collapsedH
}
function onDragStart(e) {
  dragging = true
  dragStartY = (e.touches?.[0]?.clientY) ?? 0
  dragStartH = sheetHeight.value
}
function onDragMove(e) {
  if (!dragging) return
  const y = (e.touches?.[0]?.clientY) ?? 0
  const dy = dragStartY - y
  const next = Math.max(120, Math.min(window.innerHeight - 80, dragStartH + dy))
  sheetHeight.value = next
}
function onDragEnd() {
  if (!dragging) return
  dragging = false
  const mid = window.innerHeight * 0.45
  if (sheetHeight.value > mid) {
    sheetExpanded.value = true
    sheetHeight.value = expandedH.value
  } else {
    sheetExpanded.value = false
    sheetHeight.value = collapsedH
  }
}
function onMouseStart(e) {
  dragStartY = e.clientY
  dragStartH = sheetHeight.value
  dragging = true
  const move = (ev) => {
    if (!dragging) return
    const dy = dragStartY - ev.clientY
    sheetHeight.value = Math.max(120, Math.min(window.innerHeight - 80, dragStartH + dy))
  }
  const up = () => {
    onDragEnd()
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

let pollHandle = null
function onResize() {
  if (sheetExpanded.value) sheetHeight.value = expandedH.value
}

onMounted(() => {
  sheetHeight.value = expandedH.value
  sheetExpanded.value = true
  loadOrders()
  pollHandle = setInterval(loadOrders, 30000)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (pollHandle) clearInterval(pollHandle)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.courier-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  height: calc(100dvh - 60px);
  overflow: hidden;
  background: var(--bz-surface-2);
}
@media (max-width: 960px) {
  .courier-page { height: calc(100vh - 56px); height: calc(100dvh - 56px); }
}

.courier-map-section {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Top floating header */
.courier-top-card {
  position: absolute;
  top: 10px;
  left: 12px;
  right: 12px;
  background: color-mix(in srgb, var(--bz-surface-1) 96%, transparent);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.22);
  border: 1px solid var(--bz-border);
  z-index: 600;
  color: var(--bz-text-1);
}
.v-theme--dark .courier-top-card {
  background: rgba(15, 23, 42, 0.94);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(0,0,0,0.55);
}
.courier-top-num {
  font-weight: 800;
  font-size: 15px;
  font-family: ui-monospace, monospace;
  letter-spacing: -0.3px;
  color: var(--bz-text-1);
}
.courier-top-sub {
  display: flex;
  gap: 4px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.courier-call-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #16A34A;
  box-shadow: 0 4px 12px rgba(22,163,74,0.35);
  text-decoration: none;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
.courier-call-btn:active { transform: scale(0.92); }

/* Bottom sheet */
.courier-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bz-surface-1);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -10px 32px rgba(15,23,42,0.14);
  z-index: 700;
  display: flex;
  flex-direction: column;
  transition: height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.courier-sheet-handle {
  flex-shrink: 0;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
}
.courier-sheet-handle:active { cursor: grabbing; }
.courier-sheet-grip {
  width: 42px;
  height: 4px;
  border-radius: 4px;
  background: var(--bz-border-strong);
}
.courier-sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}

/* Tabs */
.courier-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  position: sticky;
  top: 0;
  background: var(--bz-surface-1);
  padding: 4px 0 8px;
  z-index: 1;
}
.courier-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 6px;
  border-radius: 12px;
  background: var(--bz-surface-2);
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--bz-text-3);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 42px;
}
.courier-tab.active {
  background: var(--bz-primary-soft);
  color: var(--bz-primary);
  border-color: var(--bz-primary-glow);
}
.courier-tab-badge {
  background: var(--bz-primary);
  color: white;
  font-size: 10.5px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
}
.courier-tab.active .courier-tab-badge { background: var(--bz-primary); }
.courier-tab:not(.active) .courier-tab-badge { background: var(--bz-text-3); }

.courier-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 8px;
}
.courier-greeting {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--bz-text-3);
  font-weight: 600;
}

.courier-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.courier-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bz-surface-2);
  border: 1px solid var(--bz-border);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.courier-list-row:active {
  transform: scale(0.98);
  background: var(--bz-surface-3);
}
.courier-list-row.is-mine {
  border-color: var(--bz-primary-glow);
  background: var(--bz-primary-soft);
}
.courier-list-row.skeleton {
  cursor: default;
  pointer-events: none;
}
.courier-list-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.courier-list-line1 {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.courier-list-num {
  font-weight: 800;
  font-size: 13.5px;
  font-family: ui-monospace, monospace;
  color: var(--bz-text-1);
}
.courier-list-line2 {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--bz-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.courier-list-line2 span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.courier-list-line3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--bz-text-2);
  flex-wrap: wrap;
}
.courier-list-dist {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--bz-primary);
}
.courier-list-time {
  color: var(--bz-text-3);
  font-weight: 600;
}

/* Empty state */
.courier-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 8px;
}
.courier-empty-title {
  font-weight: 800;
  font-size: 15px;
  color: var(--bz-text-1);
}
.courier-empty-sub {
  font-size: 12.5px;
  color: var(--bz-text-3);
  margin-bottom: 8px;
}

/* Selected order panel */
.courier-order-card {
  background: var(--bz-surface-2);
  border: 1px solid var(--bz-border);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 12px;
}
.courier-order-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.courier-customer-name {
  font-weight: 800;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.courier-customer-phone {
  font-size: 12.5px;
  color: var(--bz-text-3);
  font-family: ui-monospace, monospace;
  margin-top: 2px;
}
.courier-total {
  font-weight: 800;
  font-size: 16px;
  color: var(--bz-primary);
}
.courier-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--bz-border);
  font-size: 13px;
  color: var(--bz-text-2);
  line-height: 1.45;
}
.courier-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--bz-text-3);
}
.courier-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.courier-meta-item.courier-note {
  background: rgba(245,158,11,0.14);
  padding: 6px 10px;
  border-radius: 8px;
  color: #B45309;
  width: 100%;
}
.v-theme--dark .courier-meta-item.courier-note {
  background: rgba(245,158,11,0.18);
  color: #FCD34D;
}

.courier-items-section {
  background: var(--bz-surface-2);
  border: 1px solid var(--bz-border);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}
.courier-items-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  color: var(--bz-text-1);
}
.courier-items-list {
  padding: 0 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.courier-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-top: 1px solid var(--bz-border);
  font-size: 12.5px;
}
.courier-item-row:first-child { border-top: 0; }
.courier-item-qty {
  font-weight: 800;
  color: var(--bz-primary);
  min-width: 28px;
}
.courier-item-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--bz-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.courier-item-price {
  font-size: 11.5px;
  color: var(--bz-text-3);
}
.courier-item-total {
  font-weight: 700;
  color: var(--bz-text-2);
}

/* Action buttons */
.courier-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.courier-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 16px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.1px;
  border: 0;
  cursor: pointer;
  min-height: 60px;
  color: white;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(15,23,42,0.12);
}
.courier-btn:active:not(:disabled) { transform: scale(0.96); }
.courier-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.courier-btn-claim     { background: linear-gradient(135deg, #3B82F6, #2563EB); grid-column: 1 / -1; }
.courier-btn-go        { background: linear-gradient(135deg, #8B5CF6, #7C3AED); grid-column: 1 / -1; }
.courier-btn-delivered { background: linear-gradient(135deg, #16A34A, #15803D); grid-column: 1 / -1; }
.courier-btn-completed { background: linear-gradient(135deg, #16A34A, #14532D); grid-column: 1 / -1; }
.courier-btn-paid      { background: linear-gradient(135deg, #F59E0B, #D97706); }
.courier-btn-cancel    { background: linear-gradient(135deg, #EF4444, #DC2626); }

.courier-back-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--bz-border);
  padding: 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  color: var(--bz-text-2);
  cursor: pointer;
}
.courier-back-btn:active { background: var(--bz-surface-3); }

.bz-skeleton {
  background: linear-gradient(90deg, var(--bz-surface-3) 0%, color-mix(in srgb, var(--bz-surface-3) 70%, white) 50%, var(--bz-surface-3) 100%);
  background-size: 800px 100%;
  animation: bz-shimmer 1.4s linear infinite;
  border-radius: var(--bz-radius-sm);
}
@keyframes bz-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* Transitions */
.bz-slide-down-enter-active,
.bz-slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bz-slide-down-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.bz-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.bz-fade-enter-active,
.bz-fade-leave-active { transition: opacity 0.2s ease; }
.bz-fade-enter-from, .bz-fade-leave-to { opacity: 0; }
</style>
