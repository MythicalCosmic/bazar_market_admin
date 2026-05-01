import api from './_client'

export const referralRewardsApi = {
  list:       p => api.get('/referral-rewards', { params: p }),
  get:        id => api.get(`/referral-reward/${id}`),
  create:     d => api.post('/referral-reward/create', d),
  update:     (id, d) => api.patch(`/referral-reward/${id}/update`, d),
  delete:     id => api.delete(`/referral-reward/${id}/delete`),
  activate:   id => api.post(`/referral-reward/${id}/activate`),
  deactivate: id => api.post(`/referral-reward/${id}/deactivate`),
}
