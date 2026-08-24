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
  logout: async (): Promise<ApiResponse> => {
    const res = await apiClient.post('/auth/logout');
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

  // ── Phase 5 Image Ingestion Endpoints ─────────────────────────────────────────
  uploadImage: async (inspectionId: string, file: File, viewType: string): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('viewType', viewType);

    const res = await apiClient.post(`/inspections/${inspectionId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteImage: async (inspectionId: string, imageId: string): Promise<ApiResponse> => {
    const res = await apiClient.delete(`/inspections/${inspectionId}/images/${imageId}`);
    return res.data;
  },

  getCompleteness: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/completeness`);
    return res.data;
  },

  getImageUrl: (inspectionId: string, imageId: string): string => {
    return `${API_URL}/inspections/${inspectionId}/images/${imageId}`;
  },

  // ── Phase 6 Image Quality Assessment (IQA) Endpoints ─────────────────────────
  runIQA: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/iqa`);
    return res.data;
  },

  getIQA: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/iqa`);
    return res.data;
  },

  // ── Phase 7C Computer Vision Damage Detection Endpoints ───────────────────────
  runDamageDetection: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/damage/detect`);
    return res.data;
  },

  getDamageDetections: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/damage`);
    return res.data;
  },

  // ── Phase 8 Evidence Reasoning & Condition Score Endpoints ───────────────────
  analyzeEvidence: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/evidence/analyze`);
    return res.data;
  },

  getEvidence: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/evidence`);
    return res.data;
  },

  // ── Phase 9 Buyer Assessment Trust & Completeness Endpoints ──────────────────
  analyzeTrust: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/trust/analyze`);
    return res.data;
  },

  getTrust: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/trust`);
    return res.data;
  },

  // ── Phase 10 Repair Cost Estimation Endpoints ───────────────────────────────
  estimateRepairCost: async (inspectionId: string, regionTier: string = 'TIER_2'): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/repair/estimate`, { regionTier });
    return res.data;
  },

  getRepairCost: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/repair`);
    return res.data;
  },

  // ── Phase 11 Fair-Market Vehicle Valuation Endpoints ─────────────────────────
  evaluateValuation: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/valuation/evaluate`);
    return res.data;
  },

  getValuation: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/valuation`);
    return res.data;
  },

  // ── Phase 12 End-to-End Assessment Orchestrator Endpoints ──────────────────
  runFullAssessment: async (inspectionId: string, regionTier: string = 'TIER_2'): Promise<ApiResponse> => {
    const res = await apiClient.post(`/inspections/${inspectionId}/analyze`, { regionTier });
    return res.data;
  },

  getAssessment: async (inspectionId: string): Promise<ApiResponse> => {
    const res = await apiClient.get(`/inspections/${inspectionId}/assessment`);
    return res.data;
  },
};

export default apiClient;
