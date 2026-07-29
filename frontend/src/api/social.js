import apiClient from './client';

// Social Feed modülünün tüm REST çağrılarının tek yeri. Bileşenler URL string'i
// tekrar etmek yerine bu yardımcıları kullanır.

export function getFeed({ following = false, page = 1 } = {}) {
  return apiClient.get('/social/feed', { params: { following, page } }).then((r) => r.data);
}

export function getPost(id) {
  return apiClient.get(`/social/posts/${id}`).then((r) => r.data);
}

export function createPost({ caption, images }) {
  const formData = new FormData();
  if (caption) formData.append('caption', caption);
  images.forEach((file) => formData.append('images', file));
  return apiClient.post('/social/posts', formData).then((r) => r.data);
}

export function updatePost(id, { caption }) {
  return apiClient.patch(`/social/posts/${id}`, { caption }).then((r) => r.data);
}

export function deletePost(id) {
  return apiClient.delete(`/social/posts/${id}`);
}

export function likePost(id) {
  return apiClient.post(`/social/posts/${id}/like`).then((r) => r.data);
}

export function unlikePost(id) {
  return apiClient.delete(`/social/posts/${id}/like`).then((r) => r.data);
}

export function getComments(postId) {
  return apiClient.get(`/social/posts/${postId}/comments`).then((r) => r.data);
}

export function addComment(postId, content) {
  return apiClient.post(`/social/posts/${postId}/comments`, { content }).then((r) => r.data);
}

export function deleteComment(commentId) {
  return apiClient.delete(`/social/comments/${commentId}`);
}

export function followUser(userId) {
  return apiClient.post(`/social/follow/${userId}`).then((r) => r.data);
}

export function unfollowUser(userId) {
  return apiClient.delete(`/social/follow/${userId}`).then((r) => r.data);
}

export function getProfile(userId) {
  return apiClient.get(`/social/profile/${userId}`).then((r) => r.data);
}

export function updateMyProfile({ bio }) {
  return apiClient.patch('/social/profile', { bio }).then((r) => r.data);
}

export function getNotifications() {
  return apiClient.get('/social/notifications').then((r) => r.data);
}

export function getUnreadNotificationCount() {
  return apiClient.get('/social/notifications/unread-count').then((r) => r.data);
}

export function markNotificationRead(id) {
  return apiClient.patch(`/social/notifications/${id}/read`).then((r) => r.data);
}
