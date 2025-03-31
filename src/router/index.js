import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import VideoPlayer from '../views/VideoPlayer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/video/:id',
      name: 'video',
      component: VideoPlayer,
      props: true
    }
  ]
})

export default router