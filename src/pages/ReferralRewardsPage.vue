<template>
  <div>
    <BzPageHeader title="Referral mukofotlar" subtitle="Faqat bitta mukofot faol bo'lishi mumkin">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Mukofot yaratish</v-btn>
      </template>
    </BzPageHeader>

    <!-- Active reward highlight -->
    <v-card v-if="activeReward" rounded="xl" class="bz-card mb-4" style="border:2px solid var(--bz-primary)">
      <div class="pa-5 d-flex align-center ga-4">
        <div style="width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center" :style="{ background: typeColor(activeReward.type) + '18' }">
          <v-icon :color="typeColorRaw(activeReward.type)" size="26">{{ typeIcon(activeReward.type) }}</v-icon>
        </div>
        <div style="flex:1;min-width:0">
          <div class="d-flex align-center ga-2">
            <span style="font-weight:800;font-size:16px">{{ activeReward.name }}</span>
            <v-chip color="success" variant="flat" size="x-small" class="chip-sm">Faol</v-chip>
          </div>
          <div style="font-size:13px;color:var(--bz-text-3);margin-top:2px">{{ typeLabel(activeReward.type) }} · {{ rewardSummary(activeReward) }}</div>
        </div>
        <v-btn variant="tonal" color="error" rounded="lg" size="small" @click="deactivate(activeReward)">
          <v-icon start size="16">mdi-pause-circle-outline</v-icon> Nofaollashtirish
        </v-btn>
      </div>
    </v-card>

    <!-- List -->
    <v-card rounded="xl" class="bz-card pa-3">
      <BzPageLoader v-if="loading" />
      <BzEmptyState v-else-if="!rewards.length" icon="mdi-gift-off-outline" title="Mukofotlar yo'q" subtitle="Birinchi mukofotni yarating" />
      <v-list v-else class="pa-0">
        <v-list-item v-for="r in rewards" :key="r.id" rounded="lg" class="mb-2" style="border:1px solid var(--bz-border);min-height:76px">
          <template #prepend>
            <div class="d-flex align-center justify-center mr-3 flex-shrink-0" style="width:48px;height:48px;border-radius:14px" :style="{ background: typeColor(r.type) + '18' }">
              <v-icon :color="typeColorRaw(r.type)" size="22">{{ typeIcon(r.type) }}</v-icon>
            </div>
          </template>
          <template #title>
            <div class="d-flex align-center ga-2">
              <span style="font-weight:700;font-size:14px">{{ r.name }}</span>
              <v-chip v-if="r.is_active" color="success" variant="flat" size="x-small" class="chip-sm">Faol</v-chip>
            </div>
          </template>
          <template #subtitle>
            <div style="font-size:12px;color:var(--bz-text-3);margin-top:2px">
              {{ typeLabel(r.type) }} · {{ rewardSummary(r) }} · {{ fmt.date(r.created_at) }}
            </div>
          </template>
          <template #append>
            <div class="d-flex align-center ga-1">
              <v-btn v-if="!r.is_active" icon variant="text" size="small" color="success" @click="activate(r)" title="Faollashtirish">
                <v-icon size="18">mdi-play-circle-outline</v-icon>
              </v-btn>
              <v-btn v-else icon variant="text" size="small" color="warning" @click="deactivate(r)" title="Nofaollashtirish">
                <v-icon size="18">mdi-pause-circle-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(r)"><v-icon size="18">mdi-pencil-outline</v-icon></v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(r)"><v-icon size="18">mdi-delete-outline</v-icon></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Tahrirlash' : 'Yangi mukofot' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi *" v-model="form.name" :rules="[r => !!r || 'Majburiy']" class="mb-3" />

            <v-select
              label="Turi *"
              v-model="form.type"
              :items="typeOptions"
              item-title="t"
              item-value="v"
              :rules="[r => !!r || 'Majburiy']"
              class="mb-3"
            />

            <!-- Coupon fields -->
            <template v-if="form.type === 'coupon'">
              <v-row dense>
                <v-col cols="6">
                  <v-select label="Kupon turi" v-model="form.coupon_type" :items="[{t:'Foiz (%)',v:'percent'},{t:'Summa',v:'fixed'}]" item-title="t" item-value="v" />
                </v-col>
                <v-col cols="6">
                  <v-text-field label="Miqdor *" v-model.number="form.coupon_value" type="number" :rules="[r => r > 0 || 'Majburiy']" />
                </v-col>
                <v-col cols="6">
                  <v-text-field label="Max chegirma" v-model.number="form.coupon_max_discount" type="number" />
                </v-col>
                <v-col cols="6">
                  <v-text-field label="Min buyurtma" v-model.number="form.coupon_min_order" type="number" />
                </v-col>
                <v-col cols="12">
                  <v-text-field label="Amal qilish muddati (kun)" v-model.number="form.coupon_expires_days" type="number" />
                </v-col>
              </v-row>
            </template>

            <!-- Free delivery fields -->
            <template v-if="form.type === 'free_delivery'">
              <v-text-field label="Bepul yetkazish soni *" v-model.number="form.free_delivery_count" type="number" :rules="[r => r > 0 || 'Majburiy']" />
            </template>

            <!-- Bonus product fields -->
            <template v-if="form.type === 'bonus_product'">
              <v-select
                label="Mahsulot *"
                v-model="form.bonus_product_id"
                :items="productsList"
                item-title="name"
                item-value="id"
                :rules="[r => !!r || 'Majburiy']"
                class="mb-3"
              />
              <v-text-field label="Miqdor *" v-model="form.bonus_quantity" type="number" step="0.1" :rules="[r => r > 0 || 'Majburiy']" />
            </template>

            <v-switch label="Faol" v-model="form.is_active" color="success" class="mt-2" />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Bekor</v-btn>
          <v-btn color="primary" rounded="lg" :loading="saving" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BzConfirmDialog v-model="confirmDialog" title="Mukofotni o'chirish" :text="`'${delTarget?.name}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { referralRewardsApi, productsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const rewards = ref([])
const loading = ref(false)
const dialog  = ref(false)
const saving  = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()
const productsList = ref([])

const activeReward = computed(() => rewards.value.find(r => r.is_active))

const typeOptions = [
  { t: 'Kupon (chegirma)', v: 'coupon' },
  { t: 'Bepul yetkazish', v: 'free_delivery' },
  { t: 'Bonus mahsulot',  v: 'bonus_product' },
]

function typeIcon(t) {
  return { coupon: 'mdi-ticket-percent-outline', free_delivery: 'mdi-truck-check-outline', bonus_product: 'mdi-gift-outline' }[t] || 'mdi-gift-outline'
}
function typeLabel(t) {
  return { coupon: 'Kupon', free_delivery: 'Bepul yetkazish', bonus_product: 'Bonus mahsulot' }[t] || t
}
function typeColor(t) {
  return { coupon: '#F59E0B', free_delivery: '#3B82F6', bonus_product: '#8B5CF6' }[t] || '#6B7280'
}
function typeColorRaw(t) {
  return { coupon: 'warning', free_delivery: 'info', bonus_product: 'purple' }[t] || 'grey'
}
function rewardSummary(r) {
  if (r.type === 'coupon') {
    return r.coupon_type === 'percent' ? `${r.coupon_value}% chegirma` : `${fmt.price(r.coupon_value)} chegirma`
  }
  if (r.type === 'free_delivery') return `${r.free_delivery_count} marta bepul`
  if (r.type === 'bonus_product') return `${r.bonus_quantity || 1}x ${r.bonus_product_name || 'mahsulot'}`
  return ''
}

const emptyForm = () => ({
  name: '', type: 'coupon', is_active: false,
  coupon_type: 'percent', coupon_value: null, coupon_max_discount: null, coupon_min_order: null, coupon_expires_days: 30,
  free_delivery_count: 1,
  bonus_product_id: null, bonus_quantity: 1,
})
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(r) {
  editItem.value = r
  form.value = { ...emptyForm(), ...r }
  dialog.value = true
}
function confirmDel(r) { delTarget.value = r; confirmDialog.value = true }

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { name: form.value.name, type: form.value.type, is_active: form.value.is_active }
    if (form.value.type === 'coupon') {
      Object.assign(payload, {
        coupon_type: form.value.coupon_type, coupon_value: form.value.coupon_value,
        coupon_max_discount: form.value.coupon_max_discount, coupon_min_order: form.value.coupon_min_order,
        coupon_expires_days: form.value.coupon_expires_days,
      })
    } else if (form.value.type === 'free_delivery') {
      payload.free_delivery_count = form.value.free_delivery_count
    } else if (form.value.type === 'bonus_product') {
      payload.bonus_product_id = form.value.bonus_product_id
      payload.bonus_quantity = form.value.bonus_quantity
    }
    if (editItem.value) { await referralRewardsApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else                { await referralRewardsApi.create(payload); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await referralRewardsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function activate(r) {
  try {
    await referralRewardsApi.activate(r.id)
    snack.success('Faollashtirildi')
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function deactivate(r) {
  try {
    await referralRewardsApi.deactivate(r.id)
    snack.success('Nofaollashtirildi')
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function load() {
  loading.value = true
  try {
    const { data } = await referralRewardsApi.list({ per_page: 100, order_by: '-created_at' })
    rewards.value = data.data?.items || data.data || []
  } catch {} finally { loading.value = false }
}

// Load products for bonus_product picker
watch(() => form.value.type, async t => {
  if (t === 'bonus_product' && !productsList.value.length) {
    try {
      const { data } = await productsApi.list({ per_page: 200 })
      productsList.value = (data.data?.items || []).map(p => ({ id: p.id, name: p.name_uz || p.name }))
    } catch {}
  }
})

onMounted(load)
</script>
