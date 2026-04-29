import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',               redirect: '/dashboard' },
      { path: 'dashboard',      name: 'dashboard',       component: () => import('@/pages/DashboardPage.vue') },
      { path: 'orders',         name: 'orders',          component: () => import('@/pages/OrdersPage.vue') },
      { path: 'orders/:id',     name: 'order-detail',    component: () => import('@/pages/OrderDetailPage.vue') },
      { path: 'products',       name: 'products',        component: () => import('@/pages/ProductsPage.vue') },
      { path: 'categories',     name: 'categories',      component: () => import('@/pages/CategoriesPage.vue') },
      { path: 'customers',      name: 'customers',       component: () => import('@/pages/CustomersPage.vue') },
      { path: 'customers/:id',  name: 'customer-detail', component: () => import('@/pages/CustomerDetailPage.vue') },
      { path: 'users',          name: 'users',           component: () => import('@/pages/UsersPage.vue') },
      { path: 'discounts',      name: 'discounts',       component: () => import('@/pages/DiscountsPage.vue') },
      { path: 'coupons',        name: 'coupons',         component: () => import('@/pages/CouponsPage.vue') },
      { path: 'delivery-zones', name: 'delivery-zones',  component: () => import('@/pages/DeliveryZonesPage.vue') },
      { path: 'settings',       name: 'settings',        component: () => import('@/pages/SettingsPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.path === '/login' && auth.isLoggedIn) return '/'
})

export default router
