/**
 * Client-side Axios Configuration with NextAuth
 * Use this in client components
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Custom Axios instance type that returns data directly
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

axiosInstance.interceptors.request.use(
  async (config) => {
    // Prevent infinite loops by checking if we're already processing
    if (config.headers['X-Request-Processing']) {
      return config
    }
    config.headers['X-Request-Processing'] = 'true'

    try {
      const session = await getSession()
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }

      // Add workspace context header from session (single source of truth)
      const workspaceId = session?.workspace?.id
      if (workspaceId) {
        config.headers['X-Workspace-Id'] = workspaceId
        console.log('[Axios] âœ… Workspace ID:', workspaceId, 'â†’', config.url)
      } else {
        console.warn('[Axios] âš ï¸ No workspace in session! User may not have a workspace assigned.')
      }

      if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
    } finally {
      // Clean up processing flag
      delete config.headers['X-Request-Processing']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor vá»›i token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Return response.data directly for cleaner API usage
    return response.data as any
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Äang refresh token â†’ queue request nÃ y
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger NextAuth to refresh the token
        const session = await getSession();

        if (session?.accessToken) {
          // Token Ä‘Ã£ Ä‘Æ°á»£c refresh thÃ nh cÃ´ng
          processQueue(null, session.accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          // KhÃ´ng cÃ³ session hoáº·c refresh tháº¥t báº¡i
          throw new Error('Session refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh tháº¥t báº¡i â†’ redirect to login
        if (typeof window !== 'undefined') {
          console.log('[Auth] Token refresh failed, redirecting to login');
          window.location.href = '/api/auth/signout?callbackUrl=/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
)

// Export with custom type that reflects the interceptor behavior
export const axiosClient = axiosInstance as CustomAxiosInstance
export default axiosClient

