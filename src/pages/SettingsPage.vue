<template>
  <div>
    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5 mb-4">
      <div style="font-weight:700;font-size:15px;margin-bottom:16px">Tizim sozlamalari</div>
      <PageLoader v-if="loading" />
      <div v-else>
        <v-row v-for="s in settings" :key="s.key" class="mb-2" align="center">
          <v-col cols="12" sm="4">
            <div style="font-weight:600;font-size:13px">{{ s.key }}</div>
            <div v-if="s.description" style="font-size:11px;color:#94A3B8">{{ s.description }}</div>
          </v-col>
          <v-col cols="12" sm="6">
            <v-switch v-if="s.type === 'boolean'" :model-value="s.value === 'true' || s.value === true" color="primary" hide-details inset @update:model-value="updateSetting(s, $event ? 'true' : 'false')" />
            <v-text-field v-else v-model="s.value" hide-details density="compact" @blur="updateSetting(s, s.value)" />
          </v-col>
          <v-col cols="12" sm="2">
            <v-chip size="x-small" variant="tonal" color="grey">{{ s.type }}</v-chip>
          </v-col>
          <v-col cols="12"><v-divider /></v-col>
        </v-row>
        <EmptyState v-if="!settings.length" icon="mdi-cog-off-outline" title="Sozlamalar topilmadi" />
      </div>
    </v-card>

    <!-- Add new setting -->
    <v-card rounded="xl" style="border:1px solid rgba(0,0,0,0.07)" class="pa-5">
      <div style="font-weight:700;font-size:15px;margin-bottom:16px">Yangi sozlama qo'shish</div>
      <v-form ref="formRef">
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-text-field label="Kalit *" v-model="newSetting.key" :rules="[r => !!r || 'Majburiy']" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field label="Qiymat *" v-model="newSetting.value" :rules="[r => r !== '' || 'Majburiy']" />
          </v-col>
          <v-col cols="12" sm="2">
            <v-select label="Turi" v-model="newSetting.type" :items="['string','integer','boolean','json']" />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field label="Tavsif" v-model="newSetting.description" />
          </v-col>
          <v-col cols="12">
            <v-btn color="primary" :loading="addingNew" @click="addSetting">
              <v-icon start>mdi-plus</v-icon> Saqlash
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { settingsApi } from '@/api'
import { useSnackStore } from '@/stores/snack'
import PageLoader from '@/components/common/PageLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const snack    = useSnackStore()
const settings = ref([])
const loading  = ref(false)
const addingNew= ref(false)
const formRef  = ref()

const newSetting = ref({ key: '', value: '', type: 'string', description: '' })

async function updateSetting(s, value) {
  try {
    await settingsApi.set({ key: s.key, value, type: s.type, description: s.description || '' })
    s.value = value
    snack.success('Saqlandi')
  } catch { snack.error('Xatolik') }
}

async function addSetting() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  addingNew.value = true
  try {
    await settingsApi.set(newSetting.value)
    snack.success('Saqlandi')
    newSetting.value = { key: '', value: '', type: 'string', description: '' }
    formRef.value.reset()
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { addingNew.value = false }
}

async function load() {
  loading.value = true
  try {
    const { data } = await settingsApi.list()
    settings.value = data.data || []
  } catch {}
  finally { loading.value = false }
}

onMounted(load)
</script>
