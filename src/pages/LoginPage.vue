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
        class="pa-8 bz-login-card"
      >
        <!-- Logo -->
        <div class="d-flex align-center justify-center flex-column mb-7">
          <div
            v-motion
            :initial="{ scale: 0.8, rotate: -8 }"
            :enter="{ scale: 1, rotate: 0, transition: { duration: 600, delay: 100 } }"
            class="d-flex align-center justify-center mb-4 bz-login-mark"
          >
            <v-icon color="white" size="32">mdi-storefront</v-icon>
          </div>
          <div style="font-size:25px;font-weight:800;letter-spacing:-0.7px" class="bz-gradient-text">Bazar Market</div>
          <div style="font-size:13px;color:var(--bz-text-3);margin-top:3px;font-weight:600">Admin Panel</div>
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
  background: linear-gradient(180deg, #070C16 0%, #0B1220 100%);
  padding: 16px;
}
.bz-login-card {
  width: 444px;
  max-width: 100%;
  position: relative;
  background: rgba(255,255,255,0.94) !important;
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.6) !important;
  box-shadow: 0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04),
              inset 0 1px 0 rgba(255,255,255,0.9) !important;
}
.bz-login-mark {
  width: 66px; height: 66px;
  background: linear-gradient(135deg, #059669, #34D399);
  border-radius: 19px;
  box-shadow: 0 14px 40px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.4);
}
@media (max-width: 600px) {
  .bz-login-card { padding: 24px !important; }
}
.bz-mesh {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  animation: mesh-drift 20s ease-in-out infinite;
  pointer-events: none;
}
.bz-mesh-1 { top: -140px; left: -140px; background: radial-gradient(circle, #10B981, transparent 70%); animation-delay: 0s; }
.bz-mesh-2 { bottom: -180px; right: -140px; background: radial-gradient(circle, #6366F1, transparent 70%); animation-delay: -7s; }
.bz-mesh-3 { top: 35%; left: 50%; background: radial-gradient(circle, #A855F7, transparent 70%); animation-delay: -13s; opacity: 0.4; }
@keyframes mesh-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(50px, -36px) scale(1.12); }
  66%      { transform: translate(-36px, 48px) scale(0.94); }
}
@media (prefers-reduced-motion: reduce) {
  .bz-mesh { animation: none; }
}
</style>
