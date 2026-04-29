import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/admin-api',
})

api.interceptors.request.use(cfg => {
  const key = localStorage.getItem('session_key')
  if (key) cfg.headers['Authorization'] = `Bearer ${key}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('session_key')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login:  d => api.post('/auth-login', d),
  logout: () => api.post('/auth-logout'),
  me:     () => api.get('/auth-me'),
}

// ── Orders ────────────────────────────────────────
export const ordersApi = {
  list:           p => api.get('/orders', { params: p }),
  get:            id => api.get(`/order/${id}`),
  updateStatus:   (id, d) => api.post(`/order/${id}/status`, d),
  updatePayment:  (id, s) => api.post(`/order/${id}/payment-status`, { payment_status: s }),
  addNote:        (id, note) => api.post(`/order/${id}/note`, { note }),
  assignCourier:  (id, uid) => api.post(`/order/${id}/assign-courier`, { user_id: uid }),
  unassignCourier:(id) => api.post(`/order/${id}/unassign-courier`),
  cancel:         (id, r) => api.post(`/order/${id}/cancel`, { reason: r }),
  bulkStatus:     d => api.post('/orders/bulk-status', d),
}

// ── Categories ────────────────────────────────────
export const categoriesApi = {
  list:       p => api.get('/categories', { params: p }),
  tree:       () => api.get('/categories/tree'),
  get:        id => api.get(`/category/${id}`),
  create:     d => api.post('/category/create', d),
  update:     (id, d) => api.patch(`/category/${id}/update`, d),
  delete:     id => api.delete(`/category/${id}/delete`),
  restore:    id => api.post(`/category/${id}/restore`),
  activate:   id => api.post(`/category/${id}/activate`),
  deactivate: id => api.post(`/category/${id}/deactivate`),
  reorder:    d => api.post('/categories/reorder', d),
}

// ── Products ──────────────────────────────────────
export const productsApi = {
  list:       p => api.get('/products', { params: p }),
  get:        id => api.get(`/product/${id}`),
  create:     d => api.post('/product/create', d),
  update:     (id, d) => api.patch(`/product/${id}/update`, d),
  delete:     id => api.delete(`/product/${id}/delete`),
  restore:    id => api.post(`/product/${id}/restore`),
  activate:   id => api.post(`/product/${id}/activate`),
  deactivate: id => api.post(`/product/${id}/deactivate`),
  feature:    id => api.post(`/product/${id}/feature`),
  unfeature:  id => api.post(`/product/${id}/unfeature`),
  setStock:   (id, d) => api.post(`/product/${id}/stock`, d),
  addImages:  (id, d) => api.post(`/product/${id}/images`, d),
  deleteImage:(id, imgId) => api.delete(`/product/${id}/image/${imgId}`),
}

// ── Customers ─────────────────────────────────────
export const customersApi = {
  list:       p => api.get('/customers', { params: p }),
  get:        id => api.get(`/customer/${id}`),
  update:     (id, d) => api.patch(`/customer/${id}/update`, d),
  activate:   id => api.post(`/customer/${id}/activate`),
  deactivate: id => api.post(`/customer/${id}/deactivate`),
}

// ── Addresses ─────────────────────────────────────
export const addressesApi = {
  list:   p => api.get('/addresses', { params: p }),
  byUser: uid => api.get(`/addresses/user/${uid}`),
  get:    id => api.get(`/address/${id}`),
}

// ── Users (admins/couriers) ───────────────────────
export const usersApi = {
  list:             p => api.get('/users', { params: p }),
  get:              id => api.get(`/user/${id}`),
  create:           d => api.post('/user/create', d),
  update:           (id, d) => api.patch(`/user/${id}/update`, d),
  delete:           id => api.delete(`/user/${id}/delete`),
  restore:          id => api.post(`/user/${id}/restore`),
  getPermissions:   id => api.get(`/user/${id}/permissions`),
  grantPermission:  (id, d) => api.post(`/user/${id}/permissions/grant`, d),
  denyPermission:   (id, d) => api.post(`/user/${id}/permissions/deny`, d),
  removePermission: (id, d) => api.delete(`/user/${id}/permissions/remove`, { data: d }),
  clearPermissions: id => api.delete(`/user/${id}/permissions/clear`),
}

// ── Discounts ─────────────────────────────────────
export const discountsApi = {
  list:       p => api.get('/discounts', { params: p }),
  get:        id => api.get(`/discount/${id}`),
  create:     d => api.post('/discount/create', d),
  update:     (id, d) => api.patch(`/discount/${id}/update`, d),
  delete:     id => api.delete(`/discount/${id}/delete`),
  restore:    id => api.post(`/discount/${id}/restore`),
  activate:   id => api.post(`/discount/${id}/activate`),
  deactivate: id => api.post(`/discount/${id}/deactivate`),
  setProducts:(id, d) => api.post(`/discount/${id}/products/set`, d),
  addProducts:(id, d) => api.post(`/discount/${id}/products/add`, d),
  setCategories:(id,d)=> api.post(`/discount/${id}/categories/set`, d),
}

// ── Coupons ───────────────────────────────────────
export const couponsApi = {
  list:       p => api.get('/coupons', { params: p }),
  get:        id => api.get(`/coupon/${id}`),
  create:     d => api.post('/coupon/create', d),
  update:     (id, d) => api.patch(`/coupon/${id}/update`, d),
  delete:     id => api.delete(`/coupon/${id}/delete`),
  activate:   id => api.post(`/coupon/${id}/activate`),
  deactivate: id => api.post(`/coupon/${id}/deactivate`),
}

// ── Banners ───────────────────────────────────────
export const bannersApi = {
  list:       p => api.get('/banners', { params: p }),
  get:        id => api.get(`/banner/${id}`),
  create:     d => api.post('/banner/create', d),
  update:     (id, d) => api.patch(`/banner/${id}/update`, d),
  delete:     id => api.delete(`/banner/${id}/delete`),
  activate:   id => api.post(`/banner/${id}/activate`),
  deactivate: id => api.post(`/banner/${id}/deactivate`),
  reorder:    d => api.post('/banners/reorder', d),
}

// ── Delivery Zones ────────────────────────────────
export const zonesApi = {
  list:       p => api.get('/zones', { params: p }),
  get:        id => api.get(`/zone/${id}`),
  create:     d => api.post('/zone/create', d),
  update:     (id, d) => api.patch(`/zone/${id}/update`, d),
  delete:     id => api.delete(`/zone/${id}/delete`),
  activate:   id => api.post(`/zone/${id}/activate`),
  deactivate: id => api.post(`/zone/${id}/deactivate`),
  reorder:    d => api.post('/zones/reorder', d),
}

// ── Reviews ───────────────────────────────────────
export const reviewsApi = {
  list:    p => api.get('/reviews', { params: p }),
  get:     id => api.get(`/review/${id}`),
  approve: id => api.post(`/review/${id}/approve`),
  reject:  id => api.post(`/review/${id}/reject`),
  reply:   (id, d) => api.post(`/review/${id}/reply`, d),
}

// ── Settings ──────────────────────────────────────
export const settingsApi = {
  list: () => api.get('/settings'),
  set:  d => api.post('/settings/set', d),
}

export default api
