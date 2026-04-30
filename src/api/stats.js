import api from './_client'

const get = (path, params) => api.get(`/stats/${path}`, { params })

export const statsApi = {
  overview:      p => get('overview', p),
  staff:         p => get('staff', p),
  customers:     p => get('customers', p),
  categories:    p => get('categories', p),
  products:      p => get('products', p),
  orders:        p => get('orders', p),
  banners:       p => get('banners', p),
  coupons:       p => get('coupons', p),
  discounts:     p => get('discounts', p),
  zones:         p => get('zones', p),
  reviews:       p => get('reviews', p),
  payments:      p => get('payments', p),
  notifications: p => get('notifications', p),
  favorites:     p => get('favorites', p),
}
