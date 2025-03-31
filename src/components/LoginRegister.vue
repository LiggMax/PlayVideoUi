<template>
  <div class="login-register">
    <el-tabs v-model="activeTab" class="login-tabs">
      <el-tab-pane label="登录" name="login">
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="form-container">
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="用户名" 
              class="custom-input"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="密码"
              class="custom-input"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <div class="remember-forgot">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="#" class="forgot-link">忘记密码?</a>
          </div>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleLogin" 
              :loading="loading" 
              class="submit-button"
              size="large"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="注册" name="register">
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" class="form-container">
          <el-form-item prop="username">
            <el-input 
              v-model="registerForm.username" 
              placeholder="用户名" 
              class="custom-input"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="密码"
              class="custom-input"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="确认密码"
              class="custom-input"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleRegister" 
              :loading="loading" 
              class="submit-button"
              size="large"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock, Promotion, ChatDotRound, Position } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref(null)
const registerFormRef = ref(null)
const rememberMe = ref(false)

// 登录表单数据和验证规则
const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册表单数据和验证规则
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 登录处理函数
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 这里添加登录请求逻辑
      setTimeout(() => {
        ElMessage.success('登录成功')
        loading.value = false
      }, 1000)
    }
  })
}

// 注册处理函数
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 这里添加注册请求逻辑
      setTimeout(() => {
        ElMessage.success('注册成功')
        loading.value = false
        activeTab.value = 'login'
      }, 1000)
    }
  })
}

defineExpose({
  activeTab
})
</script>

<style scoped>
.login-register {
  padding: 20px;
  width: 380px;
  color: #333;
}


.login-tabs {
  margin-bottom: 15px;
}

.form-container {
  margin-top: 15px;
}

.custom-input {
  margin-bottom: 5px;
  border-radius: 8px;
}

.submit-button {
  width: 100%;
  border-radius: 8px;
  font-size: 16px;
  margin-top: 10px;
  height: 44px;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}

.forgot-link {
  color: #409EFF;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}


</style> 