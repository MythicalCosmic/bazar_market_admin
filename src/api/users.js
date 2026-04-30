import api from './_client'

export const usersApi = {
  list:             p => api.get('/users', { params: p }),
  get:              id => api.get(`/user/${id}`),
  create:           d => api.post('/user/create', d),
  update:           (id, d) => api.patch(`/user/${id}/update`, d),
  delete:           id => api.delete(`/user/${id}/delete`),
  restore:          id => api.post(`/user/${id}/restore`),
  getPermissions:   id => api.get(`/user/${id}/permissions`),
  grantPermission:  (id, permission) => api.post(`/user/${id}/permissions/grant`, { permission }),
  denyPermission:   (id, permission) => api.post(`/user/${id}/permissions/deny`, { permission }),
  removePermission: (id, permission) => api.delete(`/user/${id}/permissions/remove`, { data: { permission } }),
  clearPermissions: id => api.delete(`/user/${id}/permissions/clear`),
}
