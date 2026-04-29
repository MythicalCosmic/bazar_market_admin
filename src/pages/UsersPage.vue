<template>
  <div>
    <div class="d-flex justify-end mb-4 ga-3">
      <v-select v-model="f.role" :items="roles" item-title="t" item-value="v" placeholder="Rol" clearable hide-details style="max-width:180px" @update:model-value="load" />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Foydalanuvchi qo'shish</v-btn>
    </div>

    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)">
      <v-data-table :headers="headers" :items="users" :loading="loading" hide-default-footer :items-per-page="f.per_page">
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="36" color="primary" variant="tonal">
              <span style="font-size:13px;font-weight:700">{{ fmt.initials(item.first_name, item.last_name) }}</span>
            </v-avatar>
            <div>
              <div style="font-weight:700;font-size:13px">{{ [item.first_name, item.last_name].filter(Boolean).join(' ') || '—' }}</div>
              <div style="font-size:11px;color:#94A3B8">@{{ item.username }}</div>
            </div>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip :color="ROLE_COLORS[item.role] || 'grey'" variant="tonal" size="x-small" class="chip-sm">
            {{ ROLE_LABELS[item.role] || item.role }}
          </v-chip>
        </template>

        <template #item.phone="{ item }">
          <span style="font-size:13px">{{ item.phone || '—' }}</span>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" variant="tonal" size="x-small" class="chip-sm">
            {{ item.is_active ? 'Faol' : 'Nofaol' }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span style="font-size:12px;color:#64748B">{{ fmt.date(item.created_at) }}</span>
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

        <template #loading><PageLoader :size="36" /></template>
        <template #no-data><EmptyState icon="mdi-shield-account-outline" title="Foydalanuvchilar topilmadi" /></template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div style="font-size:13px;color:#64748B">Jami: <b>{{ total }}</b> ta</div>
        <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        <v-select v-model="f.per_page" :items="[10,20,50]" hide-details density="compact" style="max-width:85px" @update:model-value="load" />
      </div>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span style="font-weight:700;font-size:17px">{{ editItem ? 'Tahrirlash' : 'Yangi foydalanuvchi' }}</span>
          <v-btn icon variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="6">
                <v-text-field label="Ism *" v-model="form.first_name" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Familiya" v-model="form.last_name" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Username *" v-model="form.username" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Telefon" v-model="form.phone" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-select label="Rol *" v-model="form.role" :items="roles" item-title="t" item-value="v" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col v-if="!editItem" cols="12">
                <v-text-field label="Parol *" v-model="form.password" type="password" :rules="[r => !!r || 'Majburiy']" class="mb-3" />
              </v-col>
              <v-col cols="12">
                <v-switch label="Faol" v-model="form.is_active" color="primary" hide-details inset />
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

    <ConfirmDialog v-model="confirmDialog" title="Foydalanuvchini o'chirish" :text="`'@${delTarget?.username}' foydalanuvchisini o'chirmoqchimisiz?`" :loading="deleting" @confirm="del" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usersApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import PageLoader    from '@/components/common/PageLoader.vue'
import EmptyState    from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const fmt    = useFormat()
const snack  = useSnackStore()
const users  = ref([])
const loading= ref(false)
const total  = ref(0)
const pages  = computed(() => Math.ceil(total.value / f.value.per_page))
const dialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editItem = ref(null)
const confirmDialog = ref(false)
const delTarget = ref(null)
const formRef = ref()

const f = ref({ role: null, page: 1, per_page: 20, order_by: '-created_at' })

const ROLE_LABELS = { admin: 'Admin', superadmin: 'Superadmin', courier: 'Kuryer', manager: 'Menejer' }
const ROLE_COLORS = { admin: 'primary', superadmin: 'error', courier: 'info', manager: 'warning' }
const roles = [
  { t: 'Admin',      v: 'admin' },
  { t: 'Superadmin', v: 'superadmin' },
  { t: 'Kuryer',     v: 'courier' },
  { t: 'Menejer',    v: 'manager' },
]

const headers = [
  { title: 'Foydalanuvchi', key: 'name',       sortable: false },
  { title: 'Rol',           key: 'role',        width: 140 },
  { title: 'Telefon',       key: 'phone',       sortable: false },
  { title: 'Holat',         key: 'is_active',   width: 100 },
  { title: 'Sanasi',        key: 'created_at',  width: 140 },
  { title: '',              key: 'actions',      width: 90, sortable: false },
]

const emptyForm = () => ({ first_name: '', last_name: '', username: '', phone: '', role: 'admin', password: '', is_active: true })
const form = ref(emptyForm())

function openCreate() { editItem.value = null; form.value = emptyForm(); dialog.value = true }
function openEdit(item) {
  editItem.value = item
  form.value = { first_name: item.first_name || '', last_name: item.last_name || '', username: item.username || '', phone: item.phone || '', role: item.role || 'admin', password: '', is_active: item.is_active }
  dialog.value = true
}
function confirmDel(item) { delTarget.value = item; confirmDialog.value = true }

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form.value }
    if (editItem.value && !payload.password) delete payload.password
    if (editItem.value) { await usersApi.update(editItem.value.id, payload); snack.success('Yangilandi') }
    else               { await usersApi.create(payload); snack.success("Qo'shildi") }
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
  } catch { snack.error('Xatolik') }
  finally { deleting.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await usersApi.list(fmt.cleanParams({ ...f.value }))
    users.value = data.data?.items || data.data || []
    total.value = data.data?.total || 0
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
