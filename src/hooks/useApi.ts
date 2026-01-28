import { useState, useEffect, useCallback } from "react";
import type { ApiResponse } from "../services/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
} {
  const { immediate = true, dependencies = [] } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const executeApiCall = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();
      setState({
        data: response.data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error:
          error.response?.data?.error || error.message || "An error occurred",
      });
    }
  }, [apiCall]);

  const refetch = useCallback(async () => {
    await executeApiCall();
  }, [executeApiCall]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (immediate) {
      executeApiCall();
    }
  }, [immediate, executeApiCall, ...dependencies]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    clearError,
  };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (params: {
    limit: number;
    offset: number;
  }) => Promise<
    ApiResponse<{ data: T[]; total: number; limit: number; offset: number }>
  >,
  options: UseApiOptions & { pageSize?: number } = {}
): {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  clearError: () => void;
} {
  const { immediate = true, dependencies = [], pageSize = 20 } = options;

  const [state, setState] = useState<{
    data: T[];
    total: number;
    loading: boolean;
    error: string | null;
    offset: number;
  }>({
    data: [],
    total: 0,
    loading: false,
    error: null,
    offset: 0,
  });

  const executeApiCall = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall({ limit: pageSize, offset });
        const { data, total } = response.data;

        setState((prev) => ({
          data: append ? [...prev.data, ...data] : data,
          total,
          loading: false,
          error: null,
          offset,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error.response?.data?.error || error.message || "An error occurred",
        }));
      }
    },
    [apiCall, pageSize]
  );

  const refetch = useCallback(async () => {
    await executeApiCall(0, false);
  }, [executeApiCall]);

  const loadMore = useCallback(async () => {
    if (!state.loading && state.data.length < state.total) {
      await executeApiCall(state.offset + pageSize, true);
    }
  }, [
    executeApiCall,
    state.loading,
    state.data.length,
    state.total,
    state.offset,
    pageSize,
  ]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (immediate) {
      executeApiCall(0, false);
    }
  }, [immediate, executeApiCall, ...dependencies]);

  return {
    data: state.data,
    total: state.total,
    loading: state.loading,
    error: state.error,
    refetch,
    loadMore,
    hasMore: state.data.length < state.total,
    clearError,
  };
}
