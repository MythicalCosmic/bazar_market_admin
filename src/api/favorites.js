import api from './_client'

export const favoritesApi = {
  list: p => api.get('/favorites', { params: p }),
  most: (limit = 20) => api.get('/favorites/most', { params: { limit } }),
}
