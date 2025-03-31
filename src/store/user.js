import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi, 
  refreshToken as refreshTokenApi, 
  getCurrentUser as getCurrentUserApi,
  updateUserInfo
} from '../api/user'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref('')
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const avatar = computed(() => user.value?.avatarUrl || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
  const nickname = computed(() => user.value?.nickname || user.value?.username || '')

  // 从localStorage中恢复用户信息和令牌
  const storedUser = localStorage.getItem('user')
  const storedToken = localStorage.getItem('token')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to parse stored user info:', e)
      localStorage.removeItem('user')
    }
  }
  if (storedToken) {
    token.value = storedToken
    // 设置axios默认请求头
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
  }

  // 登录
  async function login(loginData) {
    try {
      loading.value = true
      const response = await loginApi(loginData)
      
      if (response.success) {
        // 保存token
        const tokenValue = response.token
        token.value = tokenValue
        localStorage.setItem('token', tokenValue)
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`
        
        // 保存用户信息
        user.value = response.user
        localStorage.setItem('user', JSON.stringify(response.user))
        
        return { success: true, user: response.user }
      } else {
        return { success: false, message: response.message || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: error.response?.data?.message || '登录失败，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(registerData) {
    try {
      loading.value = true
      const response = await registerApi(registerData)
      
      if (response.success) {
        return { success: true }
      } else {
        return { success: false, message: response.message || '注册失败' }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: error.response?.data?.message || '注册失败，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      loading.value = true
      
      // 调用后端登出接口
      if (token.value) {
        await logoutApi()
      }
      
      // 清除本地存储和状态
      user.value = null
      token.value = ''
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      // 清除axios默认请求头
      delete axios.defaults.headers.common['Authorization']
      
      return { success: true, message: '登出成功' }
    } catch (error) {
      console.error('登出失败:', error)
      
      // 即使请求失败，也应清除本地状态
      user.value = null
      token.value = ''
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      
      return { success: false, message: error.response?.data?.message || '登出失败，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  // 刷新令牌
  async function refreshToken() {
    try {
      if (!token.value) {
        return { success: false, message: '没有有效的令牌' }
      }
      
      const response = await refreshTokenApi()
      
      if (response.success) {
        // 保存新token
        const newToken = response.token
        token.value = newToken
        localStorage.setItem('token', newToken)
        
        // 更新axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        
        return { success: true }
      } else {
        return { success: false, message: response.message || '刷新令牌失败' }
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      return { success: false, message: error.response?.data?.message || '刷新令牌失败，请稍后重试' }
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    try {
      if (!token.value) {
        return { success: false, message: '未登录' }
      }
      
      loading.value = true
      const response = await getCurrentUserApi()
      
      if (response.success) {
        // 更新用户信息
        user.value = response.user
        localStorage.setItem('user', JSON.stringify(response.user))
        return { success: true, user: response.user }
      } else {
        return { success: false, message: response.message || '获取用户信息失败' }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return { success: false, message: error.response?.data?.message || '获取用户信息失败，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  async function updateUser(userData) {
    try {
      if (!user.value || !user.value.id) {
        return { success: false, message: '未登录或用户ID不存在' }
      }
      
      loading.value = true
      const response = await updateUserInfo(user.value.id, userData)
      
      if (response.success) {
        // 更新本地存储的用户信息
        user.value = { ...user.value, ...userData }
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true, message: '更新成功' }
      } else {
        return { success: false, message: response.message || '更新失败' }
      }
    } catch (error) {
      console.error('更新失败:', error)
      return { success: false, message: error.response?.data?.message || '更新失败，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    avatar,
    nickname,
    login,
    register,
    logout,
    refreshToken,
    fetchCurrentUser,
    updateUser
  }
}) 