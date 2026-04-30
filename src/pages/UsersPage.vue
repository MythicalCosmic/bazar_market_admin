<template>
  <div>
    <BzPageHeader title="Adminlar" :subtitle="total ? `${total} ta jami` : ''">
      <template #actions>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">Foydalanuvchi qo'shish</v-btn>
      </template>
    </BzPageHeader>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Ism, username, telefon…" @search="onSearch">
      <v-select v-model="f.role" :items="roles" item-title="t" item-value="v" placeholder="Rol" clearable hide-details density="comfortable" style="max-width:170px" @update:model-value="load" />
      <v-select v-model="f.is_active" :items="[{t:'Faol',v:'true'},{t:'Nofaol',v:'false'}]" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
    </BzFilterBar>

    <v-card rounded="xl" class="bz-card">
      <v-data-table :headers="headers" :items="users" :loading="loading" hide-default-footer :items-per-page="f.per_page">
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="36" color="primary" variant="tonal">
              <span style="font-size:13px;font-weight:800">{{ fmt.initials(item.first_name, item.last_name) }}</span>
            </v-avatar>
            <div>
              <div style="font-weight:700;font-size:13px">{{ fmt.fullName(item) }}</div>
              <div style="font-size:11px;color:var(--bz-text-3)">@{{ item.username }}</div>
            </div>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip :color="ROLE_COLORS[item.role] || 'grey'" variant="tonal" size="x-small" class="chip-sm">
            {{ ROLE_LABELS[item.role] || item.role }}
          </v-chip>
        </template>

        <template #item.last_seen_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.relativeTime(item.last_seen_at) }}</span>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.is_active ? 'Faol' : 'Nofaol' }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:var(--bz-text-3)">{{ fmt.date(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex">
            <v-btn icon variant="text" size="small" @click="openEdit(item)">
              <v-icon size="17">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="small" color="error" @click="confirmDel(item)">
              <v-icon size="17">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
        </template>

        <template #loading><BzSkeleton v-for="n in 5" :key="n" type="row" /></template>
        <template #no-data><BzEmptyState icon="mdi-shield-account-outline" title="Foydalanuvchilar topilmadi" /></template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3 ga-3">
        <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b style="color:var(--bz-text-1)">{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[10,20,50]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>

    <!-- Edit/Create dialog -->
    <v-dialog v-model="dialog" max-width="640" persistent>
      <v-card rounded="xl">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:800;font-size:17px">{{ editItem ? 'Tahrirlash' : 'Yangi foydalanuvchi' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-tabs v-model="formTab" color="primary" density="comfortable">
          <v-tab value="info"><v-icon start size="16">mdi-account-outline</v-icon> Ma'lumot</v-tab>
          <v-tab value="perms" :disabled="!editItem"><v-icon start size="16">mdi-key-variant</v-icon> Ruxsatlar</v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pa-5" style="min-height:320px">
          <v-form v-if="formTab === 'info'" ref="formRef">
            <v-row dense>
              <v-col cols="6"><v-text-field label="Ism *" v-model="form.first_name" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="6"><v-text-field label="Familiya *" v-model="form.last_name" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12"><v-text-field label="Username *" v-model="form.username" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Telefon" v-model="form.phone" /></v-col>
              <v-col cols="12" sm="6"><v-text-field label="Telegram ID" v-model.number="form.telegram_id" type="number" /></v-col>
              <v-col cols="12" sm="6"><v-select label="Rol *" v-model="form.role" :items="roles" item-title="t" item-value="v" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col cols="12" sm="6"><v-select label="Til" v-model="form.language" :items="['uz','ru']" /></v-col>
              <v-col v-if="!editItem" cols="12"><v-text-field label="Parol *" v-model="form.password" type="password" :rules="[r => !!r || 'Majburiy']" /></v-col>
              <v-col v-else cols="12"><v-text-field label="Yangi parol" v-model="form.password" type="password" placeholder="Bo'sh qoldiring agar o'zgartirmasangiz" /></v-col>
              <v-col cols="12"><v-switch label="Faol" v-model="form.is_active" /></v-col>
            </v-row>
          </v-form>

          <div v-if="formTab === 'perms'">
            <BzPageLoader v-if="permsLoading" :size="40" />
            <div v-else>
              <div class="mb-3" style="font-size:12.5px;color:var(--bz-text-3)">
                Rol: <b>{{ ROLE_LABELS[editItem?.role] || editItem?.role }}</b> · Quyidagi ro'yxat — bu rol darajasida grant/deny bo'lgan qo'shimcha o'zgarishlar.
              </div>
              <v-list v-if="overrides.length" class="pa-0">
                <v-list-item v-for="o in overrides" :key="o.permission" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
                  <template #prepend>
                    <v-icon :color="o.granted ? 'success' : 'error'" size="20">{{ o.granted ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
                  </template>
                  <v-list-item-title style="font-weight:700;font-size:13px;font-family:monospace">{{ o.permission }}</v-list-item-title>
                  <v-list-item-subtitle style="font-size:11.5px">{{ o.granted ? 'Qo\'shilgan' : 'Olib tashlangan' }}</v-list-item-subtitle>
                  <template #append>
                    <v-btn icon variant="text" size="small" color="error" @click="removeOverride(o.permission)"><v-icon size="16">mdi-delete-outline</v-icon></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <BzEmptyState v-else icon="mdi-key-outline" title="Maxsus ruxsatlar yo'q" subtitle="Rol darajasida bo'lgan ruxsatlar avtomatik qo'llaniladi" />

              <v-divider class="my-4" />
              <div class="d-flex align-center ga-2">
                <v-text-field v-model="newPerm" label="Ruxsat kodi" placeholder="masalan: manage_orders" hide-details density="comfortable" style="font-family:monospace" />
                <v-btn variant="tonal" color="success" :loading="savingPerm" @click="grant">Qo'shish</v-btn>
                <v-btn variant="tonal" color="error" :loading="savingPerm" @click="deny">Olib tashlash</v-btn>
              </div>
            </div>
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

    <BzConfirmDialog v-model="confirmDialog" title="Foydalanuvchini o'chirish" :text="`'@${delTarget?.username}' o'chirilsinmi?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usersApi } from '@/api'
import { useFormat, ROLE_LABELS, ROLE_COLORS } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader  from '@/components/common/BzPageHeader.vue'
import BzFilterBar   from '@/components/common/BzFilterBar.vue'
import BzEmptyState  from '@/components/common/BzEmptyState.vue'
import BzSkeleton    from '@/components/common/BzSkeleton.vue'
import BzPageLoader  from '@/components/common/BzPageLoader.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const users    = ref([])
const loading  = ref(false)
const total    = ref(0)
const dialog   = ref(false)
const saving   = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef  = ref()
const formTab  = ref('info')

const overrides    = ref([])
const permsLoading = ref(false)
const newPerm      = ref('')
const savingPerm   = ref(false)

const f = ref({ q:'', role:null, is_active:null, page:1, per_page:20, order_by:'-created_at' })
const pages = computed(() => Math.ceil(total.value / f.value.per_page))

const roles = [
  { t: 'Admin',   v: 'admin' },
  { t: 'Menejer', v: 'manager' },
  { t: 'Kuryer',  v: 'courier' },
]

const headers = [
  { title: 'Foydalanuvchi', key: 'name',         sortable: false },
  { title: 'Rol',           key: 'role',         width: 130 },
  { title: 'Oxirgi',        key: 'last_seen_at', width: 150 },
  { title: 'Holat',         key: 'is_active',    width: 100 },
  { title: 'Sanasi',        key: 'created_at',   width: 130 },
  { title: '',              key: 'actions',      width: 100, sortable: false },
]

const emptyForm = () => ({ first_name:'', last_name:'', username:'', phone:'', role:'admin', password:'', is_active:true, language:'uz', telegram_id:null })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); formTab.value = 'info'; dialog.value = true }
function openEdit(item) {
  editItem.value = item
  formTab.value  = 'info'
  form.value = { ...emptyForm(), ...item, password: '', telegram_id: item.telegram_id || null }
  dialog.value = true
}
function confirmDel(item) { delTarget.value = item; confirmDialog.value = true }

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await usersApi.list(fmt.cleanParams({ ...f.value }))
    users.value = data.data?.items || data.data || []
    total.value = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form.value }
    if (editItem.value && !payload.password) delete payload.password
    if (editItem.value) { await usersApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else                { await usersApi.create(payload); snack.success("Qo'shildi") }
    dialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { saving.value = false }
}

async function del() {
  deleting.value = true
  try {
    await usersApi.delete(delTarget.value.id)
    snack.success("O'chirildi")
    confirmDialog.value = false; load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

async function loadOverrides() {
  if (!editItem.value) return
  permsLoading.value = true
  try {
    const { data } = await usersApi.getPermissions(editItem.value.id)
    overrides.value = data.data?.overrides || data.data || []
  } catch {} finally { permsLoading.value = false }
}

async function grant() {
  if (!newPerm.value.trim()) return
  savingPerm.value = true
  try { await usersApi.grantPermission(editItem.value.id, newPerm.value.trim()); snack.success('Qo\'shildi'); newPerm.value = ''; loadOverrides() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { savingPerm.value = false }
}
async function deny() {
  if (!newPerm.value.trim()) return
  savingPerm.value = true
  try { await usersApi.denyPermission(editItem.value.id, newPerm.value.trim()); snack.success('Olib tashlandi'); newPerm.value = ''; loadOverrides() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { savingPerm.value = false }
}
async function removeOverride(perm) {
  try { await usersApi.removePermission(editItem.value.id, perm); snack.success('O\'chirildi'); loadOverrides() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

watch(formTab, t => { if (t === 'perms') loadOverrides() })

onMounted(load)
</script>
