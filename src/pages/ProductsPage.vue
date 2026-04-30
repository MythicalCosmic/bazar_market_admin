<template>
  <div>
    <BzPageHeader title="Mahsulotlar" :subtitle="total ? `${total} ta jami` : ''">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Mahsulot qo'shish</v-btn>
      </template>
    </BzPageHeader>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Mahsulot nomi…" @search="onSearch">
      <v-select v-model="f.category_id" :items="categories" item-title="name" item-value="id" placeholder="Kategoriya" clearable hide-details density="comfortable" style="max-width:220px" @update:model-value="load" />
      <v-select v-model="f.is_active" :items="[{t:'Faol',v:'true'},{t:'Nofaol',v:'false'}]" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
      <v-select v-model="f.in_stock" :items="boolOptions" item-title="t" item-value="v" placeholder="Omborda" clearable hide-details density="comfortable" style="max-width:130px" @update:model-value="load" />
      <v-select v-model="f.has_discount" :items="boolOptions" item-title="t" item-value="v" placeholder="Chegirma" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
    </BzFilterBar>

    <!-- Loading skeletons -->
    <v-row v-if="loading" dense>
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-card rounded="xl" class="bz-card" style="overflow:hidden">
          <div class="bz-skeleton" style="width:100%;height:200px;border-radius:0" />
          <div class="pa-4">
            <div class="bz-skeleton mb-2" style="width:70%;height:14px" />
            <div class="bz-skeleton mb-2" style="width:40%;height:12px" />
            <div class="bz-skeleton" style="width:50%;height:20px" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-card v-else-if="!products.length" rounded="xl" class="bz-card">
      <BzEmptyState icon="mdi-cube-off-outline" title="Mahsulotlar topilmadi">
        <v-btn variant="tonal" color="primary" @click="openCreate">Birinchi mahsulotni yarating</v-btn>
      </BzEmptyState>
    </v-card>

    <!-- Product cards grid -->
    <v-row v-else dense>
      <v-col v-for="item in products" :key="item.id" cols="12" sm="6" md="4" lg="3">
        <v-card rounded="xl" class="bz-product-card bz-card" style="height:100%;display:flex;flex-direction:column">
          <!-- Image area -->
          <div class="bz-product-img-wrap" @click="openEdit(item)">
            <v-img
              :src="item.primary_image || item.image || item.images?.[0]?.image || 'https://placehold.co/400x300/f1f5f9/94a3b8?text=Rasm+yo%27q'"
              height="200"
              cover
              class="bz-product-img"
            />

            <!-- Overlay badges -->
            <div class="bz-product-badges">
              <v-chip
                v-if="item.discount && item.discounted_price && item.discounted_price !== item.price"
                size="x-small" color="error" variant="flat" class="chip-sm" style="font-weight:800"
              ><v-icon start size="10">mdi-sale</v-icon> {{ item.discount.discount_type === 'percent' ? `-${item.discount.discount_value}%` : fmt.price(item.discount.discount_amount) }}</v-chip>
              <v-chip
                v-if="item.is_featured"
                size="x-small" color="warning" variant="flat" class="chip-sm"
              ><v-icon start size="11">mdi-star</v-icon> Featured</v-chip>
              <v-chip
                v-if="item.is_low_stock"
                size="x-small" color="error" variant="flat" class="chip-sm"
              ><v-icon start size="11">mdi-alert</v-icon> Kam</v-chip>
            </div>

            <!-- Status pill -->
            <v-chip
              :color="item.is_active ? 'success' : 'error'"
              variant="flat" size="x-small"
              class="chip-sm bz-product-status"
            >{{ item.is_active ? 'Faol' : 'Nofaol' }}</v-chip>

            <!-- Hover overlay -->
            <div class="bz-product-overlay">
              <v-icon size="22" color="white">mdi-pencil-outline</v-icon>
              <span style="font-size:11.5px;color:white;font-weight:600;margin-top:4px">Tahrirlash</span>
            </div>
          </div>

          <!-- Content -->
          <div class="pa-4" style="flex:1;display:flex;flex-direction:column">
            <!-- Category -->
            <div style="font-size:11.5px;color:var(--bz-text-3);font-weight:600;margin-bottom:4px">
              {{ item.category_name || item.category?.name_uz || 'Kategoriyasiz' }}
            </div>

            <!-- Name -->
            <div style="font-weight:800;font-size:14.5px;line-height:1.3;margin-bottom:8px;flex:1">
              {{ item.name_uz || item.name }}
            </div>

            <!-- SKU -->
            <div v-if="item.sku" style="font-size:11px;color:var(--bz-text-3);font-family:ui-monospace,monospace;margin-bottom:8px">
              {{ item.sku }}
            </div>

            <!-- Price + stock -->
            <div class="d-flex align-center justify-space-between" style="margin-bottom:10px">
              <div>
                <!-- Discounted price -->
                <template v-if="item.discount && item.discounted_price && item.discounted_price !== item.price">
                  <span class="num" style="font-weight:800;font-size:16px;color:var(--bz-primary)">{{ fmt.price(item.discounted_price) }}</span>
                  <span class="num" style="font-size:12px;color:var(--bz-text-3);text-decoration:line-through;margin-left:6px">{{ fmt.price(item.price) }}</span>
                  <div class="d-flex align-center ga-1 mt-1">
                    <v-chip size="x-small" color="error" variant="flat" class="chip-sm" style="font-weight:800">
                      <v-icon start size="10">mdi-tag-outline</v-icon>
                      {{ item.discount.discount_type === 'percent' ? `-${item.discount.discount_value}%` : `-${fmt.price(item.discount.discount_amount)}` }}
                    </v-chip>
                    <span v-if="item.discount.discount_name" style="font-size:10.5px;color:var(--bz-text-3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="item.discount.discount_name">
                      {{ item.discount.discount_name }}
                    </span>
                  </div>
                </template>
                <!-- Regular price -->
                <template v-else>
                  <span class="num" style="font-weight:800;font-size:16px;color:var(--bz-primary)">{{ fmt.price(item.price) }}</span>
                </template>
                <div v-if="item.cost_price" style="font-size:11px;color:var(--bz-text-3);margin-top:2px">Tannarx: {{ fmt.price(item.cost_price) }}</div>
              </div>
              <v-chip
                :color="item.in_stock && Number(item.stock_qty || 0) > 0 ? 'success' : 'error'"
                variant="tonal" size="x-small" class="chip-sm"
              >
                <v-icon start size="11">{{ item.in_stock ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
                {{ item.stock_qty ?? 0 }} {{ item.unit || 'ta' }}
              </v-chip>
            </div>

            <!-- Margin bar -->
            <v-progress-linear
              v-if="item.margin != null"
              :model-value="Math.min(item.margin, 100)"
              :color="item.margin >= 30 ? 'success' : item.margin >= 15 ? 'warning' : 'error'"
              height="4" rounded
              bg-color="grey-lighten-3"
              class="mb-3"
            />

            <!-- Actions -->
            <div class="d-flex align-center ga-1 pt-1" style="border-top:1px solid var(--bz-border)">
              <v-btn
                icon variant="text" size="small"
                :title="item.is_featured ? 'Featured olib tashlash' : 'Featured qilish'"
                @click.stop="toggleFeature(item)"
              >
                <v-icon size="18" :color="item.is_featured ? 'warning' : 'grey'">{{ item.is_featured ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click.stop="openEdit(item)">
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-spacer />
              <v-btn
                icon variant="text" size="small"
                :color="item.is_active ? 'warning' : 'success'"
                @click.stop="toggleActive(item)"
              >
                <v-icon size="18">{{ item.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click.stop="confirmDel(item)">
                <v-icon size="18">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-card v-if="!loading && products.length" rounded="xl" class="bz-card mt-4">
      <div class="d-flex align-center justify-space-between px-4 py-3 ga-3" style="flex-wrap:wrap">
        <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b style="color:var(--bz-text-1)">{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[12,24,48]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="780" persistent scrollable>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <v-tabs v-model="formTab" color="primary" density="comfortable" :disabled="!editItem && tabsRequireEdit" :hide-slider="false">
          <v-tab value="info"><v-icon start size="16">mdi-information-outline</v-icon> Ma'lumot</v-tab>
          <v-tab value="images" :disabled="!editItem"><v-icon start size="16">mdi-image-multiple-outline</v-icon> Rasmlar</v-tab>
          <v-tab value="stock" :disabled="!editItem"><v-icon start size="16">mdi-warehouse</v-icon> Ombor</v-tab>
          <v-tab value="discounts" :disabled="!editItem"><v-icon start size="16">mdi-sale</v-icon> Chegirmalar</v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pa-5" style="max-height:60vh">
          <!-- Info -->
          <v-form v-if="formTab === 'info'" ref="formRef">
            <v-row dense>
              <v-col cols="12" sm="6"><v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Nomi (RU)" v-model="form.name_ru" /></v-col>
              <v-col cols="12" sm="6"><v-select label="Kategoriya *" v-model="form.category_id" :items="categories" item-title="name" item-value="id" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-select label="Birlik *" v-model="form.unit" :items="['kg','piece','liter','pack','bundle']" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Narxi (UZS) *" v-model.number="form.price" type="number" :rules="[r => r > 0 || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Tannarx" v-model.number="form.cost_price" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="SKU" v-model="form.sku" style="font-family:monospace" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Shtrix-kod" v-model="form.barcode" style="font-family:monospace" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Min miqdor" v-model.number="form.min_qty" type="number" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Max miqdor" v-model.number="form.max_qty" type="number" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Qadam" v-model.number="form.step" type="number" step="0.1" /></v-col>
              <v-col cols="12"><v-textarea label="Tavsif (UZ)" v-model="form.description_uz" rows="3" /></v-col>
              <v-col cols="12" class="d-flex ga-4">
                <v-switch label="Faol" v-model="form.is_active" />
                <v-switch label="Featured" v-model="form.is_featured" color="warning" />
              </v-col>
            </v-row>
          </v-form>

          <!-- Images -->
          <div v-if="formTab === 'images'">
            <div class="d-flex ga-2 mb-3">
              <v-text-field v-model="newImageUrl" placeholder="https://… rasm URL" hide-details density="comfortable" />
              <v-btn color="primary" rounded="lg" :loading="imageLoading" :disabled="!newImageUrl" @click="addImage">Qo'shish</v-btn>
            </div>
            <BzEmptyState v-if="!productImages.length" icon="mdi-image-off-outline" title="Rasmlar yo'q" />
            <div v-else class="d-flex flex-wrap ga-3">
              <div
                v-for="img in productImages" :key="img.id"
                class="bz-img-card"
                draggable="true"
                @dragstart="dragImg = img.id"
                @dragover.prevent
                @drop="dropImg(img.id)"
              >
                <v-img :src="img.image || img.url" width="120" height="120" rounded="lg" cover />
                <div class="d-flex align-center justify-space-between pt-1">
                  <v-btn icon variant="text" size="x-small" :color="img.is_primary ? 'warning' : ''" @click="setPrimary(img)">
                    <v-icon size="16">{{ img.is_primary ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="x-small" color="error" @click="removeImage(img)">
                    <v-icon size="16">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>

          <!-- Stock -->
          <v-form v-if="formTab === 'stock'">
            <v-row dense>
              <v-col cols="12" sm="4"><v-text-field label="Ombor miqdori" v-model.number="form.stock_qty" type="number" /></v-col>
              <v-col cols="12" sm="4"><v-text-field label="Past chegara" v-model.number="form.low_stock_threshold" type="number" /></v-col>
              <v-col cols="12" sm="4"><v-switch label="Omborda bor" v-model="form.in_stock" /></v-col>
              <v-col cols="12">
                <v-btn color="primary" rounded="lg" :loading="stockLoading" @click="saveStock"><v-icon start>mdi-content-save-outline</v-icon> Ombor saqlash</v-btn>
              </v-col>
            </v-row>
          </v-form>

          <!-- Discounts -->
          <div v-if="formTab === 'discounts'">
            <BzEmptyState v-if="!discounts.length" icon="mdi-sale" title="Chegirmalar yo'q">
              <v-btn variant="tonal" color="primary" to="/discounts">Chegirma yaratish</v-btn>
            </BzEmptyState>
            <v-list v-else class="pa-0">
              <v-list-item v-for="d in discounts" :key="d.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                <template #prepend>
                  <v-checkbox-btn :model-value="assignedDiscounts.includes(d.id)" @update:model-value="toggleDiscount(d.id, $event)" />
                </template>
                <v-list-item-title style="font-weight:700;font-size:13.5px">{{ d.name_uz }}</v-list-item-title>
                <v-list-item-subtitle style="font-size:12px;color:var(--bz-text-3)">{{ d.type === 'percent' ? `${d.value}%` : fmt.price(d.value) }} chegirma · {{ fmt.date(d.starts_at) }} – {{ fmt.date(d.expires_at || d.ends_at) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Yopish</v-btn>
          <v-btn v-if="formTab === 'info'" color="primary" rounded="lg" :loading="saving" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BzConfirmDialog v-model="confirmDialog" title="Mahsulotni o'chirish" :text="`'${delTarget?.name_uz}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { productsApi, categoriesApi, discountsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader  from '@/components/common/BzPageHeader.vue'
import BzFilterBar   from '@/components/common/BzFilterBar.vue'
import BzEmptyState  from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const products  = ref([])
const categories= ref([])
const discounts = ref([])
const loading   = ref(false)
const total     = ref(0)
const dialog    = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const editItem  = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef   = ref()
const formTab   = ref('info')

const productImages = ref([])
const newImageUrl   = ref('')
const imageLoading  = ref(false)
const dragImg       = ref(null)
const stockLoading  = ref(false)
const assignedDiscounts = ref([])

const f = ref({ q: '', category_id: null, is_active: null, in_stock: null, has_discount: null, page: 1, per_page: 12, order_by: '-created_at' })

const boolOptions = [
  { t: 'Bor', v: 'true' },
  { t: "Yo'q", v: 'false' },
]
const pages = computed(() => Math.ceil(total.value / f.value.per_page))
const tabsRequireEdit = computed(() => !editItem.value)

const emptyForm = () => ({
  name_uz:'', name_ru:'', category_id:null, unit:'kg', price:null, cost_price:null,
  sku:'', barcode:'', description_uz:'',
  step:1, min_qty:1, max_qty:null, in_stock:true, stock_qty:0, low_stock_threshold:null,
  sort_order:0, is_active:true, is_featured:false,
})
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); formTab.value = 'info'; dialog.value = true }
async function openEdit(p) {
  editItem.value = p
  formTab.value = 'info'
  // Load full product detail for relations
  try {
    const { data } = await productsApi.get(p.id)
    const d = data.data || p
    form.value = {
      name_uz: d.name_uz || '', name_ru: d.name_ru || '',
      category_id: d.category_id || d.category?.id || null,
      unit: d.unit || 'kg',
      price: d.price ?? null, cost_price: d.cost_price ?? null,
      sku: d.sku || '', barcode: d.barcode || '',
      description_uz: d.description_uz || '',
      step: d.step ?? 1, min_qty: d.min_qty ?? 1, max_qty: d.max_qty ?? null,
      in_stock: d.in_stock ?? true, stock_qty: d.stock_qty ?? 0, low_stock_threshold: d.low_stock_threshold ?? null,
      sort_order: d.sort_order ?? 0, is_active: d.is_active ?? true, is_featured: d.is_featured ?? false,
    }
    productImages.value = d.images || []
    assignedDiscounts.value = (d.discounts || []).map(x => x.id)
  } catch {}
  dialog.value = true
}

function confirmDel(item) { delTarget.value = item; confirmDialog.value = true }

async function toggleActive(item) {
  try {
    if (item.is_active) await productsApi.deactivate(item.id)
    else await productsApi.activate(item.id)
    item.is_active = !item.is_active
    snack.success(item.is_active ? 'Faollashtirildi' : 'Nofaollashtirildi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}
async function toggleFeature(item) {
  try {
    if (item.is_featured) await productsApi.unfeature(item.id)
    else await productsApi.feature(item.id)
    item.is_featured = !item.is_featured
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
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
      const { data } = await productsApi.create(form.value)
      const created = data.data
      // Switch into edit mode so other tabs become available
      if (created?.id) {
        editItem.value = created
        productImages.value = []
        assignedDiscounts.value = []
      }
      snack.success("Qo'shildi")
    }
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await productsApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await productsApi.list(fmt.cleanParams({ ...f.value }))
    products.value = data.data?.items || data.data || []
    total.value    = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

// Images
async function addImage() {
  if (!editItem.value || !newImageUrl.value) return
  imageLoading.value = true
  try {
    await productsApi.addImages(editItem.value.id, [{ image: newImageUrl.value, is_primary: !productImages.value.length }])
    newImageUrl.value = ''
    await reloadEdit()
    snack.success('Rasm qo\'shildi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { imageLoading.value = false }
}
async function removeImage(img) {
  try { await productsApi.removeImage(editItem.value.id, img.id); await reloadEdit() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}
async function setPrimary(img) {
  try { await productsApi.setPrimaryImage(editItem.value.id, img.id); await reloadEdit() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}
async function dropImg(targetId) {
  if (!dragImg.value || dragImg.value === targetId) return
  const ids = productImages.value.map(i => i.id)
  const fromIdx = ids.indexOf(dragImg.value)
  const toIdx   = ids.indexOf(targetId)
  ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0])
  try { await productsApi.reorderImages(editItem.value.id, ids); await reloadEdit() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  dragImg.value = null
}
async function reloadEdit() {
  const { data } = await productsApi.get(editItem.value.id)
  productImages.value = data.data?.images || []
}

// Stock
async function saveStock() {
  stockLoading.value = true
  try {
    await productsApi.setStock(editItem.value.id, {
      stock_qty: form.value.stock_qty,
      in_stock:  form.value.in_stock,
      low_stock_threshold: form.value.low_stock_threshold,
    })
    snack.success('Ombor yangilandi'); load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { stockLoading.value = false }
}

// Discounts
async function toggleDiscount(id, on) {
  try {
    if (on) {
      await productsApi.assignDiscounts(editItem.value.id, [id])
      assignedDiscounts.value = [...assignedDiscounts.value, id]
    } else {
      await productsApi.removeDiscounts(editItem.value.id, [id])
      assignedDiscounts.value = assignedDiscounts.value.filter(x => x !== id)
    }
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

watch(formTab, async tab => {
  if (tab === 'discounts' && !discounts.value.length) {
    try { const { data } = await discountsApi.list({ per_page: 100, current_only: 'true' }); discounts.value = data.data?.items || [] } catch {}
  }
})

onMounted(async () => {
  load()
  try {
    const { data } = await categoriesApi.list({ per_page: 200 })
    categories.value = (data.data?.items || []).map(c => ({ id: c.id, name: c.name_uz || c.name }))
  } catch {}
})
</script>

<style scoped>
/* Product card */
.bz-product-card {
  overflow: hidden;
  transition: transform var(--bz-dur) var(--bz-ease), box-shadow var(--bz-dur) var(--bz-ease);
}
.bz-product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--bz-shadow-lg);
}

/* Image wrapper */
.bz-product-img-wrap {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: var(--bz-surface-3);
}
.bz-product-img {
  transition: transform 0.4s var(--bz-ease-out);
}
.bz-product-img-wrap:hover .bz-product-img {
  transform: scale(1.06);
}

/* Badges on image */
.bz-product-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 4px;
  z-index: 2;
}
.bz-product-status {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

/* Hover overlay */
.bz-product-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--bz-dur) var(--bz-ease);
  z-index: 3;
}
.bz-product-img-wrap:hover .bz-product-overlay {
  opacity: 1;
}

/* Image manager cards in dialog */
.bz-img-card {
  background: var(--bz-surface-2);
  border: 1px solid var(--bz-border);
  border-radius: 14px;
  padding: 6px;
  cursor: grab;
  transition: transform var(--bz-dur) var(--bz-ease), box-shadow var(--bz-dur) var(--bz-ease);
}
.bz-img-card:hover { transform: translateY(-2px); box-shadow: var(--bz-shadow-md); }
.bz-img-card:active { cursor: grabbing; }
</style>
