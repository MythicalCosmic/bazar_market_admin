import api from './_client'

export const notificationsApi = {
  list:       p => api.get('/notifications', { params: p }),
  get:        id => api.get(`/notification/${id}`),
  sendToUser: (userId, payload) => api.post(`/notification/user/${userId}/send`, payload),
  sendBulk:   payload => api.post('/notifications/send', payload),
  delete:     id => api.delete(`/notification/${id}/delete`),
  deleteUser: userId => api.delete(`/notification/user/${userId}/delete`),
}
