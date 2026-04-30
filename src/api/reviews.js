import api from './_client'

export const reviewsApi = {
  list:        p => api.get('/reviews', { params: p }),
  get:         id => api.get(`/review/${id}`),
  approve:     id => api.post(`/review/${id}/approve`),
  reject:      id => api.post(`/review/${id}/reject`),
  reply:       (id, reply) => api.post(`/review/${id}/reply`, { reply }),
  delete:      id => api.delete(`/review/${id}/delete`),
  bulkApprove: review_ids => api.post('/reviews/bulk-approve', { review_ids }),
  bulkReject:  review_ids => api.post('/reviews/bulk-reject', { review_ids }),
}
