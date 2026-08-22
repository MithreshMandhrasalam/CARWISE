import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token if available in local storage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('carwise_token') || localStorage.getItem('autotrust_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ── Auth Endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  register: async (name: string, email: string, password: string): Promise<ApiResponse> => {
    const res = await apiClient.post('/auth/register', { name, email, password });
    return res.data;
  },
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  me: async (): Promise<ApiResponse> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// ── Inspection Endpoints ──────────────────────────────────────────────────────
export const inspectionApi = {
  create: async (vehicleInfo: {
    make: string;
    model: string;
    variant?: string;
    year: number;
    fuelType: string;
    transmission: string;
    mileageKm: number;
    askingPrice: number;
    location?: string;
    registrationNumber?: string;
  }): Promise<ApiResponse> => {
    const res = await apiClient.post('/inspections', vehicleInfo);
    return res.data;
  },

  list: async (params?: { page?: number; limit?: number; status?: string; make?: string }): Promise<ApiResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.status) query.append('status', params.status);
    if (params?.make) query.append('make', params.make);

    const res = await apiClient.get(`/inspections?${query.toString()}`);
    return res.data;
  },

  get: async (id: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${id}`);
    return res.data;
  },

  update: async (id: string, updateData: Record<string, any>): Promise<ApiResponse> => {
    const res = await apiClient.patch(`/inspections/${id}`, updateData);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await apiClient.delete(`/inspections/${id}`);
    return res.data;
  },
};

export default apiClient;
