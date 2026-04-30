import api from './_client'

export const couponsApi = {
  list:       p => api.get('/coupons', { params: p }),
  get:        id => api.get(`/coupon/${id}`),
  create:     d => api.post('/coupon/create', d),
  update:     (id, d) => api.patch(`/coupon/${id}/update`, d),
  delete:     id => api.delete(`/coupon/${id}/delete`),
  activate:   id => api.post(`/coupon/${id}/activate`),
  deactivate: id => api.post(`/coupon/${id}/deactivate`),
}
