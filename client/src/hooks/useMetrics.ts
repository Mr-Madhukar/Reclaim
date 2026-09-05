import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MetricSummary } from '../types';

export function useMetricsSummary(refetchInterval: number | false = 30000) {
  return useQuery<MetricSummary, Error>({
    queryKey: ['metrics', 'summary'],
    queryFn: () => api.metrics.getSummary(),
    refetchInterval,
    staleTime: 15000,
    placeholderData: (prev) => prev,
  });
}

export function useLaneMetrics() {
  return useQuery({
    queryKey: ['metrics', 'by-lane'],
    queryFn: () => api.metrics.getByLane(),
    staleTime: 5000,
  });
}
