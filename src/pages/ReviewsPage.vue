<template>
  <div>
    <BzPageHeader title="Sharhlar" :subtitle="total ? `${total} ta jami` : ''" />

    <!-- Stats -->
    <v-row class="mb-4" dense>
      <v-col cols="6" sm="3"><v-card rounded="xl" class="bz-card pa-4"><div class="section-label">Jami</div><div class="num" style="font-weight:800;font-size:22px">{{ stats.total ?? '—' }}</div></v-card></v-col>
      <v-col cols="6" sm="3"><v-card rounded="xl" class="bz-card pa-4"><div class="section-label">O'rtacha</div><div class="d-flex align-center ga-1"><span class="num" style="font-weight:800;font-size:22px">{{ stats.average_rating?.toFixed?.(1) ?? '—' }}</span><v-icon color="warning" size="18">mdi-star</v-icon></div></v-card></v-col>
      <v-col cols="6" sm="3"><v-card rounded="xl" class="bz-card pa-4" style="background:rgba(245,158,11,0.06)"><div class="section-label" style="color:var(--bz-warn)">Kutilmoqda</div><div class="num" style="font-weight:800;font-size:22px;color:var(--bz-warn)">{{ stats.pending ?? '—' }}</div></v-card></v-col>
      <v-col cols="6" sm="3"><v-card rounded="xl" class="bz-card pa-4" style="background:rgba(22,163,74,0.06)"><div class="section-label" style="color:var(--bz-primary)">Tasdiqlangan</div><div class="num" style="font-weight:800;font-size:22px;color:var(--bz-primary)">{{ stats.approved ?? '—' }}</div></v-card></v-col>
    </v-row>

    <BzFilterBar v-model:search-value="f.q" search-placeholder="Sharh, mijoz, raqam…" @search="onSearch">
      <v-select v-model="f.moderation_status" :items="modStatuses" item-title="t" item-value="v" placeholder="Holat" clearable hide-details density="comfortable" style="max-width:160px" @update:model-value="load" />
      <v-select v-model="f.rating" :items="[1,2,3,4,5]" placeholder="Reyting" clearable hide-details density="comfortable" style="max-width:130px" @update:model-value="load" />
    </BzFilterBar>

    <transition name="bz-slide-up">
      <v-card v-if="selected.length" class="mb-3 pa-3 d-flex align-center ga-3" rounded="lg" style="border:1px solid var(--bz-primary-glow);background:var(--bz-primary-soft)">
        <v-icon color="primary">mdi-checkbox-multiple-marked-outline</v-icon>
        <div style="font-weight:700;font-size:13.5px;color:var(--bz-primary)">{{ selected.length }} ta tanlandi</div>
        <v-spacer />
        <v-btn size="small" variant="tonal" color="success" @click="bulk('approve')">Tasdiqlash</v-btn>
        <v-btn size="small" variant="tonal" color="error" @click="bulk('reject')">Rad etish</v-btn>
        <v-btn size="small" variant="text" @click="selected = []">Bekor</v-btn>
      </v-card>
    </transition>

    <v-card rounded="xl" class="bz-card pa-3">
      <BzPageLoader v-if="loading" />
      <BzEmptyState v-else-if="!reviews.length" icon="mdi-comment-off-outline" title="Sharhlar yo'q" />
      <div v-else>
        <div v-for="r in reviews" :key="r.id" class="bz-review pa-4 mb-2" style="border:1px solid var(--bz-border);border-radius:14px">
          <div class="d-flex align-start ga-3">
            <v-checkbox-btn :model-value="selected.includes(r.id)" @update:model-value="toggleSel(r.id, $event)" />
            <v-avatar size="42" color="primary" variant="tonal">
              <span style="font-weight:800;font-size:13px">{{ fmt.initials(r.user?.first_name, r.user?.last_name) }}</span>
            </v-avatar>
            <div style="flex:1;min-width:0">
              <div class="d-flex align-center ga-2 flex-wrap">
                <span style="font-weight:800;font-size:14px">{{ fmt.fullName(r.user) }}</span>
                <span style="color:var(--bz-warn);display:flex">
                  <v-icon v-for="n in 5" :key="n" size="13" :color="n <= r.rating ? 'warning' : 'grey-lighten-2'">mdi-star</v-icon>
                </span>
                <BzStatusChip :status="r.moderation_status" type="moderation" />
                <router-link v-if="r.order?.id" :to="`/orders/${r.order.id}`" style="font-size:12px;color:var(--bz-primary);text-decoration:none;font-weight:700">
                  #{{ r.order.order_number }}
                </router-link>
                <span style="font-size:11.5px;color:var(--bz-text-3)">· {{ fmt.relativeTime(r.created_at) }}</span>
              </div>
              <div v-if="r.comment" style="font-size:13.5px;color:var(--bz-text-2);margin-top:6px;line-height:1.55">{{ r.comment }}</div>
              <div v-if="r.admin_reply" class="pa-3 mt-3" style="background:var(--bz-surface-2);border-radius:10px;font-size:12.5px;color:var(--bz-text-2);border-left:3px solid var(--bz-primary)">
                <div class="section-label" style="margin-bottom:4px">Admin javobi</div>
                {{ r.admin_reply }}
              </div>

              <div v-if="replyId === r.id" class="d-flex align-end ga-2 mt-3">
                <v-textarea v-model="replyText" placeholder="Javob…" rows="2" hide-details density="compact" no-resize />
                <v-btn color="primary" rounded="lg" :loading="replyLoading" @click="sendReply(r)"><v-icon start>mdi-send</v-icon> Yuborish</v-btn>
                <v-btn variant="text" @click="replyId = null">Bekor</v-btn>
              </div>

              <div v-else class="d-flex align-center ga-2 mt-3">
                <v-btn v-if="r.moderation_status !== 'approved'" variant="tonal" color="success" size="small" rounded="lg" @click="approve(r)">
                  <v-icon start size="14">mdi-check-circle-outline</v-icon> Tasdiqlash
                </v-btn>
                <v-btn v-if="r.moderation_status !== 'rejected'" variant="tonal" color="error" size="small" rounded="lg" @click="reject(r)">
                  <v-icon start size="14">mdi-close-circle-outline</v-icon> Rad etish
                </v-btn>
                <v-btn variant="tonal" color="info" size="small" rounded="lg" @click="replyId = r.id; replyText = r.admin_reply || ''">
                  <v-icon start size="14">mdi-reply-outline</v-icon> Javob berish
                </v-btn>
                <v-spacer />
                <v-btn icon variant="text" size="small" color="error" @click="confirmDel(r)"><v-icon size="16">mdi-delete-outline</v-icon></v-btn>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex align-center justify-space-between pt-3">
          <div style="font-size:13px;color:var(--bz-text-3)">Jami: <b>{{ total }}</b> ta</div>
          <v-pagination v-model="f.page" :length="pages" :total-visible="5" size="small" rounded="lg" @update:model-value="load" />
        </div>
      </div>
    </v-card>

    <BzConfirmDialog v-model="confirmDialog" title="Sharhni o'chirish" text="Bu amalni qaytarib bo'lmaydi" :loading="deleting" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reviewsApi, statsApi } from '@/api'
import { useFormat } from '@/composables/useFormat'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'
import BzFilterBar  from '@/components/common/BzFilterBar.vue'
import BzPageLoader from '@/components/common/BzPageLoader.vue'
import BzEmptyState from '@/components/common/BzEmptyState.vue'
import BzStatusChip from '@/components/common/BzStatusChip.vue'
import BzConfirmDialog from '@/components/common/BzConfirmDialog.vue'

const fmt   = useFormat()
const snack = useSnackStore()

const reviews = ref([])
const loading = ref(false)
const total   = ref(0)
const stats   = ref({})
const selected = ref([])
const replyId = ref(null)
const replyText = ref('')
const replyLoading = ref(false)
const confirmDialog = ref(false)
const delTarget = ref(null)
const deleting = ref(false)

const f = ref({ q:'', moderation_status:null, rating:null, page:1, per_page:20, order_by:'-created_at' })
const pages = computed(() => Math.ceil(total.value / f.value.per_page))

const modStatuses = [
  { t: 'Kutilmoqda',  v: 'pending' },
  { t: 'Tasdiqlangan', v: 'approved' },
  { t: 'Rad etilgan',  v: 'rejected' },
]

function onSearch() { f.value.page = 1; load() }
function toggleSel(id, on) { selected.value = on ? [...selected.value, id] : selected.value.filter(x => x !== id) }

async function load() {
  loading.value = true
  try {
    const { data } = await reviewsApi.list(fmt.cleanParams({ ...f.value }))
    reviews.value = data.data?.items || data.data || []
    total.value   = data.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function loadStats() {
  try { const { data } = await statsApi.reviews(); stats.value = data.data || {} } catch {}
}

async function approve(r) {
  try { await reviewsApi.approve(r.id); r.moderation_status = 'approved'; snack.success('Tasdiqlandi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}
async function reject(r) {
  try { await reviewsApi.reject(r.id); r.moderation_status = 'rejected'; snack.success('Rad etildi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

async function sendReply(r) {
  replyLoading.value = true
  try { await reviewsApi.reply(r.id, replyText.value); r.admin_reply = replyText.value; replyId.value = null; replyText.value = ''; snack.success('Javob yuborildi') }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { replyLoading.value = false }
}

async function bulk(action) {
  if (!selected.value.length) return
  try {
    if (action === 'approve') await reviewsApi.bulkApprove(selected.value)
    else                      await reviewsApi.bulkReject(selected.value)
    snack.success(`${selected.value.length} ta sharh ${action === 'approve' ? 'tasdiqlandi' : 'rad etildi'}`)
    selected.value = []
    load(); loadStats()
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
}

function confirmDel(r) { delTarget.value = r; confirmDialog.value = true }
async function doDelete() {
  deleting.value = true
  try { await reviewsApi.delete(delTarget.value.id); snack.success("O'chirildi"); confirmDialog.value = false; load(); loadStats() }
  catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { deleting.value = false }
}

onMounted(() => { load(); loadStats() })
</script>
