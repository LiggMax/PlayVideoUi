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
      <el-menu-item index="5" @click="openLoginDialog">
        <el-icon><Avatar /></el-icon>
      </el-menu-item>
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
      <LoginRegister ref="loginRegisterRef" />
    </el-dialog>
  </el-header>
</template>

<script setup>
import { ref } from 'vue'
import { Avatar } from '@element-plus/icons-vue'
import LoginRegister from './LoginRegister.vue'

const loginDialogVisible = ref(false)
const loginRegisterRef = ref(null)

const openLoginDialog = () => {
  loginDialogVisible.value = true
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

:deep(.login-dialog .el-dialog__header) {
  padding: 0;
}

:deep(.login-dialog .el-dialog__body) {
  padding: 0;
}
</style>