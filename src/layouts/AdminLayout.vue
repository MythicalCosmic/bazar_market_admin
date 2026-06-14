<template>
  <v-layout class="fill-height bz-shell">

    <!-- ── Sidebar (dark panel) ───────────────────────────── -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      color="transparent"
      :border="0"
      :width="264"
      class="bz-side"
    >
      <!-- Brand -->
      <div class="brand">
        <div class="logo">B</div>
        <div class="bn">
          <div class="b1">Bazar Market</div>
          <div class="b2">Admin Panel</div>
        </div>
      </div>

      <!-- Nav -->
      <div class="nav">
        <template v-for="group in visibleGroups" :key="group.label || 'top'">
          <div class="nav-group">
            <div v-if="group.label" class="gl">{{ group.label }}</div>
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.to) }"
              @click="onNavClick"
            >
              <span class="ni-ic"><v-icon size="16">{{ item.icon }}</v-icon></span>
              <span class="ni-l">{{ item.title }}</span>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </router-link>
          </div>
        </template>
      </div>

      <!-- User footer -->
      <div class="user-menu" :class="{ open: userOpen }">
        <button class="user-trigger" @click="userOpen = !userOpen">
          <v-avatar size="36" class="bz-avatar"><span style="font-size:13px;font-weight:800">{{ initials }}</span></v-avatar>
          <span class="nm">
            <span class="n1">{{ fullName }}</span>
            <span class="n2">{{ ROLE_LABELS[auth.role] || auth.role || 'Admin' }}</span>
          </span>
          <v-icon class="chev" size="16">mdi-chevron-up</v-icon>
        </button>
        <div class="user-pop">
          <button @click="goProfile"><v-icon size="16">mdi-account-circle-outline</v-icon> Profil</button>
          <button @click="handleLogout"><v-icon size="16">mdi-logout</v-icon> Chiqish</button>
          <button class="danger" @click="handleLogoutAll"><v-icon size="16">mdi-logout-variant</v-icon> Barcha qurilmalardan</button>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- ── Main ───────────────────────────────────────────── -->
    <v-main class="bz-main">
      <!-- Topbar -->
      <div class="topbar">
        <button v-if="mobile" class="tb-btn menu-toggle" @click="drawer = !drawer">
          <v-icon size="20">mdi-menu</v-icon>
        </button>

        <div class="crumbs">
          <template v-for="(crumb, i) in crumbs" :key="crumb.to">
            <span v-if="i > 0" class="sep">/</span>
            <router-link :to="crumb.to" :class="['c-link', i === crumbs.length - 1 ? 'c-cur' : 'c-parent']">{{ crumb.title }}</router-link>
          </template>
        </div>

        <div class="spacer" />

        <button class="search-trigger" @click="palette.show()">
          <v-icon size="16">mdi-magnify</v-icon>
          <span class="hide-sm">Qidirish</span>
          <span class="kbd hide-sm"><kbd>⌘K</kbd></span>
        </button>

        <!-- Appearance popover (themes + accents + style + light/dark) -->
        <v-menu v-model="appOpen" :close-on-content-click="false" location="bottom end" offset="10">
          <template #activator="{ props: act }">
            <button class="tb-btn" v-bind="act" title="Ko'rinish">
              <v-icon size="18">mdi-palette-outline</v-icon>
            </button>
          </template>
          <div class="appear-pop">
            <div class="pop-t">Mavzu</div>
            <div class="theme-grid">
              <button
                v-for="t in themeStore.THEMES"
                :key="t.id"
                class="theme-sw"
                :class="{ active: themeStore.themeId === t.id }"
                @click="themeStore.setTheme(t.id)"
              >
                <span class="tsw" :style="`background:${t.swatch[1]}`">
                  <i :style="`background:${t.swatch[0]}`" />
                  <i :style="`background:${t.swatch[2]}`" />
                </span>
                <span class="tsl">{{ t.label }}</span>
              </button>
            </div>

            <div class="pop-t">Asosiy rang</div>
            <div class="accent-swatches">
              <button
                v-for="a in themeStore.ACCENTS"
                :key="a.id"
                class="accent-sw"
                :class="{ active: themeStore.accent === a.id }"
                :style="`background:${a.color}`"
                @click="themeStore.setAccent(a.id)"
              >
                <span class="ck"><v-icon size="14">mdi-check</v-icon></span>
              </button>
            </div>

            <div class="pop-t">Uslub</div>
            <div class="seg">
              <button :aria-pressed="themeStore.style === 'modern'" @click="themeStore.setStyle('modern')">Modern</button>
              <button :aria-pressed="themeStore.style === 'editorial'" @click="themeStore.setStyle('editorial')">Editorial</button>
            </div>
          </div>
        </v-menu>

        <button class="tb-btn" :title="themeStore.isDark ? 'Yorug\' tema' : 'Qorong\'u tema'" @click="themeStore.toggleDark()">
          <v-icon size="18">{{ themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </button>

        <button class="tb-btn" title="Yangi buyurtmalar" @click="$router.push('/orders?status=pending')">
          <v-icon size="18">mdi-bell-outline</v-icon>
          <span class="ping" />
        </button>
      </div>

      <!-- Page content -->
      <div :class="['page-scroll', { 'is-flush': isFlushRoute }]">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { usePaletteStore } from '@/stores/palette'
import { useThemeStore } from '@/stores/theme'
import { ROLE_LABELS } from '@/composables/useFormat'

const auth       = useAuthStore()
const route      = useRoute()
const router     = useRouter()
const palette    = usePaletteStore()
const themeStore = useThemeStore()
const display    = useDisplay()
const mobile     = computed(() => display.mdAndDown.value)

const drawer   = ref(!mobile.value)
const userOpen = ref(false)
const appOpen  = ref(false)

watch(mobile, (isMobile) => { drawer.value = !isMobile })

function onNavClick() { if (mobile.value) drawer.value = false }
function isActive(to) { return route.path === to || route.path.startsWith(to + '/') }

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
  { label: 'Aloqa', items: [
    { to: '/reviews',       icon: 'mdi-comment-quote-outline', title: 'Sharhlar',         perm: 'view_reviews' },
    { to: '/notifications', icon: 'mdi-bell-outline',           title: 'Bildirishnomalar', perm: 'manage_notifications' },
  ]},
  { label: 'Tizim', items: [
    { to: '/delivery-zones', icon: 'mdi-map-marker-radius-outline', title: 'Yetkazib berish', perm: 'view_delivery_zones' },
    { to: '/settings',       icon: 'mdi-cog-outline',                title: 'Sozlamalar',      perm: 'manage_settings' },
  ]},
]

const permsReady = computed(() => !auth.isLoggedIn || !!auth.user)
const visibleGroups = computed(() =>
  NAV
    .map(g => ({ ...g, items: g.items.filter(i => !permsReady.value || auth.hasPerm(i.perm)) }))
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

function goProfile() { userOpen.value = false; router.push('/profile') }
async function handleLogout()    { userOpen.value = false; await auth.logout();    router.push('/login') }
async function handleLogoutAll() { userOpen.value = false; await auth.logoutAll(); router.push('/login') }

onMounted(() => {
  if (auth.isLoggedIn && !auth.user) auth.fetchMe().catch(() => {})
})
</script>

<style scoped>
.bz-shell.v-layout { background: var(--bg); height: 100vh; height: 100dvh; }

/* ── Sidebar — dark panel ──────────────────────────────── */
.bz-side.v-navigation-drawer {
  background: var(--side-bg) !important;
  border-right: none !important;
  display: flex;
  flex-direction: column;
}
.bz-side :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.brand { display: flex; align-items: center; gap: 11px; padding: 20px 18px 16px; }
.brand .logo {
  width: 38px; height: 38px; border-radius: 11px;
  background: var(--accent); color: var(--on-accent);
  display: grid; place-items: center;
  font-family: var(--font-display); font-weight: 800; font-size: 19px;
  box-shadow: 0 8px 20px -8px var(--accent); flex-shrink: 0;
}
.brand .bn { line-height: 1.15; }
.brand .bn .b1 { font-family: var(--font-display); font-weight: var(--display-weight); font-size: 16px; letter-spacing: -0.01em; color: var(--side-ink); }
.brand .bn .b2 { font-size: 10px; color: var(--side-muted); letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; margin-top: 2px; }

.nav { flex: 1; overflow-y: auto; padding: 6px 12px 14px; }
.nav-group { margin-top: 16px; }
.nav-group:first-child { margin-top: 4px; }
.nav-group > .gl { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--side-muted); font-weight: 700; padding: 8px 12px 6px; display: flex; align-items: center; gap: 8px; }
.nav-group > .gl::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.7; }

.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 7px 10px; border-radius: 10px;
  color: var(--side-soft); font-size: 13.5px; font-weight: 600;
  cursor: pointer; position: relative; margin-bottom: 2px;
  transition: background 0.2s var(--ease), color 0.2s, box-shadow 0.2s;
}
.nav-item .ni-ic { width: 30px; height: 30px; border-radius: 8px; background: var(--side-surface); display: grid; place-items: center; flex-shrink: 0; transition: all 0.2s var(--ease); color: var(--side-soft); }
.nav-item .ni-l { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-item:hover { background: var(--side-hover); color: var(--side-ink); }
.nav-item:hover .ni-ic { color: var(--accent); }
.nav-item.active { background: var(--accent); color: var(--on-accent); box-shadow: 0 10px 22px -10px var(--accent); }
.nav-item.active .ni-ic { background: rgba(255,255,255,0.18); color: var(--on-accent); }
.nav-item .badge { margin-left: auto; font-size: 11px; font-weight: 700; background: var(--bad); color: #fff; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 99px; display: grid; place-items: center; }
.nav-item.active .badge { background: rgba(255,255,255,0.24); color: var(--on-accent); }

.user-menu { border-top: 1px solid var(--side-line); padding: 12px; position: relative; }
.user-trigger { display: flex; align-items: center; gap: 11px; width: 100%; padding: 8px; border-radius: 11px; border: none; background: transparent; cursor: pointer; transition: background 0.2s; }
.user-trigger:hover { background: var(--side-hover); }
.user-trigger .nm { text-align: left; line-height: 1.15; min-width: 0; flex: 1; }
.user-trigger .nm .n1 { font-weight: 700; font-size: 13.5px; color: var(--side-ink); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-trigger .nm .n2 { font-size: 12px; color: var(--side-muted); }
.user-trigger .chev { margin-left: auto; color: var(--side-muted); transition: transform 0.25s; }
.user-menu.open .user-trigger .chev { transform: rotate(180deg); }
.bz-avatar { background: var(--side-surface) !important; color: var(--side-ink) !important; }

.user-pop {
  position: absolute; bottom: calc(100% - 4px); left: 12px; right: 12px;
  background: var(--side-surface); border: 1px solid var(--side-line); border-radius: 12px;
  box-shadow: var(--shadow-lg); padding: 6px; z-index: 50;
  opacity: 0; transform: translateY(8px); pointer-events: none;
  transition: opacity 0.2s var(--ease), transform 0.25s var(--ease);
}
.user-menu.open .user-pop { opacity: 1; transform: none; pointer-events: auto; }
.user-pop button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border: none; background: transparent; border-radius: 8px; font-size: 13.5px; color: var(--side-soft); cursor: pointer; text-align: left; transition: background 0.15s, color 0.15s; }
.user-pop button:hover { background: var(--side-hover); color: var(--side-ink); }
.user-pop button.danger:hover { background: var(--bad); color: #fff; }

/* ── Main + topbar ─────────────────────────────────────── */
/* v-main is a fixed-height flex column; the page area is the
   only scroll container (body is overflow:hidden). Vuetify's v-main
   has no inner wrap, so the flex column lives on v-main itself; the
   :deep wrap rule is a harmless fallback if a wrap ever exists. */
.bz-main.v-main {
  height: 100vh; height: 100dvh;
  overflow: hidden;
  display: flex; flex-direction: column;
}
.bz-main :deep(.v-main__wrap) { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.topbar {
  height: var(--topbar-h); flex-shrink: 0;
  display: flex; align-items: center; gap: 12px;
  padding: 0 24px; border-bottom: 1px solid var(--line);
  background: var(--surface);
  z-index: 8;
}
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); min-width: 0; }
.crumbs .c-link { color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; transition: color 0.15s; }
.crumbs .c-link:hover { color: var(--ink-soft); }
.crumbs .c-cur { color: var(--ink); font-weight: 600; }
.crumbs .sep { opacity: 0.5; }
.topbar .spacer { flex: 1; }

.tb-btn {
  width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--surface-2); color: var(--ink-soft); cursor: pointer;
  display: grid; place-items: center; position: relative; flex-shrink: 0;
  transition: all 0.2s var(--ease);
}
.tb-btn:hover { border-color: var(--line-strong); color: var(--ink); transform: translateY(-1px); }
.tb-btn .ping { position: absolute; top: 7px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: var(--bad); border: 2px solid var(--surface); }

.search-trigger {
  display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px 0 13px;
  border-radius: 10px; border: 1px solid var(--line); background: var(--surface-2);
  color: var(--muted); cursor: pointer; font-size: 13.5px; min-width: 200px;
  transition: all 0.2s var(--ease);
}
.search-trigger:hover { border-color: var(--line-strong); color: var(--ink-soft); }
.search-trigger .kbd kbd { font-family: var(--font-ui); font-size: 11px; background: var(--surface); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; color: var(--muted); margin-left: auto; }
.search-trigger .kbd { margin-left: auto; }

/* ── Page scroller ─────────────────────────────────────── */
.page-scroll { flex: 1; overflow-y: auto; min-height: 0; padding: clamp(20px, 3vw, 38px) clamp(18px, 3.2vw, 44px); }
.page-scroll.is-flush { padding: 0; }

/* ── Appearance popover ────────────────────────────────── */
.appear-pop { padding: 10px; min-width: 248px; }
.pop-t { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); font-weight: 700; padding: 8px 6px 6px; }
.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.theme-sw { display: flex; flex-direction: column; gap: 6px; align-items: center; padding: 8px 4px 7px; border-radius: 11px; border: 1.5px solid var(--line); background: var(--surface-2); cursor: pointer; transition: all 0.18s var(--ease); }
.theme-sw:hover { border-color: var(--line-strong); transform: translateY(-1px); }
.theme-sw.active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.theme-sw .tsw { width: 100%; height: 30px; border-radius: 8px; position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: 4px; gap: 3px; border: 1px solid rgba(128,128,128,0.15); }
.theme-sw .tsw i { width: 9px; height: 9px; border-radius: 50%; }
.theme-sw .tsl { font-size: 11px; font-weight: 600; color: var(--ink-soft); }

.accent-swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 7px; padding: 4px 6px; }
.accent-sw { width: 100%; aspect-ratio: 1; border-radius: 8px; border: 2px solid transparent; cursor: pointer; transition: transform 0.18s var(--ease); position: relative; }
.accent-sw:hover { transform: scale(1.12); }
.accent-sw.active { border-color: var(--ink); }
.accent-sw .ck { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; opacity: 0; }
.accent-sw.active .ck { opacity: 1; }

.seg { display: inline-flex; background: var(--surface-3); border-radius: 10px; padding: 3px; gap: 2px; margin: 4px 6px 6px; }
.seg button { border: none; background: transparent; cursor: pointer; font-size: 12.5px; font-weight: 600; padding: 6px 13px; border-radius: 7px; color: var(--muted); transition: all 0.22s var(--ease); }
.seg button:hover { color: var(--ink); }
.seg button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-sm); }

@media (max-width: 600px) {
  .topbar { padding: 0 12px; gap: 8px; }
  .search-trigger { min-width: 0; width: 38px; padding: 0; justify-content: center; }
  .search-trigger .hide-sm { display: none; }
}
</style>
