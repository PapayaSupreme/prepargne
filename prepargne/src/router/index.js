import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import Dashboard from '../views/Dashboard.vue'
import Login from "../views/login.vue";
import Register from "../views/register.vue";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Login
  },
  {
    path: '/Homepage',
    name: 'Homepage',
    component: HomePage
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: "/register",
    name: "Register",
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

