import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  CaseFilterParams,
  MetricSummary,
  PolicyConfig,
  RecoveryCase,
  AuditLog,
  BatchRunResult,
  LaneMetric,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('reclaim_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string; code?: string } }>) => {
    const message = error.response?.data?.error?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// API Endpoints
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/login', { email, password });
      return data.data;
    },
    me: async (): Promise<AuthResponse['user']> => {
      const { data } = await apiClient.get<{ data: { user: AuthResponse['user'] } }>('/auth/me');
      return data.data.user;
    },
    logout: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
  },

  metrics: {
    getSummary: async (): Promise<MetricSummary> => {
      const { data } = await apiClient.get<{ data: MetricSummary }>('/metrics/summary');
      return data.data;
    },
    getByLane: async (): Promise<Record<string, LaneMetric>> => {
      const { data } = await apiClient.get<{ data: Record<string, LaneMetric> }>('/metrics/by-lane');
      return data.data;
    },
  },

  cases: {
    list: async (params?: CaseFilterParams): Promise<{ cases: RecoveryCase[]; total: number; page: number; limit: number }> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== 'ALL')
      );
      const { data } = await apiClient.get<{ data: { cases: RecoveryCase[]; total: number; page: number; limit: number } }>('/cases', {
        params: cleanParams,
      });
      return data.data;
    },
    getById: async (id: string): Promise<RecoveryCase> => {
      const { data } = await apiClient.get<{ data: { case: RecoveryCase } }>(`/cases/${id}`);
      return data.data.case;
    },
    triggerAction: async (id: string): Promise<{ success: boolean; message: string; action?: unknown }> => {
      const { data } = await apiClient.post<{ data: { success: boolean; message: string; action?: unknown } }>(`/cases/${id}/trigger`);
      return data.data;
    },
    resolveEscalation: async (id: string, notes: string, outcome: 'RECOVERED' | 'EXPIRED' | 'UNRESOLVED'): Promise<void> => {
      await apiClient.post(`/cases/${id}/resolve`, { notes, outcome });
    },
    logPromiseToPay: async (id: string, promisedAmount: number, promisedDate: string): Promise<void> => {
      await apiClient.post(`/cases/${id}/promise-to-pay`, { promisedAmount, promisedDate });
    },
    customerAction: async (
      id: string,
      payload: { action: 'PAY_SUCCESS' | 'OPT_OUT' | 'PROMISE_TO_PAY' | 'ALT_PAYMENT'; promisedDate?: string; promisedAmount?: number; paymentMethod?: string }
    ): Promise<{ success: boolean; message: string }> => {
      const { data } = await apiClient.post<{ success: boolean; message: string }>(`/cases/${id}/customer-action`, payload);
      return data;
    },
  },

  policies: {
    list: async (): Promise<PolicyConfig[]> => {
      const { data } = await apiClient.get<{ data: { policyConfigs: PolicyConfig[] } }>('/policy-configs');
      return data.data.policyConfigs;
    },
    update: async (
      id: string,
      updates: Partial<Pick<PolicyConfig, 'maxAttempts' | 'cooldownMinutes' | 'maxIncentiveAmount' | 'dailyCapGlobal'>>
    ): Promise<PolicyConfig> => {
      const { data } = await apiClient.put<{ data: { policyConfig: PolicyConfig } }>(`/policy-configs/${id}`, updates);
      return data.data.policyConfig;
    },
  },

  auditLogs: {
    list: async (params?: { entityType?: string; entityId?: string; limit?: number; page?: number }): Promise<{ auditLogs: AuditLog[]; total: number }> => {
      const { data } = await apiClient.get<{ data: { auditLogs: AuditLog[]; total: number } }>('/audit-logs', { params });
      return data.data;
    },
  },

  webhooks: {
    simulate: async (payload: {
      event?: string;
      amount?: number;
      failureCode?: string;
      failureReason?: string;
      customerEmail?: string;
      customerName?: string;
    }): Promise<{ simulated: boolean; signature: string; event: string; payload: unknown; result?: unknown }> => {
      const { data } = await apiClient.post<{ simulated: boolean; signature: string; event: string; payload: unknown; result?: unknown }>(
        '/webhooks/simulate',
        payload
      );
      return data;
    },
  },

  agent: {
    runBatch: async (options?: { dryRun?: boolean; limit?: number }): Promise<BatchRunResult> => {
      const { data } = await apiClient.post<{ data: BatchRunResult }>('/agent/run-batch', options);
      return data.data;
    },
  },
};
