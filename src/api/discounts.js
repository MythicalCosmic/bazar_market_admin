import api from './_client'

export const discountsApi = {
  list:       p => api.get('/discounts', { params: p }),
  get:        id => api.get(`/discount/${id}`),
  create:     d => api.post('/discount/create', d),
  update:     (id, d) => api.patch(`/discount/${id}/update`, d),
  delete:     id => api.delete(`/discount/${id}/delete`),
  restore:    id => api.post(`/discount/${id}/restore`),
  activate:   id => api.post(`/discount/${id}/activate`),
  deactivate: id => api.post(`/discount/${id}/deactivate`),
  setProducts:    (id, product_ids)  => api.post(`/discount/${id}/products/set`,    { product_ids }),
  addProducts:    (id, product_ids)  => api.post(`/discount/${id}/products/add`,    { product_ids }),
  removeProducts: (id, product_ids)  => api.post(`/discount/${id}/products/remove`, { product_ids }),
  setCategories:    (id, category_ids) => api.post(`/discount/${id}/categories/set`,    { category_ids }),
  addCategories:    (id, category_ids) => api.post(`/discount/${id}/categories/add`,    { category_ids }),
  removeCategories: (id, category_ids) => api.post(`/discount/${id}/categories/remove`, { category_ids }),
}
