import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 90000, // 90s for AI analysis calls
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('autotrust_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('autotrust_token');
      localStorage.removeItem('autotrust_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ── Inspections ───────────────────────────────────────────────────
export const inspectionApi = {
  create: (vehicleInfo: Record<string, unknown>) =>
    api.post('/inspections', vehicleInfo),
  list: (page = 1, limit = 10) =>
    api.get(`/inspections?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get(`/inspections/${id}`),
  delete: (id: string) =>
    api.delete(`/inspections/${id}`),
  uploadImages: (id: string, files: File[], angles: string[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    angles.forEach((angle) => form.append('angles', angle));
    return api.post(`/inspections/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyze: (id: string) =>
    api.post(`/inspections/${id}/analyze`),
  pollStatus: async (id: string, onUpdate: (status: string) => void, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await api.get(`/inspections/${id}`);
      const status = data.data?.status;
      onUpdate(status);
      if (status === 'complete' || status === 'failed') return data.data;
    }
    throw new Error('Analysis timed out.');
  },
};

export default api;
