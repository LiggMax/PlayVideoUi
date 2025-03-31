import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister } from '../api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || '',
    loading: false
  }),

  // 计算属性
  getters: {
    isLoggedIn: (state) => !!state.user,
    username: (state) => state.user?.username || '',
    nickname: (state) => {
      if (!state.user) return ''
      return state.user.nickname || state.user.username || ''
    },
    avatar: (state) => state.user?.avatarUrl || 'https://via.placeholder.com/150'
  },

  // 操作方法
  actions: {
    // 登录
    async login(loginData) {
      try {
        this.loading = true
        const response = await apiLogin(loginData)
        
        if (response.success) {
          this.setUserData(response.user)
          ElMessage.success(`欢迎回来，${response.user.nickname || response.user.username}！`)
          return { success: true, user: response.user }
        } else {
          ElMessage.error(response.message || '登录失败')
          return { success: false, message: response.message }
        }
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败，请稍后重试')
        return { success: false, message: '登录失败，请稍后重试' }
      } finally {
        this.loading = false
      }
    },

    // 注册
    async register(registerData) {
      try {
        this.loading = true
        const response = await apiRegister(registerData)
        
        if (response.success) {
          ElMessage.success('注册成功，请登录')
          return { success: true }
        } else {
          ElMessage.error(response.message || '注册失败')
          return { success: false, message: response.message }
        }
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('注册失败，请稍后重试')
        return { success: false, message: '注册失败，请稍后重试' }
      } finally {
        this.loading = false
      }
    },

    // 退出登录
    logout() {
      this.user = null
      this.token = ''
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      ElMessage.success('已退出登录')
    },

    // 设置用户数据
    setUserData(userData) {
      this.user = userData
      // 可以在此处设置token，如果后端返回token
      localStorage.setItem('user', JSON.stringify(userData))
    },

    // 设置token
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    }
  }
}) 