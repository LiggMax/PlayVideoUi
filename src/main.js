import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { useUserStore } from './store/user'

// 配置axios默认URL
axios.defaults.baseURL = 'http://localhost:8080'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 添加axios响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    // 判断是否为401未授权错误
    if (error.response && error.response.status === 401) {
      // 获取用户状态管理实例
      const userStore = useUserStore()
      
      // 如果用户已登录，则执行登出操作
      if (userStore.isLoggedIn()) {
        // 清空用户信息和令牌
        userStore.user = null
        userStore.token = ''
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        
        // 提示用户登录已过期
        ElMessage.error('登录已过期，请重新登录')
        
        // 跳转到登录页面
        router.push('/login')
      }
    }
    
    return Promise.reject(error)
  }
)

app.mount('#app')