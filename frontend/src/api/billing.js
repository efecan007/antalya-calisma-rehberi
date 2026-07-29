import apiClient from './client';

// Billing (RemoteRehber Pro) REST çağrıları. Bu adımda yalnızca okuma uçları
// mevcut; deneme başlatma/abonelik/iptal uçları ödeme entegrasyonuyla eklenecek.

export function getStatus() {
  return apiClient.get('/billing/status').then((r) => r.data);
}

export function getHistory() {
  return apiClient.get('/billing/history').then((r) => r.data);
}

export function getInvoices() {
  return apiClient.get('/billing/invoices').then((r) => r.data);
}

export function startTrial() {
  return apiClient.post('/billing/start-trial').then((r) => r.data);
}

export function subscribe(paymentToken) {
  return apiClient.post('/billing/subscribe', { paymentToken }).then((r) => r.data);
}

export function cancelSubscription() {
  return apiClient.post('/billing/cancel').then((r) => r.data);
}

export function resumeSubscription() {
  return apiClient.post('/billing/resume').then((r) => r.data);
}

export function updatePaymentMethod(paymentToken) {
  return apiClient.patch('/billing/payment-method', { paymentToken }).then((r) => r.data);
}
