import api from './_client'

export const productsApi = {
  list:        p => api.get('/products', { params: p }),
  get:         id => api.get(`/product/${id}`),
  create:      d => api.post('/product/create', d),
  update:      (id, d) => api.patch(`/product/${id}/update`, d),
  delete:      id => api.delete(`/product/${id}/delete`),
  restore:     id => api.post(`/product/${id}/restore`),
  reorder:     ids => api.post('/products/reorder', { ids }),
  activate:    id => api.post(`/product/${id}/activate`),
  deactivate:  id => api.post(`/product/${id}/deactivate`),
  feature:     id => api.post(`/product/${id}/feature`),
  unfeature:   id => api.post(`/product/${id}/unfeature`),
  setStock:    (id, d) => api.post(`/product/${id}/stock`, d),
  addImages:   (id, images) => api.post(`/product/${id}/images`, { images }),
  removeImage: (id, imgId) => api.delete(`/product/${id}/image/${imgId}`),
  reorderImages: (id, ids) => api.post(`/product/${id}/images/reorder`, { ids }),
  setPrimaryImage: (id, imgId) => api.post(`/product/${id}/image/${imgId}/primary`),
  assignDiscounts: (id, discount_ids) => api.post(`/product/${id}/discounts/assign`, { discount_ids }),
  removeDiscounts: (id, discount_ids) => api.post(`/product/${id}/discounts/remove`, { discount_ids }),
}
