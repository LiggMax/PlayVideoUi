<template>
  <div class="category-container">
    <h1 class="category-title">{{ categoryTitle }}</h1>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="videoList.length === 0" class="empty-container">
      <el-empty description="该分类下暂无视频" />
    </div>
    
    <div v-else class="video-grid">
      <el-card 
        v-for="video in videoList" 
        :key="video.id" 
        class="video-item"
        shadow="hover"
        @click="goToVideo(video.id)"
      >
        <div class="video-thumb">
          <el-image 
            :src="video.coverUrl || 'https://via.placeholder.com/320x180'" 
            fit="cover"
          ></el-image>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <p class="video-uploader">{{ video.uploaderName }}</p>
          <p class="video-stats">
            <span>{{ formatNumber(video.views) }} 播放</span>
            <span class="dot">·</span>
            <span>{{ formatDate(video.createTime) }}</span>
          </p>
        </div>
      </el-card>
    </div>
    
    <div class="pagination-container" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getVideosByCategory } from '../api/video'

const route = useRoute()
const router = useRouter()

// 页面状态
const loading = ref(false)
const videoList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 获取分类参数
const category = computed(() => route.params.category)

// 分类映射表
const categoryMap = {
  'technology': '科技',
  'game': '游戏',
  'music': '音乐',
  'movie': '电影',
  'animation': '动画',
  'sports': '运动',
  'food': '美食',
  'other': '其他'
}

// 分类标题
const categoryTitle = computed(() => {
  return categoryMap[category.value] || '未知分类'
})

// 加载分类视频
const loadCategoryVideos = async () => {
  loading.value = true
  try {
    const response = await getVideosByCategory(
      category.value, 
      currentPage.value, 
      pageSize.value
    )
    
    if (response.success && response.data) {
      videoList.value = response.data.videos || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error('获取视频失败')
      videoList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载分类视频失败:', error)
    ElMessage.error('获取视频失败，请稍后再试')
    videoList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 跳转到视频详情页
const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadCategoryVideos()
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 处理每页数量变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadCategoryVideos()
}

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date // 时间差（毫秒）
  
  // 小于1天，显示多少小时前
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return hours > 0 ? `${hours}小时前` : '刚刚'
  }
  
  // 小于30天，显示多少天前
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 大于30天，显示年月日
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 监听分类参数变化
watch(() => route.params.category, (newCategory) => {
  if (newCategory) {
    currentPage.value = 1
    loadCategoryVideos()
  }
})

// 页面挂载时加载数据
onMounted(() => {
  if (category.value) {
    loadCategoryVideos()
  }
})
</script>

<style scoped>
.category-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.loading-container, 
.empty-container {
  padding: 40px 0;
  text-align: center;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.video-item {
  cursor: pointer;
  transition: transform 0.3s;
}

.video-item:hover {
  transform: translateY(-5px);
}

.video-thumb {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.video-info {
  padding: 10px 0;
}

.video-title {
  margin: 0 0 5px;
  font-size: 16px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-uploader {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.video-stats {
  margin: 5px 0 0;
  font-size: 13px;
  color: #909399;
}

.dot {
  margin: 0 5px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .video-thumb {
    height: 100px;
  }
  
  .video-title {
    font-size: 14px;
  }
  
  .video-uploader,
  .video-stats {
    font-size: 12px;
  }
}
</style> 