import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const permissions = ref([])
  const token       = ref(localStorage.getItem('session_key') || null)
  const expiresAt   = ref(localStorage.getItem('session_expires_at') || null)

  const isLoggedIn = computed(() => !!token.value)
  const role       = computed(() => user.value?.role || null)
  const isAdmin    = computed(() => role.value === 'admin')

  function hasPerm(code) {
    if (!code) return true
    if (isAdmin.value) return true
    return permissions.value.includes(code)
  }

  async function login(username, password) {
    const { data } = await authApi.login({
      username,
      password,
      device: deviceLabel(),
    })
    token.value     = data.data.session_key
    expiresAt.value = data.data.expires_at || null
    localStorage.setItem('session_key', data.data.session_key)
    if (expiresAt.value) localStorage.setItem('session_expires_at', expiresAt.value)
    if (data.data.user) user.value = data.data.user
    try {
      await fetchMe()
    } catch (e) {
      token.value = null
      user.value  = null
      expiresAt.value = null
      localStorage.removeItem('session_key')
      localStorage.removeItem('session_expires_at')
      throw e
    }
  }

  async function logout() {
    try { await authApi.logout() } catch {}
    clearLocal()
  }

  async function logoutAll() {
    try { await authApi.logoutAll() } catch {}
    clearLocal()
  }

  function clearLocal() {
    token.value = null
    user.value  = null
    permissions.value = []
    expiresAt.value = null
    localStorage.removeItem('session_key')
    localStorage.removeItem('session_expires_at')
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    user.value = data.data
    permissions.value = data.data?.permissions || []
  }

  return {
    user, permissions, token, expiresAt,
    isLoggedIn, role, isAdmin,
    hasPerm, login, logout, logoutAll, fetchMe,
  }
})

function deviceLabel() {
  const ua = navigator.userAgent || ''
  let os = 'Unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac/i.test(ua)) os = 'Mac'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  let browser = 'Browser'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'
  return `${browser} • ${os}`
}
