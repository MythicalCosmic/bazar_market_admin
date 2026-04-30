<template>
  <div>
    <BzPageHeader title="Yetkazib berish zonalari">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-vector-polygon" @click="startDrawing">Yangi zona chizish</v-btn>
      </template>
    </BzPageHeader>

    <v-row>
      <!-- List left -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="bz-card pa-3" style="max-height:calc(100vh - 180px);overflow:auto">
          <BzPageLoader v-if="loading" :size="32" />
          <BzEmptyState v-else-if="!zones.length" icon="mdi-map-marker-off-outline" title="Zonalar yo'q" />
          <v-list v-else class="pa-0">
            <v-list-item
              v-for="z in zones" :key="z.id"
              rounded="lg" class="mb-1 cursor-pointer"
              :style="`border:1px solid ${selectedId === z.id ? 'var(--bz-primary)' : 'var(--bz-border)'};background:${selectedId === z.id ? 'var(--bz-primary-soft)' : 'transparent'}`"
              @click="selectedId = z.id"
            >
              <template #prepend>
                <div class="d-flex align-center justify-center mr-2 flex-shrink-0" style="width:36px;height:36px;border-radius:10px;background:rgba(59,130,246,0.10)">
                  <v-icon color="info" size="18">mdi-map-marker-radius</v-icon>
                </div>
              </template>
              <v-list-item-title style="font-weight:700;font-size:13.5px">{{ z.name }}</v-list-item-title>
              <v-list-item-subtitle style="font-size:11.5px;color:var(--bz-text-3)">
                {{ fmt.price(z.delivery_fee) }} · ~{{ z.estimated_minutes || '?' }} min
              </v-list-item-subtitle>
              <template #append>
                <v-chip :color="z.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">{{ z.is_active ? 'Faol' : 'Nofaol' }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card v-if="selected" rounded="xl" class="bz-card pa-4 mt-3">
          <div class="d-flex align-center justify-space-between mb-3">
            <div style="font-weight:800">{{ selected.name }}</div>
            <div class="d-flex ga-1">
              <v-btn icon variant="text" size="small" :color="selected.is_active ? 'warning' : 'success'" @click="toggle(selected)">
                <v-icon size="17">{{ selected.is_active ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openEdit(selected)"><v-icon size="17">mdi-pencil-outline</v-icon></v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDel(selected)"><v-icon size="17">mdi-delete-outline</v-icon></v-btn>
            </div>
          </div>
          <div style="font-size:12.5px;color:var(--bz-text-2);line-height:1.7">
            <div><b>Narx:</b> {{ fmt.price(selected.delivery_fee) }}</div>
            <div><b>Min buyurtma:</b> {{ fmt.price(selected.min_order) }}</div>
            <div><b>Vaqt:</b> ~{{ selected.estimated_minutes || '?' }} min</div>
          </div>
        </v-card>
      </v-col>

      <!-- Map right -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="bz-card" style="height:calc(100vh - 180px);overflow:hidden">
          <ZoneMap
            :zones="zones"
            :selected-id="selectedId"
            :drawing="drawing"
            @draw="onDraw"
            @edit="onEdit"
            @select="id => selectedId = id"
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Form dialog -->
    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Zonani tahrirlash' : 'Yangi zona' }}</span>
          <v-btn icon variant="text" @click="dialog = false; pendingPolygon = null"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Nomi *" v-model="form.name" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
            <v-row dense>
              <v-col cols="6"><v-text-field label="Yetkazib berish narxi *" v-model.number="form.delivery_fee" type="number" :rules="[r => r >= 0 || 'Majburiy']" /></v-col>
              <v-col cols="6"><v-text-field label="Min buyurtma" v-model.number="form.min_order" type="number" /></v-col>
              <v-col cols="6"><v-text-field label="Tahminiy daqiqa" v-model.number="form.estimated_minutes" type="number" /></v-col>
              <v-col cols="6"><v-text-field label="Sort tartibi" v-model.number="form.sort_order" type="number" /></v-col>
            </v-row>
            <v-switch label="Faol" v-model="form.is_active" />
            <div v-if="form.polygon" class="d-flex align-center ga-2 pa-2" style="background:var(--bz-primary-soft);border-radius:10px;font-size:12px;color:var(--bz-primary);font-weight:600">
              <v-icon size="14">mdi-vector-polygon</v-icon>
              Polygon mavjud ({{ form.polygon.coordinates?.[0]?.length || 0 }} ta nuqta)
            </div>
            <div v-else class="d-flex align-center ga-2 pa-2" style="background:var(--bz-warn-soft);border-radius:10px;font-size:12px;color:var(--bz-warn);font-weight:600">
              <v-icon size="14">mdi-alert-outline</v-icon>
              Polygon chizilmagan. Saqlashdan oldin xaritada chiqing.
            </div>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false; pendingPolygon = null">Bekor</v-btn>
          <v-btn color="primary" rounded="lg" :loading="saving" :disabled="!form.polygon" @click="save">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BzConfirmDialog v-model="confirmDialog" title="Zonani o'chirish" :text="`'${delTarget?.name}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { zonesApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'
import ZoneMap from '@/components/zones/ZoneMap.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const zones = ref([])
const loading = ref(false)
const selectedId = ref(null)
const drawing = ref(false)
const pendingPolygon = ref(null)

const dialog = ref(false)
const editItem = ref(null)
const formRef = ref()
const saving = ref(false)
const confirmDialog = ref(false)
const delTarget = ref(null)
const deleting = ref(false)

const selected = computed(() => zones.value.find(z => z.id === selectedId.value))

const emptyForm = () => ({ name:'', polygon:null, delivery_fee:0, min_order:0, estimated_minutes:30, sort_order:0, is_active:true })
const form = ref(emptyForm())

function startDrawing() {
  editItem.value = null
  form.value = emptyForm()
  drawing.value = true
  snack.info('Xaritada nuqtalarni bosib polygon chizing')
}

function onDraw(geometry) {
  drawing.value = false
  form.value = { ...emptyForm(), polygon: geometry }
  pendingPolygon.value = geometry
  dialog.value = true
}

function onEdit(edits) {
  edits.forEach(async (e) => {
    if (!e.id) return
    try { await zonesApi.update(e.id, { polygon: e.geometry }); snack.success('Polygon yangilandi') }
    catch { snack.error('Xatolik') }
  })
  load()
}

function openEdit(z) {
  editItem.value = z
  form.value = {
    name: z.name, polygon: z.polygon,
    delivery_fee: z.delivery_fee, min_order: z.min_order || 0,
    estimated_minutes: z.estimated_minutes || 30, sort_order: z.sort_order || 0,
    is_active: z.is_active,
  }
  dialog.value = true
}

function confirmDel(z) { delTarget.value = z; confirmDialog.value = true }

async function toggle(z) {
  try {
    if (z.is_active) await zonesApi.deactivate(z.id)
    else             await zonesApi.activate(z.id)
    z.is_active = !z.is_active
    snack.success('Yangilandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  if (!form.value.polygon) { snack.error('Polygon chizilmagan'); return }
  saving.value = true
  try {
    if (editItem.value) { await zonesApi.update(editItem.value.id, form.value); snack.success('Yangilandi') }
    else                { await zonesApi.create(form.value); snack.success("Qo'shildi") }
    dialog.value = false; pendingPolygon.value = null
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await zonesApi.delete(delTarget.value.id)
    snack.success("O'chirildi"); confirmDialog.value = false; selectedId.value = null
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await zonesApi.list({ per_page: 100, order_by: 'sort_order' })
    zones.value = data.data?.items || data.data || []
  } catch {} finally { loading.value = false }
}

onMounted(load)
</script>
