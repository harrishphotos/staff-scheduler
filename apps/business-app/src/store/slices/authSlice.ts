import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  registerStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  registerError: string | null;
  registerMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
  registerStatus: "idle",
  error: null,
  registerError: null,
  registerMessage: null,
};

// Base URL pulled from Vite env – falls back to gateway default on 8081.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

// Helper function to make requests with timeout and retry for cold starts
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

export const login = createAsyncThunk(
  "auth/login",
  async (creds: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // First attempt with extended timeout for cold starts (80 seconds)
      const response = await fetchWithTimeout(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // so refresh cookie is set
          body: JSON.stringify(creds),
        },
        80000
      ); // 80 second timeout for cold start

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Login failed");
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === "AbortError") {
        return rejectWithValue(
          "Request timed out. Services are starting up, please try again in a moment."
        );
      }
      return rejectWithValue(
        "Login failed. Please check your connection and try again."
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: { email: string; username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(userData),
        },
        80000
      ); // 80 second timeout for cold start

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Registration failed");
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === "AbortError") {
        return rejectWithValue(
          "Request timed out. Services are starting up, please try again in a moment."
        );
      }
      return rejectWithValue(
        "Registration failed. Please check your connection and try again."
      );
    }
  }
);

export const refresh = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
        80000
      ); // 80 second timeout for cold start

      if (!response.ok) {
        return rejectWithValue("Token refresh failed");
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === "AbortError") {
        return rejectWithValue(
          "Request timed out. Services are starting up, please try again in a moment."
        );
      }
      return rejectWithValue("Token refresh failed");
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await fetchWithTimeout(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
        80000
      ); // 80 second timeout for cold start
      return true;
    } catch (err: any) {
      if (err.name === "AbortError") {
        return rejectWithValue(
          "Request timed out. Services are starting up, please try again in a moment."
        );
      }
      return rejectWithValue("Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ access_token: string; user: User }>
    ) => {
      state.accessToken = action.payload.access_token;
      state.user = action.payload.user;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    clearRegisterState: (state) => {
      state.registerStatus = "idle";
      state.registerError = null;
      state.registerMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: any) => {
        state.status = "succeeded";
        state.accessToken = action.payload.access_token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // Register cases
      .addCase(register.pending, (state) => {
        state.registerStatus = "loading";
        state.registerError = null;
        state.registerMessage = null;
      })
      .addCase(register.fulfilled, (state, action: any) => {
        state.registerStatus = "succeeded";
        state.registerMessage = action.payload.message;
        state.registerError = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.registerStatus = "failed";
        state.registerError = action.payload as string;
        state.registerMessage = null;
      })

      // Other cases
      .addCase(refresh.fulfilled, (state, action: any) => {
        state.accessToken = action.payload.access_token;
        state.user = action.payload.user;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { setCredentials, clearAuth, clearRegisterState } =
  authSlice.actions;
export default authSlice.reducer;
