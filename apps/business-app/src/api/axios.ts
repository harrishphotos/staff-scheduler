import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// dynamic env value; fallback to gateway at 8081
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://staff-scheduler-q2w5f.ondigitalocean.app";

// We'll get the store reference dynamically to avoid circular dependency
let store: any = null;

export const setStore = (storeInstance: any) => {
  store = storeInstance;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies (refresh token)
  timeout: 30000, // Standard 30 second timeout
});

// Request interceptor: attach access token if present
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store?.getState()?.auth?.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function for timeout handling in refresh requests
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper to queue refresh requests so multiple 401s trigger only one refresh call
let refreshPromise: Promise<any> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (!refreshPromise) {
        refreshPromise = fetchWithTimeout(
          `${BASE_URL}/api/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
          30000
        )
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              store?.dispatch({
                type: "auth/setCredentials",
                payload: data,
              });
              refreshPromise = null;
              return data;
            } else {
              throw new Error("Refresh failed");
            }
          })
          .catch((refreshErr) => {
            refreshPromise = null;
            store?.dispatch({ type: "auth/clearAuth" });
            return Promise.reject(refreshErr);
          });
      }

      try {
        await refreshPromise;
        originalRequest._retry = true; // mark so we don't loop forever
        return axiosInstance(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Service health check utility
export const checkServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      timeout: 10000,
    } as any);
    return response.ok;
  } catch {
    return false;
  }
};

export default axiosInstance;
