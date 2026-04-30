import api from './_client'

export const customersApi = {
  list:       p => api.get('/customers', { params: p }),
  get:        id => api.get(`/customer/${id}`),
  update:     (id, d) => api.patch(`/customer/${id}/update`, d),
  activate:   id => api.post(`/customer/${id}/activate`),
  deactivate: id => api.post(`/customer/${id}/deactivate`),
}
