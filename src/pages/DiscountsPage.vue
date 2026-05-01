<template>
  <div>
    <BzPageHeader title="Chegirmalar">
      <template #actions>
        <v-switch v-model="currentOnly" label="Faqat amal qiluvchi" hide-details density="compact" inset color="primary" @update:model-value="load" />
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Chegirma yaratish</v-btn>
      </template>
    </BzPageHeader>

    <!-- Stats -->
    <v-row dense class="mb-2">
      <v-col cols="6" sm="3">
        <BzStatCard title="Jami" :value="stats.total" icon="mdi-sale" color="#F59E0B" bg-color="rgba(245,158,11,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Faol" :value="stats.active" icon="mdi-check-circle-outline" color="#16A34A" bg-color="rgba(22,163,74,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Mahsulotlarda" :value="stats.withProducts" icon="mdi-cube-outline" color="#3B82F6" bg-color="rgba(59,130,246,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Kategoriyalarda" :value="stats.withCategories" icon="mdi-tag-multiple-outline" color="#8B5CF6" bg-color="rgba(139,92,246,0.10)" :loading="statsLoading" />
      </v-col>
    </v-row>

    <v-card rounded="xl" class="bz-card pa-3">
      <BzPageLoader v-if="loading" />
      <BzEmptyState v-else-if="!discounts.length" icon="mdi-sale" title="Chegirmalar yo'q" />
      <v-list v-else class="pa-0">
        <v-list-item v-for="d in discounts" :key="d.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border);min-height:74px">
          <template #prepend>
            <div class="d-flex align-center justify-center mr-3 flex-shrink-0" style="width:50px;height:50px;border-radius:14px;background:rgba(245,158,11,0.10)">
              <v-icon color="warning" size="24">mdi-sale</v-icon>
            </div>
          </template>
          <template #title>
            <span style="font-weight:800;font-size:14px">{{ d.name_uz || d.name }}</span>
            <span class="num font-weight-bold" style="font-size:13px;color:var(--bz-warn);margin-left:8px">
              {{ d.type === 'percent' ? `${d.value}%` : fmt.price(d.value) }}
            </span>
          </template>
          <template #subtitle>
            <span style="font-size:12px;color:var(--bz-text-3)">
              {{ fmt.date(d.starts_at) }} – {{ fmt.date(d.expires_at || d.ends_at) }}
            </span>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip :color="d.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">{{ d.is_active ? 'Faol' : 'Nofaol' }}</v-chip>
              <v-btn icon variant="text" size="small" :color="d.is_active ? 'warning' : 'success'" @click="toggle(d)">
                <v-icon size="17">{{ d.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(d)"><v-icon size="17">mdi-pencil-outline</v-icon></v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(d)"><v-icon size="17">mdi-delete-outline</v-icon></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Dialog with tabs -->
    <v-dialog v-model="dialog" max-width="720" persistent scrollable>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Chegirmani tahrirlash' : 'Yangi chegirma' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-tabs v-model="tab" color="primary" density="comfortable">
          <v-tab value="info"><v-icon start size="16">mdi-information-outline</v-icon> Ma'lumot</v-tab>
          <v-tab value="products" :disabled="!editItem"><v-icon start size="16">mdi-cube-outline</v-icon> Mahsulotlar</v-tab>
          <v-tab value="categories" :disabled="!editItem"><v-icon start size="16">mdi-tag-multiple-outline</v-icon> Kategoriyalar</v-tab>
        </v-tabs>
        <v-divider />
        <v-card-text class="pa-5" style="min-height:380px;max-height:60vh">

          <v-form v-if="tab === 'info'" ref="formRef">
            <v-row dense>
              <v-col cols="12" sm="6"><v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Nomi (RU)"   v-model="form.name_ru" /></v-col>
              <v-col cols="12" sm="4"><v-select label="Turi" v-model="form.type" :items="[{t:'Foiz (%)',v:'percent'},{t:'Summa',v:'fixed'}]" item-title="t" item-value="v" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Miqdor *" v-model.number="form.value" type="number" :rules="[r => r > 0 || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Maksimal chegirma (foiz uchun)" v-model.number="form.max_discount" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Boshlanish" v-model="form.starts_at" type="date" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Tugash" v-model="form.expires_at" type="date" /></v-col>
              <v-col cols="12"><v-switch label="Faol" v-model="form.is_active" /></v-col>
            </v-row>
          </v-form>

          <div v-if="tab === 'products'">
            <v-text-field v-model="productQ" placeholder="Mahsulot qidiring…" prepend-inner-icon="mdi-magnify" hide-details density="comfortable" class="mb-3" />
            <BzPageLoader v-if="productsLoading" :size="36" />
            <v-list v-else style="max-height:320px;overflow:auto" class="pa-0">
              <v-list-item v-for="p in filteredProducts" :key="p.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                <template #prepend>
                  <v-checkbox-btn :model-value="selectedProducts.includes(p.id)" @update:model-value="toggleProductSel(p.id, $event)" />
                </template>
                <v-list-item-title style="font-weight:600;font-size:13px">{{ p.name_uz || p.name }}</v-list-item-title>
                <v-list-item-subtitle style="font-size:11.5px">{{ fmt.price(p.price) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div class="mt-3">
              <v-btn color="primary" rounded="lg" :loading="savingTargets" @click="saveProducts">
                <v-icon start>mdi-content-save-outline</v-icon> {{ selectedProducts.length }} ta mahsulotni saqlash
              </v-btn>
            </div>
          </div>

          <div v-if="tab === 'categories'">
            <BzPageLoader v-if="catsLoading" :size="36" />
            <v-list v-else style="max-height:380px;overflow:auto" class="pa-0">
              <v-list-item v-for="c in categoriesList" :key="c.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                <template #prepend>
                  <v-checkbox-btn :model-value="selectedCategories.includes(c.id)" @update:model-value="toggleCatSel(c.id, $event)" />
                </template>
                <v-list-item-title style="font-weight:600;font-size:13px">{{ c.name_uz || c.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <div class="mt-3">
              <v-btn color="primary" rounded="lg" :loading="savingTargets" @click="saveCategories">
                <v-icon start>mdi-content-save-outline</v-icon> {{ selectedCategories.length }} ta kategoriyani saqlash
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Yopish</v-btn>
          <v-btn v-if="tab === 'info'" color="primary" rounded="lg" :loading="saving" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BzConfirmDialog v-model="confirmDialog" title="Chegirmani o'chirish" :text="`'${delTarget?.name_uz}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { discountsApi, productsApi, categoriesApi, statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzStatCard   from '@/components/common/BzStatCard.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const stats = ref({ total: 0, active: 0, withProducts: 0, withCategories: 0 })
const statsLoading = ref(false)

const discounts   = ref([])
const loading     = ref(false)
const dialog      = ref(false)
const saving      = ref(false)
const deleting    = ref(false)
const editItem    = ref(null)
const confirmDialog = ref(false)
const delTarget   = ref(null)
const formRef     = ref()
const tab         = ref('info')
const currentOnly = ref(false)

const productsList = ref([])
const productsLoading = ref(false)
const productQ = ref('')
const selectedProducts = ref([])

const categoriesList = ref([])
const catsLoading = ref(false)
const selectedCategories = ref([])

const savingTargets = ref(false)

const filteredProducts = computed(() => {
  const q = productQ.value.trim().toLowerCase()
  if (!q) return productsList.value
  return productsList.value.filter(p => (p.name_uz || p.name || '').toLowerCase().includes(q))
})

const emptyForm = () => ({ name_uz:'', name_ru:'', type:'percent', value:null, max_discount:null, starts_at:'', expires_at:'', is_active:true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; tab.value = 'info'; form.value = emptyForm(); dialog.value = true }
function openEdit(d) {
  editItem.value = d
  tab.value = 'info'
  form.value = {
    name_uz: d.name_uz || '', name_ru: d.name_ru || '',
    type: d.type || 'percent', value: d.value, max_discount: d.max_discount || null,
    starts_at: fmt.isoDateOnly(d.starts_at), expires_at: fmt.isoDateOnly(d.expires_at || d.ends_at),
    is_active: d.is_active,
  }
  dialog.value = true
}
function confirmDel(d) { delTarget.value = d; confirmDialog.value = true }

async function toggle(d) {
  try {
    if (d.is_active) await discountsApi.deactivate(d.id)
    else             await discountsApi.activate(d.id)
    d.is_active = !d.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) { await discountsApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else {
      const { data } = await discountsApi.create(form.value)
      editItem.value = data.data
      snack.success("Qo'shildi")
    }
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await discountsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const params = { per_page: 100 }
    if (currentOnly.value) params.current_only = 'true'
    const { data } = await discountsApi.list(params)
    discounts.value = data.data?.items || data.data || []
  } catch {} finally { loading.value = false }
}

async function loadProducts() {
  productsLoading.value = true
  try {
    const { data } = await productsApi.list({ per_page: 200 })
    productsList.value = data.data?.items || []
    if (editItem.value) {
      const { data: full } = await discountsApi.get(editItem.value.id)
      selectedProducts.value = (full.data?.products || []).map(x => x.id)
    }
  } catch {} finally { productsLoading.value = false }
}

async function loadCategories() {
  catsLoading.value = true
  try {
    const { data } = await categoriesApi.list({ per_page: 300 })
    categoriesList.value = data.data?.items || []
    if (editItem.value) {
      const { data: full } = await discountsApi.get(editItem.value.id)
      selectedCategories.value = (full.data?.categories || []).map(x => x.id)
    }
  } catch {} finally { catsLoading.value = false }
}

function toggleProductSel(id, on) { selectedProducts.value = on ? [...selectedProducts.value, id] : selectedProducts.value.filter(x => x !== id) }
function toggleCatSel(id, on)     { selectedCategories.value = on ? [...selectedCategories.value, id] : selectedCategories.value.filter(x => x !== id) }

async function saveProducts() {
  if (!editItem.value) return
  savingTargets.value = true
  try { await discountsApi.setProducts(editItem.value.id, selectedProducts.value); snack.success('Mahsulotlar saqlandi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { savingTargets.value = false }
}
async function saveCategories() {
  if (!editItem.value) return
  savingTargets.value = true
  try { await discountsApi.setCategories(editItem.value.id, selectedCategories.value); snack.success('Kategoriyalar saqlandi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { savingTargets.value = false }
}

watch(tab, t => {
  if (t === 'products' && !productsList.value.length) loadProducts()
  if (t === 'categories' && !categoriesList.value.length) loadCategories()
})

async function loadStats() {
  statsLoading.value = true
  try {
    const { data } = await statsApi.discounts()
    const d = data.data || {}
    stats.value = { total: d.total || 0, active: d.active || 0, withProducts: d.with_products || 0, withCategories: d.with_categories || 0 }
  } catch {} finally { statsLoading.value = false }
}

onMounted(() => { load(); loadStats() })
</script>
