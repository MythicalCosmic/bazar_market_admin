<template>
  <div>
    <BzPageHeader title="Profil" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="bz-card pa-6 text-center">
          <v-avatar size="92" color="primary" variant="tonal" class="mb-4">
            <span style="font-size:32px;font-weight:800">{{ initials }}</span>
          </v-avatar>
          <div style="font-weight:800;font-size:18px">{{ fmt.fullName(auth.user) }}</div>
          <div style="font-size:13px;color:var(--bz-text-3);margin-top:2px">@{{ auth.user?.username }}</div>
          <v-chip :color="ROLE_COLORS[auth.role]" variant="tonal" class="mt-3 chip-sm">{{ ROLE_LABELS[auth.role] || auth.role }}</v-chip>

          <v-divider class="my-4" />

          <div class="d-flex flex-column ga-3" style="text-align:left">
            <div class="d-flex align-center ga-2" style="font-size:13px"><v-icon size="16" color="grey">mdi-phone-outline</v-icon><span>{{ auth.user?.phone || '—' }}</span></div>
            <div class="d-flex align-center ga-2" style="font-size:13px"><v-icon size="16" color="grey">mdi-translate</v-icon><span>{{ auth.user?.language || 'uz' }}</span></div>
            <div v-if="auth.expiresAt" class="d-flex align-center ga-2" style="font-size:13px"><v-icon size="16" color="grey">mdi-clock-outline</v-icon><span>Sessiya: {{ fmt.relativeTime(auth.expiresAt) }}</span></div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- Change password -->
        <v-card rounded="xl" class="bz-card pa-5 mb-4">
          <div style="font-weight:800;font-size:15px;margin-bottom:14px">Parolni o'zgartirish</div>
          <v-form ref="pwdRef">
            <v-text-field label="Yangi parol" v-model="newPassword" type="password" :rules="[r => (r && r.length >= 6) || 'Kamida 6 belgi']" class="mb-3" />
            <v-text-field label="Yangi parolni qayta kiriting" v-model="confirmPassword" type="password" :rules="[r => r === newPassword || 'Mos kelmadi']" class="mb-3" />
            <v-btn color="primary" rounded="lg" :loading="changing" @click="changePassword"><v-icon start>mdi-key-variant</v-icon> Parolni saqlash</v-btn>
          </v-form>
        </v-card>

        <!-- Sessions -->
        <v-card rounded="xl" class="bz-card pa-5">
          <div style="font-weight:800;font-size:15px;margin-bottom:6px">Sessiyalar</div>
          <div style="font-size:12.5px;color:var(--bz-text-3);margin-bottom:14px">Qurilmalardan chiqish va xavfsizlik</div>

          <div class="d-flex ga-2">
            <v-btn variant="tonal" color="warning" rounded="lg" :loading="loggingOut" @click="doLogout">
              <v-icon start>mdi-logout</v-icon> Chiqish
            </v-btn>
            <v-btn variant="tonal" color="error" rounded="lg" :loading="loggingOutAll" @click="doLogoutAll">
              <v-icon start>mdi-logout-variant</v-icon> Barcha qurilmalardan chiqish
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/api'
import { useFormat, ROLE_LABELS, ROLE_COLORS } from '@/composables/useFormat'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'
import BzPageHeader from '@/components/common/BzPageHeader.vue'

const auth   = useAuthStore()
const router = useRouter()
const fmt    = useFormat()
const snack  = useSnackStore()

const newPassword     = ref('')
const confirmPassword = ref('')
const changing        = ref(false)
const loggingOut      = ref(false)
const loggingOutAll   = ref(false)
const pwdRef          = ref()

const initials = computed(() => {
  const u = auth.user
  if (!u) return 'A'
  return ((u.first_name?.[0] || u.username?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || 'A'
})

async function changePassword() {
  const { valid } = await pwdRef.value.validate()
  if (!valid) return
  changing.value = true
  try {
    await usersApi.update(auth.user.id, { password: newPassword.value })
    snack.success('Parol o\'zgartirildi')
    newPassword.value = ''; confirmPassword.value = ''
  } catch (e) { snack.error(e.response?.data?.message || 'Xatolik') }
  finally { changing.value = false }
}

async function doLogout() {
  loggingOut.value = true
  await auth.logout()
  router.push('/login')
}

async function doLogoutAll() {
  loggingOutAll.value = true
  await auth.logoutAll()
  router.push('/login')
}
</script>
