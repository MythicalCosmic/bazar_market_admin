<template>
  <div>
    <!-- Filters card -->
    <v-card rounded="xl" class="pa-4 mb-4" style="border:1px solid rgba(0,0,0,0.07)">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="f.q"
            placeholder="Raqam, telefon, mijoz..."
            prepend-inner-icon="mdi-magnify"
            clearable hide-details
            @update:model-value="debounce"
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select
            v-model="f.payment_method"
            :items="payMethods" item-title="t" item-value="v"
            placeholder="To'lov turi" clearable hide-details
            @update:model-value="load"
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select
            v-model="f.payment_status"
            :items="payStatuses" item-title="t" item-value="v"
            placeholder="To'lov holati" clearable hide-details
            @update:model-value="load"
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-text-field v-model="f.date_from" type="date" label="Dan" hide-details @change="load" />
        </v-col>
        <v-col cols="6" sm="2">
          <v-text-field v-model="f.date_to"   type="date" label="Gacha" hide-details @change="load" />
        </v-col>
      </v-row>
    </v-card>

    <!-- Status tabs -->
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-chip
        v-for="tab in statusTabs"
        :key="tab.v"
        :color="f.status === tab.v ? (tab.color || 'primary') : undefined"
        :variant="f.status === tab.v ? 'flat' : 'outlined'"
        class="cursor-pointer"
        style="font-weight:600;font-size:12px"
        @click="setTab(tab.v)"
      >
        {{ tab.t }}
        <span v-if="tab.v === f.status && total > 0" class="ml-1">({{ total }})</span>
      </v-chip>
    </div>

    <!-- Table -->
    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <v-data-table
        :headers="headers"
        :items="orders"
        :loading="loading"
        hide-default-footer
        :items-per-page="f.per_page"
      >
        <template #item.order_number="{ item }">
          <router-link
            :to="`/orders/${item.id}`"
            style="font-weight:700;color:rgb(var(--v-theme-primary));text-decoration:none;font-size:14px"
          >#{{ item.order_number }}</router-link>
        </template>

        <template #item.customer="{ item }">
          <div>
            <div style="font-weight:600;font-size:13px">{{ item.customer_name || '—' }}</div>
            <div style="font-size:11px;color:#94A3B8">{{ item.customer_phone || '' }}</div>
          </div>
        </template>

        <template #item.status="{ item }">
          <StatusChip :status="item.status" :icon="true" />
        </template>

        <template #item.payment_status="{ item }">
          <StatusChip :status="item.payment_status" type="payment" />
        </template>

        <template #item.total_price="{ item }">
          <span class="num font-weight-bold" style="font-size:13px">
            {{ fmt.price(item.total_price || item.total) }}
          </span>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:#64748B">{{ fmt.date(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" :to="`/orders/${item.id}`">
            <v-icon size="17">mdi-eye-outline</v-icon>
          </v-btn>
        </template>

        <template #loading>
          <PageLoader :size="36" />
        </template>
        <template #no-data>
          <EmptyState icon="mdi-package-variant-closed" title="Buyurtmalar topilmadi" />
        </template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div style="font-size:13px;color:#64748B">
          Jami: <b>{{ total }}</b> ta
        </div>
        <v-pagination
          v-model="f.page"
          :length="pages"
          :total-visible="5"
          size="small"
          rounded="lg"
          @update:model-value="load"
        />
        <v-select
          v-model="f.per_page"
          :items="[10,20,50,100]"
          hide-details density="compact"
          style="max-width:85px"
          @update:model-value="load"
        />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ordersApi } from '@/api'
import { useFormat, ORDER_STATUS } from '@/composables/useFormat'
import StatusChip from '@/components/common/StatusChip.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageLoader from '@/components/common/PageLoader.vue'

const fmt    = useFormat()
const orders = ref([])
const loading= ref(false)
const total  = ref(0)
const pages  = computed(() => Math.ceil(total.value / f.value.per_page))

const f = ref({
  q: '', status: null, payment_method: null, payment_status: null,
  date_from: '', date_to: '', page: 1, per_page: 20, order_by: '-created_at',
})

const headers = [
  { title: 'Raqam',     key: 'order_number',  width: 110 },
  { title: 'Mijoz',     key: 'customer',       sortable: false },
  { title: 'Holat',     key: 'status',         width: 150 },
  { title: "To'lov",   key: 'payment_status', width: 130 },
  { title: 'Summa',    key: 'total_price',    width: 170 },
  { title: 'Sana',     key: 'created_at',     width: 140 },
  { title: '',         key: 'actions',        width: 50, sortable: false },
]

const statusTabs = [
  { v: null,          t: 'Barchasi',      color: 'secondary' },
  ...Object.entries(ORDER_STATUS).map(([v, m]) => ({ v, t: m.label, color: m.color })),
]

const payMethods  = [{ t: 'Naqd', v: 'cash' }, { t: 'Click', v: 'click' }, { t: 'Payme', v: 'payme' }]
const payStatuses = [
  { t: "To'lanmagan", v: 'unpaid' },
  { t: 'Kutilmoqda',  v: 'pending' },
  { t: "To'langan",  v: 'paid' },
  { t: 'Qaytarildi',  v: 'refunded' },
]

function setTab(v) { f.value.status = v; f.value.page = 1; load() }

let timer
function debounce() {
  clearTimeout(timer)
  timer = setTimeout(() => { f.value.page = 1; load() }, 400)
}

async function load() {
  loading.value = true
  try {
    const { data } = await ordersApi.list(fmt.cleanParams({ ...f.value }))
    orders.value = data.data?.items || data.data || []
    total.value  = data.data?.total || 0
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
