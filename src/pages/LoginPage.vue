<template>
  <v-app :theme="themeStore.vuetifyName">
    <div class="login-bg d-flex align-center justify-center" style="min-height:100vh;position:relative;overflow:hidden">
      <v-card
        v-motion
        :initial="{ opacity: 0, scale: 0.96, y: 20 }"
        :enter="{ opacity: 1, scale: 1, y: 0, transition: { duration: 480 } }"
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
          <div class="serif" style="font-size:25px;font-weight:800;letter-spacing:-0.02em;color:var(--ink)">Bazar Market</div>
          <div class="eyebrow" style="margin-top:6px">Admin Panel</div>
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
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
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
  background:
    radial-gradient(circle at 20% 0%, var(--accent-soft), transparent 45%),
    radial-gradient(circle at 100% 100%, var(--accent-soft), transparent 50%),
    var(--bg);
  padding: 16px;
}
.bz-login-card {
  width: 420px;
  max-width: 100%;
  position: relative;
  background: var(--surface) !important;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
}
.bz-login-mark {
  width: 64px; height: 64px;
  background: var(--accent);
  border-radius: 18px;
  box-shadow: 0 14px 36px -10px var(--accent), inset 0 1px 0 rgba(255,255,255,0.3);
}
@media (max-width: 600px) {
  .bz-login-card { padding: 24px !important; }
}

/* ── Input harmony ──────────────────────────────────────────────
   Both fields must read as the SAME component. Without this, the
   focused field gets a bright fill + glow while the empty one looks
   like a flat grey box — two different-looking inputs. We pin a
   consistent surface, a clearly-visible border, and a focus state
   that only swaps the border colour (no jarring fill jump). */
.bz-login-card :deep(.v-field) {
  border-radius: var(--bz-radius-md);
  background: var(--surface-2);
}
.bz-login-card :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--line-strong);
}
.bz-login-card :deep(.v-field--focused .v-field__outline) {
  color: var(--accent);
}
/* The focus glow rounds at radius-md, but Vuetify's outline segments keep the
   default ~4px corners — so a focused field looked rounder than an empty one.
   Pin both segments to radius-md so every field has identical corners. */
.bz-login-card :deep(.v-field__outline__start) {
  border-top-left-radius: var(--bz-radius-md);
  border-bottom-left-radius: var(--bz-radius-md);
}
.bz-login-card :deep(.v-field__outline__end) {
  border-top-right-radius: var(--bz-radius-md);
  border-bottom-right-radius: var(--bz-radius-md);
}
/* Neutralise browser autofill so an autofilled field isn't recoloured
   differently from an empty one. */
.bz-login-card :deep(input:-webkit-autofill),
.bz-login-card :deep(input:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #182037 inset;
  -webkit-text-fill-color: #F1F5F9;
  caret-color: #F1F5F9;
  transition: background-color 9999s ease-in-out 0s;
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
