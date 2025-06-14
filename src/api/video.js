import request from '../utils/request'

/**
 * 上传视频文件
 * @param {File} file - 视频文件
 * @returns {Promise} 响应结果
 */
export function uploadVideo(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/user/video/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    withCredentials: true,
    data: formData
  })
}

/**
 * 上传视频封面
 * @param {File} file - 封面图片文件
 * @returns {Promise} 响应结果
 */
export function uploadCover(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/user/video/cover',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    withCredentials: true,
    data: formData
  })
}

/**
 * 保存视频信息
 * @param {Object} data - 视频信息，包含标题、描述、路径等
 * @returns {Promise} 响应结果
 */
export function saveVideo(data) {
  return request({
    url: '/api/user/video/save',
    method: 'post',
    data
  })
}

/**
 * 获取当前用户的视频列表
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise} 响应结果
 */
export function getMyVideos(page = 1, size = 8) {
  return request({
    url: '/api/user/video/list',
    method: 'get',
    params: { page, size }
  })
}

/**
 * 删除视频
 * @param {number} id - 视频ID
 * @returns {Promise} 响应结果
 */
export function deleteVideo(id) {
  return request({
    url: `/api/user/video/${id}`,
    method: 'delete'
  })
}

/**
 * 获取视频详情
 * @param {number} id - 视频ID
 * @returns {Promise} 响应结果
 */
export function getVideoDetail(id) {
  return request({
    url: `/api/video/${id}`,
    method: 'get'
  })
}

/**
 * 增加视频浏览量
 * @param {number} id - 视频ID
 * @returns {Promise} 响应结果
 */
export function incrementViews(id) {
  return request({
    url: `/api/video/${id}/view`,
    method: 'post'
  })
}

/**
 * 点赞视频
 * @param {number} id - 视频ID
 * @returns {Promise} 响应结果
 */
export function likeVideo(id) {
  return request({
    url: `/api/video/${id}/like`,
    method: 'post'
  })
}

/**
 * 获取视频列表（按分类）
 * @param {string} category - 分类名称
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise} 响应结果
 */
export function getVideosByCategory(category, page = 1, size = 8) {
  return request({
    url: '/api/video/category',
    method: 'get',
    params: { category, page, size }
  })
}

/**
 * 获取最新视频
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise} 响应结果
 */
export function getLatestVideos(page = 1, size = 8) {
  return request({
    url: '/api/video/latest',
    method: 'get',
    params: { page, size }
  })
}

/**
 * 获取热门视频
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise} 响应结果
 */
export function getPopularVideos(page = 1, size = 8) {
  return request({
    url: '/api/video/popular',
    method: 'get',
    params: { page, size }
  })
}

/**
 * 搜索视频
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise} 响应结果
 */
export function searchVideos(keyword, page = 1, size = 8) {
  return request({
    url: '/api/video/search',
    method: 'get',
    params: { keyword, page, size }
  })
}

/**
 * 发送弹幕
 */
export function sendDanmu(data) {
  return request({
    url: '/api/video/saveDanmu',
    method: 'post',
    data
  })
}

/**
 * 获取弹幕
 */
export function getDanmu(id) {
  return request({
    url: `/api/video/getDanmu/${id}`,
    method: 'get'
  })
}