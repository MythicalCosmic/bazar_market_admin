<template>
  <div>
    <BzPageHeader title="To'lov" back="/payments">
      <template #actions>
        <BzStatusChip v-if="payment" :status="payment.status" type="payment" size="default" :icon="true" />
        <v-btn v-if="payment?.status === 'completed'" color="warning" variant="tonal" rounded="lg" prepend-icon="mdi-undo-variant" @click="refundDialog = true">Qaytarish</v-btn>
      </template>
    </BzPageHeader>

    <BzPageLoader v-if="loading" />

    <v-row v-else-if="payment">
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div class="section-label mb-2">Summa</div>
          <div class="num" style="font-size:36px;font-weight:800;letter-spacing:-1px">{{ fmt.price(payment.amount) }}</div>
          <v-divider class="my-4" />

          <v-row dense>
            <v-col cols="6"><div class="section-label">Usul</div><div style="font-weight:700;font-size:14px;text-transform:capitalize">{{ payment.method }}</div></v-col>
            <v-col cols="6"><div class="section-label">UUID</div><div style="font-family:monospace;font-size:11.5px;color:var(--bz-text-3)">{{ payment.uuid }}</div></v-col>
            <v-col cols="6" class="mt-3"><div class="section-label">Yaratildi</div><div style="font-size:13px">{{ fmt.datetime(payment.created_at) }}</div></v-col>
            <v-col cols="6" class="mt-3"><div class="section-label">To'landi</div><div style="font-size:13px">{{ fmt.datetime(payment.paid_at) }}</div></v-col>
          </v-row>

          <v-divider class="my-4" />
          <div class="section-label mb-2">Holatni o'zgartirish</div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn v-for="s in nextStates" :key="s" size="small" rounded="lg" variant="tonal" :loading="statusLoading === s" @click="setStatus(s)">
              {{ PAYMENT_STATUS[s]?.label || s }}
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card v-if="payment.order" rounded="xl" class="bz-card pa-5 mb-4">
          <div style="font-weight:800;font-size:15px;margin-bottom:12px">Buyurtma</div>
          <router-link :to="`/orders/${payment.order.id}`" style="font-weight:800;font-size:18px;color:rgb(var(--v-theme-primary));text-decoration:none">#{{ payment.order.order_number }}</router-link>
          <div v-if="payment.order.user" class="d-flex align-center ga-3 mt-3">
            <v-avatar size="38" color="primary" variant="tonal"><span style="font-weight:800;font-size:12px">{{ fmt.initials(payment.order.user.first_name, payment.order.user.last_name) }}</span></v-avatar>
            <div>
              <div style="font-weight:700;font-size:13px">{{ fmt.fullName(payment.order.user) }}</div>
              <div style="font-size:11.5px;color:var(--bz-text-3)">{{ payment.order.user.phone || '' }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <BzEmptyState v-else icon="mdi-credit-card-off-outline" title="To'lov topilmadi" />

    <BzConfirmDialog
      v-model="refundDialog"
      title="To'lovni qaytarish"
      text="To'lov mijozga qaytariladi. Bu amalni qaytarib bo'lmaydi."
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
import { useRoute, useRouter } from 'vue-router'
import { paymentsApi } from '@/api'
import { useFormat, PAYMENT_STATUS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const route  = useRoute()
const fmt    = useFormat()
const snack  = useSnackStore()

const payment = ref(null)
const loading = ref(true)
const statusLoading = ref(null)
const refundDialog  = ref(false)
const refundReason  = ref('')
const refundLoading = ref(false)

const transitions = {
  pending:    ['processing','completed','failed'],
  processing: ['completed','failed'],
  completed:  ['refunded'],
  failed:     [],
  refunded:   [],
}
const nextStates = computed(() => transitions[payment.value?.status] || [])

async function fetch() {
  loading.value = true
  try { const { data } = await paymentsApi.get(route.params.id); payment.value = data.data }
  catch {} finally { loading.value = false }
}

async function setStatus(s) {
  statusLoading.value = s
  try { await paymentsApi.updateStatus(payment.value.id, s); payment.value.status = s; snack.success('Holat yangilandi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { statusLoading.value = null }
}

async function doRefund() {
  refundLoading.value = true
  try {
    await paymentsApi.refund(payment.value.id, refundReason.value || 'Mijoz iltimosiga binoan')
    payment.value.status = 'refunded'
    snack.success('Qaytarildi')
    refundDialog.value = false
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { refundLoading.value = false }
}

onMounted(fetch)
</script>
