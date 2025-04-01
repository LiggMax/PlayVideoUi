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
            <el-divider />
            
            <div class="author-info">
              <div class="author-avatar-container">
                <el-avatar :size="50" :src="uploaderAvatar" @click="goToUserProfile" />
              </div>
              <div class="author-details">
                <h3 class="author-name" @click="goToUserProfile" style="cursor: pointer">{{ video.uploaderName }}</h3>
                <p class="upload-date">上传于 {{ formatDate(video.createTime) }}</p>
                <p v-if="uploaderSubscribers" class="subscriber-count">{{ formatNumber(uploaderSubscribers) }} 位关注者</p>
              </div>
              <div class="video-actions">
                <el-button 
                  type="danger" 
                  :icon="Star" 
                  @click="handleLikeVideo"
                  :disabled="likeClicked">
                  {{ formatNumber(video.likes) }} 赞
                </el-button>
                <el-button 
                  type="primary" 
                  @click="handleSubscribe"
                  :disabled="!isLoggedIn || isCurrentUser">
                  {{ isSubscribed ? '已关注' : '关注' }}
                </el-button>
                <el-button 
                  type="default" 
                  :icon="Share" 
                  @click="handleShareVideo">
                  分享
                </el-button>
              </div>
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, Share } from '@element-plus/icons-vue'
import { getVideoDetail, incrementViews, likeVideo, getVideosByCategory } from '../api/video'
import { getUserInfo, subscribeUser, unsubscribeUser, isSubscribed as checkIsSubscribed, getSubscriberCount } from '../api/user'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const videoPlayer = ref(null)
const loading = ref(true)
const uploaderAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png') // 默认头像
const uploaderSubscribers = ref(0) // 作者关注人数
const isSubscribed = ref(false) // 是否已关注
const likeClicked = ref(false) // 是否已点赞
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
  userId: null,
  category: '',
  tags: ''
})
const relatedVideos = ref([])
const viewIncremented = ref(false)
const shareDialogVisible = ref(false)
const shareUrl = computed(() => window.location.href)

// 计算用户是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 计算当前用户是否是视频上传者
const isCurrentUser = computed(() => {
  return isLoggedIn.value && userStore.user && userStore.user.id === video.value.userId
})

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
      // 加载上传者信息
      loadUploaderInfo()
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

// 加载上传者信息
const loadUploaderInfo = async () => {
  try {
    // 重置上传者信息
    uploaderAvatar.value = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
    uploaderSubscribers.value = 0;
    isSubscribed.value = false;
    
    if (video.value.userId) {
      const response = await getUserInfo(video.value.userId);

      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        if (userData.avatarUrl) {
          uploaderAvatar.value = userData.avatarUrl;
        }
        
        // 获取用户的粉丝数
        const subscriberResponse = await getSubscriberCount(video.value.userId);

        if (subscriberResponse.success) {
          uploaderSubscribers.value = subscriberResponse.data;
        }
        
        // 检查当前用户是否已关注该上传者
        if (isLoggedIn.value && userStore.user) {

          try {
            // 明确打印出请求参数
            console.log('开始检查订阅状态，请求参数 targetUserId:', video.value.userId);
            
            const subscriptionResponse = await checkIsSubscribed(video.value.userId);
            console.log('检查订阅状态响应:', JSON.stringify(subscriptionResponse));
            
            if (subscriptionResponse.success) {
              isSubscribed.value = subscriptionResponse.data;
              console.log('设置订阅状态为:', isSubscribed.value);
            } else if (subscriptionResponse.code === 401) {
              // 如果返回401错误，说明用户未登录或token已过期
              console.warn('获取订阅状态失败: 用户未认证 (401)');
              isSubscribed.value = false;
            } else {
              console.error('获取订阅状态失败:', subscriptionResponse.message);
              isSubscribed.value = false; // 确保设置默认值
            }
          } catch (subError) {
            console.error('检查订阅状态时发生错误:', subError);
            isSubscribed.value = false; // 确保设置默认值
          }
        } else {
          console.log('用户未登录，无需检查订阅状态');
          isSubscribed.value = false;
        }
      }
    }
  } catch (error) {
    console.error('加载上传者信息失败:', error);
    // 确保在出错时设置默认值
    uploaderAvatar.value = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
    uploaderSubscribers.value = 0;
    isSubscribed.value = false;
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
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (likeClicked.value) {
    return
  }
  
  try {
    if (!video.value.id) return
    
    const response = await likeVideo(video.value.id)
    
    if (response.success) {
      video.value.likes++
      likeClicked.value = true
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
  // 滚动到顶部
  window.scrollTo(0, 0)
  // 注意：不需要手动调用loadVideoDetail，由路由监听器处理
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

// 处理分享视频
const handleShareVideo = () => {
  // 创建一个临时输入框
  const input = document.createElement('input')
  input.value = shareUrl.value
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  
  ElMessage.success('视频链接已复制到剪贴板')
}

// 跳转到用户主页
const goToUserProfile = () => {
  if (video.value.userId) {
    router.push({ path: `/user/${video.value.userId}` })
  }
}

// 处理关注/取消关注
const handleSubscribe = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (isCurrentUser.value) {
    ElMessage.warning('不能关注自己')
    return
  }
  
  try {
    console.log('当前订阅状态:', isSubscribed.value ? '已订阅' : '未订阅');
    
    if (isSubscribed.value) {
      // 取消关注
      console.log('开始取消关注用户:', video.value.userId);
      const response = await unsubscribeUser(video.value.userId);
      console.log('取消关注响应:', response);
      
      if (response.success) {
        isSubscribed.value = false;
        uploaderSubscribers.value = Math.max(0, uploaderSubscribers.value - 1);
        ElMessage.success(`已取消关注 ${video.value.uploaderName}`);
        console.log('取消关注成功，当前状态设置为未关注');
      } else {
        ElMessage.error(response.message || '取消关注失败');
        console.error('取消关注失败:', response.message);
      }
    } else {
      // 添加关注
      console.log('开始关注用户:', video.value.userId);
      const response = await subscribeUser(video.value.userId);
      console.log('关注响应:', response);
      
      if (response.success) {
        isSubscribed.value = true;
        uploaderSubscribers.value++;
        ElMessage.success(`已成功关注 ${video.value.uploaderName}`);
        console.log('关注成功，当前状态设置为已关注');
      } else {
        ElMessage.error(response.message || '关注失败');
        console.error('关注失败:', response.message);
      }
    }
    
    // 无论成功失败，都再次检查一遍订阅状态，确保UI与后端状态一致
    setTimeout(async () => {
      try {
        console.log('操作后重新检查订阅状态');
        const checkResponse = await checkIsSubscribed(video.value.userId);
        if (checkResponse.success) {
          isSubscribed.value = checkResponse.data;
          console.log('重新检查后的订阅状态:', isSubscribed.value ? '已订阅' : '未订阅');
        }
      } catch (checkError) {
        console.error('重新检查订阅状态失败:', checkError);
      }
    }, 500);
    
  } catch (error) {
    console.error('关注操作失败:', error);
    ElMessage.error('操作失败，请稍后重试');
  }
}

// 组件挂载时加载视频详情
onMounted(() => {
  loadVideoDetail()
  
  // 页面加载后，延迟再次检查订阅状态，以防首次加载未成功获取状态
  setTimeout(() => {
    if (video.value.userId && isLoggedIn.value && !isSubscribed.value) {
      console.log('页面加载后延迟重新检查订阅状态');
      loadUploaderInfo();
    }
  }, 1000);
})

// 监听路由参数变化，当视频ID变化时重新加载
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      console.log('视频ID变化，重新加载视频:', newId);
      // 重置状态
      isSubscribed.value = false;
      likeClicked.value = false;
      viewIncremented.value = false;
      // 加载新视频
      loadVideoDetail();
    }
  }
)

// 监听登录状态变化
watch(
  () => userStore.isLoggedIn,
  (newLoginState) => {
    if (video.value.userId) {
      console.log('登录状态变化，重新检查订阅状态');
      // 仅重新加载上传者信息和订阅状态
      setTimeout(() => {
        loadUploaderInfo();
      }, 500);
    }
  }
)

// 监听token变化
watch(
  () => userStore.token,
  (newToken) => {
    if (video.value.userId && newToken) {
      console.log('认证Token变化，重新检查订阅状态');
      // 延迟一小段时间再重新加载，确保token已经被设置到headers中
      setTimeout(() => {
        loadUploaderInfo();
      }, 500);
    }
  }
)
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

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.author-avatar-container {
  margin-right: 15px;
  cursor: pointer;
}

.author-details {
  flex: 1;
}

.author-name {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.author-name:hover {
  color: #409EFF;
}

.upload-date {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.subscriber-count {
  color: #666;
  font-size: 13px;
  margin: 0;
}

.video-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
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
