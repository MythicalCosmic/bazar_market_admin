<template>
  <v-layout class="fill-height">

    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      color="surface"
      border="end"
      :width="256"
    >
      <!-- Logo -->
      <div
        class="d-flex align-center px-4"
        style="height:64px;border-bottom:1px solid rgba(0,0,0,0.06);gap:10px"
      >
        <div
          class="d-flex align-center justify-center flex-shrink-0"
          style="width:36px;height:36px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:10px"
        >
          <v-icon color="white" size="20">mdi-storefront</v-icon>
        </div>
        <template v-if="!rail">
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:15px;line-height:1.1">Bazar Market</div>
            <div class="section-label" style="margin-top:1px">Admin Panel</div>
          </div>
          <v-btn icon variant="text" size="x-small" @click="rail = true">
            <v-icon size="16">mdi-chevron-left</v-icon>
          </v-btn>
        </template>
      </div>

      <!-- Nav -->
      <v-list nav density="compact" class="px-1 pt-2">
        <template v-for="group in navGroups" :key="group.label">
          <div
            v-if="!rail && group.label"
            class="section-label px-3 pt-3 pb-1"
          >{{ group.label }}</div>

          <v-list-item
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="rail ? '' : item.title"
            class="nav-item"
            active-class="v-list-item--active"
            rounded="lg"
            exact
          />
        </template>
      </v-list>

      <!-- User -->
      <template #append>
        <v-divider />
        <div class="pa-2">
          <v-list-item
            :subtitle="rail ? '' : (authStore.user?.role || 'admin')"
            :title="rail ? '' : fullName"
            rounded="lg"
            class="px-2 py-2"
          >
            <template #prepend>
              <v-avatar size="34" color="primary" class="mr-3">
                <span class="text-white font-weight-bold" style="font-size:12px">{{ initials }}</span>
              </v-avatar>
            </template>
            <template #append v-if="!rail">
              <v-btn icon variant="text" size="x-small" title="Chiqish" @click="handleLogout">
                <v-icon size="17" color="grey">mdi-logout</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Rail expand -->
    <v-btn
      v-if="rail"
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
    <v-main style="min-height:100vh">
      <!-- Topbar -->
      <div
        class="d-flex align-center px-6"
        style="height:64px;border-bottom:1px solid rgba(0,0,0,0.06);background:rgb(var(--v-theme-surface));position:sticky;top:0;z-index:9"
      >
        <div>
          <div class="page-title">{{ pageTitle }}</div>
        </div>
        <v-spacer />
        <div class="d-flex align-center ga-1">
          <v-btn icon variant="text" size="small" @click="toggleTheme" :title="isDark ? 'Yorug\' tema' : 'Qorong\'u tema'">
            <v-icon size="20">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" to="/orders" title="Buyurtmalar">
            <v-icon size="20">mdi-bell-outline</v-icon>
          </v-btn>
          <v-avatar size="34" color="primary" class="ml-1" style="cursor:pointer">
            <span class="text-white font-weight-bold" style="font-size:12px">{{ initials }}</span>
          </v-avatar>
        </div>
      </div>

      <!-- Page -->
      <div class="pa-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>

  </v-layout>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore  = useAuthStore()
const route      = useRoute()
const router     = useRouter()
const drawer     = ref(true)
const rail       = ref(false)
const theme      = inject('theme')
const toggleTheme= inject('toggleTheme')
const isDark     = computed(() => theme.value === 'dark')

const navGroups = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: 'mdi-view-dashboard-outline', title: 'Dashboard' },
      { to: '/orders',    icon: 'mdi-package-variant-closed',  title: 'Buyurtmalar' },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/products',   icon: 'mdi-cube-outline',           title: 'Mahsulotlar' },
      { to: '/categories', icon: 'mdi-tag-multiple-outline',   title: 'Kategoriyalar' },
      { to: '/discounts',  icon: 'mdi-sale',                   title: 'Chegirmalar' },
      { to: '/coupons',    icon: 'mdi-ticket-percent-outline',  title: 'Kuponlar' },
    ],
  },
  {
    label: 'Foydalanuvchilar',
    items: [
      { to: '/customers', icon: 'mdi-account-group-outline',   title: 'Mijozlar' },
      { to: '/users',     icon: 'mdi-shield-account-outline',  title: 'Adminlar' },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { to: '/delivery-zones', icon: 'mdi-map-marker-radius-outline', title: 'Yetkazib berish' },
      { to: '/settings',       icon: 'mdi-cog-outline',               title: 'Sozlamalar' },
    ],
  },
]

const PAGE_TITLES = {
  dashboard:       'Dashboard',
  orders:          'Buyurtmalar',
  'order-detail':  'Buyurtma tafsilotlari',
  products:        'Mahsulotlar',
  categories:      'Kategoriyalar',
  customers:       'Mijozlar',
  'customer-detail':'Mijoz tafsilotlari',
  users:           'Foydalanuvchilar',
  discounts:       'Chegirmalar',
  coupons:         'Kuponlar',
  'delivery-zones':'Yetkazib berish zonalari',
  settings:        'Sozlamalar',
}

const pageTitle = computed(() => PAGE_TITLES[route.name] || 'Bazar Admin')

const fullName = computed(() => {
  const u = authStore.user
  if (!u) return 'Admin'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Admin'
})

const initials = computed(() => {
  const u = authStore.user
  if (!u) return 'A'
  return ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || 'A'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (authStore.isLoggedIn && !authStore.user) authStore.fetchMe().catch(() => {})
})
</script>
