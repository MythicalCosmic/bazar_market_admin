<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Kategoriya qo'shish</v-btn>
    </div>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <PageLoader v-if="loading" />
      <div v-else-if="!cats.length">
        <EmptyState icon="mdi-tag-off-outline" title="Kategoriyalar yo'q" />
      </div>
      <v-list v-else class="pa-2">
        <v-list-item
          v-for="cat in cats"
          :key="cat.id"
          rounded="lg"
          class="mb-1"
          style="min-height:60px"
        >
          <template #prepend>
            <v-img
              :src="cat.image || 'https://placehold.co/52x52/f1f5f9/94a3b8?text=?'"
              width="48" height="48" rounded="lg" cover class="mr-3 flex-shrink-0"
            />
          </template>
          <template #title>
            <span style="font-weight:700;font-size:14px">{{ cat.name_uz || cat.name }}</span>
            <v-chip v-if="cat.name_ru" size="x-small" variant="tonal" class="ml-2">{{ cat.name_ru }}</v-chip>
          </template>
          <template #subtitle>
            <span style="font-size:12px;color:#94A3B8">
              Sort: {{ cat.sort_order ?? 0 }}
              · {{ cat.products_count ?? 0 }} mahsulot
            </span>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip
                :color="cat.is_active ? 'success' : 'error'"
                variant="tonal" size="x-small" class="chip-sm"
              >{{ cat.is_active ? 'Faol' : 'Nofaol' }}</v-chip>
              <v-btn
                icon variant="text" size="small"
                :color="cat.is_active ? 'warning' : 'success'"
                @click="toggleCat(cat)"
              >
                <v-icon size="17">{{ cat.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(cat)">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(cat)">
                <v-icon size="17">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Nomi (RU)" v-model="form.name_ru" class="mb-3" />
            <v-text-field label="Rasm URL" v-model="form.image" class="mb-3" />
            <v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" class="mb-3" />
            <v-switch label="Faol" v-model="form.is_active" color="primary" hide-details inset />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5 pt-3">
          <v-btn v-if="editItem" variant="tonal" color="error" :loading="deleting" @click="del">O'chirish</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Bekor</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete -->
    <ConfirmDialog
      v-model="confirmDialog"
      title="Kategoriyani o'chirish"
      :text="`'${delTarget?.name_uz}' kategoriyasini o'chirmoqchimisiz?`"
      :loading="deleting"
      @confirm="del"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoriesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader     from '@/components/common/PageLoader.vue'
import EmptyState     from '@/components/common/EmptyState.vue'
import ConfirmDialog  from '@/components/common/ConfirmDialog.vue'

const fmt    = useFormat()
const snack  = useSnackStore()
const cats   = ref([])
const loading= ref(false)
const dialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()

const emptyForm = () => ({ name_uz: '', name_ru: '', image: '', sort_order: 0, is_active: true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(c) {
  editItem.value = c
  form.value = { name_uz: c.name_uz || '', name_ru: c.name_ru || '', image: c.image || '', sort_order: c.sort_order ?? 0, is_active: c.is_active }
  dialog.value = true
}

function confirmDel(c) { delTarget.value = c; confirmDialog.value = true }

async function toggleCat(c) {
  try {
    if (c.is_active) { await categoriesApi.deactivate(c.id) }
    else             { await categoriesApi.activate(c.id) }
    c.is_active = !c.is_active
    snack.success(c.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch { snack.error('Xatolik') }
}

async function del() {
  const target = editItem.value || delTarget.value
  if (!target) return
  deleting.value = true
  try {
    await categoriesApi.delete(target.id)
    snack.success("O'chirildi")
    dialog.value = false; confirmDialog.value = false; load()
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) { await categoriesApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else                { await categoriesApi.create(form.value); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await categoriesApi.list({ per_page: 200, order_by: 'sort_order' })
    cats.value = data.data?.items || data.data || []
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
