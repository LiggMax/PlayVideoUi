<template>
  <div class="home">
    <el-container>
      <el-header>
        <NavBar />
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="6" v-for="i in 8" :key="i">
            <el-card class="video-card" shadow="hover">
              <div class="video-thumbnail">
                <el-image
                  src="https://via.placeholder.com/320x180"
                  fit="cover"
                />
              </div>
              <div class="video-info">
                <h3>视频标题 {{ i }}</h3>
                <p>视频简介...</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '../components/NavBar.vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.el-header {
  padding: 0;
}

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

.video-card {
  margin-bottom: 20px;
}

.video-thumbnail {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.video-info {
  padding: 10px 0;
}

.video-info h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

.video-info p {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}

.el-main {
  padding: 20px;
}
</style>