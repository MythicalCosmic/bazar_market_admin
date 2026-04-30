import api from './_client'

export const paymentsApi = {
  list:         p => api.get('/payments', { params: p }),
  get:          id => api.get(`/payment/${id}`),
  byOrder:      orderId => api.get(`/payments/order/${orderId}`),
  updateStatus: (id, status) => api.post(`/payment/${id}/status`, { status }),
  refund:       (id, reason) => api.post(`/payment/${id}/refund`, { reason }),
}
