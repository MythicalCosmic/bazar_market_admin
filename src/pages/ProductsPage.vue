<template>
  <div>
    <!-- Filters -->
    <v-card rounded="xl" class="pa-4 mb-4" style="border:1px solid rgba(0,0,0,0.07)">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field v-model="f.q" placeholder="Mahsulot nomi..." prepend-inner-icon="mdi-magnify" clearable hide-details @update:model-value="debounce" />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select v-model="f.category_id" :items="categories" item-title="name" item-value="id" placeholder="Kategoriya" clearable hide-details @update:model-value="load" />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select v-model="f.is_active" :items="[{t:'Faol',v:true},{t:'Nofaol',v:false}]" item-title="t" item-value="v" placeholder="Holat" clearable hide-details @update:model-value="load" />
        </v-col>
        <v-col cols="12" sm="3" class="d-flex justify-end">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Mahsulot qo'shish</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <v-data-table :headers="headers" :items="products" :loading="loading" hide-default-footer :items-per-page="f.per_page">
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-img :src="item.image || item.images?.[0]?.url || 'https://placehold.co/44x44/f1f5f9/94a3b8?text=?'" width="44" height="44" rounded="lg" cover />
            <div>
              <div style="font-weight:700;font-size:13px">{{ item.name_uz || item.name }}</div>
              <div v-if="item.is_featured" style="font-size:11px;color:#F59E0B">⭐ Featured</div>
            </div>
          </div>
        </template>

        <template #item.category="{ item }">
          <span style="font-size:12px;color:#64748B">{{ item.category?.name_uz || item.category_name || '—' }}</span>
        </template>

        <template #item.price="{ item }">
          <span class="num font-weight-bold" style="font-size:13px">{{ fmt.price(item.price) }}</span>
        </template>

        <template #item.stock="{ item }">
          <v-chip :color="item.stock > 0 ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.stock ?? 0 }} ta
          </v-chip>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.is_active ? 'Faol' : 'Nofaol' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex">
            <v-btn icon variant="text" size="small" @click="openEdit(item)">
              <v-icon size="17">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="small" :color="item.is_active ? 'warning' : 'success'" @click="toggleProduct(item)">
              <v-icon size="17">{{ item.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="small" color="error" @click="confirmDel(item)">
              <v-icon size="17">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
        </template>

        <template #loading><PageLoader :size="36" /></template>
        <template #no-data><EmptyState icon="mdi-cube-off-outline" title="Mahsulotlar topilmadi" /></template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div style="font-size:13px;color:#64748B">Jami: <b>{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[10,20,50]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="640" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Nomi (RU)" v-model="form.name_ru" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Narxi (UZS) *" v-model.number="form.price" type="number" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Eski narx" v-model.number="form.old_price" type="number" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="Kategoriya *" v-model="form.category_id" :items="categories" item-title="name" item-value="id" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Ombordagi miqdor" v-model.number="form.stock" type="number" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Birlik (ta, kg, l...)" v-model="form.unit" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Rasm URL" v-model="form.image" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-textarea label="Tavsif (UZ)" v-model="form.description_uz" rows="3" class="mb-3" />
              </v-col>
              <v-col cols="12" class="d-flex ga-4">
                <v-switch label="Faol" v-model="form.is_active" color="primary" hide-details inset />
                <v-switch label="Featured" v-model="form.is_featured" color="warning" hide-details inset />
              </v-col>
            </v-row>
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

    <ConfirmDialog v-model="confirmDialog" title="Mahsulotni o'chirish" :text="`'${delTarget?.name_uz}' mahsulotini o'chirmoqchimisiz?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { productsApi, categoriesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader    from '@/components/common/PageLoader.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const fmt       = useFormat()
const snack     = useSnackStore()
const products  = ref([])
const categories= ref([])
const loading   = ref(false)
const total     = ref(0)
const pages     = computed(() => Math.ceil(total.value / f.value.per_page))
const dialog    = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const editItem  = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef   = ref()

const f = ref({ q: '', category_id: null, is_active: null, page: 1, per_page: 20, order_by: 'sort_order' })

const headers = [
  { title: 'Mahsulot',    key: 'name',      sortable: false },
  { title: 'Kategoriya',  key: 'category',  sortable: false },
  { title: 'Narxi',       key: 'price',     width: 160 },
  { title: 'Ombor',       key: 'stock',     width: 100 },
  { title: 'Holat',       key: 'is_active', width: 100 },
  { title: '',            key: 'actions',   width: 120, sortable: false },
]

const emptyForm = () => ({ name_uz: '', name_ru: '', price: null, old_price: null, category_id: null, stock: 0, unit: 'ta', sort_order: 0, image: '', description_uz: '', is_active: true, is_featured: false })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(item) {
  editItem.value = item
  form.value = {
    name_uz: item.name_uz || '', name_ru: item.name_ru || '',
    price: item.price, old_price: item.old_price || null,
    category_id: item.category_id || item.category?.id || null,
    stock: item.stock ?? 0, unit: item.unit || 'ta',
    sort_order: item.sort_order ?? 0, image: item.image || '',
    description_uz: item.description_uz || '',
    is_active: item.is_active, is_featured: item.is_featured || false,
  }
  dialog.value = true
}

function confirmDel(item) { delTarget.value = item; confirmDialog.value = true }

async function toggleProduct(item) {
  try {
    if (item.is_active) await productsApi.deactivate(item.id)
    else await productsApi.activate(item.id)
    item.is_active = !item.is_active
    snack.success(item.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch { snack.error('Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) {
      await productsApi.update(editItem.value.id, form.value)
      snack.success('Yangilandi')
    } else {
      await productsApi.create(form.value)
      snack.success("Qo'shildi")
    }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await productsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

let timer
function debounce() { clearTimeout(timer); timer = setTimeout(() => { f.value.page = 1; load() }, 400) }

async function load() {
  loading.value = true
  try {
    const { data } = await productsApi.list(fmt.cleanParams({ ...f.value }))
    products.value = data.data?.items || data.data || []
    total.value    = data.data?.total || 0
  } catch {}
  finally { loading.value = false }
}

onMounted(async () => {
  load()
  try {
    const { data } = await categoriesApi.list({ per_page: 200 })
    categories.value = (data.data?.items || data.data || []).map(c => ({ id: c.id, name: c.name_uz || c.name }))
  } catch {}
})
</script>
