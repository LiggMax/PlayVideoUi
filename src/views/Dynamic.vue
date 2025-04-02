<template>
  <div class="dynamic-page">
    <el-container>
      <el-main>
        <h1 class="page-title">动态</h1>
        
        <!-- 发布动态区域 -->
        <div v-if="isLoggedIn" class="post-dynamic">
          <el-card class="post-card">
            <div class="post-header">
              <el-avatar :size="40" :src="userStore.avatar" />
              <div class="post-user-info">
                <span class="post-username">{{ userStore.nickname || userStore.username }}</span>
              </div>
            </div>
            <el-form>
              <el-form-item>
                <el-input
                  v-model="dynamicContent"
                  type="textarea"
                  :rows="3"
                  placeholder="分享你的新鲜事..."
                  resize="none"
                />
              </el-form-item>
              <el-form-item>
                <div class="post-attachments">
                  <el-upload
                    v-if="showImageUpload"
                    class="upload-demo"
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    list-type="picture-card"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    :limit="9"
                    multiple
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                </div>
                <div class="post-actions">
                  <el-button 
                    type="primary" 
                    @click="publishDynamicHandler" 
                    :disabled="!dynamicContent.trim()" 
                    :loading="publishing"
                  >
                    发布
                  </el-button>
                  <div class="post-tools">
                    <el-button type="text" @click="toggleImageUpload">
                      <el-icon><Picture /></el-icon>
                      图片
                    </el-button>
                    <el-button type="text" @click="addVideoLink">
                      <el-icon><VideoCamera /></el-icon>
                      视频
                    </el-button>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <!-- 未登录提示 -->
        <div v-else class="login-tip">
          <el-card>
            <el-empty description="登录后才能发布动态">
              <el-button type="primary" @click="goToLogin">去登录</el-button>
            </el-empty>
          </el-card>
        </div>
        
        <!-- 动态列表 -->
        <div class="dynamic-list">
          <el-card v-if="dynamicList.length === 0 && !loading" class="empty-card">
            <el-empty description="暂无动态">
              <el-button v-if="isLoggedIn" type="primary" @click="scrollToPost">发布第一条动态</el-button>
            </el-empty>
          </el-card>
          
          <div v-if="loading" class="loading-dynamics">
            <el-skeleton :rows="3" animated />
            <el-divider />
            <el-skeleton :rows="3" animated />
          </div>
          
          <el-card v-for="dynamic in dynamicList" :key="dynamic.id" class="dynamic-card">
            <div class="dynamic-header">
              <el-avatar :size="40" :src="dynamic.userAvatar" @click="goToUserProfile(dynamic.userId)" />
              <div class="dynamic-user-info">
                <span class="dynamic-username" @click="goToUserProfile(dynamic.userId)">{{ dynamic.username }}</span>
                <span class="dynamic-time">{{ formatDynamicDate(dynamic.createTime) }}</span>
              </div>
              <el-dropdown v-if="userStore.user && userStore.user.id === dynamic.userId" trigger="click">
                <el-button type="text" class="dynamic-more">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="deleteDynamicHandler(dynamic.id)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="dynamic-content">
              <p class="dynamic-text">{{ dynamic.content }}</p>
              
              <div v-if="dynamic.images && dynamic.images.length > 0" class="dynamic-images">
                <el-image 
                  v-for="(image, index) in getImagesArray(dynamic.images)" 
                  :key="index"
                  :src="getFullImageUrl(image)"
                  :preview-src-list="getImagesArray(dynamic.images).map(img => getFullImageUrl(img))"
                  fit="cover"
                  class="dynamic-image"
                  :initial-index="index"
                />
              </div>
              
              <div v-if="dynamic.videoId" class="dynamic-video">
                <div class="video-link" @click="goToVideo(dynamic.videoId)">
                  <el-image
                    :src="dynamic.videoCover || 'https://via.placeholder.com/320x180'"
                    fit="cover"
                    class="video-thumbnail"
                  />
                  <div class="video-info">
                    <h3>{{ dynamic.videoTitle }}</h3>
                    <p>点击观看视频</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="dynamic-actions">
              <el-button type="text" @click="likeDynamicHandler(dynamic.id)" :class="{ 'is-liked': dynamic.liked }">
                <el-icon><Star /></el-icon>
                赞 ({{ dynamic.likes || 0 }})
              </el-button>
              <el-button type="text" @click="showComments(dynamic.id)">
                <el-icon><ChatDotRound /></el-icon>
                评论 ({{ dynamic.commentCount || 0 }})
              </el-button>
              <el-button type="text" @click="shareDynamic(dynamic.id)">
                <el-icon><Share /></el-icon>
                分享
              </el-button>
            </div>
            
            <div v-if="dynamic.showComments" class="dynamic-comments">
              <el-divider />
              <div v-if="isLoggedIn" class="comment-form">
                <el-avatar :size="32" :src="userStore.avatar" class="comment-avatar" />
                <el-input
                  v-model="commentMap[dynamic.id]"
                  placeholder="发表评论..."
                  size="small"
                  @keyup.enter="submitComment(dynamic.id)"
                />
                <el-button size="small" type="primary" @click="submitComment(dynamic.id)">发送</el-button>
              </div>
              
              <div v-if="dynamic.comments && dynamic.comments.length > 0" class="comments-list">
                <div v-for="comment in dynamic.comments" :key="comment.id" class="comment-item">
                  <el-avatar :size="32" :src="comment.userAvatar" class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-info">
                      <span class="comment-username">{{ comment.username }}</span>
                      <span class="comment-time">{{ formatDynamicDate(comment.createTime) }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="no-comments">
                暂无评论，快来发表第一条评论吧
              </div>
            </div>
          </el-card>
          
          <div v-if="dynamicList.length > 0 && hasMore" class="load-more">
            <el-button type="text" @click="loadMoreDynamics" :loading="loadingMore">加载更多</el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { Plus, Picture, VideoCamera, Star, ChatDotRound, Share, More } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getLatestDynamics, 
  getUserDynamics, 
  publishDynamic, 
  uploadDynamicImage,
  likeDynamic,
  deleteDynamic,
  getDynamicComments,
  commentDynamic,
  deleteDynamicComment
} from '../api/dynamic'

const router = useRouter()
const userStore = useUserStore()

// 计算用户是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 发布动态相关变量
const dynamicContent = ref('')
const publishing = ref(false)
const showImageUpload = ref(false)
const uploadedImages = ref([])

// 上传图片配置
const uploadUrl = computed(() => '/api/dynamic/upload-image')
const uploadHeaders = computed(() => ({
  Authorization: userStore.token
}))

// 动态列表相关变量
const dynamicList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loadingMore = ref(false)

// 评论相关变量
const commentMap = reactive({})

// 切换图片上传显示
const toggleImageUpload = () => {
  showImageUpload.value = !showImageUpload.value
}

// 添加视频链接
const addVideoLink = () => {
  // 弹出选择视频的对话框，暂不实现
  ElMessage.info('此功能正在开发中，敬请期待')
}

// 处理图片上传成功
const handleUploadSuccess = (response, file, fileList) => {
  if (response.success) {
    // 保存图片路径，不需要添加服务器地址，发送到后端时只需要相对路径
    uploadedImages.value.push(response.data)
    console.log('上传图片成功:', response.data)
  } else {
    ElMessage.error('图片上传失败: ' + response.message)
  }
}

// 处理图片上传失败
const handleUploadError = (error, file, fileList) => {
  ElMessage.error('图片上传失败，请稍后重试')
}

// 发布动态
const publishDynamicHandler = async () => {
  if (!dynamicContent.value.trim()) {
    ElMessage.warning('动态内容不能为空')
    return
  }
  
  try {
    publishing.value = true
    
    const data = {
      content: dynamicContent.value,
      images: uploadedImages.value.join(','),
      videoId: null // 暂不支持关联视频
    }
    
    const response = await publishDynamic(data)
    
    if (response.success) {
      // 处理返回的动态对象，确保图片路径格式正确
      const newDynamic = response.data
      
      // 将新发布的动态添加到列表头部
      dynamicList.value.unshift(newDynamic)
      
      // 重置表单
      dynamicContent.value = ''
      uploadedImages.value = []
      showImageUpload.value = false
      
      ElMessage.success('动态发布成功')
    } else {
      ElMessage.error(response.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后重试')
  } finally {
    publishing.value = false
  }
}

// 加载动态列表
const loadDynamics = async (page = 1, replace = true) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    
    const response = await getLatestDynamics(page, pageSize.value)
    
    if (response.success) {
      const data = response.data
      if (replace) {
        dynamicList.value = data.dynamics || []
      } else {
        dynamicList.value = [...dynamicList.value, ...(data.dynamics || [])]
      }
      
      currentPage.value = page
      hasMore.value = data.total > page * pageSize.value
    } else {
      ElMessage.error(response.message || '获取动态列表失败')
    }
  } catch (error) {
    ElMessage.error('加载动态失败，请稍后重试')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多动态
const loadMoreDynamics = () => {
  if (loadingMore.value || !hasMore.value) return
  loadDynamics(currentPage.value + 1, false)
}

// 点赞动态
const likeDynamicHandler = async (dynamicId) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const response = await likeDynamic(dynamicId)
    
    if (response.success) {
      const dynamic = dynamicList.value.find(d => d.id === dynamicId)
      if (dynamic) {
        const isLiked = response.data.liked
        if (isLiked) {
          dynamic.likes++
          dynamic.liked = true
        } else {
          dynamic.likes = Math.max(0, dynamic.likes - 1)
          dynamic.liked = false
        }
      }
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 显示评论
const showComments = async (dynamicId) => {
  const dynamic = dynamicList.value.find(d => d.id === dynamicId)
  if (dynamic) {
    dynamic.showComments = !dynamic.showComments
    
    // 如果打开评论且尚未加载评论
    if (dynamic.showComments && (!dynamic.comments || dynamic.comments.length === 0)) {
      try {
        const response = await getDynamicComments(dynamicId, 1, 10)
        
        if (response.success) {
          dynamic.comments = response.data.comments || []
        } else {
          ElMessage.error(response.message || '获取评论失败')
        }
      } catch (error) {
        ElMessage.error('获取评论失败，请稍后重试')
      }
    }
  }
}

// 提交评论
const submitComment = async (dynamicId) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  const content = commentMap[dynamicId]
  if (!content || !content.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  try {
    const response = await commentDynamic(dynamicId, content.trim())
    
    if (response.success) {
      const dynamic = dynamicList.value.find(d => d.id === dynamicId)
      if (dynamic) {
        if (!dynamic.comments) {
          dynamic.comments = []
        }
        
        dynamic.comments.unshift(response.data)
        dynamic.commentCount = (dynamic.commentCount || 0) + 1
        
        // 清空输入框
        commentMap[dynamicId] = ''
      }
    } else {
      ElMessage.error(response.message || '评论失败')
    }
  } catch (error) {
    ElMessage.error('评论失败，请稍后重试')
  }
}

// 删除动态
const deleteDynamicHandler = async (dynamicId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await deleteDynamic(dynamicId)
    
    if (response.success) {
      // 从列表中移除
      const index = dynamicList.value.findIndex(d => d.id === dynamicId)
      if (index !== -1) {
        dynamicList.value.splice(index, 1)
      }
      
      ElMessage.success('动态已删除')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 分享动态
const shareDynamic = (dynamicId) => {
  const shareUrl = `${window.location.origin}/dynamic/${dynamicId}`
  
  // 创建一个临时输入框
  const input = document.createElement('input')
  input.value = shareUrl
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  
  ElMessage.success('动态链接已复制到剪贴板')
}

// 格式化动态日期
const formatDynamicDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  
  // 计算时间差（毫秒）
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于30天
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 大于30天，显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 跳转到用户主页
const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 跳转到视频页面
const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
}

// 滚动到发布区域
const scrollToPost = () => {
  document.querySelector('.post-dynamic')?.scrollIntoView({ behavior: 'smooth' })
}

// 将图片路径字符串转为数组
const getImagesArray = (images) => {
  if (!images) return []
  return typeof images === 'string' ? images.split(',') : images
}

// 获取完整的图片URL
const getFullImageUrl = (path) => {
  if (!path) return ''
  // 如果已经是完整URL，则直接返回
  if (path.startsWith('http')) return path
  // 否则添加后端服务器地址
  return `http://localhost:8080${path}`
}

// 组件挂载时加载动态列表
onMounted(() => {
  loadDynamics()
})
</script>

<style scoped>
.dynamic-page {
  padding: 20px 0;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.post-dynamic,
.login-tip,
.dynamic-card {
  margin-bottom: 20px;
}

.post-card {
  margin-bottom: 20px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.post-user-info {
  margin-left: 12px;
}

.post-username {
  font-weight: 600;
  font-size: 16px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-tools {
  display: flex;
  gap: 12px;
}

.dynamic-card {
  margin-bottom: 20px;
}

.dynamic-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.dynamic-user-info {
  margin-left: 12px;
  flex: 1;
}

.dynamic-username {
  font-weight: 600;
  font-size: 16px;
  margin-right: 8px;
  cursor: pointer;
}

.dynamic-username:hover {
  color: #409EFF;
}

.dynamic-time {
  font-size: 13px;
  color: #909399;
}

.dynamic-more {
  color: #909399;
}

.dynamic-content {
  margin-bottom: 15px;
}

.dynamic-text {
  white-space: pre-wrap;
  line-height: 1.6;
  margin-bottom: 12px;
}

.dynamic-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.dynamic-image {
  width: 150px;
  height: 150px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.dynamic-video {
  margin-top: 10px;
}

.video-link {
  display: flex;
  background-color: #f9f9f9;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.video-link:hover {
  background-color: #f0f0f0;
}

.video-thumbnail {
  width: 120px;
  height: 70px;
  object-fit: cover;
}

.video-info {
  padding: 10px;
  flex: 1;
}

.video-info h3 {
  margin: 0 0 5px 0;
  font-size: 15px;
  line-height: 1.4;
}

.video-info p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.dynamic-actions {
  display: flex;
  gap: 20px;
}

.is-liked {
  color: #f56c6c;
}

.dynamic-comments {
  margin-top: 15px;
}

.comment-form {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  margin-top: 15px;
}

.comment-avatar {
  margin-right: 10px;
  flex-shrink: 0;
}

.comment-form .el-input {
  flex: 1;
  margin-right: 10px;
}

.comments-list {
  margin-top: 10px;
}

.comment-item {
  display: flex;
  margin-bottom: 12px;
}

.comment-content {
  flex: 1;
  margin-left: 10px;
}

.comment-info {
  margin-bottom: 5px;
}

.comment-username {
  font-weight: 600;
  font-size: 14px;
  margin-right: 8px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 15px 0;
  font-size: 14px;
}

.load-more {
  text-align: center;
  padding: 10px 0;
}

.empty-card {
  padding: 20px 0;
}

.loading-dynamics {
  margin-bottom: 20px;
}

.el-empty {
  padding: 20px 0;
}
</style> 