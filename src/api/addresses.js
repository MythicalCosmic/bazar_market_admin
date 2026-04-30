import api from './_client'

export const addressesApi = {
  list:   p   => api.get('/addresses', { params: p }),
  byUser: uid => api.get(`/addresses/user/${uid}`),
  get:    id  => api.get(`/address/${id}`),
}
