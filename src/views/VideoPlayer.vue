<template>
  <div class="video-player-page">
    <el-container>
      <el-header>
        <el-menu
          mode="horizontal"
          :ellipsis="false"
          class="nav-menu"
        >
          <el-menu-item index="1" @click="goHome">
            <img src="../assets/logo.svg" class="logo" alt="Logo"/>
            视频播放平台
          </el-menu-item>
          <div class="flex-grow" />
          <el-menu-item index="2" @click="goHome">首页</el-menu-item>
          <el-menu-item index="3">分类</el-menu-item>
          <el-menu-item index="4">收藏</el-menu-item>
        </el-menu>
      </el-header>

      <el-main>
        <div class="video-container">
          <video
            controls
            class="video-player"
            :src="videoUrl"
            poster="https://via.placeholder.com/1280x720"
          ></video>
        </div>

        <div class="video-details">
          <h1>{{ videoTitle }}</h1>
          <p class="video-stats">
            <span>{{ viewCount }} 次观看</span>
            <span>{{ uploadDate }}</span>
          </p>
          <el-divider />
          <p class="video-description">{{ videoDescription }}</p>
        </div>

        <div class="related-videos">
          <h2>相关视频</h2>
          <el-row :gutter="20">
            <el-col :span="6" v-for="i in 4" :key="i">
              <el-card class="video-card" shadow="hover">
                <div class="video-thumbnail">
                  <el-image
                    src="https://via.placeholder.com/320x180"
                    fit="cover"
                  />
                </div>
                <div class="video-info">
                  <h3>相关视频 {{ i }}</h3>
                  <p>视频简介...</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 模拟数据
const videoUrl = ref('https://www.example.com/sample-video.mp4')
const videoTitle = ref('示例视频标题')
const viewCount = ref('1,234')
const uploadDate = ref('2023-05-20')
const videoDescription = ref('这是一个视频描述示例。这里可以包含关于视频的详细信息，例如视频内容的摘要、创作背景等。')

const goHome = () => {
  router.push('/')
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

.video-container {
  width: 100%;
  margin-bottom: 20px;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  background-color: #000;
}

.video-details {
  margin-bottom: 30px;
}

.video-details h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.video-stats {
  color: #666;
  font-size: 14px;
}

.video-stats span {
  margin-right: 15px;
}

.video-description {
  white-space: pre-line;
  line-height: 1.5;
}

.related-videos h2 {
  margin-bottom: 20px;
}

.video-card {
  margin-bottom: 20px;
  cursor: pointer;
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
  max-width: 1200px;
  margin: 0 auto;
}
</style>