import api from './_client'

export const authApi = {
  login:     d  => api.post('/auth-login', d),
  logout:    () => api.post('/auth-logout'),
  logoutAll: () => api.post('/auth-logout-all'),
  me:        () => api.get('/auth-me'),
}
