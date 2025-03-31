<template>
  <el-header>
    <el-menu
      mode="horizontal"
      :ellipsis="false"
      class="nav-menu"
      router
      :default-active="activeIndex"
    >
      <el-menu-item index="/">
        <img src="../assets/logo.svg" class="logo" alt="Logo"/>
        视频播放平台
      </el-menu-item>
      <div class="flex-grow" />
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/category">分类</el-menu-item>
      <el-menu-item index="/favorites">收藏</el-menu-item>
      
      <!-- 未登录状态 -->
      <div v-if="!userStore.isLoggedIn" class="user-auth-wrapper">
        <el-button 
          text 
          class="login-btn" 
          @click="openLoginDialog"
        >
          <el-icon><Avatar /></el-icon>
          <span class="login-text">登录/注册</span>
        </el-button>
      </div>
      
      <!-- 已登录状态 -->
      <el-dropdown v-else trigger="click" @command="handleCommand" class="user-dropdown">
        <div class="user-avatar-container">
          <el-avatar :size="32" :src="userStore.avatar" />
          <span class="username">{{ userStore.nickname }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item command="favorites">
              <el-icon><Star /></el-icon>我的收藏
            </el-dropdown-item>
            <el-dropdown-item command="history">
              <el-icon><Clock /></el-icon>历史记录
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-menu>
    
    <!-- 登录注册弹窗 -->
    <el-dialog
      v-model="loginDialogVisible"
      title=""
      width="450px"
      :show-close="true"
      :destroy-on-close="true"
      class="login-dialog"
    >
      <LoginRegister 
        ref="loginRegisterRef" 
        @login-success="handleLoginSuccess"
        @register-success="handleRegisterSuccess"
      />
    </el-dialog>
  </el-header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Avatar, 
  User, 
  Star, 
  Clock, 
  ArrowDown, 
  SwitchButton 
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import LoginRegister from './LoginRegister.vue'
import { useUserStore } from '../stores/user'

const loginDialogVisible = ref(false)
const loginRegisterRef = ref(null)
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

// 计算当前激活的菜单项
const activeIndex = computed(() => {
  return route.path
})

// 打开登录对话框
const openLoginDialog = () => {
  loginDialogVisible.value = true
}

// 登录成功处理
const handleLoginSuccess = (user) => {
  loginDialogVisible.value = false
  ElMessage.success(`欢迎回来，${user.nickname || user.username}！`)
}

// 注册成功处理
const handleRegisterSuccess = () => {
  // 注册成功后可以切换到登录选项卡
  if (loginRegisterRef.value) {
    loginRegisterRef.value.activeTab = 'login'
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'favorites':
      router.push('/user/favorites')
      break
    case 'history':
      router.push('/user/history')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout().then(() => {
      ElMessage.success('已退出登录')
      router.push('/')
    })
  }).catch(() => {})
}
</script>

<style scoped>
.nav-menu {
  width: 100%;
  padding: 0 20px;
}

.logo {
  height: 30px;
  margin-right: 10px;
}

.flex-grow {
  flex-grow: 1;
}

.user-auth-wrapper {
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.login-btn {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.login-text {
  margin-left: 5px;
}

.user-dropdown {
  padding: 0 20px;
  cursor: pointer;
}

.user-avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 5px 0 8px;
  font-size: 14px;
  color: #606266;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item i) {
  margin-right: 8px;
}

:deep(.login-dialog .el-dialog__header) {
  padding: 0;
}

:deep(.login-dialog .el-dialog__body) {
  padding: 0;
}
</style>