import api from './_client'

export const zonesApi = {
  list:       p => api.get('/zones', { params: p }),
  get:        id => api.get(`/zone/${id}`),
  create:     d => api.post('/zone/create', d),
  update:     (id, d) => api.patch(`/zone/${id}/update`, d),
  delete:     id => api.delete(`/zone/${id}/delete`),
  reorder:    ids => api.post('/zones/reorder', { ids }),
  activate:   id => api.post(`/zone/${id}/activate`),
  deactivate: id => api.post(`/zone/${id}/deactivate`),
}
