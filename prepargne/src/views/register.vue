<template>
  <div class="auth-container">
    <div class="card">
      <h1>Create an account</h1>
      <p class="subtitle">Start optimizing your savings</p>

      <form @submit.prevent="register">

        <div class="input-group">
          <label>Username</label>
          <input v-model="username" type="text" required />
        </div>

        <div class="input-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>

        <div class="input-group">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>

        <div class="input-group">
          <label>Confirm password</label>
          <input v-model="confirmPassword" type="password" required />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Creating..." : "Create account" }}
        </button>

        <p class="error" v-if="error">{{ error }}</p>
      </form>

      <p class="switch">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import axios from "axios"
import { useRouter } from "vue-router"

const username = ref("")
const email = ref("")
const password = ref("")
const confirmPassword = ref("")
const error = ref("")
const loading = ref(false)

const router = useRouter()

const register = async () => {
  error.value = ""

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match"
    return
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters"
    return
  }

  loading.value = true

  try {
    await axios.put("http://localhost:3000/log-in", {
      username: username.value,
      email: email.value,
      password: password.value
    })

    router.push("/login")
  } catch (err) {
    error.value = err.response?.data?.message || "Registration failed"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #020617, #0f172a);
}

.card {
  background: #0f172a;
  padding: 2rem;
  border-radius: 16px;
  width: 350px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

h1 {
  margin-bottom: 0.3rem;
}

.subtitle {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  border: none;
  margin-top: 0.3rem;
  background: #1e293b;
  color: white;
}

button {
  width: 100%;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  background: #22c55e;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}

button:hover {
  background: #16a34a;
}

.error {
  color: #f87171;
  margin-top: 1rem;
}

.switch {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  text-align: center;
}
</style>