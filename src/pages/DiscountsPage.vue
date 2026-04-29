<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Chegirma yaratish</v-btn>
    </div>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <PageLoader v-if="loading" />
      <EmptyState v-else-if="!discounts.length" icon="mdi-sale" title="Chegirmalar yo'q" />
      <v-list v-else class="pa-2">
        <v-list-item v-for="d in discounts" :key="d.id" rounded="lg" class="mb-1" style="min-height:64px">
          <template #prepend>
            <div class="d-flex align-center justify-center flex-shrink-0 mr-3"
              style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,0.10)">
              <v-icon color="warning" size="22">mdi-sale</v-icon>
            </div>
          </template>
          <template #title>
            <span style="font-weight:700;font-size:14px">{{ d.name_uz || d.name }}</span>
          </template>
          <template #subtitle>
            <span style="font-size:12px;color:#64748B">
              {{ d.type === 'percent' ? `${d.value}%` : fmt.price(d.value) }} chegirma
              · {{ fmt.date(d.starts_at) }} – {{ fmt.date(d.ends_at) }}
            </span>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip :color="d.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
                {{ d.is_active ? 'Faol' : 'Nofaol' }}
              </v-chip>
              <v-btn icon variant="text" size="small" :color="d.is_active ? 'warning' : 'success'" @click="toggle(d)">
                <v-icon size="17">{{ d.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(d)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(d)">
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
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Chegirmani tahrirlash' : 'Yangi chegirma' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Nomi (RU)" v-model="form.name_ru" class="mb-3" />
            <v-select label="Turi" v-model="form.type" :items="[{t:'Foiz (%)',v:'percent'},{t:'Summa',v:'amount'}]" item-title="t" item-value="v" class="mb-3" />
            <v-text-field label="Chegirma miqdori *" v-model.number="form.value" type="number" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
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

    <ConfirmDialog v-model="confirmDialog" title="Chegirmani o'chirish" :text="`'${delTarget?.name_uz}' chegirmasini o'chirmoqchimisiz?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { discountsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader    from '@/components/common/PageLoader.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const fmt       = useFormat()
const snack     = useSnackStore()
const discounts = ref([])
const loading   = ref(false)
const dialog    = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const editItem  = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef   = ref()

const emptyForm = () => ({ name_uz: '', name_ru: '', type: 'percent', value: null, starts_at: '', ends_at: '', is_active: true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(d) {
  editItem.value = d
  form.value = { name_uz: d.name_uz || '', name_ru: d.name_ru || '', type: d.type || 'percent', value: d.value, starts_at: d.starts_at?.split('T')[0] || '', ends_at: d.ends_at?.split('T')[0] || '', is_active: d.is_active }
  dialog.value = true
}
function confirmDel(d) { delTarget.value = d; confirmDialog.value = true }

async function toggle(d) {
  try {
    if (d.is_active) await discountsApi.deactivate(d.id)
    else await discountsApi.activate(d.id)
    d.is_active = !d.is_active
    snack.success(d.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch { snack.error('Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) { await discountsApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else               { await discountsApi.create(form.value); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await discountsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await discountsApi.list({ per_page: 100 })
    discounts.value = data.data?.items || data.data || []
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
