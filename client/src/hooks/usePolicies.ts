import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PolicyConfig } from '../types';

export function usePolicyConfigs() {
  return useQuery<PolicyConfig[], Error>({
    queryKey: ['policies'],
    queryFn: () => api.policies.list(),
    staleTime: 10000,
  });
}

export function useUpdatePolicyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<PolicyConfig, 'maxAttempts' | 'cooldownMinutes' | 'maxIncentiveAmount' | 'dailyCapGlobal'>>;
    }) => api.policies.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}
