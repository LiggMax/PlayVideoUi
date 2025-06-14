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
          <div class="video-wrapper">
            <video
              ref="videoPlayer"
              controls
              class="video-player"
              :src="video.videoUrl"
              :poster="video.coverUrl || 'https://via.placeholder.com/1280x720'"
              @play="handleVideoPlay"
              @timeupdate="handleTimeUpdate"
            ></video>
            <canvas ref="danmuCanvas" class="danmu-canvas"></canvas>
          </div>
        </div>

        <div class="danmu-send-box">
          <el-input
            v-model="danmuContent"
            placeholder="发送弹幕..."
            :disabled="!isLoggedIn"
            @keyup.enter="handleSendDanmu"
          >
            <template #append>
              <el-button @click="handleSendDanmu" :disabled="!isLoggedIn || !danmuContent.trim()">
                发送弹幕
              </el-button>
            </template>
          </el-input>
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
                <el-avatar :size="50" :src="uploaderAvatar" />
              </div>
              <div class="author-details">
                <h3 class="author-name"  style="cursor: pointer">{{ video.uploaderName }}</h3>
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

          <div class="comments-section">
            <h2>评论 ({{ totalComments }})</h2>
            
            <div v-if="isLoggedIn" class="comment-form">
              <el-avatar :size="40" :src="userStore.avatar" class="comment-avatar" />
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="2"
                placeholder="发表评论..."
                resize="none"
              />
              <el-button
                type="primary"
                :disabled="!commentContent.trim()"
                @click="submitComment"
                :loading="submittingComment"
              >
                发表
              </el-button>
            </div>
            <div v-else class="login-to-comment">
              请<el-button type="text" @click="openLoginDialog">登录</el-button>后发表评论
            </div>
            
            <div v-if="comments.length > 0" class="comments-list">
              <el-divider />
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <el-avatar :size="40" :src="comment.userAvatar || defaultAvatar" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.username }}</span>
                    <span class="comment-time">{{ formatCommentDate(comment.createTime) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="toggleReplyForm(comment.id)"
                    >
                      回复
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="likeComment(comment.id)"
                      :disabled="comment.liked"
                    >
                      {{ comment.likes > 0 ? `点赞(${comment.likes})` : '点赞' }}
                    </el-button>
                    <el-button
                      v-if="canDeleteComment(comment)"
                      type="text"
                      size="small"
                      @click="removeComment(comment.id)"
                    >
                      删除
                    </el-button>
                  </div>
                  
                  <div v-if="replyingTo === comment.id" class="reply-form">
                    <el-input
                      v-model="replyContent"
                      type="textarea"
                      :rows="2"
                      placeholder="回复评论..."
                      resize="none"
                      size="small"
                    />
                    <div class="reply-actions">
                      <el-button size="small" @click="cancelReply">取消</el-button>
                      <el-button
                        type="primary"
                        size="small"
                        :disabled="!replyContent.trim()"
                        @click="submitReply(comment.id)"
                        :loading="submittingReply"
                      >
                        回复
                      </el-button>
                    </div>
                  </div>
                  
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                    <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                      <el-avatar :size="30" :src="reply.userAvatar || defaultAvatar" class="reply-avatar" />
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="reply-author">{{ reply.username }}</span>
                          <span class="reply-time">{{ formatCommentDate(reply.createTime) }}</span>
                        </div>
                        <p class="reply-text">{{ reply.content }}</p>
                        <div class="reply-actions">
                          <el-button
                            v-if="canDeleteComment(reply)"
                            type="text"
                            size="small"
                            @click="removeComment(reply.id)"
                          >
                            删除
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
        </div>

              <div class="pagination" v-if="totalComments > 10">
                <el-pagination
                  layout="prev, pager, next"
                  :total="totalComments"
                  :page-size="10"
                  @current-change="handleCommentPageChange"
                />
              </div>
            </div>
            <div v-else-if="!loadingComments" class="no-comments">
              暂无评论，快来发表第一条评论吧！
            </div>
            <div v-else class="loading-comments">
              <el-skeleton animated :rows="3" />
            </div>
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
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Share } from '@element-plus/icons-vue'
import { getVideoDetail, incrementViews, likeVideo, getVideosByCategory, sendDanmu, getDanmu } from '../api/video'
import { getUserInfo, subscribeUser, unsubscribeUser, isSubscribed as checkIsSubscribed, getSubscriberCount } from '../api/user'
import { useUserStore } from '../store/user'
import { getVideoComments, postComment, deleteComment, replyComment, likeComment as likeCommentApi } from '../api/comment'
import { formatCategory, formatAvatarUrl } from '../utils/videoUtils'

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

// 评论相关变量
const comments = ref([])
const totalComments = ref(0)
const loadingComments = ref(false)
const commentContent = ref('')
const submittingComment = ref(false)
const replyingTo = ref(null)
const replyContent = ref('')
const submittingReply = ref(false)
const commentPage = ref(1)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 弹幕相关变量
const danmuContent = ref('')
const danmuCanvas = ref(null)
const danmuList = ref([])
const activeDanmus = ref([])
const canvasContext = ref(null)
const animationFrameId = ref(null)

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
      // 适配新的数据结构
      const { video: videoData, userInfo } = response.data
      video.value = {
        id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        videoUrl: videoData.videoUrl,
        coverUrl: videoData.coverUrl,
        views: videoData.views,
        likes: videoData.likes,
        createTime: videoData.createTime,
        uploaderName: videoData.uploaderName,
        userId: videoData.userId,
        category: videoData.category,
        tags: videoData.tags,
        tagList: videoData.tagList || []
      }
      
      // 设置上传者信息
      // 从API返回的userInfo直接获取头像URL
      uploaderAvatar.value = userInfo.avatarUrl
      
      // 获取用户的粉丝数
      try {
        const subscriberResponse = await getSubscriberCount(video.value.userId);
        if (subscriberResponse.success) {
          uploaderSubscribers.value = subscriberResponse.data;
        }
      } catch (error) {
        console.error('获取粉丝数失败:', error);
        // 获取粉丝数失败不影响页面其他功能
        uploaderSubscribers.value = 0;
      }
      
      // 检查订阅状态，仅对已登录用户执行
      if (isLoggedIn.value) {
        await checkSubscriptionStatus();
      } else {
        isSubscribed.value = false;
      }
      
      // 加载相关视频（同类别的视频）
      await loadRelatedVideos()
    } else {
      await router.push('/')
    }
  } catch (error) {
    ElMessage.error('获取视频详情失败，请稍后重试')
    await router.push('/')
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
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再点赞',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (likeClicked.value) {
    return;
  }
  
  try {
    if (!video.value.id) return;
    
    const response = await likeVideo(video.value.id);
    
    if (response.success) {
      video.value.likes++;
      likeClicked.value = true;
      ElMessage.success('点赞成功');
    } else {
      ElMessage.error(response.message || '点赞失败');
    }
  } catch (error) {
    ElMessage.error('点赞失败，请稍后重试');
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
    ElMessage({
      message: '请先登录后再关注',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (isCurrentUser.value) {
    ElMessage.warning('不能关注自己');
    return;
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
      } else {
        ElMessage.error(response.message || '取消关注失败');
      }
    } else {
      // 添加关注
      const response = await subscribeUser(video.value.userId);

      if (response.success) {
        isSubscribed.value = true;
        uploaderSubscribers.value++;
        ElMessage.success(`已成功关注 ${video.value.uploaderName}`);
      } else {
        ElMessage.error(response.message || '关注失败');
        console.error('关注失败:', response.message);
      }
    }
  } catch (error) {
    console.error('关注操作失败:', error);
    ElMessage.error('操作失败，请稍后重试');
  }
}

// 打开登录对话框
const openLoginDialog = () => {
  // 重定向到登录页面
  router.push({
    path: '/',
    query: { login: 'true', redirect: router.currentRoute.value.fullPath }
  });
}

// 加载评论列表
const loadComments = async (page = 1) => {
  if (!video.value.id) return
  
  try {
    loadingComments.value = true
    commentPage.value = page
    
    const response = await getVideoComments(video.value.id, page, 10)
    
    if (response.success) {
      comments.value = response.data.comments || []
      totalComments.value = response.data.total || 0
    } else {
      ElMessage.error('获取评论失败: ' + response.message)
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('获取评论失败，请稍后重试')
  } finally {
    loadingComments.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再评论',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  try {
    submittingComment.value = true
    
    const response = await postComment({
      videoId: video.value.id,
      content: commentContent.value.trim()
    })
    
    if (response.success) {
      ElMessage.success('评论发表成功')
      commentContent.value = ''
      // 重新加载评论列表
      await loadComments(1)
    } else {
      ElMessage.error('评论发表失败: ' + response.message)
    }
  } catch (error) {
    console.error('提交评论失败:', error)
    ElMessage.error('评论发表失败，请稍后重试')
  } finally {
    submittingComment.value = false
  }
}

// 切换回复表单
const toggleReplyForm = (commentId) => {
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再回复',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (replyingTo.value === commentId) {
    replyingTo.value = null
    replyContent.value = ''
  } else {
    replyingTo.value = commentId
    replyContent.value = ''
  }
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (commentId) => {
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再回复',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  
  try {
    submittingReply.value = true
    
    const response = await replyComment({
      videoId: video.value.id,
      parentId: commentId,
      content: replyContent.value.trim()
    })
    
    if (response.success) {
      ElMessage.success('回复发表成功')
      replyContent.value = ''
      replyingTo.value = null
      // 重新加载评论列表
      await loadComments(commentPage.value)
    } else {
      ElMessage.error('回复发表失败: ' + response.message)
    }
  } catch (error) {
    console.error('提交回复失败:', error)
    ElMessage.error('回复发表失败，请稍后重试')
  } finally {
    submittingReply.value = false
  }
}

// 删除评论
const removeComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await deleteComment(commentId)
    
    if (response.success) {
      ElMessage.success('评论已删除')
      // 重新加载评论列表
      await loadComments(commentPage.value)
    } else {
      ElMessage.error('删除评论失败: ' + response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败，请稍后重试')
    }
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再点赞评论',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  try {
    const response = await likeCommentApi(commentId)
    
    if (response.success) {
      // 更新评论列表中的点赞数
      const comment = findComment(commentId)
      if (comment) {
        comment.likes++
        comment.liked = true
      }
      ElMessage.success('点赞成功')
    } else {
      ElMessage.error('点赞失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('点赞失败，请稍后重试')
  }
}

// 在评论列表中查找评论
const findComment = (commentId) => {
  // 在主评论中查找
  let comment = comments.value.find(c => c.id === commentId)
  if (comment) return comment
  
  // 在回复中查找
  for (const c of comments.value) {
    if (c.replies) {
      comment = c.replies.find(r => r.id === commentId)
      if (comment) return comment
    }
  }
  
  return null
}

// 检查是否可以删除评论
const canDeleteComment = (comment) => {
  if (!isLoggedIn.value || !userStore.user) return false
  
  // 当前用户是评论作者，或者是视频上传者
  return userStore.user.id === comment.userId || 
         (video.value.userId && userStore.user.id === video.value.userId)
}

// 评论分页切换
const handleCommentPageChange = (page) => {
  loadComments(page)
}

// 格式化评论日期
const formatCommentDate = (dateString) => {
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

// 在加载视频详情后，加载评论列表
watch(() => video.value.id, (newId) => {
  if (newId) {
    loadComments(1)
  }
})

// 组件挂载时加载视频详情
onMounted(() => {
  loadVideoDetail()
  
  // 监听窗口大小变化，调整Canvas大小
  window.addEventListener('resize', resizeDanmuCanvas)
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
      // 直接加载新视频，API会返回完整的用户信息
      loadVideoDetail();
    }
  }
)

// 监听登录状态变化
watch(
  () => userStore.isLoggedIn,
  (newLoginState) => {
    if (video.value.userId && newLoginState) {
      console.log('登录状态变化，重新检查订阅状态');
      // 检查订阅状态
      checkSubscriptionStatus();
    }
  }
)

// 检查订阅状态
const checkSubscriptionStatus = async () => {
  if (!isLoggedIn.value || !video.value.userId) return;
  
  try {
    const subscriptionResponse = await checkIsSubscribed(video.value.userId);
    if (subscriptionResponse.success) {
      isSubscribed.value = subscriptionResponse.data;
    }
  } catch (error) {
    console.error('检查订阅状态失败:', error);
    // 错误处理：设置默认值为未订阅
    isSubscribed.value = false;
  }
}

// 监听token变化
watch(
  () => userStore.token,
  (newToken) => {
    if (video.value.userId && newToken) {
      console.log('认证Token变化，重新检查订阅状态');
      // 延迟一小段时间再重新检查，确保token已经被设置到headers中
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 500);
    }
  }
)

// 发送弹幕
const handleSendDanmu = async () => {
  if (!isLoggedIn.value) {
    ElMessage({
      message: '请先登录后再发送弹幕',
      type: 'warning',
      onClose: () => {
        openLoginDialog();
      }
    });
    return;
  }
  
  if (!danmuContent.value.trim()) {
    return;
  }
  
  try {
    // 获取当前视频播放时间作为时间戳
    const currentTime = Math.floor(videoPlayer.value.currentTime || 0);
    
    const response = await sendDanmu({
      videoId: video.value.id,
      content: danmuContent.value.trim(),
      time: currentTime
    });
    
    if (response.success) {
      ElMessage.success('弹幕发送成功');
      
      // 立即在画面上显示新发送的弹幕
      const newDanmu = {
        id: Date.now(), // 临时ID
        content: danmuContent.value.trim(),
        time: currentTime,
        timeFlag: currentTime, // 添加一致的时间标识
        isActive: true,
        x: danmuCanvas.value.width,
        y: Math.floor(Math.random() * (danmuCanvas.value.height - 30)) + 15,
        speed: Math.random() * 2 + 1,
        color: getRandomColor()
      };
      
      // 添加到弹幕列表和活动弹幕
      danmuList.value.push(newDanmu);
      activeDanmus.value.push(newDanmu);
      
      // 清空输入框
      danmuContent.value = '';
    } else {
      ElMessage.error(response.message || '弹幕发送失败');
    }
  } catch (error) {
    console.error('发送弹幕失败:', error);
    ElMessage.error('弹幕发送失败，请稍后重试');
  }
}

// 加载弹幕数据
const loadDanmuData = async () => {
  try {
    if (!video.value.id) return
    
    const response = await getDanmu(video.value.id)
    
    if (response.success && response.data) {
      console.log('获取到弹幕数据:', response.data);
      danmuList.value = response.data.map(item => ({
        ...item,
        isActive: false,
        x: danmuCanvas.value ? danmuCanvas.value.width : window.innerWidth,
        y: Math.floor(Math.random() * (danmuCanvas.value ? (danmuCanvas.value.height - 30) : 300)) + 15,
        speed: Math.random() * 2 + 1,
        color: getRandomColor(),
        timeFlag: parseInt(item.time) // 确保时间是数字类型
      }))
    }
  } catch (error) {
    console.error('获取弹幕数据失败:', error)
  }
}

// 初始化弹幕Canvas
const initDanmuCanvas = () => {
  if (!danmuCanvas.value || !videoPlayer.value) return
  
  const videoElem = videoPlayer.value
  danmuCanvas.value.width = videoElem.clientWidth
  danmuCanvas.value.height = videoElem.clientHeight
  canvasContext.value = danmuCanvas.value.getContext('2d')
  
  // 设置Canvas文本样式
  canvasContext.value.font = 'bold 20px Arial'
  canvasContext.value.textBaseline = 'middle'
  
  console.log('Canvas初始化完成, 宽度:', danmuCanvas.value.width, '高度:', danmuCanvas.value.height);
  
  // 开始渲染动画
  renderDanmu()
}

// 处理视频时间更新
const handleTimeUpdate = () => {
  if (!videoPlayer.value || !danmuList.value.length) return
  
  const currentTime = Math.floor(videoPlayer.value.currentTime)
  console.log('当前播放时间:', currentTime, '活动弹幕数:', activeDanmus.value.length);
  
  // 查找当前时间应该显示的弹幕
  danmuList.value.forEach(danmu => {
    // 使用更宽松的条件，确保能匹配到对应时间的弹幕
    if (danmu.timeFlag === currentTime && !danmu.isActive) {
      console.log('激活弹幕:', danmu.content, '时间:', danmu.timeFlag);
      danmu.isActive = true;
      
      // 重新设置初始位置，确保从屏幕右侧开始
      if (danmuCanvas.value) {
        danmu.x = danmuCanvas.value.width;
      }
      
      activeDanmus.value.push(danmu);
    }
  })
}

// 渲染弹幕
const renderDanmu = () => {
  if (!canvasContext.value) return
  
  // 清空画布
  canvasContext.value.clearRect(0, 0, danmuCanvas.value.width, danmuCanvas.value.height)
  
  // 绘制活动弹幕
  activeDanmus.value = activeDanmus.value.filter(danmu => {
    // 更新位置
    danmu.x -= danmu.speed
    
    // 绘制文本
    canvasContext.value.fillStyle = danmu.color
    canvasContext.value.fillText(danmu.content, danmu.x, danmu.y)
    
    // 当弹幕完全离开屏幕时，从活动列表中移除
    return danmu.x + canvasContext.value.measureText(danmu.content).width > 0
  })
  
  // 继续渲染动画
  animationFrameId.value = requestAnimationFrame(renderDanmu)
}

// 生成随机颜色
const getRandomColor = () => {
  const colors = [
    '#FFFFFF', // 白色
    '#FF0000', // 红色
    '#00FF00', // 绿色
    '#FFFF00', // 黄色
    '#00FFFF', // 青色
    '#FF00FF', // 粉色
    '#0000FF'  // 蓝色
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 调整Canvas大小的函数
const resizeDanmuCanvas = () => {
  if (!danmuCanvas.value || !videoPlayer.value) return
  
  danmuCanvas.value.width = videoPlayer.value.clientWidth
  danmuCanvas.value.height = videoPlayer.value.clientHeight
}

// 组件卸载前清理资源
onBeforeUnmount(() => {
  // 取消动画
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  
  // 移除事件监听
  window.removeEventListener('resize', resizeDanmuCanvas)
})

// 监听视频ID变化，加载弹幕数据
watch(
  () => video.value.id,
  (newId) => {
    if (newId) {
      // 先初始化Canvas再加载弹幕数据
      setTimeout(() => {
        initDanmuCanvas()
        // 确保Canvas初始化后再加载弹幕数据
        setTimeout(() => {
          loadDanmuData()
        }, 300)
      }, 500)
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
  flex-direction: column;
  justify-content: center;
}

.video-wrapper {
  position: relative;
  width: 100%;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  background-color: #000;
}

.danmu-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
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

/* 评论区样式 */
.comments-section {
  margin-top: 30px;
  margin-bottom: 30px;
}

.comments-section h2 {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
}

.comment-form {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.comment-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-form .el-input {
  flex: 1;
  margin-right: 12px;
}

.login-to-comment {
  padding: 15px;
  background-color: #f9f9f9;
  text-align: center;
  border-radius: 4px;
  margin-bottom: 20px;
}

.comment-item {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.comment-content {
  flex: 1;
  margin-left: 12px;
}

.comment-header {
  margin-bottom: 5px;
}

.comment-author {
  font-weight: 600;
  margin-right: 8px;
}

.comment-time {
  color: #909399;
  font-size: 13px;
}

.comment-text {
  margin: 5px 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  margin-top: 5px;
  display: flex;
  gap: 12px;
}

.reply-form {
  margin-top: 10px;
  margin-bottom: 15px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

.replies-list {
  margin-top: 15px;
  margin-left: 20px;
  padding-left: 15px;
  border-left: 2px solid #eee;
}

.reply-item {
  display: flex;
  margin-bottom: 12px;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  margin-left: 10px;
}

.reply-header {
  margin-bottom: 3px;
}

.reply-author {
  font-weight: 600;
  margin-right: 8px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-text {
  margin: 3px 0;
  line-height: 1.4;
  font-size: 14px;
}

.reply-actions {
  margin-top: 3px;
}

.no-comments, .loading-comments {
  padding: 30px 0;
  text-align: center;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 弹幕发送框样式 */
.danmu-send-box {
  margin-top: 10px;
  margin-bottom: 20px;
  max-width: 600px;
}
</style>
