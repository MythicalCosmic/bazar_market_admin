<template>
  <div>
    <BzPageHeader title="Kategoriyalar">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate(null)">Kategoriya qo'shish</v-btn>
      </template>
    </BzPageHeader>

    <!-- Stats -->
    <v-row dense class="mb-2">
      <v-col cols="6" sm="3">
        <BzStatCard title="Jami" :value="stats.total" icon="mdi-tag-multiple-outline" color="#3B82F6" bg-color="rgba(59,130,246,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Faol" :value="stats.active" icon="mdi-check-circle-outline" color="#16A34A" bg-color="rgba(22,163,74,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Ota-kategoriyalar" :value="stats.root" icon="mdi-folder-outline" color="#8B5CF6" bg-color="rgba(139,92,246,0.10)" :loading="statsLoading" />
      </v-col>
      <v-col cols="6" sm="3">
        <BzStatCard title="Subkategoriyalar" :value="stats.sub" icon="mdi-source-branch" color="#F59E0B" bg-color="rgba(245,158,11,0.10)" :loading="statsLoading" />
      </v-col>
    </v-row>

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
            <BzImg
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
    <v-dialog v-model="dialog" max-width="680" persistent scrollable>
      <v-card rounded="xl">
        <!-- Header -->
        <div class="bz-dialog-header">
          <div class="d-flex align-center ga-3">
            <div class="bz-dialog-icon" :style="{ background: editItem ? 'var(--bz-primary-soft)' : 'rgba(34,197,94,0.12)' }">
              <v-icon :color="editItem ? 'primary' : 'success'" size="22">{{ editItem ? 'mdi-pencil-outline' : 'mdi-plus' }}</v-icon>
            </div>
            <div>
              <div style="font-weight:800;font-size:17px">{{ editItem ? editItem.name_uz : 'Yangi kategoriya' }}</div>
              <div v-if="editItem" style="font-size:12px;color:var(--bz-text-3);margin-top:1px">
                ID: {{ editItem.id }}
                <span v-if="editItem.children_count"> · {{ editItem.children_count }} subkategoriya</span>
                <span v-if="editItem.products_count"> · {{ editItem.products_count }} mahsulot</span>
              </div>
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>

        <!-- Tabs (edit mode) -->
        <template v-if="editItem">
          <v-tabs v-model="catTab" color="primary" density="comfortable" style="padding:0 8px">
            <v-tab value="info"><v-icon start size="16">mdi-information-outline</v-icon> Ma'lumot</v-tab>
            <v-tab value="children">
              <v-icon start size="16">mdi-source-branch</v-icon> Subkategoriyalar
              <v-chip v-if="editChildren.length" size="x-small" color="primary" variant="tonal" class="ml-1">{{ editChildren.length }}</v-chip>
            </v-tab>
          </v-tabs>
        </template>
        <v-divider />

        <v-card-text class="pa-5" style="max-height:60vh">
          <!-- Info tab -->
          <v-form v-if="catTab === 'info' || !editItem" ref="formRef">
            <v-text-field label="Nomi (UZ) *" v-model="form.name_uz" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-text-field label="Nomi (RU)"   v-model="form.name_ru" class="mb-3" />

            <!-- Image upload -->
            <div class="bz-cat-upload mb-3">
              <div v-if="form.image" style="position:relative">
                <BzImg :src="form.image" cover height="140" rounded="lg" />
                <v-btn icon size="x-small" color="error" variant="flat" style="position:absolute;top:6px;right:6px" @click="form.image = ''">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
              <div v-else class="bz-cat-dropzone" @click="$refs.catFileInput?.click()">
                <input ref="catFileInput" type="file" accept="image/*" hidden @change="onPickCatFile" />
                <v-icon size="28" color="primary" style="opacity:0.5">mdi-cloud-upload-outline</v-icon>
                <div style="font-weight:600;font-size:12.5px;margin-top:6px">Rasm yuklash</div>
              </div>
            </div>
            <v-progress-linear v-if="fileUpload.uploading.value" :model-value="fileUpload.progress.value" color="primary" rounded class="mb-3" />

            <v-row dense>
              <v-col cols="6"><v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" /></v-col>
              <v-col cols="6">
                <v-select
                  v-if="!form.parent_id"
                  label="Ota-kategoriya"
                  v-model="form.parent_id"
                  :items="rootCats"
                  item-title="name_uz"
                  item-value="id"
                  clearable
                  placeholder="Yo'q (ota)"
                />
                <div v-else class="d-flex align-center ga-2 pt-3" style="font-size:12.5px;color:var(--bz-text-3)">
                  <v-icon size="14">mdi-source-branch</v-icon>
                  Ota: <b>{{ parentName(form.parent_id) }}</b>
                  <v-btn variant="text" size="x-small" color="error" @click="form.parent_id = null">X</v-btn>
                </div>
              </v-col>
            </v-row>
            <v-switch label="Faol" v-model="form.is_active" color="success" />
          </v-form>

          <!-- Children tab (edit only) -->
          <div v-if="editItem && catTab === 'children'">
            <!-- Add new subcategory -->
            <div class="d-flex align-center ga-2 mb-4">
              <v-text-field
                v-model="newChildName"
                placeholder="Yangi subkategoriya nomi…"
                hide-details
                density="comfortable"
                prepend-inner-icon="mdi-plus"
              />
              <v-btn color="primary" rounded="lg" :loading="addingChild" :disabled="!newChildName.trim()" @click="addChild">
                Qo'shish
              </v-btn>
            </div>

            <BzEmptyState v-if="!editChildren.length" icon="mdi-source-branch" title="Subkategoriyalar yo'q" subtitle="Yuqoridagi maydondan qo'shing" />

            <!-- Subcategory list -->
            <div v-else class="d-flex flex-column ga-2">
              <div
                v-for="child in editChildren"
                :key="child.id"
                class="bz-child-row"
              >
                <div class="d-flex align-center ga-3" style="flex:1;min-width:0">
                  <BzImg v-if="child.image" :src="child.image" width="36" height="36" rounded="lg" cover />
                  <v-avatar v-else size="36" color="primary" variant="tonal" rounded="lg">
                    <v-icon size="18">mdi-tag-outline</v-icon>
                  </v-avatar>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:13.5px">{{ child.name_uz }}</div>
                    <div style="font-size:11px;color:var(--bz-text-3)">
                      ID: {{ child.id }}
                      <span v-if="child.products_count"> · {{ child.products_count }} mahsulot</span>
                    </div>
                  </div>
                </div>
                <div class="d-flex align-center ga-1">
                  <v-chip :color="child.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
                    {{ child.is_active ? 'Faol' : 'Nofaol' }}
                  </v-chip>
                  <v-btn icon variant="text" size="x-small" @click="editSubcat(child)" title="Tahrirlash">
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="x-small" :color="child.is_active ? 'warning' : 'success'" @click="toggleChild(child)" title="Holat">
                    <v-icon size="16">{{ child.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="x-small" color="error" @click="confirmDel(child)" title="O'chirish">
                    <v-icon size="16">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Yopish</v-btn>
          <v-btn v-if="catTab === 'info'" color="primary" rounded="lg" :loading="saving" @click="save">
            <v-icon start>mdi-content-save-outline</v-icon> Saqlash
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BzConfirmDialog v-model="confirmDialog" title="Kategoriyani o'chirish" :text="`'${delTarget?.name_uz}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { categoriesApi, statsApi } from '@/api'
import { useFileUpload } from '@/composables/useFileUpload'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader  from '@/components/common/BzPageHeader.vue'
import BzStatCard    from '@/components/common/BzStatCard.vue'
import BzEmptyState  from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'
import BzImg           from '@/components/common/BzImg.vue'

const snack = useSnackStore()

const stats = ref({ total: 0, active: 0, root: 0, sub: 0 })
const statsLoading = ref(false)

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
const catTab  = ref('info')
const catFileInput = ref()
const fileUpload   = useFileUpload()

const editChildren = ref([])
const newChildName = ref('')
const addingChild  = ref(false)

function onPickCatFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileUpload.upload(file).then(url => { if (url) form.value.image = url })
  e.target.value = ''
}

const emptyForm = () => ({ name_uz:'', name_ru:'', image:'', sort_order:0, parent_id:null, is_active:true })
const form = ref(emptyForm())

const rootCats = computed(() => tree.value.filter(c => !editItem.value || c.id !== editItem.value.id))

function openCreate(parent) {
  editItem.value = null
  catTab.value = 'info'
  editChildren.value = []
  form.value = { ...emptyForm(), parent_id: parent?.id || null }
  dialog.value = true
}
function openEdit(c) {
  editItem.value = c
  catTab.value = 'info'
  editChildren.value = c.children || []
  form.value = {
    name_uz: c.name_uz || '', name_ru: c.name_ru || '',
    image: c.image || '', sort_order: c.sort_order ?? 0,
    parent_id: c.parent_id || null, is_active: c.is_active,
  }
  dialog.value = true
}
function editSubcat(child) {
  // Open the subcategory for editing
  openEdit(child)
}
function confirmDel(c) { delTarget.value = c; confirmDialog.value = true }

async function addChild() {
  if (!editItem.value || !newChildName.value.trim()) return
  addingChild.value = true
  try {
    await categoriesApi.create({ name_uz: newChildName.value.trim(), parent_id: editItem.value.id, is_active: true, sort_order: editChildren.value.length })
    newChildName.value = ''
    snack.success("Subkategoriya qo'shildi")
    await reloadEditChildren()
    load(); loadStats()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { addingChild.value = false }
}

async function toggleChild(child) {
  try {
    if (child.is_active) await categoriesApi.deactivate(child.id)
    else await categoriesApi.activate(child.id)
    child.is_active = !child.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function reloadEditChildren() {
  try {
    const { data } = await categoriesApi.tree()
    const allTree = data.data || []
    const find = (nodes) => {
      for (const n of nodes) {
        if (n.id === editItem.value.id) return n.children || []
        if (n.children?.length) { const r = find(n.children); if (r) return r }
      }
      return null
    }
    editChildren.value = find(allTree) || []
  } catch {}
}

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

async function loadStats() {
  statsLoading.value = true
  try {
    const { data } = await statsApi.categories()
    const d = data.data || {}
    stats.value = { total: d.total || 0, active: d.active || 0, root: d.root_categories || 0, sub: d.subcategories || 0 }
  } catch {} finally { statsLoading.value = false }
}

onMounted(() => { load(); loadStats() })
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

/* Dialog */
.bz-dialog-header {
  padding: 20px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bz-dialog-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Image upload */
.bz-cat-dropzone {
  border: 2px dashed var(--bz-border);
  border-radius: 14px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all var(--bz-dur) var(--bz-ease);
  background: var(--bz-surface-2);
}
.bz-cat-dropzone:hover {
  border-color: var(--bz-primary);
  background: var(--bz-primary-soft);
}

/* Child row */
.bz-child-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid var(--bz-border);
  background: var(--bz-surface-2);
  transition: background var(--bz-dur) var(--bz-ease);
}
.bz-child-row:hover {
  background: var(--bz-surface-3);
}
</style>
