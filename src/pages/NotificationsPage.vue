<template>
  <div>
    <BzPageHeader title="Bildirishnomalar" />

    <v-tabs v-model="tab" color="primary" density="comfortable" class="mb-4" style="border-bottom:1px solid var(--bz-border)">
      <v-tab value="sent"><v-icon start size="16">mdi-bell-outline</v-icon> Yuborilganlar</v-tab>
      <v-tab value="new"><v-icon start size="16">mdi-bell-plus-outline</v-icon> Yangi yuborish</v-tab>
    </v-tabs>

    <!-- SENT -->
    <div v-if="tab === 'sent'">
      <BzFilterBar v-model:search-value="f.q" search-placeholder="Sarlavha, mijoz…" @search="onSearch">
        <v-select v-model="f.type" :items="types" item-title="t" item-value="v" placeholder="Turi" clearable hide-details density="comfortable" style="max-width:140px" @update:model-value="load" />
        <v-select v-model="f.channel" :items="channels" item-title="t" item-value="v" placeholder="Kanal" clearable hide-details density="comfortable" style="max-width:130px" @update:model-value="load" />
      </BzFilterBar>

      <v-card rounded="xl" class="bz-card pa-3">
        <BzPageLoader v-if="loading" />
        <BzEmptyState v-else-if="!notifs.length" icon="mdi-bell-off-outline" title="Bildirishnomalar yo'q" />
        <v-list v-else class="pa-0">
          <v-list-item v-for="n in notifs" :key="n.id" rounded="lg" class="mb-1" style="border:1px solid var(--bz-border)">
            <template #prepend>
              <v-avatar :color="typeColor(n.type)" variant="tonal" size="38" class="mr-3">
                <v-icon size="16">{{ channelIcon(n.channel) }}</v-icon>
              </v-avatar>
            </template>
            <template #title>
              <div class="d-flex align-center ga-2 flex-wrap">
                <span style="font-weight:700;font-size:13.5px">{{ n.title }}</span>
                <v-chip size="x-small" variant="tonal" :color="typeColor(n.type)" class="chip-sm">{{ typeLabel(n.type) }}</v-chip>
                <v-chip size="x-small" variant="tonal" class="chip-sm">{{ n.channel }}</v-chip>
                <span v-if="n.is_read" style="font-size:11px;color:var(--bz-text-3)">· O'qildi</span>
              </div>
            </template>
            <template #subtitle>
              <div style="font-size:12.5px;color:var(--bz-text-2)">{{ n.body }}</div>
              <div style="font-size:11px;color:var(--bz-text-3);margin-top:2px">{{ n.user?.first_name }} {{ n.user?.last_name }} · {{ fmt.relativeTime(n.sent_at || n.created_at) }}</div>
            </template>
            <template #append>
              <v-btn icon variant="text" size="small" color="error" @click="del(n)"><v-icon size="16">mdi-delete-outline</v-icon></v-btn>
            </template>
          </v-list-item>
        </v-list>
        <div class="d-flex align-center justify-space-between pt-3">
          <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b>{{ total }}</b> ta</div>
          <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        </div>
      </v-card>
    </div>

    <!-- NEW -->
    <v-card v-if="tab === 'new'" rounded="xl" class="bz-card pa-5">
      <v-form ref="formRef">
        <v-row dense>
          <v-col cols="12"><v-text-field label="Sarlavha *" v-model="form.title" :rules="[r => !!r || 'Majburiy']" /></v-col>
          <v-col cols="12"><v-textarea label="Matn *" v-model="form.body" rows="3" :rules="[r => !!r || 'Majburiy']" /></v-col>
          <v-col cols="6" sm="3"><v-select label="Turi" v-model="form.type" :items="types" item-title="t" item-value="v" /></v-col>
          <v-col cols="6" sm="3"><v-select label="Kanal" v-model="form.channel" :items="channels" item-title="t" item-value="v" /></v-col>
          <v-col cols="12" sm="6"><v-select label="Kim uchun" v-model="form.audience" :items="audiences" item-title="t" item-value="v" /></v-col>
          <v-col v-if="form.audience === 'role'" cols="12"><v-select label="Rol" v-model="form.role" :items="['client','manager','courier']" /></v-col>
          <v-col v-if="form.audience === 'specific'" cols="12">
            <v-text-field
              label="User ID lar (vergul bilan)"
              v-model="form.userIdsRaw"
              placeholder="7, 8, 9"
              hint="Mijoz ID raqamlarini vergul bilan ajrating"
              persistent-hint
            />
          </v-col>
          <v-col cols="12">
            <v-btn color="primary" rounded="lg" :loading="sending" @click="send">
              <v-icon start>mdi-send</v-icon> Yuborish
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { notificationsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const tab = ref('sent')
const notifs = ref([])
const loading = ref(false)
const total = ref(0)

const f = ref({ q:'', type:null, channel:null, page:1, per_page:20, order_by:'-sent_at' })
const pages = computed(() => Math.ceil(total.value / f.value.per_page))

const types    = [{ t:'Buyurtma', v:'order_status' },{ t:'Promo', v:'promo' },{ t:'Tizim', v:'system' }]
const channels = [{ t:'Telegram', v:'telegram' },{ t:'SMS', v:'sms' },{ t:'Push', v:'push' }]
const audiences = [
  { t:'Barcha faol mijozlar', v:'all' },
  { t:'Rol bo\'yicha',         v:'role' },
  { t:'Aniq mijozlar',         v:'specific' },
]

function typeColor(t) { return { order_status:'info', promo:'warning', system:'secondary' }[t] || 'secondary' }
function typeLabel(t) { return { order_status:'Buyurtma', promo:'Promo', system:'Tizim' }[t] || t }
function channelIcon(c) { return { telegram:'mdi-telegram', sms:'mdi-message-text-outline', push:'mdi-bell-outline' }[c] || 'mdi-bell-outline' }

const formRef = ref()
const sending = ref(false)
const form = ref({ title:'', body:'', type:'promo', channel:'telegram', audience:'all', role:'client', userIdsRaw:'' })

function onSearch() { f.value.page = 1; load() }

async function load() {
  loading.value = true
  try {
    const { data } = await notificationsApi.list(fmt.cleanParams({ ...f.value }))
    notifs.value = data.data?.items || data.data || []
    total.value  = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function del(n) {
  try { await notificationsApi.delete(n.id); snack.success("O'chirildi"); load() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function send() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  sending.value = true
  try {
    if (form.value.audience === 'specific') {
      const ids = form.value.userIdsRaw.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite)
      if (!ids.length) { snack.error('User ID kerak'); sending.value = false; return }
      if (ids.length === 1) {
        await notificationsApi.sendToUser(ids[0], { title: form.value.title, body: form.value.body, type: form.value.type, channel: form.value.channel })
      } else {
        await notificationsApi.sendBulk({ title: form.value.title, body: form.value.body, type: form.value.type, channel: form.value.channel, user_ids: ids })
      }
    } else {
      const payload = { title: form.value.title, body: form.value.body, type: form.value.type, channel: form.value.channel }
      if (form.value.audience === 'role') payload.role = form.value.role
      await notificationsApi.sendBulk(payload)
    }
    snack.success('Yuborildi')
    form.value = { title:'', body:'', type:'promo', channel:'telegram', audience:'all', role:'client', userIdsRaw:'' }
    tab.value = 'sent'
    load()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { sending.value = false }
}

onMounted(load)
</script>
