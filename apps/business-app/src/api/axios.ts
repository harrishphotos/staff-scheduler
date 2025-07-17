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

// Cold start detection and retry configuration
const COLD_START_INDICATORS = [
  "timeout",
  "Service is unavailable",
  "cold start timeout",
  "Service unavailable",
  "ENOTFOUND",
  "ECONNREFUSED",
];

const isColdStartError = (error: any): boolean => {
  const message =
    error?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    "";
  return COLD_START_INDICATORS.some((indicator) =>
    message.toLowerCase().includes(indicator.toLowerCase())
  );
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies (refresh token)
  timeout: 80000, // Increased to 80 seconds for cold starts (slightly less than gateway timeout)
});

// Request interceptor: attach access token if present
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store?.getState()?.auth?.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add retry attempt header for monitoring
    if (!config.headers["X-Retry-Attempt"]) {
      config.headers["X-Retry-Attempt"] = "1";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced retry mechanism for cold starts
const retryRequest = async (
  error: AxiosError,
  retryCount: number = 0
): Promise<any> => {
  const maxRetries = 2;
  const originalRequest = error.config as any;

  // Don't retry certain types of errors
  if (
    error.response?.status === 401 ||
    error.response?.status === 403 ||
    error.response?.status === 404 ||
    retryCount >= maxRetries
  ) {
    throw error;
  }

  // Only retry if it looks like a cold start issue
  if (!isColdStartError(error)) {
    throw error;
  }

  console.log(
    `[RETRY] Cold start detected, retrying request (attempt ${
      retryCount + 1
    }/${maxRetries})`
  );

  // Dispatch cold start event for UI handling
  if (retryCount === 0) {
    // Only dispatch on first retry to avoid spam
    window.dispatchEvent(
      new CustomEvent("coldstart-detected", {
        detail: error,
      })
    );
  }

  // Progressive delay: 3s, 6s for cold start retries
  const delay = (retryCount + 1) * 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Update retry header
  if (originalRequest.headers) {
    originalRequest.headers["X-Retry-Attempt"] = (retryCount + 2).toString();
  }

  try {
    return await axiosInstance(originalRequest);
  } catch (retryError) {
    return retryRequest(retryError as AxiosError, retryCount + 1);
  }
};

// Helper function for timeout handling in refresh requests
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 80000
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
          80000
        ) // 80 second timeout for cold start
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

    // Handle cold start retries for non-401 errors
    if (!originalRequest._coldStartRetried && isColdStartError(error)) {
      originalRequest._coldStartRetried = true;

      // Dispatch cold start event for UI handling
      window.dispatchEvent(
        new CustomEvent("coldstart-detected", {
          detail: error,
        })
      );

      try {
        return await retryRequest(error);
      } catch (retryError) {
        return Promise.reject(retryError);
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
      timeout: 10000, // Quick health check
    } as any);
    return response.ok;
  } catch {
    return false;
  }
};

// Warm up services utility
export const warmUpServices = async (): Promise<void> => {
  try {
    console.log("[WARMUP] Warming up services...");
    await Promise.allSettled([
      fetch(`${BASE_URL}/health`),
      fetch(`${BASE_URL}/monitor/health`),
    ]);
    console.log("[WARMUP] Services warm-up initiated");
  } catch (error) {
    console.log("[WARMUP] Failed to warm up services:", error);
  }
};

export default axiosInstance;
