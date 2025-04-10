import { createRouter, createWebHistory } from 'vue-router'
import FileManager from '../components/FileManager.vue'
import LuckySheet from '../components/LuckySheet.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: FileManager
  },
  {
    path: '/editor',
    name: 'editor',
    component: LuckySheet
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
