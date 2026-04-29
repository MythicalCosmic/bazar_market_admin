<template>
  <v-app theme="light">
    <div class="login-bg d-flex align-center justify-center" style="min-height:100vh">
      <v-card rounded="2xl" width="420" class="pa-8" elevation="8">
        <!-- Logo -->
        <div class="d-flex align-center justify-center flex-column mb-8">
          <div
            class="d-flex align-center justify-center mb-4"
            style="width:60px;height:60px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:16px"
          >
            <v-icon color="white" size="30">mdi-storefront</v-icon>
          </div>
          <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">Bazar Market</div>
          <div style="font-size:13px;color:#94A3B8;margin-top:2px">Admin Panel</div>
        </div>

        <v-form ref="formRef" @submit.prevent="submit">
          <v-text-field
            v-model="username"
            label="Login"
            prepend-inner-icon="mdi-account-outline"
            :rules="[r => !!r || 'Majburiy']"
            class="mb-3"
            autofocus
          />
          <v-text-field
            v-model="password"
            label="Parol"
            :type="showPass ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            :rules="[r => !!r || 'Majburiy']"
            class="mb-6"
            @click:append-inner="showPass = !showPass"
          />
          <v-btn
            color="primary"
            block
            size="large"
            rounded="lg"
            type="submit"
            :loading="loading"
            style="font-weight:700;font-size:15px"
          >
            Kirish
          </v-btn>
        </v-form>

        <div v-if="error" class="mt-4 text-center" style="font-size:13px;color:#EF4444">{{ error }}</div>
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
  background: linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #EFF6FF 100%);
}
</style>
