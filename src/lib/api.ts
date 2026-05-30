/**
 * lib/api.ts
 * Fungsi-fungsi HTTP (GET, POST, PUT, DELETE, PATCH) dengan Bearer Token.
 * Semua halaman yang butuh data dari backend menggunakan fungsi dari file ini.
 *
 * Cara pakai:
 *   import { get, post, put, del } from '@/lib/api';
 *   const data = await get('/master/criteria');
 *   await post('/auth/login', { email, password });
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5100/api';

// Buat instance axios dengan konfigurasi default
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 detik
});

// ── Request Interceptor ────────────────────────────────────────
// Setiap request otomatis ditambahkan Bearer Token dari cookie
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────
// Jika token expired (401), redirect ke login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token tidak valid / expired — hapus cookie dan redirect
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_data');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Type Definitions ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ── Helper: ekstrak pesan error dari response ──────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      return Array.isArray(first) ? first[0] : String(first);
    }
    if (error.response?.status === 404) return 'Data tidak ditemukan.';
    if (error.response?.status === 403) return 'Anda tidak memiliki akses.';
    if (error.response?.status === 500) return 'Terjadi kesalahan pada server.';
    if (error.code === 'ECONNABORTED') return 'Koneksi timeout. Coba lagi.';
    if (!error.response) return 'Tidak dapat terhubung ke server.';
  }
  return 'Terjadi kesalahan.';
}

// ── GET ────────────────────────────────────────────────────────
export async function get<T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.get(endpoint, config);
  return res.data;
}

// ── POST ───────────────────────────────────────────────────────
export async function post<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.post(endpoint, body, config);
  return res.data;
}

// ── PUT ────────────────────────────────────────────────────────
export async function put<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.put(endpoint, body, config);
  return res.data;
}

// ── PATCH ──────────────────────────────────────────────────────
export async function patch<T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.patch(endpoint, body, config);
  return res.data;
}

// ── DELETE ─────────────────────────────────────────────────────
export async function del<T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.delete(endpoint, config);
  return res.data;
}

// ── Upload File (multipart/form-data) ─────────────────────────
export async function upload<T = unknown>(
  endpoint: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.post(endpoint, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${Cookies.get('access_token') || ''}`,
    },
  });
  return res.data;
}

export default apiClient;
