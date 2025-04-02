<template>
  <div class="home">
    <el-container>
      <el-main>
        <h2 class="page-title">最新视频</h2>
        
        <el-row :gutter="20">
          <!-- 左侧最新视频区域 -->
          <el-col :span="18">
            <el-row :gutter="20">
              <el-col :span="8" v-for="video in latestVideos" :key="video.id">
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
            
            <div class="pagination-container" v-if="latestTotal > 0">
              <el-pagination
                @current-change="handleLatestPageChange"
                :current-page="latestPage"
                :page-size="pageSize"
                layout="prev, pager, next"
                :total="latestTotal">
              </el-pagination>
            </div>
            
            <div class="no-data" v-if="latestVideos.length === 0">
              <el-empty description="暂无视频数据"></el-empty>
            </div>
          </el-col>
          
          <!-- 右侧热门排行榜 -->
          <el-col :span="6">
            <div class="popular-videos-container">
              <h3 class="popular-title">
                <el-icon><Trophy /></el-icon> 热门排行
              </h3>
              <div class="popular-list">
                <div 
                  v-for="(video, index) in popularVideos" 
                  :key="video.id" 
                  class="popular-item"
                  @click="goToVideo(video.id)"
                >
                  <div class="popular-rank" 
                    :class="{
                      'rank-1': index === 0,
                      'rank-2': index === 1,
                      'rank-3': index === 2,
                      'top-three': index < 3
                    }"
                  >{{ index + 1 }}</div>
                  <div class="popular-thumbnail">
                    <el-image
                      :src="video.coverUrl || 'https://via.placeholder.com/120x67'"
                      fit="cover"
                    />
                  </div>
                  <div class="popular-info">
                    <h4 class="popular-title">{{ video.title }}</h4>
                    <p class="popular-stats">{{ formatNumber(video.views) }} 播放</p>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Trophy } from '@element-plus/icons-vue'
import { getLatestVideos, getPopularVideos } from '../api/video'

const router = useRouter()
const latestVideos = ref([])
const popularVideos = ref([])
const latestTotal = ref(0)
const latestPage = ref(1)
const pageSize = ref(9)

// 加载最新视频数据
const loadLatestVideos = async (page = 1) => {
  try {
    latestPage.value = page
    const response = await getLatestVideos(page, pageSize.value)
    
    if (response.success) {
      latestVideos.value = response.data.videos
      latestTotal.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取最新视频列表失败')
    }
  } catch (error) {
    console.error('加载最新视频失败:', error)
    ElMessage.error('获取最新视频列表失败，请稍后重试')
  }
}

// 加载热门视频数据
const loadPopularVideos = async () => {
  try {
    const response = await getPopularVideos(1, 10)
    
    if (response.success) {
      popularVideos.value = response.data.videos
    } else {
      ElMessage.error(response.message || '获取热门视频列表失败')
    }
  } catch (error) {
    console.error('加载热门视频失败:', error)
    ElMessage.error('获取热门视频列表失败，请稍后重试')
  }
}

// 处理最新视频分页变化
const handleLatestPageChange = (page) => {
  loadLatestVideos(page)
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
  loadLatestVideos()
  loadPopularVideos()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.page-title {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 600;
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
  height: 0;
  padding-bottom: 56.25%;  /* 16:9 宽高比 */
  position: relative;
  overflow: hidden;
}

.video-thumbnail .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 48px;
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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.no-data {
  margin-top: 50px;
  text-align: center;
}

/* 热门排行区域样式 */
.popular-videos-container {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.popular-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 12px;
}

.popular-title .el-icon {
  margin-right: 8px;
  color: #ff9900;
  font-size: 22px;
}

.popular-list {
  display: flex;
  flex-direction: column;
}

.popular-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.popular-item:last-child {
  border-bottom: none;
}

.popular-item:hover {
  background-color: #f0f0f0;
  transform: translateX(5px);
}

.popular-rank {
  min-width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #606266;
  font-weight: bold;
  border-radius: 4px;
  margin-right: 12px;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.popular-rank.top-three {
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-size: 15px;
}

.popular-rank.rank-1 {
  background: linear-gradient(135deg, #ffcc00, #ff6600);
  box-shadow: 0 2px 6px rgba(255,102,0,0.3);
}

.popular-rank.rank-2 {
  background: linear-gradient(135deg, #b4b9c8, #8892a8);
  box-shadow: 0 2px 6px rgba(136,146,168,0.3);
}

.popular-rank.rank-3 {
  background: linear-gradient(135deg, #d8a374, #a97142);
  box-shadow: 0 2px 6px rgba(169,113,66,0.3);
}

.popular-thumbnail {
  width: 80px;
  height: 45px;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.popular-info {
  flex: 1;
  overflow: hidden;
}

.popular-info h4 {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #333;
  transition: color 0.2s;
}

.popular-item:hover .popular-info h4 {
  color: #409EFF;
}

.popular-stats {
  font-size: 12px;
  color: #999;
  margin: 5px 0 0;
  display: flex;
  align-items: center;
}

.popular-stats:before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background-color: #ddd;
  border-radius: 50%;
  margin-right: 5px;
}
</style>