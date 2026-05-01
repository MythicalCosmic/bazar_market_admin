<template>
  <div>
    <BzPageHeader title="Bannerlar">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Banner qo'shish</v-btn>
      </template>
    </BzPageHeader>

    <BzPageLoader v-if="loading" />
    <BzEmptyState v-else-if="!banners.length" icon="mdi-image-off-outline" title="Bannerlar yo'q">
      <v-btn variant="tonal" color="primary" @click="openCreate">Birinchi bannerni yarating</v-btn>
    </BzEmptyState>

    <v-row v-else>
      <v-col v-for="b in banners" :key="b.id" cols="12" sm="6" lg="4">
        <v-card rounded="xl" class="bz-card bz-card-hover" style="overflow:hidden;height:100%">
          <div style="position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--bz-surface-3)">
            <BzImg :src="b.image" cover height="100%" />
            <v-chip class="chip-sm" :color="b.is_active ? 'success' : 'error'" variant="flat" size="small" style="position:absolute;top:10px;left:10px">
              {{ b.is_active ? 'Faol' : 'Nofaol' }}
            </v-chip>
            <v-chip v-if="isExpired(b)" class="chip-sm" color="warning" variant="flat" size="small" style="position:absolute;top:10px;right:10px">
              Muddati tugagan
            </v-chip>
          </div>
          <div class="pa-4">
            <div style="font-weight:800;font-size:14.5px">{{ b.title || 'Sarlavhasiz' }}</div>
            <div style="font-size:12px;color:var(--bz-text-3);margin-top:4px">
              <v-icon size="13">{{ linkIcon(b.link_type) }}</v-icon>
              {{ linkLabel(b) }}
            </div>
            <div v-if="b.starts_at || b.expires_at" style="font-size:11.5px;color:var(--bz-text-3);margin-top:6px">
              <v-icon size="13">mdi-calendar-range</v-icon>
              {{ b.starts_at ? fmt.date(b.starts_at) : '∞' }} – {{ b.expires_at ? fmt.date(b.expires_at) : '∞' }}
            </div>
            <div class="d-flex align-center justify-end ga-1 mt-3">
              <v-btn icon variant="text" size="small" :color="b.is_active ? 'warning' : 'success'" @click="toggle(b)">
                <v-icon size="17">{{ b.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(b)"><v-icon size="17">mdi-pencil-outline</v-icon></v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(b)"><v-icon size="17">mdi-delete-outline</v-icon></v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="640" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Bannerni tahrirlash' : 'Yangi banner' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-file-input
              v-model="bannerFile"
              label="Rasm tanlang"
              accept="image/*"
              :rules="[r => !!form.image || !!r || 'Majburiy']"
              prepend-icon="mdi-camera"
              class="mb-3"
              @update:model-value="onBannerFile"
            />
            <v-progress-linear v-if="fileUpload.uploading.value" :model-value="fileUpload.progress.value" color="primary" rounded class="mb-1" />
            <BzImg v-if="form.image" :src="form.image" cover height="180" rounded="lg" class="mb-3" />
            <v-text-field label="Sarlavha" v-model="form.title" class="mb-3" />
            <v-row dense>
              <v-col cols="6"><v-select label="Havola turi" v-model="form.link_type" :items="linkTypes" item-title="t" item-value="v" /></v-col>
              <v-col cols="6"><v-text-field label="Havola qiymati" v-model="form.link_value" :disabled="form.link_type === 'none'" /></v-col>
              <v-col cols="6"><v-text-field label="Boshlanish" v-model="form.starts_at" type="date" /></v-col>
              <v-col cols="6"><v-text-field label="Tugash" v-model="form.expires_at" type="date" /></v-col>
              <v-col cols="6"><v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" /></v-col>
              <v-col cols="6"><v-switch label="Faol" v-model="form.is_active" /></v-col>
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

    <BzConfirmDialog v-model="confirmDialog" title="Bannerni o'chirish" :text="`'${delTarget?.title || delTarget?.id}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bannersApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useFileUpload } from '@/composables/useFileUpload'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'
import BzImg           from '@/components/common/BzImg.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const banners = ref([])
const loading = ref(false)
const dialog  = ref(false)
const saving  = ref(false)
const deleting = ref(false)
const editItem= ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()
const bannerFile  = ref(null)
const fileUpload  = useFileUpload()

async function onBannerFile(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const url = await fileUpload.upload(file)
  if (url) form.value.image = url
}

const linkTypes = [
  { t: "Yo'q",       v: 'none' },
  { t: 'Kategoriya', v: 'category' },
  { t: 'Mahsulot',   v: 'product' },
  { t: 'URL',        v: 'url' },
]

const emptyForm = () => ({ image:'', title:'', link_type:'none', link_value:'', sort_order:0, starts_at:'', expires_at:'', is_active:true })
const form = ref(emptyForm())

function isExpired(b) {
  if (!b.expires_at) return false
  return new Date(b.expires_at).getTime() < Date.now()
}

function linkIcon(t) {
  return { category:'mdi-tag-outline', product:'mdi-cube-outline', url:'mdi-link', none:'mdi-link-off' }[t] || 'mdi-link-off'
}
function linkLabel(b) {
  if (!b.link_type || b.link_type === 'none') return 'Havolasiz'
  if (b.link_type === 'url')      return b.link_value || 'URL'
  if (b.link_type === 'category') return `Kategoriya #${b.link_value}`
  if (b.link_type === 'product')  return `Mahsulot #${b.link_value}`
  return b.link_type
}

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(b) {
  editItem.value = b
  form.value = {
    image: b.image, title: b.title || '',
    link_type: b.link_type || 'none', link_value: b.link_value || '',
    sort_order: b.sort_order ?? 0,
    starts_at: fmt.isoDateOnly(b.starts_at), expires_at: fmt.isoDateOnly(b.expires_at),
    is_active: b.is_active,
  }
  dialog.value = true
}
function confirmDel(b) { delTarget.value = b; confirmDialog.value = true }

async function toggle(b) {
  try {
    if (b.is_active) await bannersApi.deactivate(b.id)
    else             await bannersApi.activate(b.id)
    b.is_active = !b.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form.value }
    if (payload.link_type === 'none') { delete payload.link_value }
    if (editItem.value) { await bannersApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else                { await bannersApi.create(payload); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try { await bannersApi.delete(delTarget.value.id); snack.success("O'chirildi"); confirmDialog.value = false; load() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try { const { data } = await bannersApi.list({ per_page: 100 }); banners.value = data.data?.items || data.data || [] }
  catch {} finally { loading.value = false }
}

onMounted(load)
</script>
