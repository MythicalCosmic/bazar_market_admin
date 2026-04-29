<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Zona qo'shish</v-btn>
    </div>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <PageLoader v-if="loading" />
      <EmptyState v-else-if="!zones.length" icon="mdi-map-marker-off-outline" title="Zonalar yo'q" />
      <v-list v-else class="pa-2">
        <v-list-item v-for="z in zones" :key="z.id" rounded="lg" class="mb-1" style="min-height:64px">
          <template #prepend>
            <div class="d-flex align-center justify-center flex-shrink-0 mr-3"
              style="width:44px;height:44px;border-radius:12px;background:rgba(59,130,246,0.10)">
              <v-icon color="info" size="22">mdi-map-marker-radius</v-icon>
            </div>
          </template>
          <template #title>
            <span style="font-weight:700;font-size:14px">{{ z.name_uz || z.name }}</span>
          </template>
          <template #subtitle>
            <span style="font-size:12px;color:#64748B">
              Yetkazib berish narxi: {{ fmt.price(z.delivery_price) }}
              · Min buyurtma: {{ fmt.price(z.min_order_amount) }}
              · ~{{ z.delivery_time_min || '?' }}–{{ z.delivery_time_max || '?' }} min
            </span>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip :color="z.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
                {{ z.is_active ? 'Faol' : 'Nofaol' }}
              </v-chip>
              <v-btn icon variant="text" size="small" :color="z.is_active ? 'warning' : 'success'" @click="toggle(z)">
                <v-icon size="17">{{ z.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(z)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(z)">
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
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Zonani tahrirlash' : 'Yangi zona' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Nomi (RU)" v-model="form.name_ru" class="mb-3" />
            <v-text-field label="Yetkazib berish narxi *" v-model.number="form.delivery_price" type="number" :rules="[r => r !== null && r !== '' || 'Majburiy']" class="mb-3" />
            <v-text-field label="Minimal buyurtma summasi" v-model.number="form.min_order_amount" type="number" class="mb-3" />
            <v-row dense>
              <v-col cols="6">
                <v-text-field label="Min vaqt (min)" v-model.number="form.delivery_time_min" type="number" class="mb-3" />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Max vaqt (min)" v-model.number="form.delivery_time_max" type="number" class="mb-3" />
              </v-col>
            </v-row>
            <v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" class="mb-3" />
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

    <ConfirmDialog v-model="confirmDialog" title="Zonani o'chirish" :text="`'${delTarget?.name_uz}' zonasini o'chirmoqchimisiz?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { zonesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader    from '@/components/common/PageLoader.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const fmt    = useFormat()
const snack  = useSnackStore()
const zones  = ref([])
const loading= ref(false)
const dialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()

const emptyForm = () => ({ name_uz: '', name_ru: '', delivery_price: null, min_order_amount: 0, delivery_time_min: 30, delivery_time_max: 60, sort_order: 0, is_active: true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(z) {
  editItem.value = z
  form.value = { name_uz: z.name_uz || '', name_ru: z.name_ru || '', delivery_price: z.delivery_price, min_order_amount: z.min_order_amount || 0, delivery_time_min: z.delivery_time_min || 30, delivery_time_max: z.delivery_time_max || 60, sort_order: z.sort_order ?? 0, is_active: z.is_active }
  dialog.value = true
}
function confirmDel(z) { delTarget.value = z; confirmDialog.value = true }

async function toggle(z) {
  try {
    if (z.is_active) await zonesApi.deactivate(z.id)
    else await zonesApi.activate(z.id)
    z.is_active = !z.is_active
    snack.success(z.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch { snack.error('Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) { await zonesApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else               { await zonesApi.create(form.value); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await zonesApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await zonesApi.list({ per_page: 100, order_by: 'sort_order' })
    zones.value = data.data?.items || data.data || []
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
