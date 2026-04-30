<template>
  <div>
    <BzPageHeader title="Kategoriyalar">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate(null)">Kategoriya qo'shish</v-btn>
      </template>
    </BzPageHeader>

    <!-- Loading -->
    <v-row v-if="loading" dense>
      <v-col v-for="n in 6" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-card rounded="xl" class="bz-card" style="overflow:hidden">
          <div class="bz-skeleton" style="width:100%;height:160px;border-radius:0" />
          <div class="pa-4"><div class="bz-skeleton mb-2" style="width:65%;height:14px" /><div class="bz-skeleton" style="width:40%;height:12px" /></div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty -->
    <v-card v-else-if="!tree.length" rounded="xl" class="bz-card">
      <BzEmptyState icon="mdi-tag-off-outline" title="Kategoriyalar yo'q">
        <v-btn variant="tonal" color="primary" @click="openCreate(null)">Birinchi kategoriyani yarating</v-btn>
      </BzEmptyState>
    </v-card>

    <!-- Category cards grid -->
    <v-row v-else dense>
      <v-col
        v-for="cat in tree"
        :key="cat.id"
        cols="12" sm="6" md="4" lg="3"
        draggable="true"
        @dragstart="dragId = cat.id"
        @dragover.prevent
        @drop="dropTo(cat.id)"
      >
        <v-card rounded="xl" class="bz-cat-card bz-card" style="height:100%;display:flex;flex-direction:column;overflow:hidden">
          <!-- Image -->
          <div class="bz-cat-img-wrap" @click="openEdit(cat)">
            <v-img
              :src="cat.image || 'https://placehold.co/400x220/f1f5f9/94a3b8?text=' + encodeURIComponent(cat.name_uz || 'Kategoriya')"
              height="160"
              cover
              class="bz-cat-img"
            />
            <v-chip
              :color="cat.is_active ? 'success' : 'error'"
              variant="flat" size="x-small" class="chip-sm"
              style="position:absolute;top:10px;right:10px;z-index:2"
            >{{ cat.is_active ? 'Faol' : 'Nofaol' }}</v-chip>

            <div class="bz-cat-overlay">
              <v-icon size="20" color="white">mdi-pencil-outline</v-icon>
            </div>
          </div>

          <!-- Content -->
          <div class="pa-4" style="flex:1;display:flex;flex-direction:column">
            <div style="font-weight:800;font-size:15px;line-height:1.3">{{ cat.name_uz || cat.name }}</div>
            <div v-if="cat.name_ru" style="font-size:12px;color:var(--bz-text-3);margin-top:2px">{{ cat.name_ru }}</div>

            <div class="d-flex align-center ga-3 mt-3" style="font-size:12px;color:var(--bz-text-3)">
              <div class="d-flex align-center ga-1">
                <v-icon size="14">mdi-cube-outline</v-icon>
                <span class="num" style="font-weight:700">{{ cat.products_count ?? 0 }}</span> mahsulot
              </div>
              <div v-if="cat.children?.length" class="d-flex align-center ga-1">
                <v-icon size="14">mdi-source-branch</v-icon>
                <span class="num" style="font-weight:700">{{ cat.children.length }}</span> sub
              </div>
            </div>

            <!-- Children preview -->
            <div v-if="cat.children?.length" class="d-flex flex-wrap ga-1 mt-3">
              <v-chip
                v-for="child in cat.children.slice(0, 4)"
                :key="child.id"
                size="x-small" variant="tonal" class="chip-sm cursor-pointer"
                @click="openEdit(child)"
              >{{ child.name_uz }}</v-chip>
              <v-chip v-if="cat.children.length > 4" size="x-small" variant="tonal" color="grey" class="chip-sm">
                +{{ cat.children.length - 4 }}
              </v-chip>
            </div>

            <v-spacer />

            <!-- Actions -->
            <div class="d-flex align-center ga-1 pt-3 mt-3" style="border-top:1px solid var(--bz-border)">
              <v-btn variant="text" size="small" rounded="lg" color="primary" @click.stop="openCreate(cat)">
                <v-icon start size="15">mdi-plus</v-icon>
                <span class="hidden-sm-and-down">Sub</span>
              </v-btn>
              <v-spacer />
              <v-btn icon variant="text" size="small" :color="cat.is_active ? 'warning' : 'success'" @click.stop="toggleCat(cat)">
                <v-icon size="18">{{ cat.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click.stop="openEdit(cat)">
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click.stop="confirmDel(cat)">
                <v-icon size="18">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Tahrirlash' : 'Yangi kategoriya' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Nomi (RU)"   v-model="form.name_ru" class="mb-3" />
            <v-text-field label="Rasm URL"    v-model="form.image" class="mb-3" />
            <v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" class="mb-3" />
            <div v-if="form.parent_id" class="mb-3 d-flex align-center ga-2" style="font-size:12px;color:var(--bz-text-3)">
              <v-icon size="14">mdi-source-branch</v-icon>
              Ota-kategoriya: <b>{{ parentName(form.parent_id) }}</b>
              <v-btn variant="text" size="x-small" color="error" @click="form.parent_id = null">Olib tashlash</v-btn>
            </div>
            <v-switch label="Faol" v-model="form.is_active" />
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

    <BzConfirmDialog v-model="confirmDialog" title="Kategoriyani o'chirish" :text="`'${delTarget?.name_uz}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoriesApi } from '@/api'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader  from '@/components/common/BzPageHeader.vue'
import BzEmptyState  from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const snack = useSnackStore()

const tree    = ref([])
const flat    = ref([])
const loading = ref(false)
const dialog  = ref(false)
const saving  = ref(false)
const deleting= ref(false)
const editItem= ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()
const dragId  = ref(null)

const emptyForm = () => ({ name_uz:'', name_ru:'', image:'', sort_order:0, parent_id:null, is_active:true })
const form = ref(emptyForm())

function openCreate(parent) {
  editItem.value = null
  form.value = { ...emptyForm(), parent_id: parent?.id || null }
  dialog.value = true
}
function openEdit(c) {
  editItem.value = c
  form.value = {
    name_uz: c.name_uz || '', name_ru: c.name_ru || '',
    image: c.image || '', sort_order: c.sort_order ?? 0,
    parent_id: c.parent_id || null, is_active: c.is_active,
  }
  dialog.value = true
}
function confirmDel(c) { delTarget.value = c; confirmDialog.value = true }

function parentName(id) {
  return flat.value.find(c => c.id === id)?.name_uz || '—'
}

async function toggleCat(c) {
  try {
    if (c.is_active) await categoriesApi.deactivate(c.id)
    else             await categoriesApi.activate(c.id)
    c.is_active = !c.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editItem.value) { await categoriesApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else                { await categoriesApi.create(form.value); snack.success("Qo'shildi") }
    dialog.value = false
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await categoriesApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function dropTo(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const ids = tree.value.map(c => c.id)
  const fromIdx = ids.indexOf(dragId.value)
  const toIdx   = ids.indexOf(targetId)
  if (fromIdx < 0 || toIdx < 0) return
  ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0])
  try {
    await categoriesApi.reorder(ids)
    snack.success('Tartib saqlandi')
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  dragId.value = null
}

async function load() {
  loading.value = true
  try {
    const { data } = await categoriesApi.tree()
    tree.value = data.data || []
    flatten()
  } catch {
    // Fallback: fetch flat list and build tree
    try {
      const { data } = await categoriesApi.list({ per_page: 500, order_by: 'sort_order' })
      const all = data.data?.items || []
      flat.value = all
      const byParent = {}
      all.forEach(c => { (byParent[c.parent_id || 'root'] ||= []).push(c) })
      const build = (id) => (byParent[id] || []).map(c => ({ ...c, children: build(c.id) }))
      tree.value = build('root')
    } catch {}
  } finally { loading.value = false }
}

function flatten() {
  const out = []
  const walk = (nodes) => nodes.forEach(n => { out.push(n); if (n.children?.length) walk(n.children) })
  walk(tree.value)
  flat.value = out
}

onMounted(load)
</script>

<style scoped>
.bz-cat-card {
  transition: transform var(--bz-dur) var(--bz-ease), box-shadow var(--bz-dur) var(--bz-ease);
}
.bz-cat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--bz-shadow-lg);
}
.bz-cat-img-wrap {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: var(--bz-surface-3);
}
.bz-cat-img {
  transition: transform 0.4s var(--bz-ease-out);
}
.bz-cat-img-wrap:hover .bz-cat-img {
  transform: scale(1.06);
}
.bz-cat-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--bz-dur) var(--bz-ease);
  z-index: 3;
}
.bz-cat-img-wrap:hover .bz-cat-overlay {
  opacity: 1;
}
/* Drag feedback */
[draggable="true"]:active { opacity: 0.65; cursor: grabbing; }
</style>
