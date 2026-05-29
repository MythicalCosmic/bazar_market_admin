<template>
  <v-layout class="fill-height">

    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="!mobile && rail"
      :permanent="!mobile"
      :temporary="mobile"
      color="surface"
      border="end"
      :width="248"
    >
      <!-- Brand -->
      <div class="d-flex align-center px-4" style="height:60px;border-bottom:1px solid var(--bz-border);gap:10px">
        <div
          class="d-flex align-center justify-center flex-shrink-0"
          style="width:38px;height:38px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:12px;box-shadow:0 4px 14px rgba(22,163,74,0.32)"
        >
          <v-icon color="white" size="22">mdi-storefront</v-icon>
        </div>
        <template v-if="!rail || mobile">
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:15px;line-height:1.1">Bazar Market</div>
            <div class="section-label" style="margin-top:2px">Admin Panel</div>
          </div>
          <v-btn v-if="!mobile" icon variant="text" size="x-small" @click="rail = true">
            <v-icon size="16">mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn v-else icon variant="text" size="x-small" @click="drawer = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </template>
      </div>

      <!-- Nav -->
      <v-list nav density="compact" class="px-2 pt-2">
        <template v-for="group in visibleGroups" :key="group.label || 'top'">
          <div v-if="(!rail || mobile) && group.label" class="section-label px-3 pt-3 pb-1">{{ group.label }}</div>
          <v-list-item
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="(rail && !mobile) ? '' : item.title"
            class="nav-item"
            active-class="v-list-item--active"
            rounded="lg"
            exact
            @click="onNavClick"
          >
            <template v-if="(!rail || mobile) && item.badge" #append>
              <v-chip size="x-small" color="primary" variant="flat" class="chip-sm">{{ item.badge }}</v-chip>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <!-- User footer -->
      <template #append>
        <v-divider />
        <div class="pa-2">
          <v-menu offset-y>
            <template #activator="{ props: activator }">
              <v-list-item v-bind="activator" rounded="lg" class="px-2 py-2 cursor-pointer">
                <template #prepend>
                  <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                    <span style="font-size:13px;font-weight:800">{{ initials }}</span>
                  </v-avatar>
                </template>
                <template v-if="!rail || mobile">
                  <v-list-item-title style="font-weight:700;font-size:13px;line-height:1.2">{{ fullName }}</v-list-item-title>
                  <v-list-item-subtitle style="font-size:11px;color:var(--bz-text-3)">{{ ROLE_LABELS[auth.role] || auth.role || 'Admin' }}</v-list-item-subtitle>
                </template>
                <template v-if="!rail || mobile" #append>
                  <v-icon size="16" color="grey">mdi-chevron-up</v-icon>
                </template>
              </v-list-item>
            </template>
            <v-list density="compact" rounded="lg" min-width="200">
              <v-list-item to="/profile" prepend-icon="mdi-account-circle-outline" title="Profil" />
              <v-divider />
              <v-list-item prepend-icon="mdi-logout" title="Chiqish" @click="handleLogout" />
              <v-list-item prepend-icon="mdi-logout-variant" title="Barcha qurilmalardan" @click="handleLogoutAll" />
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Rail expand handle (desktop only) -->
    <v-btn
      v-if="!mobile && rail"
      icon
      variant="flat"
      size="x-small"
      color="surface"
      elevation="3"
      style="position:fixed;left:56px;top:18px;z-index:1000"
      @click="rail = false"
    >
      <v-icon size="14">mdi-chevron-right</v-icon>
    </v-btn>

    <!-- ── Main ────────────────────────────────────────────── -->
    <v-main class="bz-main" style="background:var(--bz-surface-2)">
      <!-- Topbar -->
      <div class="bz-topbar d-flex align-center">
        <!-- Mobile hamburger -->
        <v-btn
          v-if="mobile"
          icon
          variant="text"
          size="small"
          class="mr-1"
          @click="drawer = !drawer"
        >
          <v-icon size="22">mdi-menu</v-icon>
        </v-btn>

        <!-- Breadcrumbs (truncate on mobile) -->
        <div class="bz-crumbs d-flex align-center ga-2">
          <v-icon v-if="!mobile" size="16" color="grey">mdi-home-outline</v-icon>
          <template v-for="(crumb, i) in crumbs" :key="crumb.to">
            <v-icon v-if="i > 0 || !mobile" size="14" color="grey-lighten-1">mdi-chevron-right</v-icon>
            <router-link
              :to="crumb.to"
              :class="['bz-crumb', i === crumbs.length-1 ? 'bz-crumb--active' : '']"
            >{{ crumb.title }}</router-link>
          </template>
        </div>

        <v-spacer />

        <div class="d-flex align-center ga-1">
          <v-btn variant="tonal" size="small" rounded="lg" class="bz-search-btn" @click="palette.show()">
            <v-icon :start="!mobile" size="16">mdi-magnify</v-icon>
            <span class="hidden-sm-and-down">Qidirish</span>
            <kbd class="bz-kbd ml-2 hidden-sm-and-down">⌘K</kbd>
          </v-btn>

          <v-btn icon variant="text" size="small" :title="isDark ? 'Yorug\' tema' : 'Qorong\'u tema'" @click="toggleTheme">
            <v-icon size="20">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>

          <v-btn icon variant="text" size="small" to="/orders?status=pending" title="Yangi buyurtmalar">
            <v-icon size="20">mdi-bell-outline</v-icon>
          </v-btn>

          <v-avatar size="34" color="primary" variant="tonal" class="ml-1 d-none d-sm-flex" style="cursor:pointer">
            <span style="font-size:12px;font-weight:800">{{ initials }}</span>
          </v-avatar>
        </div>
      </div>

      <!-- Page content -->
      <div :class="['bz-page-content', { 'bz-page-content--flush': isFlushRoute }]">
        <router-view v-slot="{ Component }">
          <transition name="bz-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>

  </v-layout>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { usePaletteStore } from '@/stores/palette'
import { ROLE_LABELS } from '@/composables/useFormat'

const auth    = useAuthStore()
const route   = useRoute()
const router  = useRouter()
const palette = usePaletteStore()
const display = useDisplay()
const mobile  = computed(() => display.mdAndDown.value)

const drawer  = ref(!mobile.value)
const rail    = ref(false)
const theme   = inject('theme')
const toggleTheme = inject('toggleTheme')
const isDark = computed(() => theme.value === 'dark')

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
  if (isMobile) rail.value = false
})

function onNavClick() {
  if (mobile.value) drawer.value = false
}

const NAV = [
  { label: null, items: [
    { to: '/dashboard', icon: 'mdi-view-dashboard-outline', title: 'Dashboard',   perm: null },
    { to: '/orders',    icon: 'mdi-package-variant-closed', title: 'Buyurtmalar', perm: 'view_orders' },
    { to: '/courier',   icon: 'mdi-moped-outline',          title: 'Kuryer rejimi', perm: null },
    { to: '/payments',  icon: 'mdi-credit-card-outline',     title: "To'lovlar",   perm: 'view_payments' },
    { to: '/analytics', icon: 'mdi-chart-box-outline',       title: 'Tahlil',      perm: 'view_analytics' },
  ]},
  { label: 'Katalog', items: [
    { to: '/products',   icon: 'mdi-cube-outline',           title: 'Mahsulotlar',   perm: 'view_products' },
    { to: '/categories', icon: 'mdi-tag-multiple-outline',   title: 'Kategoriyalar', perm: 'view_categories' },
    { to: '/discounts',  icon: 'mdi-sale',                   title: 'Chegirmalar',   perm: 'manage_discounts' },
    { to: '/coupons',    icon: 'mdi-ticket-percent-outline',  title: 'Kuponlar',      perm: 'manage_coupons' },
    { to: '/banners',    icon: 'mdi-image-outline',          title: 'Bannerlar',     perm: 'manage_banners' },
    { to: '/referral-rewards', icon: 'mdi-gift-outline', title: 'Referral',      perm: 'manage_referral_rewards' },
  ]},
  { label: 'Foydalanuvchilar', items: [
    { to: '/customers', icon: 'mdi-account-group-outline',   title: 'Mijozlar',  perm: 'view_users' },
    { to: '/users',     icon: 'mdi-shield-account-outline',  title: 'Adminlar',  perm: 'view_users' },
    { to: '/roles',     icon: 'mdi-account-key-outline',     title: 'Rollar',    perm: 'manage_roles' },
  ]},
  { label: "Aloqa", items: [
    { to: '/reviews',       icon: 'mdi-comment-quote-outline', title: 'Sharhlar',         perm: 'view_reviews' },
    { to: '/notifications', icon: 'mdi-bell-outline',           title: 'Bildirishnomalar', perm: 'manage_notifications' },
  ]},
  { label: 'Tizim', items: [
    { to: '/delivery-zones', icon: 'mdi-map-marker-radius-outline', title: 'Yetkazib berish', perm: 'view_delivery_zones' },
    { to: '/settings',       icon: 'mdi-cog-outline',                title: 'Sozlamalar',      perm: 'manage_settings' },
  ]},
]

const visibleGroups = computed(() =>
  NAV
    .map(g => ({ ...g, items: g.items.filter(i => auth.hasPerm(i.perm)) }))
    .filter(g => g.items.length)
)

const PAGE_TITLES = {
  dashboard:'Dashboard', orders:'Buyurtmalar', 'order-detail':'Buyurtma',
  courier:'Kuryer rejimi',
  products:'Mahsulotlar', categories:'Kategoriyalar',
  customers:'Mijozlar', 'customer-detail':'Mijoz',
  users:'Adminlar', roles:'Rollar va ruxsatlar',
  discounts:'Chegirmalar', coupons:'Kuponlar', banners:'Bannerlar', 'referral-rewards':'Referral mukofotlar',
  reviews:'Sharhlar', notifications:'Bildirishnomalar',
  payments:"To'lovlar", 'payment-detail':"To'lov",
  'delivery-zones':'Yetkazib berish zonalari', settings:'Sozlamalar',
  profile:'Profil', analytics:'Tahlil',
}

const isFlushRoute = computed(() => route.name === 'courier')

const crumbs = computed(() => {
  const parts = []
  if (route.name && route.name !== 'dashboard') {
    if (!mobile.value) parts.push({ title: 'Asosiy', to: '/' })
    const title = PAGE_TITLES[route.name] || String(route.name).replace(/-/g, ' ')
    parts.push({ title, to: route.path })
  } else {
    parts.push({ title: 'Dashboard', to: '/' })
  }
  return parts
})

const fullName = computed(() => {
  const u = auth.user
  if (!u) return 'Admin'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Admin'
})

const initials = computed(() => {
  const u = auth.user
  if (!u) return 'A'
  return ((u.first_name?.[0] || u.username?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || 'A'
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
async function handleLogoutAll() {
  await auth.logoutAll()
  router.push('/login')
}

onMounted(() => {
  if (auth.isLoggedIn && !auth.user) auth.fetchMe().catch(() => {})
})
</script>

<style scoped>
.bz-main {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
}
.bz-topbar {
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid var(--bz-border);
  background: rgba(var(--v-theme-surface), 0.85);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 9;
  gap: 4px;
}
.bz-page-content {
  padding: 24px;
}
.bz-page-content--flush {
  padding: 0;
}
.bz-crumbs {
  font-size: 13px;
  color: var(--bz-text-3);
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
}
.bz-crumb {
  color: var(--bz-text-3);
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
}
.bz-crumb--active {
  color: var(--bz-text-1);
  font-weight: 700;
}
.bz-search-btn {
  background: var(--bz-surface-2) !important;
  border: 1px solid var(--bz-border) !important;
  font-weight: 600;
  color: var(--bz-text-3) !important;
}
.bz-kbd {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid var(--bz-border-strong);
  border-radius: 4px;
  background: var(--bz-surface-1);
  font-size: 10.5px;
  font-family: ui-monospace, monospace;
  color: var(--bz-text-2);
}

@media (max-width: 960px) {
  .bz-topbar {
    padding: 0 12px;
    height: 56px;
  }
  .bz-page-content {
    padding: 12px;
  }
  .bz-crumb {
    max-width: 60vw;
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .bz-page-content {
    padding: 10px;
  }
  .bz-search-btn {
    min-width: 36px;
    padding: 0 8px !important;
  }
}
</style>
