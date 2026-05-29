<template>
  <v-app theme="light">
    <div class="login-bg d-flex align-center justify-center" style="min-height:100vh;position:relative;overflow:hidden">
      <div class="bz-mesh bz-mesh-1" />
      <div class="bz-mesh bz-mesh-2" />
      <div class="bz-mesh bz-mesh-3" />

      <v-card
        v-motion
        :initial="{ opacity: 0, scale: 0.96, y: 20 }"
        :enter="{ opacity: 1, scale: 1, y: 0, transition: { duration: 480 } }"
        rounded="xl"
        class="pa-8 bz-card bz-login-card"
        style="box-shadow:var(--bz-shadow-lg);border:1px solid var(--bz-border);position:relative;backdrop-filter:blur(8px);background:rgba(255,255,255,0.92)"
      >
        <!-- Logo -->
        <div class="d-flex align-center justify-center flex-column mb-7">
          <div
            v-motion
            :initial="{ scale: 0.8, rotate: -8 }"
            :enter="{ scale: 1, rotate: 0, transition: { duration: 600, delay: 100 } }"
            class="d-flex align-center justify-center mb-4"
            style="width:64px;height:64px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:18px;box-shadow:0 12px 32px rgba(22,163,74,0.32)"
          >
            <v-icon color="white" size="32">mdi-storefront</v-icon>
          </div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.6px">Bazar Market</div>
          <div style="font-size:13px;color:var(--bz-text-3);margin-top:2px;font-weight:600">Admin Panel</div>
        </div>

        <v-form ref="formRef" @submit.prevent="submit">
          <v-text-field
            v-model="username"
            label="Login"
            prepend-inner-icon="mdi-account-outline"
            :rules="[r => !!r || 'Majburiy']"
            class="mb-3"
            autofocus
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            label="Parol"
            :type="showPass ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            :rules="[r => !!r || 'Majburiy']"
            class="mb-2"
            autocomplete="current-password"
            @click:append-inner="showPass = !showPass"
          />

          <div v-if="error" class="mb-3 d-flex align-center ga-2 pa-3" style="background:var(--bz-danger-soft);border-radius:12px;color:var(--bz-danger);font-size:12.5px;font-weight:600">
            <v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
            {{ error }}
          </div>

          <v-btn
            color="primary"
            block
            size="large"
            rounded="lg"
            type="submit"
            :loading="loading"
            class="mt-3"
            style="font-weight:700;font-size:14.5px;letter-spacing:0.2px"
          >
            <v-icon start>mdi-login</v-icon>
            Kirish
          </v-btn>
        </v-form>

        <div class="text-center mt-5" style="font-size:11.5px;color:var(--bz-text-3);font-weight:600">
          © {{ new Date().getFullYear() }} Bazar Market. Barcha huquqlar himoyalangan.
        </div>
      </v-card>
    </div>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth     = useAuthStore()
const router   = useRouter()
const formRef  = ref()
const username = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const error    = ref('')

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  error.value   = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login yoki parol noto\'g\'ri'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 50%, #EFF6FF 100%);
  padding: 16px;
}
.bz-login-card {
  width: 440px;
  max-width: 100%;
}
@media (max-width: 600px) {
  .bz-login-card {
    padding: 24px !important;
  }
}
.bz-mesh {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  animation: mesh-drift 18s ease-in-out infinite;
  pointer-events: none;
}
.bz-mesh-1 { top: -120px; left: -120px; background: radial-gradient(circle, #16A34A, transparent 70%); animation-delay: 0s; }
.bz-mesh-2 { bottom: -160px; right: -120px; background: radial-gradient(circle, #3B82F6, transparent 70%); animation-delay: -6s; }
.bz-mesh-3 { top: 40%; left: 50%; background: radial-gradient(circle, #F59E0B, transparent 70%); animation-delay: -12s; opacity: 0.35; }
@keyframes mesh-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(40px, -30px) scale(1.1); }
  66%      { transform: translate(-30px, 40px) scale(0.95); }
}
</style>
