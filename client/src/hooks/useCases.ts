import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CaseFilterParams, RecoveryCase, BatchRunResult } from '../types';

export function useCases(filters?: CaseFilterParams) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: () => api.cases.list(filters),
    staleTime: 5000,
  });
}

export function useCaseDetail(id: string | null) {
  return useQuery<RecoveryCase, Error>({
    queryKey: ['cases', 'detail', id],
    queryFn: () => api.cases.getById(id!),
    enabled: Boolean(id),
  });
}

export function useTriggerAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cases.triggerAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['cases', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useResolveEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, outcome }: { id: string; notes: string; outcome: 'RECOVERED' | 'EXPIRED' | 'UNRESOLVED' }) =>
      api.cases.resolveEscalation(id, notes, outcome),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['cases', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useLogPromiseToPay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, promisedAmount, promisedDate }: { id: string; promisedAmount: number; promisedDate: string }) =>
      api.cases.logPromiseToPay(id, promisedAmount, promisedDate),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['cases', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useRunBatch() {
  const queryClient = useQueryClient();
  return useMutation<BatchRunResult, Error, { dryRun?: boolean; limit?: number } | undefined>({
    mutationFn: (options) => api.agent.runBatch(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}
