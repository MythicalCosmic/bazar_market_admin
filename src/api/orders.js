import api from './_client'

export const ordersApi = {
  list:            p => api.get('/orders', { params: p }),
  get:             id => api.get(`/order/${id}`),
  updateStatus:    (id, d) => api.post(`/order/${id}/status`, d),
  updatePayment:   (id, payment_status) => api.post(`/order/${id}/payment-status`, { payment_status }),
  addNote:         (id, note) => api.post(`/order/${id}/note`, { note }),
  assignCourier:   (id, courier_id) => api.post(`/order/${id}/assign-courier`, { courier_id }),
  unassignCourier: id => api.post(`/order/${id}/unassign-courier`),
  cancel:          (id, reason) => api.post(`/order/${id}/cancel`, { reason }),
  bulkStatus:      d => api.post('/orders/bulk-status', d),
  acceptPrint:     id => api.post(`/order/${id}/accept-print`),
  print:           id => api.post(`/order/${id}/print`),
  getMinOrder:     () => api.get('/orders/min-order'),
  setMinOrder:     amount => api.post('/orders/min-order/set', { amount }),
}
