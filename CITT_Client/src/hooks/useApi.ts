import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

interface UseApiQueryOptions {
  url: string;
  params?: Record<string, unknown>;
  enabled?: boolean;
  staleTime?: number;
}

export function useApiQuery<T = unknown>({
  url,
  params,
  enabled = true,
  staleTime = 30000,
}: UseApiQueryOptions) {
  return useQuery<T>({
    queryKey: [url, params],
    queryFn: async () => {
      const response = await api.get(url, { params });
      return response.data;
    },
    enabled,
    staleTime,
    retry: 1,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await (api as any)[method](url, variables);
      return response.data;
    },
    onSuccess: () => {
      if (options?.successMessage) toast.success(options.successMessage);
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        );
      }
    },
    onError: (error: Error) => {
      toast.error(options?.errorMessage || error.message || 'Operation failed');
    },
  });
}
