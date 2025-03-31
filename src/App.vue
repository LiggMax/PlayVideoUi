<script setup>
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

// 应用启动时加载用户信息
onMounted(async () => {
  if (userStore.token && !userStore.user) {
    await userStore.fetchCurrentUser()
  }
})
</script>

<template>
  <div>
    <NavBar />
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>