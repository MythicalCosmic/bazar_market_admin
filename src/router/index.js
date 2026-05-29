import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',                redirect: '/dashboard' },
      { path: 'dashboard',       name: 'dashboard',        component: () => import('@/pages/DashboardPage.vue') },

      { path: 'orders',          name: 'orders',           component: () => import('@/pages/OrdersPage.vue'),         meta: { perm: 'view_orders' } },
      { path: 'orders/:id',      name: 'order-detail',     component: () => import('@/pages/OrderDetailPage.vue'),    meta: { perm: 'view_orders' } },
      { path: 'courier',         name: 'courier',          component: () => import('@/pages/CourierOrdersPage.vue') },

      { path: 'products',        name: 'products',         component: () => import('@/pages/ProductsPage.vue'),       meta: { perm: 'view_products' } },
      { path: 'categories',      name: 'categories',       component: () => import('@/pages/CategoriesPage.vue'),     meta: { perm: 'view_categories' } },

      { path: 'customers',       name: 'customers',        component: () => import('@/pages/CustomersPage.vue'),      meta: { perm: 'view_users' } },
      { path: 'customers/:id',   name: 'customer-detail',  component: () => import('@/pages/CustomerDetailPage.vue'), meta: { perm: 'view_users' } },
      { path: 'users',           name: 'users',            component: () => import('@/pages/UsersPage.vue'),          meta: { perm: 'view_users' } },
      { path: 'roles',           name: 'roles',            component: () => import('@/pages/RolesPage.vue'),          meta: { perm: 'manage_roles' } },

      { path: 'discounts',       name: 'discounts',        component: () => import('@/pages/DiscountsPage.vue'),      meta: { perm: 'manage_discounts' } },
      { path: 'coupons',         name: 'coupons',          component: () => import('@/pages/CouponsPage.vue'),        meta: { perm: 'manage_coupons' } },
      { path: 'banners',         name: 'banners',          component: () => import('@/pages/BannersPage.vue'),        meta: { perm: 'manage_banners' } },
      { path: 'referral-rewards', name: 'referral-rewards', component: () => import('@/pages/ReferralRewardsPage.vue'), meta: { perm: 'manage_referral_rewards' } },

      { path: 'reviews',         name: 'reviews',          component: () => import('@/pages/ReviewsPage.vue'),        meta: { perm: 'view_reviews' } },
      { path: 'notifications',   name: 'notifications',    component: () => import('@/pages/NotificationsPage.vue'),  meta: { perm: 'manage_notifications' } },

      { path: 'payments',        name: 'payments',         component: () => import('@/pages/PaymentsPage.vue'),       meta: { perm: 'view_payments' } },
      { path: 'payments/:id',    name: 'payment-detail',   component: () => import('@/pages/PaymentDetailPage.vue'),  meta: { perm: 'view_payments' } },

      { path: 'delivery-zones',  name: 'delivery-zones',   component: () => import('@/pages/DeliveryZonesPage.vue'),  meta: { perm: 'view_delivery_zones' } },
      { path: 'settings',        name: 'settings',         component: () => import('@/pages/SettingsPage.vue'),       meta: { perm: 'manage_settings' } },

      { path: 'analytics',       name: 'analytics',        component: () => import('@/pages/AnalyticsPage.vue'),      meta: { perm: 'view_analytics' } },
      { path: 'profile',         name: 'profile',          component: () => import('@/pages/ProfilePage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.path === '/login' && auth.isLoggedIn) return '/'

  // Permission gate: if route declares one and the user lacks it, bounce to dashboard
  if (to.meta.perm && auth.isLoggedIn) {
    // Wait for /me if needed (first navigation after refresh)
    if (!auth.user) {
      try { await auth.fetchMe() } catch {}
    }
    if (!auth.hasPerm(to.meta.perm)) {
      try { useSnackStore().error('Bu sahifaga ruxsatingiz yo\'q') } catch {}
      return '/dashboard'
    }
  }
})

export default router
