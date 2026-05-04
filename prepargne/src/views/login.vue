<template>
  <div class="auth-container">
    <div class="card">
      <h1>Sign in</h1>
      <p class="subtitle">Access your financial dashboard</p>

      <form @submit.prevent="login">

        <div class="input-group">
          <label>Username</label>
          <input v-model="username" type="text" placeholder="Optional" />
        </div>

        <div class="input-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Optional" />
        </div>

        <div class="input-group">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Signing in..." : "Sign in" }}
        </button>

        <p class="error" v-if="error">{{ error }}</p>
      </form>

      <p class="switch">
        Don’t have an account yet?
        <router-link to="/register">Create one</router-link>
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
const error = ref("")
const loading = ref(false)

const router = useRouter()

const login = async () => {
  error.value = ""

  if (!username.value && !email.value) {
    error.value = "Please enter a username or an email"
    return
  }

  loading.value = true

  try {
    const res = await axios.post("http://localhost:3000/log-in", {
      username: username.value || undefined,
      email: email.value || undefined,
      password: password.value
    })

    localStorage.setItem("token", res.data.token)

    router.push("/dashboard")
  } catch (err) {
    error.value = err.response?.data?.message || "Login failed"
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