import Vue from 'vue'
import VueRouter from 'vue-router'
import GaodeAPI from '../views/GaodeAPI.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'GaodeAPI',
    component: GaodeAPI,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/About.vue'),
  },
]

const router = new VueRouter({
  routes,
})

export default router
