<template>
  <div class="video-player-page">
    <el-container>
      <el-main>
        <div v-if="loading" class="loading-container">
          <el-skeleton animated>
            <template #template>
              <div class="video-skeleton">
                <el-skeleton-item variant="rect" style="width: 100%; height: 500px;" />
                <div style="padding: 14px;">
                  <el-skeleton-item variant="h3" style="width: 50%;" />
                  <div style="display: flex; align-items: center; margin-top: 16px;">
                    <el-skeleton-item variant="text" style="margin-right: 16px;" />
                    <el-skeleton-item variant="text" style="width: 30%;" />
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
        
        <div v-else>
          <div class="video-container">
            <video
              ref="videoPlayer"
              controls
              class="video-player"
              :src="video.videoUrl"
              :poster="video.coverUrl || 'https://via.placeholder.com/1280x720'"
              @play="handleVideoPlay"
            ></video>
          </div>

          <div class="video-details">
            <h1>{{ video.title }}</h1>
            <p class="video-stats">
              <span>{{ formatNumber(video.views) }} 次观看</span>
              <span>{{ formatDate(video.createTime) }}</span>
            </p>
            <div class="uploader-info">
              <span>上传者: {{ video.uploaderName }}</span>
              <el-button type="danger" size="small" :icon="Star" @click="handleLikeVideo">
                {{ formatNumber(video.likes) }} 赞
              </el-button>
            </div>
            <el-divider />
            <p class="video-description">{{ video.description }}</p>
            <p v-if="video.tags" class="video-tags">
              <el-tag v-for="tag in getTagList(video.tags)" :key="tag" size="small" effect="plain" class="tag">
                {{ tag }}
              </el-tag>
            </p>
          </div>

          <div class="related-videos" v-if="relatedVideos.length > 0">
            <h2>相关视频</h2>
            <el-row :gutter="20">
              <el-col :span="6" v-for="relatedVideo in relatedVideos" :key="relatedVideo.id">
                <el-card class="video-card" shadow="hover" @click="goToVideo(relatedVideo.id)">
                  <div class="video-thumbnail">
                    <el-image
                      :src="relatedVideo.coverUrl || 'https://via.placeholder.com/320x180'"
                      fit="cover"
                    />
                  </div>
                  <div class="video-info">
                    <h3>{{ relatedVideo.title }}</h3>
                    <p>{{ relatedVideo.uploaderName }}</p>
                    <p class="video-stats">
                      <span>{{ formatNumber(relatedVideo.views) }} 播放</span>
                      <span class="dot">·</span>
                      <span>{{ formatNumber(relatedVideo.likes) }} 赞</span>
                    </p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { getVideoDetail, incrementViews, likeVideo, getVideosByCategory } from '../api/video'

const router = useRouter()
const route = useRoute()
const videoPlayer = ref(null)
const loading = ref(true)
const video = ref({
  id: null,
  title: '',
  description: '',
  videoUrl: '',
  coverUrl: '',
  views: 0,
  likes: 0,
  createTime: null,
  uploaderName: '',
  category: '',
  tags: ''
})
const relatedVideos = ref([])
const viewIncremented = ref(false)

// 加载视频详情
const loadVideoDetail = async () => {
  try {
    loading.value = true
    const videoId = route.params.id
    
    if (!videoId) {
      ElMessage.error('视频ID无效')
      router.push('/')
      return
    }
    
    const response = await getVideoDetail(videoId)
    
    if (response.success && response.data) {
      video.value = response.data
      // 加载相关视频（同类别的视频）
      loadRelatedVideos()
    } else {
      ElMessage.error(response.message || '获取视频详情失败')
      router.push('/')
    }
  } catch (error) {
    console.error('加载视频详情失败:', error)
    ElMessage.error('获取视频详情失败，请稍后重试')
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 加载相关视频
const loadRelatedVideos = async () => {
  try {
    if (video.value.category) {
      const response = await getVideosByCategory(video.value.category, 1, 4)
      
      if (response.success && response.data && response.data.videos) {
        // 过滤掉当前视频
        relatedVideos.value = response.data.videos.filter(item => item.id !== video.value.id).slice(0, 4)
      }
    }
  } catch (error) {
    console.error('加载相关视频失败:', error)
  }
}

// 处理视频播放
const handleVideoPlay = async () => {
  if (!viewIncremented.value && video.value.id) {
    try {
      await incrementViews(video.value.id)
      viewIncremented.value = true
      video.value.views++
    } catch (error) {
      console.error('增加播放次数失败:', error)
    }
  }
}

// 处理点赞
const handleLikeVideo = async () => {
  try {
    if (!video.value.id) return
    
    const response = await likeVideo(video.value.id)
    
    if (response.success) {
      video.value.likes++
      ElMessage.success('点赞成功')
    } else {
      ElMessage.error(response.message || '点赞失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('点赞失败，请稍后重试')
  }
}

// 跳转到其他视频
const goToVideo = (videoId) => {
  if (videoId === video.value.id) return
  router.push({ path: `/video/${videoId}` })
  // 重新加载页面数据
  loadVideoDetail()
  // 重置状态
  viewIncremented.value = false
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 格式化数字
const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取标签列表
const getTagList = (tags) => {
  if (!tags) return []
  return tags.split(',')
}

// 组件挂载时加载视频详情
onMounted(() => {
  loadVideoDetail()
})
</script>

<style scoped>
.loading-container {
  width: 100%;
  margin-bottom: 20px;
}

.video-skeleton {
  width: 100%;
}

.video-container {
  width: 100%;
  margin-bottom: 20px;
  background-color: #000;
  display: flex;
  justify-content: center;
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

.uploader-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
}

.video-description {
  white-space: pre-line;
  line-height: 1.5;
}

.video-tags {
  margin-top: 15px;
}

.tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.related-videos h2 {
  margin-bottom: 20px;
}

.video-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.video-card:hover {
  transform: translateY(-5px);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-info p {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}

.dot {
  margin: 0 5px;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>