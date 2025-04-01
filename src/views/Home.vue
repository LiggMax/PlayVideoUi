<template>
  <div class="home">
    <el-container>
      <el-main>
        <div class="video-tabs">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane label="最新视频" name="latest"></el-tab-pane>
            <el-tab-pane label="热门视频" name="popular"></el-tab-pane>
            <el-tab-pane label="分类视频" name="category">
              <div class="category-select">
                <el-select v-model="selectedCategory" placeholder="选择视频分类" @change="handleCategoryChange">
                  <el-option
                    v-for="item in categories"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="6" v-for="video in videos" :key="video.id">
            <el-card class="video-card" shadow="hover" @click="goToVideo(video.id)">
              <div class="video-thumbnail">
                <el-image
                  :src="video.coverUrl || 'https://via.placeholder.com/320x180'"
                  fit="cover"
                />
              </div>
              <div class="video-info">
                <h3>{{ video.title }}</h3>
                <p class="uploader">{{ video.uploaderName }}</p>
                <p class="video-stats">
                  <span>{{ formatNumber(video.views) }} 播放</span>
                  <span class="dot">·</span>
                  <span>{{ formatNumber(video.likes) }} 赞</span>
                </p>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-size="pageSize"
            layout="prev, pager, next"
            :total="total">
          </el-pagination>
        </div>
        
        <div class="no-data" v-if="videos.length === 0">
          <el-empty description="暂无视频数据"></el-empty>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLatestVideos, getPopularVideos, getVideosByCategory } from '../api/video'

const router = useRouter()
const videos = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)
const activeTab = ref('latest')
const selectedCategory = ref('')
const categories = ref([
  { value: '风景', label: '风景' },
  { value: '教育', label: '教育' },
  { value: '美食', label: '美食' },
  { value: '游戏', label: '游戏' },
  { value: '音乐', label: '音乐' },
  { value: '科技', label: '科技' }
])

// 加载视频数据
const loadVideos = async (page = 1) => {
  try {
    let response
    currentPage.value = page
    
    switch (activeTab.value) {
      case 'latest':
        response = await getLatestVideos(page, pageSize.value)
        break
      case 'popular':
        response = await getPopularVideos(page, pageSize.value)
        break
      case 'category':
        if (!selectedCategory.value) {
          selectedCategory.value = categories.value[0].value
        }
        response = await getVideosByCategory(selectedCategory.value, page, pageSize.value)
        break
      default:
        response = await getLatestVideos(page, pageSize.value)
    }
    
    if (response.success) {
      videos.value = response.data.videos
      total.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取视频列表失败')
    }
  } catch (error) {
    console.error('加载视频失败:', error)
    ElMessage.error('获取视频列表失败，请稍后重试')
  }
}

// 处理分页变化
const handleCurrentChange = (page) => {
  loadVideos(page)
}

// 处理标签切换
const handleTabClick = () => {
  currentPage.value = 1
  loadVideos(1)
}

// 处理分类变化
const handleCategoryChange = () => {
  if (activeTab.value === 'category') {
    currentPage.value = 1
    loadVideos(1)
  }
}

// 跳转到视频详情页
const goToVideo = (videoId) => {
  router.push({ path: `/video/${videoId}` })
}

// 格式化数字（如：1000 -> 1k）
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num
}

// 组件挂载时加载视频
onMounted(() => {
  loadVideos()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.video-tabs {
  margin-bottom: 20px;
}

.category-select {
  margin-top: 10px;
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

.uploader {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}

.video-stats {
  margin: 5px 0 0;
  font-size: 12px;
  color: #999;
}

.dot {
  margin: 0 5px;
}

.el-main {
  padding: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.no-data {
  margin-top: 50px;
  text-align: center;
}
</style>