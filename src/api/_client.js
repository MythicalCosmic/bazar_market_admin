import axios from 'axios'
import { useSnackStore } from '@/stores/snack'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/admin-api',
  timeout: 30000,
})

api.interceptors.request.use(cfg => {
  const key = localStorage.getItem('session_key')
  if (key) cfg.headers['Authorization'] = `Bearer ${key}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status

    if (status === 401) {
      const isLoginRequest = err.config?.url?.includes('/auth-login')
      const onLoginPage    = window.location.pathname === '/login'
      if (!isLoginRequest && !onLoginPage) {
        localStorage.removeItem('session_key')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }

    if (!err.config?._silent) {
      const isServerError  = status >= 500
      const isNetworkError = !err.response
      if (isServerError || isNetworkError) {
        try {
          useSnackStore().error(
            err.response?.data?.message
              || (isNetworkError ? 'Tarmoq xatosi — internetni tekshiring' : 'Server xatosi')
          )
        } catch { /* pinia not yet active */ }
      }
    }
    return Promise.reject(err)
  }
)

export default api
