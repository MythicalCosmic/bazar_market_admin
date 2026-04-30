import api from './_client'

export const bannersApi = {
  list:       p => api.get('/banners', { params: p }),
  get:        id => api.get(`/banner/${id}`),
  create:     d => api.post('/banner/create', d),
  update:     (id, d) => api.patch(`/banner/${id}/update`, d),
  delete:     id => api.delete(`/banner/${id}/delete`),
  reorder:    ids => api.post('/banners/reorder', { ids }),
  activate:   id => api.post(`/banner/${id}/activate`),
  deactivate: id => api.post(`/banner/${id}/deactivate`),
}
