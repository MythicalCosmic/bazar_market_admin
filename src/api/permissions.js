import api from './_client'

export const permissionsApi = {
  list:    p => api.get('/permissions', { params: p }),
  groups:  () => api.get('/permissions/groups'),
  sync:    () => api.post('/permissions/sync'),
  forRole: role => api.get(`/role/${role}/permissions`),
  setRole: (role, permissions) => api.post(`/role/${role}/permissions/set`, { permissions }),
  resetRole: role => api.post(`/role/${role}/permissions/reset`),
}
