import request from '../utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据，包含username和password
 * @returns {Promise} 响应结果
 */
export function login(data) {
  return request({
    url: '/api/account/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data - 注册数据，包含username、password等信息
 * @returns {Promise} 响应结果
 */
export function register(data) {
  return request({
    url: '/api/account/register',
    method: 'post',
    data
  })
}

/**
 * 用户登出
 * @returns {Promise} 响应结果
 */
export function logout() {
  return request({
    url: '/api/account/logout',
    method: 'post'
  })
}

/**
 * 刷新令牌
 * @returns {Promise} 响应结果，包含新的令牌
 */
export function refreshToken() {
  return request({
    url: '/api/account/refresh-token',
    method: 'post'
  })
}

/**
 * 获取当前登录用户信息
 * @returns {Promise} 响应结果
 */
export function getCurrentUser() {
  return request({
    url: '/api/user/current',
    method: 'get'
  })
}

/**
 * 获取用户信息
 * @param {number} id - 用户ID
 * @returns {Promise} 响应结果
 */
export function getUserInfo(id) {
  return request({
    url: `/api/user/${id}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {Object} data - 更新的用户数据
 * @returns {Promise} 响应结果
 */
export function updateUserInfo(id, data) {
  return request({
    url: `/api/user/${id}`,
    method: 'put',
    data
  })
}

/**
 * 获取所有用户（管理员使用）
 * @returns {Promise} 响应结果
 */
export function getAllUsers() {
  return request({
    url: '/api/user/list',
    method: 'get'
  })
} 