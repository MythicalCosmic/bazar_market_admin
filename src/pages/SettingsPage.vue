<template>
  <div>
    <BzPageHeader title="Sozlamalar" />

    <!-- Min order quick widget -->
    <v-card rounded="xl" class="bz-card pa-5 mb-4">
      <div class="d-flex align-center ga-3" style="flex-wrap:wrap">
        <div
          class="d-flex align-center justify-center flex-shrink-0"
          style="width:46px;height:46px;border-radius:14px;background:var(--bz-primary-soft)"
        >
          <v-icon color="primary" size="22">mdi-cash-clock</v-icon>
        </div>
        <div style="flex:1;min-width:200px">
          <div style="font-weight:800;font-size:14.5px">Minimal buyurtma summasi</div>
          <div style="font-size:12px;color:var(--bz-text-3)">Storefront mijozlar uchun min summa</div>
        </div>
        <v-text-field v-model.number="minOrder" type="number" hide-details density="comfortable" suffix="UZS" style="max-width:240px" />
        <v-btn color="primary" rounded="lg" :loading="minOrderLoading" @click="saveMinOrder">
          <v-icon start>mdi-content-save-outline</v-icon> Saqlash
        </v-btn>
      </div>
    </v-card>

    <!-- All settings -->
    <v-card rounded="xl" class="bz-card pa-5 mb-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <div style="font-weight:800;font-size:15px">Tizim sozlamalari</div>
        <v-btn variant="tonal" size="small" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Yangi sozlama</v-btn>
      </div>
      <BzPageLoader v-if="loading" :size="36" />
      <BzEmptyState v-else-if="!groups.length" icon="mdi-cog-off-outline" title="Sozlamalar topilmadi" />
      <div v-else>
        <div v-for="g in groups" :key="g.label" class="mb-4">
          <div class="section-label mb-2">{{ g.label }}</div>
          <div v-for="s in g.items" :key="s.key" class="d-flex align-center ga-3 pa-3 mb-1" style="border:1px solid var(--bz-border);border-radius:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:180px">
              <div style="font-weight:700;font-size:13.5px;font-family:ui-monospace,monospace">{{ s.key }}</div>
              <div v-if="s.description" style="font-size:11.5px;color:var(--bz-text-3);margin-top:2px">{{ s.description }}</div>
            </div>
            <div style="min-width:200px">
              <v-switch v-if="s.type === 'bool' || s.type === 'boolean'"
                :model-value="toBool(s.value)" color="primary" hide-details inset
                @update:model-value="updateSetting(s, $event)"
              />
              <v-textarea v-else-if="s.type === 'json'"
                :model-value="formatJson(s.value)" rows="2" hide-details density="compact"
                style="font-family:ui-monospace,monospace;font-size:12px"
                @blur="(e) => updateSetting(s, e.target.value)"
              />
              <v-text-field v-else
                :model-value="s.value"
                :type="s.type === 'int' || s.type === 'integer' ? 'number' : 'text'"
                hide-details density="compact"
                @blur="(e) => updateSetting(s, e.target.value)"
              />
            </div>
            <v-chip size="x-small" variant="tonal" color="grey" class="chip-sm">{{ s.type }}</v-chip>
            <v-btn icon variant="text" size="small" color="error" @click="deleteSetting(s)"><v-icon size="16">mdi-delete-outline</v-icon></v-btn>
          </div>
        </div>
      </div>
    </v-card>

    <!-- New setting dialog -->
    <v-dialog v-model="newDialog" max-width="540" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">Yangi sozlama</span>
          <v-btn icon variant="text" @click="newDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-text-field label="Kalit *" v-model="newSetting.key" :rules="[r => !!r || 'Majburiy']" class="mb-3" style="font-family:ui-monospace,monospace" />
            <v-select label="Turi" v-model="newSetting.type" :items="['string','int','bool','json']" class="mb-3" />
            <v-text-field v-if="newSetting.type !== 'bool'" label="Qiymat *" v-model="newSetting.value" :rules="[r => r !== '' || 'Majburiy']" class="mb-3" />
            <v-switch v-else label="Qiymat" v-model="newSetting.boolValue" />
            <v-text-field label="Tavsif" v-model="newSetting.description" />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="newDialog = false">Bekor</v-btn>
          <v-btn color="primary" rounded="lg" :loading="addingNew" @click="addSetting">Saqlash</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { settingsApi, ordersApi } from '@/api'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'

const snack = useSnackStore()

const settings = ref([])
const loading  = ref(false)
const newDialog = ref(false)
const addingNew = ref(false)
const formRef   = ref()

const minOrder = ref(0)
const minOrderLoading = ref(false)

const newSetting = ref({ key:'', value:'', boolValue:false, type:'string', description:'' })

const groups = computed(() => {
  const map = {}
  for (const s of settings.value) {
    const prefix = (s.key || '').split('_')[0] || 'misc'
    const label = prefix.charAt(0).toUpperCase() + prefix.slice(1)
    ;(map[label] ||= []).push(s)
  }
  return Object.entries(map).map(([label, items]) => ({ label, items }))
})

function toBool(v) { return v === true || v === 'true' || v === 1 || v === '1' }
function formatJson(v) {
  if (typeof v === 'string') return v
  try { return JSON.stringify(v, null, 2) } catch { return String(v ?? '') }
}

async function load() {
  loading.value = true
  try { const { data } = await settingsApi.list(); settings.value = data.data || [] }
  catch {} finally { loading.value = false }
}

async function loadMin() {
  try { const { data } = await ordersApi.getMinOrder(); minOrder.value = Number(data.data?.amount || data.data || 0) }
  catch {}
}

async function saveMinOrder() {
  minOrderLoading.value = true
  try { await ordersApi.setMinOrder(Number(minOrder.value)); snack.success('Saqlandi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { minOrderLoading.value = false }
}

async function updateSetting(s, value) {
  try {
    let v = value
    if (s.type === 'bool' || s.type === 'boolean') v = toBool(value)
    if (s.type === 'json' && typeof value === 'string') {
      try { v = JSON.parse(value) } catch { snack.error('Noto\'g\'ri JSON'); return }
    }
    await settingsApi.set({ key: s.key, value: v, type: s.type, description: s.description || '' })
    s.value = v
    snack.success('Saqlandi')
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function addSetting() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  addingNew.value = true
  try {
    const payload = {
      key: newSetting.value.key,
      type: newSetting.value.type,
      description: newSetting.value.description,
      value: newSetting.value.type === 'bool' ? newSetting.value.boolValue : newSetting.value.value,
    }
    await settingsApi.set(payload)
    snack.success('Saqlandi')
    newSetting.value = { key:'', value:'', boolValue:false, type:'string', description:'' }
    newDialog.value = false
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { addingNew.value = false }
}

async function deleteSetting(s) {
  try { await settingsApi.delete(s.key); snack.success("O'chirildi"); load() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

function openCreate() { newDialog.value = true }

onMounted(() => { load(); loadMin() })
</script>
