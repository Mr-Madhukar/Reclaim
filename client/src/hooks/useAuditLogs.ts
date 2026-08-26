import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export function useAuditLogs(params?: { entityType?: string; entityId?: string; limit?: number; page?: number }) {
  return useQuery<{ auditLogs: AuditLog[]; total: number }, Error>({
    queryKey: ['audit-logs', params],
    queryFn: () => api.auditLogs.list(params),
    staleTime: 5000,
  });
}
