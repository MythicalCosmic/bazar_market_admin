<template>
  <div>
    <BzPageHeader title="Rollar va ruxsatlar" subtitle="RBAC matritsasi orqali har bir rolga ruxsatlarni biriktiring" />

    <v-row>
      <!-- Roles -->
      <v-col cols="12" md="3">
        <v-card rounded="xl" class="bz-card pa-3" style="position:sticky;top:80px">
          <v-list class="pa-0">
            <v-list-item
              v-for="r in roles" :key="r"
              rounded="lg" class="mb-1 cursor-pointer"
              :style="`border:1px solid ${selectedRole === r ? 'var(--bz-primary)' : 'var(--bz-border)'};background:${selectedRole === r ? 'var(--bz-primary-soft)' : 'transparent'}`"
              @click="select(r)"
            >
              <template #prepend><v-icon :color="ROLE_COLORS[r]">{{ roleIcon(r) }}</v-icon></template>
              <v-list-item-title style="font-weight:700">{{ ROLE_LABELS[r] }}</v-list-item-title>
              <v-list-item-subtitle style="font-size:11.5px">{{ countFor(r) }} ruxsat</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Matrix -->
      <v-col cols="12" md="9">
        <v-card rounded="xl" class="bz-card pa-5">
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
            <div>
              <div style="font-weight:800;font-size:17px">{{ ROLE_LABELS[selectedRole] }}</div>
              <div style="font-size:12.5px;color:var(--bz-text-3)">{{ rolePerms.length }} ruxsat tanlangan / {{ allPermissions.length }}</div>
            </div>
            <div class="d-flex ga-2">
              <v-btn variant="tonal" :loading="syncing" @click="doSync"><v-icon start>mdi-sync</v-icon> Sync</v-btn>
              <v-btn variant="tonal" color="warning" :disabled="selectedRole === 'admin'" @click="resetDialog = true">
                <v-icon start>mdi-restart</v-icon> Standartga qaytarish
              </v-btn>
              <v-btn color="primary" rounded="lg" :loading="saving" :disabled="selectedRole === 'admin'" @click="save">
                <v-icon start>mdi-content-save-outline</v-icon> Saqlash
              </v-btn>
            </div>
          </div>

          <div v-if="selectedRole === 'admin'" class="d-flex align-center ga-2 pa-3 mb-4" style="background:var(--bz-warn-soft);border-radius:12px;color:var(--bz-warn);font-size:12.5px;font-weight:600">
            <v-icon size="16">mdi-shield-alert-outline</v-icon>
            Admin roli barcha ruxsatlarga ega — o'zgartirib bo'lmaydi.
          </div>

          <BzPageLoader v-if="loading" />
          <BzEmptyState v-else-if="!groupedPerms.length" icon="mdi-key-off-outline" title="Ruxsatlar yo'q" />
          <div v-else>
            <div v-for="g in groupedPerms" :key="g.label" class="mb-4">
              <div class="d-flex align-center ga-2 mb-2">
                <div class="section-label">{{ g.label }}</div>
                <v-btn variant="text" size="x-small" :disabled="selectedRole === 'admin'" @click="toggleGroup(g)">
                  {{ allInGroup(g) ? 'Hammasini olish' : 'Hammasini qo\'shish' }}
                </v-btn>
              </div>
              <v-row dense>
                <v-col v-for="p in g.items" :key="p.codename" cols="12" sm="6" lg="4">
                  <v-card variant="outlined" rounded="lg" class="pa-3 d-flex align-start ga-3 cursor-pointer" :style="`border-color:${rolePerms.includes(p.codename) ? 'var(--bz-primary)' : 'var(--bz-border)'};background:${rolePerms.includes(p.codename) ? 'var(--bz-primary-soft)' : 'transparent'}`" @click="togglePerm(p.codename)">
                    <v-checkbox-btn :model-value="rolePerms.includes(p.codename)" :disabled="selectedRole === 'admin'" />
                    <div style="flex:1">
                      <div style="font-weight:700;font-size:13px;font-family:monospace">{{ p.codename }}</div>
                      <div style="font-size:11.5px;color:var(--bz-text-3);margin-top:2px">{{ p.name }}</div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <BzConfirmDialog
      v-model="resetDialog"
      title="Standartga qaytarish"
      :text="`'${ROLE_LABELS[selectedRole]}' rolining ruxsatlari boshlang'ich qiymatlarga qaytariladi.`"
      variant="warning"
      confirm-label="Qaytarish"
      :loading="resetting"
      @confirm="doReset"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { permissionsApi } from '@/api'
import { ROLE_LABELS, ROLE_COLORS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const snack = useSnackStore()

const roles = ['admin', 'manager', 'courier', 'client']
const selectedRole = ref('manager')
const allPermissions = ref([])
const rolePerms = ref([])
const counts    = ref({})
const loading   = ref(false)
const saving    = ref(false)
const syncing   = ref(false)
const resetting = ref(false)
const resetDialog = ref(false)

function roleIcon(r) { return { admin:'mdi-shield-crown', manager:'mdi-account-tie', courier:'mdi-moped-outline', client:'mdi-account-outline' }[r] || 'mdi-account' }

const groupedPerms = computed(() => {
  const map = {}
  for (const p of allPermissions.value) (map[p.group || 'other'] ||= []).push(p)
  return Object.entries(map).map(([label, items]) => ({ label, items: items.sort((a,b) => a.codename.localeCompare(b.codename)) }))
})

function countFor(r) { return counts.value[r] ?? '—' }
function allInGroup(g) { return g.items.every(p => rolePerms.value.includes(p.codename)) }

function togglePerm(code) {
  if (selectedRole.value === 'admin') return
  if (rolePerms.value.includes(code)) rolePerms.value = rolePerms.value.filter(c => c !== code)
  else rolePerms.value = [...rolePerms.value, code]
}
function toggleGroup(g) {
  const codes = g.items.map(p => p.codename)
  if (allInGroup(g)) rolePerms.value = rolePerms.value.filter(c => !codes.includes(c))
  else rolePerms.value = [...new Set([...rolePerms.value, ...codes])]
}

async function loadAll() {
  loading.value = true
  try {
    const [pRes] = await Promise.all([permissionsApi.list()])
    allPermissions.value = pRes.data.data || []
    await loadCounts()
    await loadRole()
  } catch {} finally { loading.value = false }
}

async function loadRole() {
  loading.value = true
  try {
    const { data } = await permissionsApi.forRole(selectedRole.value)
    rolePerms.value = (data.data?.permissions || []).map(p => p.codename || p)
  } catch {} finally { loading.value = false }
}

async function loadCounts() {
  for (const r of roles) {
    try { const { data } = await permissionsApi.forRole(r); counts.value[r] = (data.data?.permissions || []).length } catch {}
  }
}

async function select(r) {
  selectedRole.value = r
  loadRole()
}

async function save() {
  saving.value = true
  try { await permissionsApi.setRole(selectedRole.value, rolePerms.value); snack.success('Saqlandi'); loadCounts() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function doReset() {
  resetting.value = true
  try { await permissionsApi.resetRole(selectedRole.value); snack.success('Qaytarildi'); resetDialog.value = false; loadRole(); loadCounts() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { resetting.value = false }
}

async function doSync() {
  syncing.value = true
  try { const { data } = await permissionsApi.sync(); snack.success(`${data.data?.synced || 0} ta yangi ruxsat sinxronlandi`); loadAll() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { syncing.value = false }
}

onMounted(loadAll)
</script>
