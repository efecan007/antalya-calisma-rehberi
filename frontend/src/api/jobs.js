import apiClient from './client';

// İş İlanları modülünün tüm REST çağrılarının tek yeri.

export function getJobs({ profession } = {}) {
  return apiClient.get('/jobs', { params: profession ? { profession } : {} }).then((r) => r.data);
}

export function createJob(data) {
  return apiClient.post('/jobs', data).then((r) => r.data);
}

export function getMyJobs() {
  return apiClient.get('/jobs/mine').then((r) => r.data);
}

export function updateJob(id, data) {
  return apiClient.patch(`/jobs/${id}`, data).then((r) => r.data);
}

export function deleteJob(id) {
  return apiClient.delete(`/jobs/${id}`);
}

export function applyToJob(id, { profession, message }) {
  return apiClient.post(`/jobs/${id}/apply`, { profession, message }).then((r) => r.data);
}

export function getMyApplications() {
  return apiClient.get('/jobs/applications/mine').then((r) => r.data);
}

export function decideApplication(id, status) {
  return apiClient.patch(`/jobs/applications/${id}`, { status }).then((r) => r.data);
}
