<template>
  <el-header>
    <el-menu
      mode="horizontal"
      :ellipsis="false"
      class="nav-menu"
    >
      <el-menu-item index="1">
        <img src="../assets/logo.svg" class="logo" alt="Logo"/>
        视频播放平台
      </el-menu-item>
      <div class="flex-grow" />
      <el-menu-item index="2">首页</el-menu-item>
      <el-menu-item index="3">分类</el-menu-item>
      <el-menu-item index="4">收藏</el-menu-item>
      
      <!-- 用户图标 -->
      <el-menu-item index="5" v-if="!userInfo" @click="openLoginDialog">
        <el-button text>
          <el-icon><Avatar /></el-icon>
          登录/注册
        </el-button>
      </el-menu-item>
      
      <!-- 已登录用户信息 -->
      <el-sub-menu index="5" v-else>
        <template #title>
          <el-avatar :size="32" :src="userInfo.avatarUrl" />
          <span class="username">{{ userInfo.nickname || userInfo.username }}</span>
        </template>
        <el-menu-item index="5-1">个人中心</el-menu-item>
        <el-menu-item index="5-2">我的收藏</el-menu-item>
        <el-menu-item index="5-3">历史记录</el-menu-item>
        <el-menu-item index="5-4" @click="handleLogout">退出登录</el-menu-item>
      </el-sub-menu>
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
import { ref, onMounted } from 'vue'
import { Avatar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LoginRegister from './LoginRegister.vue'
import { getUser, logout } from '../utils/auth'

const loginDialogVisible = ref(false)
const loginRegisterRef = ref(null)
const userInfo = ref(null)

// 打开登录对话框
const openLoginDialog = () => {
  loginDialogVisible.value = true
}

// 登录成功处理
const handleLoginSuccess = (user) => {
  userInfo.value = user
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

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    logout()
    userInfo.value = null
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

// 组件挂载时检查登录状态
onMounted(() => {
  const user = getUser()
  if (user) {
    userInfo.value = user
  }
})
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

.username {
  margin-left: 8px;
  font-size: 14px;
}

:deep(.login-dialog .el-dialog__header) {
  padding: 0;
}

:deep(.login-dialog .el-dialog__body) {
  padding: 0;
}
</style>