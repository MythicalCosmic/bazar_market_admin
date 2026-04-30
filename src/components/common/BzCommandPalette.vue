<template>
  <v-dialog v-model="palette.open" max-width="640" transition="fade-transition">
    <v-card rounded="xl" class="bz-card pa-0" style="overflow:hidden">
      <div class="d-flex align-center px-4" style="height:54px;border-bottom:1px solid var(--bz-border)">
        <v-icon size="20" color="grey">mdi-magnify</v-icon>
        <input
          ref="inputEl"
          v-model="query"
          placeholder="Sahifani qidiring yoki buyurtma raqamini kiriting…"
          class="bz-input"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="commit"
          @keydown.esc.prevent="palette.hide()"
        />
        <kbd class="bz-kbd">Esc</kbd>
      </div>

      <div style="max-height:420px;overflow:auto" class="pa-2">
        <template v-for="(group, gIdx) in filtered" :key="group.label">
          <div v-if="group.items.length" class="px-2 pt-2 pb-1 section-label">{{ group.label }}</div>
          <div
            v-for="(item, iIdx) in group.items"
            :key="item.to + item.title"
            class="bz-cmd-item"
            :class="{ active: isActive(gIdx, iIdx) }"
            @mouseenter="setActive(gIdx, iIdx)"
            @click="select(item)"
          >
            <v-icon :color="isActive(gIdx, iIdx) ? 'primary' : 'grey'" size="18">{{ item.icon }}</v-icon>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13.5px">{{ item.title }}</div>
              <div v-if="item.subtitle" style="font-size:11.5px;color:var(--bz-text-3)">{{ item.subtitle }}</div>
            </div>
            <v-icon v-if="isActive(gIdx, iIdx)" color="primary" size="14">mdi-arrow-right-thin</v-icon>
          </div>
        </template>

        <div v-if="!totalItems" class="pa-6 text-center" style="color:var(--bz-text-3);font-size:13px">
          Hech narsa topilmadi
        </div>
      </div>

      <div class="d-flex align-center justify-space-between px-4 py-2" style="border-top:1px solid var(--bz-border);font-size:11px;color:var(--bz-text-3)">
        <span><kbd class="bz-kbd">↑↓</kbd> harakat <kbd class="bz-kbd">⏎</kbd> tanlash</span>
        <span>Bazar Admin</span>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePaletteStore } from '@/stores/palette'
import { useAuthStore } from '@/stores/auth'

const palette = usePaletteStore()
const auth    = useAuthStore()
const router  = useRouter()
const query   = ref('')
const inputEl = ref(null)
const cursor  = ref({ g: 0, i: 0 })

const allRoutes = [
  { label: 'Boshqaruv', items: [
    { title: 'Dashboard',     subtitle: 'Statistika', icon: 'mdi-view-dashboard-outline', to: '/dashboard',  perm: null },
    { title: 'Buyurtmalar',   subtitle: '',           icon: 'mdi-package-variant-closed', to: '/orders',     perm: 'view_orders' },
    { title: "To'lovlar",     subtitle: '',           icon: 'mdi-credit-card-outline',     to: '/payments',   perm: 'view_payments' },
    { title: 'Tahlil',        subtitle: '',           icon: 'mdi-chart-box-outline',       to: '/analytics',  perm: 'view_analytics' },
  ] },
  { label: 'Katalog', items: [
    { title: 'Mahsulotlar',   icon: 'mdi-cube-outline',          to: '/products',   perm: 'view_products' },
    { title: 'Kategoriyalar', icon: 'mdi-tag-multiple-outline',  to: '/categories', perm: 'view_categories' },
    { title: 'Chegirmalar',   icon: 'mdi-sale',                  to: '/discounts',  perm: 'manage_discounts' },
    { title: 'Kuponlar',      icon: 'mdi-ticket-percent-outline', to: '/coupons',   perm: 'manage_coupons' },
    { title: 'Bannerlar',     icon: 'mdi-image-outline',         to: '/banners',    perm: 'manage_banners' },
  ] },
  { label: 'Foydalanuvchilar', items: [
    { title: 'Mijozlar',      icon: 'mdi-account-group-outline', to: '/customers', perm: 'view_users' },
    { title: 'Adminlar',      icon: 'mdi-shield-account-outline', to: '/users',    perm: 'view_users' },
    { title: 'Rollar',        icon: 'mdi-account-key-outline',    to: '/roles',    perm: 'manage_roles' },
  ] },
  { label: "Aloqa", items: [
    { title: 'Sharhlar',      icon: 'mdi-comment-quote-outline', to: '/reviews',       perm: 'view_reviews' },
    { title: 'Bildirishnomalar', icon: 'mdi-bell-outline',       to: '/notifications', perm: 'manage_notifications' },
  ] },
  { label: 'Tizim', items: [
    { title: 'Yetkazib berish', icon: 'mdi-map-marker-radius-outline', to: '/delivery-zones', perm: 'view_delivery_zones' },
    { title: 'Sozlamalar',      icon: 'mdi-cog-outline',                to: '/settings',       perm: 'manage_settings' },
    { title: 'Profil',          icon: 'mdi-account-circle-outline',     to: '/profile',        perm: null },
  ] },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const groups = []

  if (palette.recent.length && !q) {
    groups.push({
      label: 'So\'nggi tashriflar',
      items: palette.recent.filter(r => auth.hasPerm(r.perm)),
    })
  }

  for (const g of allRoutes) {
    const items = g.items
      .filter(i => auth.hasPerm(i.perm))
      .filter(i => !q || i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q))
    if (items.length) groups.push({ label: g.label, items })
  }

  // Order shortcut
  if (/^ord[-\s]?\d+/i.test(q)) {
    groups.unshift({
      label: 'Buyurtma',
      items: [{ title: q.toUpperCase().replace(/\s/g, ''), subtitle: 'Buyurtmaga o\'tish', icon: 'mdi-package-variant', to: `/orders?q=${encodeURIComponent(q)}`, perm: 'view_orders' }],
    })
  }
  return groups
})

const totalItems = computed(() => filtered.value.reduce((a, g) => a + g.items.length, 0))

function isActive(g, i) { return cursor.value.g === g && cursor.value.i === i }
function setActive(g, i) { cursor.value = { g, i } }

function move(delta) {
  const flat = []
  filtered.value.forEach((g, gi) => g.items.forEach((_, ii) => flat.push({ g: gi, i: ii })))
  if (!flat.length) return
  const idx = flat.findIndex(x => x.g === cursor.value.g && x.i === cursor.value.i)
  const next = (idx + delta + flat.length) % flat.length
  cursor.value = flat[next]
}

function select(item) {
  palette.pushRecent({ title: item.title, icon: item.icon, to: item.to, perm: item.perm })
  router.push(item.to)
  palette.hide()
}

function commit() {
  const g = filtered.value[cursor.value.g]
  if (g && g.items[cursor.value.i]) select(g.items[cursor.value.i])
}

watch(() => palette.open, async open => {
  if (open) {
    query.value = ''
    cursor.value = { g: 0, i: 0 }
    await nextTick()
    inputEl.value?.focus()
  }
})
</script>

<style scoped>
.bz-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  margin-left: 12px;
  font-size: 14px;
  color: var(--bz-text-1);
  font-family: inherit;
}
.bz-cmd-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background var(--bz-dur-fast) var(--bz-ease);
}
.bz-cmd-item.active {
  background: var(--bz-primary-soft);
}
.bz-kbd {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid var(--bz-border-strong);
  border-radius: 4px;
  background: var(--bz-surface-2);
  font-size: 10.5px;
  font-family: ui-monospace, monospace;
  color: var(--bz-text-2);
}
</style>
