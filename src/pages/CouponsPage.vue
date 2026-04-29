<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Kupon yaratish</v-btn>
    </div>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <PageLoader v-if="loading" />
      <EmptyState v-else-if="!coupons.length" icon="mdi-ticket-percent-outline" title="Kuponlar yo'q" />
      <v-list v-else class="pa-2">
        <v-list-item v-for="c in coupons" :key="c.id" rounded="lg" class="mb-1" style="min-height:64px">
          <template #prepend>
            <div class="d-flex align-center justify-center flex-shrink-0 mr-3 px-3 py-2 rounded-lg"
              style="background:rgba(22,163,74,0.08);min-width:80px">
              <span style="font-weight:800;font-size:14px;color:#16A34A;letter-spacing:1px;font-family:monospace">
                {{ c.code }}
              </span>
            </div>
          </template>
          <template #title>
            <span style="font-weight:600;font-size:14px">{{ c.name_uz || c.name || c.code }}</span>
          </template>
          <template #subtitle>
            <span style="font-size:12px;color:#64748B">
              {{ c.type === 'percent' ? `${c.value}%` : fmt.price(c.value) }}
              · Min: {{ fmt.price(c.min_order_amount) }}
              · {{ c.usage_count || 0 }}/{{ c.max_usage || '∞' }} foydalanilgan
            </span>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip :color="c.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
                {{ c.is_active ? 'Faol' : 'Nofaol' }}
              </v-chip>
              <v-btn icon variant="text" size="small" :color="c.is_active ? 'warning' : 'success'" @click="toggle(c)">
                <v-icon size="17">{{ c.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(c)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(c)">
                <v-icon size="17">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Kuponni tahrirlash' : 'Yangi kupon' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Kupon kodi *" v-model="form.code" :rules="[r => !!r || 'Majburiy']" class="mb-3" style="font-family:monospace" />
            <v-text-field label="Nomi" v-model="form.name_uz" class="mb-3" />
            <v-select label="Turi" v-model="form.type" :items="[{t:'Foiz (%)',v:'percent'},{t:'Summa',v:'amount'}]" item-title="t" item-value="v" class="mb-3" />
            <v-text-field label="Chegirma miqdori *" v-model.number="form.value" type="number" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Minimal buyurtma summasi" v-model.number="form.min_order_amount" type="number" class="mb-3" />
            <v-text-field label="Maksimal foydalanish" v-model.number="form.max_usage" type="number" class="mb-3" placeholder="Cheksiz bo'lsa bo'sh qoldiring" />
            <v-row dense>
              <v-col cols="6">
                <v-text-field label="Boshlanish" v-model="form.starts_at" type="date" class="mb-3" />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Tugash" v-model="form.ends_at" type="date" class="mb-3" />
              </v-col>
            </v-row>
            <v-switch label="Faol" v-model="form.is_active" color="primary" hide-details inset />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5 pt-3">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Bekor</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog v-model="confirmDialog" title="Kuponni o'chirish" :text="`'${delTarget?.code}' kuponini o'chirmoqchimisiz?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { couponsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader    from '@/components/common/PageLoader.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const fmt    = useFormat()
const snack  = useSnackStore()
const coupons= ref([])
const loading= ref(false)
const dialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()

const emptyForm = () => ({ code: '', name_uz: '', type: 'percent', value: null, min_order_amount: null, max_usage: null, starts_at: '', ends_at: '', is_active: true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(c) {
  editItem.value = c
  form.value = { code: c.code, name_uz: c.name_uz || '', type: c.type || 'percent', value: c.value, min_order_amount: c.min_order_amount || null, max_usage: c.max_usage || null, starts_at: c.starts_at?.split('T')[0] || '', ends_at: c.ends_at?.split('T')[0] || '', is_active: c.is_active }
  dialog.value = true
}
function confirmDel(c) { delTarget.value = c; confirmDialog.value = true }

async function toggle(c) {
  try {
    if (c.is_active) await couponsApi.deactivate(c.id)
    else await couponsApi.activate(c.id)
    c.is_active = !c.is_active
    snack.success(c.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch { snack.error('Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.max_usage) delete payload.max_usage
    if (editItem.value) { await couponsApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else               { await couponsApi.create(payload); snack.success("Qo'shildi") }
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
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await couponsApi.list({ per_page: 100 })
    coupons.value = data.data?.items || data.data || []
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
