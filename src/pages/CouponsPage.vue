<template>
  <div>
    <BzPageHeader title="Kuponlar">
      <template #actions>
        <v-switch v-model="validOnly" label="Faqat amal qiluvchi" hide-details density="compact" inset color="primary" @update:model-value="load" />
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Kupon yaratish</v-btn>
      </template>
    </BzPageHeader>

    <v-card rounded="xl" class="bz-card pa-3">
      <BzPageLoader v-if="loading" />
      <BzEmptyState v-else-if="!coupons.length" icon="mdi-ticket-percent-outline" title="Kuponlar yo'q" />
      <v-list v-else class="pa-0">
        <v-list-item v-for="c in coupons" :key="c.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border);min-height:80px">
          <template #prepend>
            <div class="d-flex align-center justify-center mr-3 px-3 py-2 rounded-lg flex-shrink-0" style="background:var(--bz-primary-soft);min-width:96px">
              <span style="font-weight:800;font-size:13px;color:var(--bz-primary);letter-spacing:1px;font-family:ui-monospace,monospace">{{ c.code }}</span>
            </div>
          </template>
          <template #title>
            <span style="font-weight:700;font-size:14px">{{ c.name_uz || c.name || c.code }}</span>
            <span style="margin-left:8px;font-weight:800;color:var(--bz-primary)">
              {{ c.type === 'percent' ? `${c.value}%` : fmt.price(c.value) }}
            </span>
          </template>
          <template #subtitle>
            <div class="d-flex align-center ga-3 mt-1" style="font-size:11.5px;color:var(--bz-text-3);flex-wrap:wrap">
              <span v-if="c.min_order">Min: {{ fmt.price(c.min_order) }}</span>
              <span v-if="c.max_discount">Max: {{ fmt.price(c.max_discount) }}</span>
              <span v-if="c.usage_limit">{{ c.usage_count || 0 }}/{{ c.usage_limit }}</span>
              <span v-else-if="c.usage_count">{{ c.usage_count }}/∞</span>
              <span v-if="c.expires_at">→ {{ fmt.date(c.expires_at) }}</span>
            </div>
            <v-progress-linear v-if="c.usage_limit" :model-value="(c.usage_count || 0) / c.usage_limit * 100" color="primary" height="3" rounded class="mt-1" style="max-width:240px" />
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip :color="c.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">{{ c.is_active ? 'Faol' : 'Nofaol' }}</v-chip>
              <v-btn icon variant="text" size="small" :color="c.is_active ? 'warning' : 'success'" @click="toggle(c)">
                <v-icon size="17">{{ c.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(c)"><v-icon size="17">mdi-pencil-outline</v-icon></v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(c)"><v-icon size="17">mdi-delete-outline</v-icon></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Kuponni tahrirlash' : 'Yangi kupon' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12"><v-text-field label="Kupon kodi *" v-model="form.code" :rules="[r => !!r || 'Majburiy']" style="font-family:ui-monospace,monospace;font-weight:700" /></v-col>
              <v-col cols="12" sm="6"><v-select label="Turi" v-model="form.type" :items="[{t:'Foiz (%)',v:'percent'},{t:'Summa',v:'fixed'}]" item-title="t" item-value="v" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Miqdor *" v-model.number="form.value" type="number" :rules="[r => r > 0 || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Min buyurtma" v-model.number="form.min_order" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Max chegirma" v-model.number="form.max_discount" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Foydalanish limiti" v-model.number="form.usage_limit" type="number" placeholder="∞" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Bir mijozga limit" v-model.number="form.per_user_limit" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Boshlanish" v-model="form.starts_at" type="date" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Tugash" v-model="form.expires_at" type="date" /></v-col>
              <v-col cols="12"><v-switch label="Faol" v-model="form.is_active" /></v-col>
            </v-row>
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

    <BzConfirmDialog v-model="confirmDialog" title="Kuponni o'chirish" :text="`'${delTarget?.code}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { couponsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const coupons   = ref([])
const loading   = ref(false)
const dialog    = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const editItem  = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef   = ref()
const validOnly = ref(false)

const emptyForm = () => ({ code:'', name_uz:'', type:'percent', value:null, min_order:null, max_discount:null, usage_limit:null, per_user_limit:1, starts_at:'', expires_at:'', is_active:true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(c) {
  editItem.value = c
  form.value = {
    code: c.code,
    name_uz: c.name_uz || '',
    type: c.type || 'percent',
    value: c.value,
    min_order: c.min_order ?? null,
    max_discount: c.max_discount ?? null,
    usage_limit: c.usage_limit ?? null,
    per_user_limit: c.per_user_limit ?? 1,
    starts_at: fmt.isoDateOnly(c.starts_at),
    expires_at: fmt.isoDateOnly(c.expires_at),
    is_active: c.is_active,
  }
  dialog.value = true
}
function confirmDel(c) { delTarget.value = c; confirmDialog.value = true }

async function toggle(c) {
  try {
    if (c.is_active) await couponsApi.deactivate(c.id)
    else             await couponsApi.activate(c.id)
    c.is_active = !c.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form.value }
    Object.keys(payload).forEach(k => { if (payload[k] === '' || payload[k] === null) delete payload[k] })
    payload.is_active = form.value.is_active
    if (editItem.value) { await couponsApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else                { await couponsApi.create(payload); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await couponsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const params = { per_page: 100 }
    if (validOnly.value) params.valid_only = 'true'
    const { data } = await couponsApi.list(params)
    coupons.value = data.data?.items || data.data || []
  } catch {} finally { loading.value = false }
}

onMounted(load)
</script>
