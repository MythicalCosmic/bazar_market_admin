import api from './_client'

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
  reorder:    ids => api.post('/categories/reorder', { ids }),
}
