import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/room/:roomId', name: 'room', component: () => import('../views/RoomView.vue') },
  { path: '/game/:roomId', name: 'game', component: () => import('../views/GameView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const saved = localStorage.getItem('draw_room')
  if (to.name === 'home' && saved) {
    try {
      const { roomId } = JSON.parse(saved)
      if (roomId) return next({ name: 'room', params: { roomId } })
    } catch {}
  }
  if (to.name === 'room') {
    next()
  } else if (to.name !== 'home' && !saved) {
    next('/')
  } else {
    next()
  }
})

export default router
