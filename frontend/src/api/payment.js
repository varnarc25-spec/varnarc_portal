import api from './client';

export async function createOrder(payload) {
  const { data } = await api.post('/create-order', payload);
  return data;
}

export async function verifyPayment(orderId) {
  const { data } = await api.post('/verify', { order_id: orderId });
  return data;
}

export async function fetchHistory(params = {}) {
  const { data } = await api.get('/history', { params });
  return data;
}

export async function fetchOrderStatus(orderId) {
  const { data } = await api.get(`/status/${encodeURIComponent(orderId)}`);
  return data;
}

export async function requestRefund(payload) {
  const { data } = await api.post('/refund', payload);
  return data;
}
