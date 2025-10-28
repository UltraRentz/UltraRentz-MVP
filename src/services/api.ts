import axios, { type AxiosInstance, type AxiosResponse } from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://utlrarentx-backend-production.up.railway.app/api";
// Fallback to localhost if needed for development
// const API_BASE_URL = "http://localhost:5001/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Authentication API
export const authApi = {
  // Get nonce for wallet signature
  getNonce: (
    address: string
  ): Promise<ApiResponse<{ nonce: string; message: string; userId: string }>> =>
    api.get(`/auth/nonce?address=${address}`),

  // Verify signature and get JWT token
  verifySignature: (data: {
    address: string;
    signature: string;
    message: string;
  }): Promise<
    ApiResponse<{ token: string; user: { id: string; walletAddress: string } }>
  > => api.post("/auth/verify", data),

  // Logout user
  logout: (): Promise<ApiResponse<{ message: string }>> =>
    api.post("/auth/logout"),

  // Get current user profile
  getProfile: (): Promise<
    ApiResponse<{
      user: { id: string; walletAddress: string; createdAt: string };
    }>
  > => api.get("/auth/profile"),
};

// Deposits API
export const depositsApi = {
  // Get all deposits with optional filters
  getAll: (params?: {
    user?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get("/deposits", { params }),

  // Get deposit by ID
  getById: (id: number): Promise<ApiResponse<{ deposit: any }>> =>
    api.get(`/deposits/${id}`),

  // Get deposits by user address
  getByUser: (
    address: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`/deposits/user/${address}`, { params }),

  // Get deposit statistics
  getStats: (): Promise<
    ApiResponse<{
      totalDeposits: number;
      activeDeposits: number;
      releasedDeposits: number;
      disputedDeposits: number;
      totalActiveAmount: string;
    }>
  > => api.get("/deposits/stats"),

  // Sync deposit from blockchain
  syncDeposit: (
    chainId: number
  ): Promise<ApiResponse<{ message: string; status: string }>> =>
    api.post(`/deposits/sync/${chainId}`),
};

// Yields API
export const yieldsApi = {
  // Get yield history for user
  getHistory: (
    address: string,
    params?: {
      limit?: number;
      offset?: number;
      claimed?: boolean;
    }
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`/yields/${address}`, { params }),

  // Get yield summary for user
  getSummary: (
    address: string
  ): Promise<
    ApiResponse<{
      totalYield: string;
      claimableYield: string;
      claimedYield: string;
      currentAPY: string;
      activeDeposits: number;
    }>
  > => api.get(`/yields/summary/${address}`),

  // Get yield chart data
  getChartData: (
    address: string,
    params?: {
      days?: number;
    }
  ): Promise<
    ApiResponse<{
      chartData: Array<{
        date: string;
        yield: number;
        apy: number;
      }>;
      period: string;
    }>
  > => api.get(`/yields/chart/${address}`, { params }),

  // Get overall yield statistics
  getStats: (): Promise<
    ApiResponse<{
      totalYieldDistributed: string;
      totalClaimedYield: string;
      totalUnclaimedYield: string;
      uniqueUsers: number;
      averageAPY: string;
    }>
  > => api.get("/yields/stats"),
};

// Disputes API
export const yieldDepositsApi = {
  // Create a new yield deposit
  create: (data: {
    user_address: string;
    deposit_amount: string;
    duration: string;
    expectedAPY: string;
  }): Promise<ApiResponse<{ id: string; message: string; data: any }>> =>
    api.post("/yield-deposits", data),

  // Get yield deposits for a user
  getByUser: (
    address: string,
    params?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`/yield-deposits/user/${address}`, { params }),

  // Get yield deposit by ID
  getById: (id: string): Promise<ApiResponse<{ data: any }>> =>
    api.get(`/yield-deposits/${id}`),

  // Update yield deposit status
  updateStatus: (
    id: string,
    data: { status: string; tx_hash?: string }
  ): Promise<ApiResponse<{ message: string; data: any }>> =>
    api.put(`/yield-deposits/${id}/status`, data),
};

export const disputesApi = {
  // Get all disputes
  getAll: (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get("/disputes", { params }),

  // Get dispute by deposit ID
  getByDepositId: (depositId: string): Promise<ApiResponse<{ dispute: any }>> =>
    api.get(`/disputes/${depositId}`),

  // Get disputes by user
  getByUser: (
    address: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get(`/disputes/user/${address}`, { params }),

  // Get recent disputes
  getRecent: (
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get("/disputes", { params: { limit, offset: 0 } }),

  // Get dispute statistics
  getStats: (): Promise<
    ApiResponse<{
      totalDisputes: number;
      activeDisputes: number;
      resolvedDisputes: number;
      averageResolutionTimeHours: number;
    }>
  > => api.get("/disputes/stats"),

  // Get active disputes count
  getActiveCount: (): Promise<
    ApiResponse<{
      activeDisputes: number;
      resolvedDisputes: number;
      totalDisputes: number;
    }>
  > => api.get("/disputes/active"),
};

// Health check
export const healthApi = {
  check: (): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
    }>
  > => api.get("/health"),
};

export default api;
