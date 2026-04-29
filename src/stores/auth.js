import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(localStorage.getItem('session_key') || null)
  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const { data } = await authApi.login({ username, password, device: 'Admin Panel' })
    token.value = data.data.session_key
    localStorage.setItem('session_key', data.data.session_key)
    await fetchMe()
  }

  async function logout() {
    try { await authApi.logout() } catch {}
    token.value = null
    user.value  = null
    localStorage.removeItem('session_key')
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    user.value = data.data
  }

  return { user, token, isLoggedIn, login, logout, fetchMe }
})
