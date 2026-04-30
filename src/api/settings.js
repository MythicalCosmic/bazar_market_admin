import api from './_client'

export const settingsApi = {
  list:   () => api.get('/settings'),
  get:    key => api.get(`/setting/${key}`),
  set:    d => api.post('/settings/set', d),
  delete: key => api.delete(`/setting/${key}/delete`),
}
